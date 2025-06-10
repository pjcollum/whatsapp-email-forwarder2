// latest working version

require('dotenv').config();
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

// --- WhatsApp Setup ---
const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', qr => {
  console.log('🔑 Scan this QR code with WhatsApp on your phone:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');

  // Run checkEmails once immediately
  checkEmails();

  // Schedule to run daily at 12 midday
  cron.schedule('0 14 * * *', () => {
    console.log('⏰ Running scheduled email check...');
    checkEmails();
  });
});

client.on('auth_failure', () => {
  console.error('❌ WhatsApp authentication failed.');
});

client.initialize();

// --- Email Setup ---
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

function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

function markAsRead(uid) {
  return new Promise((resolve, reject) => {
    imap.addFlags(uid, '\\Seen', err => {
      if (err) {
        console.error('❌ Failed to mark email as read:', err);
        reject(err);
      } else {
        console.log('✅ Email marked as read');
        resolve();
      }
    });
  });
}

function checkEmails() {
  imap.once('ready', () => {
    openInbox((err, box) => {
      if (err) {
        console.error('❌ Failed to open inbox:', err);
        return;
      }

      imap.search(['UNSEEN'], (err, results) => {
        if (err || results.length === 0) {
          console.log('📭 No new emails to check.');
          imap.end();
          return;
        }

        const f = imap.fetch(results, { bodies: '', struct: true });
        const processingMessages = [];

        f.on('message', (msg, seqno) => {
          const messagePromise = new Promise((resolve, reject) => {
            let uid;

            msg.on('attributes', attrs => {
              uid = attrs.uid;
            });

            msg.on('body', stream => {
              simpleParser(stream, async (err, parsed) => {
                if (err) return reject(err);

                const fromAddress = parsed.from.value[0].address;
                const subject = parsed.subject || '(no subject)';
                const body = parsed.text || '';

                if (fromAddress.includes('google')) {
                  console.log(`🔕 Ignored email from ${fromAddress} (contains "google")`);
                  return resolve();
                }

                if (fromAddress === senderToWatch) {
                  console.log(`📨 Matched email from ${fromAddress}`);
                  console.log(`Subject: ${subject}`);

                  //change this line
                  const message = `📧 New email from ${fromAddress}\nSubject: ${subject}\n\n${body.slice(0, 4096)}...`;

                  try {
                    await client.sendMessage(whatsappRecipient, message);
                    console.log('📤 WhatsApp message sent!');
                    if (uid) {
                      await markAsRead(uid);
                    } else {
                      console.warn('⚠️ UID not found, cannot mark email as read.');
                    }
                    resolve();
                  } catch (err) {
                    console.error('❌ Failed to send WhatsApp message or mark as read:', err);
                    reject(err);
                  }
                } else {
                  console.log(`🔕 Ignored email from ${fromAddress}`);
                  resolve();
                }
              });
            });
          });

          processingMessages.push(messagePromise);
        });

        f.once('end', () => {
          Promise.allSettled(processingMessages)
            .then(() => {
              console.log('✅ All messages processed. Ending IMAP connection.');
              imap.end();
            });
        });
      });
    });
  });

  imap.once('error', err => {
    console.error('IMAP error:', err);
  });

  imap.connect();
}
