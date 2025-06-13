const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Email Setup
const imap = new Imap({
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASS,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});

const senderToWatch = process.env.SENDER_TO_WATCH;
const whatsappRecipient = process.env.WHATSAPP_RECIPIENT;

export default async function handler(req, res) {
  // Verify the request is from Vercel Cron
  if (req.headers['x-vercel-cron'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Initialize WhatsApp client
    const client = new Client({
      authStrategy: 'local',
    });

    // Check emails
    const checkEmails = () => {
      return new Promise((resolve, reject) => {
        imap.once('ready', () => {
          imap.openBox('INBOX', false, (err, box) => {
            if (err) {
              reject(err);
              return;
            }

            imap.search(['UNSEEN'], (err, results) => {
              if (err || results.length === 0) {
                resolve('No new emails');
                return;
              }

              const f = imap.fetch(results, { bodies: '' });
              f.on('message', (msg) => {
                msg.on('body', (stream) => {
                  simpleParser(stream, async (err, parsed) => {
                    if (err) return;

                    const fromAddress = parsed.from.value[0].address;
                    if (fromAddress === senderToWatch) {
                      const message = `📧 New email from ${fromAddress}\nSubject: ${parsed.subject}\n\n${parsed.text.slice(0, 4096)}...`;
                      await client.sendMessage(whatsappRecipient, message);
                    }
                  });
                });
              });

              f.once('end', () => {
                imap.end();
                resolve('Emails processed');
              });
            });
          });
        });

        imap.once('error', (err) => {
          reject(err);
        });

        imap.connect();
      });
    };

    // Run email check
    const result = await checkEmails();
    res.status(200).json({ success: true, message: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 