// routes/public.js
const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { sendContactEmail } = require('../utils/mailer');

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}
function takeFlash(req) {
  const flash = req.session.flash;
  delete req.session.flash;
  return flash || null;
}

router.get('/', (req, res) => {
  const products = store.list('products').filter(p => p.is_active !== false);
  const portfolio = store.list('portfolio').filter(p => p.is_active !== false);
  const reviews = store.list('reviews').filter(r => r.is_active !== false);
  const settings = store.getSettings();

  res.render('index', {
    products,
    portfolio,
    reviews,
    settings,
    flash: takeFlash(req),
    formValues: req.session.contactFormValues || {},
  });
  delete req.session.contactFormValues;
});

router.post('/contact', async (req, res) => {
  const { name, email, phone, message, website } = req.body;

  // Honeypot field — real visitors never fill in "website", bots often do.
  if (website) {
    return res.redirect('/#kontakt');
  }

  const errors = [];
  if (!name || !name.trim()) errors.push('Bitte geben Sie Ihren Namen an.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Bitte geben Sie eine gültige E-Mail-Adresse an.');
  if (!message || !message.trim()) errors.push('Bitte geben Sie eine Nachricht ein.');

  if (errors.length) {
    setFlash(req, 'error', errors.join(' '));
    req.session.contactFormValues = { name, email, phone, message };
    return res.redirect('/#kontakt');
  }

  try {
    const settings = store.getSettings();
    await sendContactEmail({
      to: settings.contact_email,
      fromName: name.trim(),
      fromEmail: email.trim(),
      phone: (phone || '').trim(),
      message: message.trim(),
    });
    setFlash(req, 'success', 'Danke für Ihre Nachricht! Wir melden uns so schnell wie möglich bei Ihnen.');
  } catch (err) {
    console.error('Kontaktformular E-Mail-Fehler:', err);
    setFlash(req, 'error', 'Ihre Nachricht konnte leider nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie uns per WhatsApp.');
    req.session.contactFormValues = { name, email, phone, message };
  }

  res.redirect('/#kontakt');
});

module.exports = router;
