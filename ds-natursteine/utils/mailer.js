// utils/mailer.js
//
// Sends contact-form emails through whatever SMTP account the owner
// configures in .env (Gmail, GMX, Web.de, IONOS, Outlook — anything that
// supports SMTP login works). If SMTP isn't configured yet, the contact
// route still works but logs the message to the console instead of
// crashing, so the rest of the site keeps working during setup.

const nodemailer = require('nodemailer');

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
function getTransporter() {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendContactEmail({ to, fromName, fromEmail, phone, message }) {
  const subject = `Neue Anfrage über die Webseite — ${fromName}`;
  const text = `Neue Kontaktanfrage von der Webseite\n\n` +
    `Name: ${fromName}\n` +
    `E-Mail: ${fromEmail}\n` +
    (phone ? `Telefon: ${phone}\n` : '') +
    `\nNachricht:\n${message}\n`;

  const t = getTransporter();
  if (!t) {
    console.log('--- SMTP nicht konfiguriert, Kontaktanfrage wird nur protokolliert ---');
    console.log(text);
    return { delivered: false };
  }

  await t.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'Webseite'}" <${process.env.SMTP_USER}>`,
    to,
    replyTo: fromEmail,
    subject,
    text,
  });
  return { delivered: true };
}

module.exports = { sendContactEmail, isConfigured };
