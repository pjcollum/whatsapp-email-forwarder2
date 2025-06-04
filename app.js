const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
  
  const messageBody = "Hi Dave, you've received an email from bowls@team.co.uk about tomorrow's match.";
  const number = '447510901260'; // Recipient number with country code
  const chatId = number + '@c.us';

  client.sendMessage(chatId, messageBody);
});

client.initialize();
