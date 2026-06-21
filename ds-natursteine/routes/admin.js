// routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const store = require('../db/store');
const { requireAdmin, redirectIfLoggedIn } = require('../middleware/auth');
const { upload, UPLOAD_DIR } = require('../middleware/upload');

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}
function takeFlash(req) {
  const flash = req.session.flash;
  delete req.session.flash;
  return flash || null;
}

// Deletes a previously-uploaded image when it's replaced or the item is removed.
// Never touches external URLs (e.g. the starter photos) — only files we manage.
function deleteUploadedImage(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;
  const filePath = path.join(UPLOAD_DIR, path.basename(imagePath));
  fs.unlink(filePath, () => {}); // best-effort; ignore errors
}

// ---------- Auth ----------
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('admin/login', { flash: takeFlash(req), layout: false });
});

router.post('/login', redirectIfLoggedIn, async (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USERNAME || '';
  const validHash = process.env.ADMIN_PASSWORD_HASH || '';

  if (!validUser || !validHash) {
    setFlash(req, 'error', 'Der Admin-Zugang wurde auf dem Server noch nicht eingerichtet (ADMIN_USERNAME / ADMIN_PASSWORD_HASH fehlen).');
    return res.redirect('/admin/login');
  }

  const userOk = username === validUser;
  const passOk = userOk && await bcrypt.compare(password || '', validHash);

  if (!userOk || !passOk) {
    setFlash(req, 'error', 'Benutzername oder Passwort ist falsch.');
    return res.redirect('/admin/login');
  }

  req.session.regenerate((err) => {
    if (err) {
      setFlash(req, 'error', 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.');
      return res.redirect('/admin/login');
    }
    req.session.isAdmin = true;
    res.redirect('/admin');
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Everything below this line requires login.
router.use(requireAdmin);

router.get('/', (req, res) => {
  res.render('admin/dashboard', {
    flash: takeFlash(req),
    counts: {
      products: store.list('products').length,
      portfolio: store.list('portfolio').length,
      reviews: store.list('reviews').length,
    },
  });
});

// ---------- Products ----------
router.get('/products', (req, res) => {
  res.render('admin/products', { items: store.list('products'), flash: takeFlash(req) });
});

router.get('/products/new', (req, res) => {
  res.render('admin/product-form', { item: null, flash: takeFlash(req) });
});

router.post('/products', upload.single('image'), async (req, res) => {
  const { name, tag_label, price_text, description } = req.body;
  if (!name || !name.trim()) {
    setFlash(req, 'error', 'Bitte geben Sie einen Produktnamen ein.');
    return res.redirect('/admin/products/new');
  }
  const image_path = req.file ? '/uploads/' + req.file.filename : (req.body.existing_image || '');
  await store.create('products', {
    name: name.trim(), tag_label: (tag_label || '').trim(),
    price_text: (price_text || '').trim(), description: (description || '').trim(),
    image_path, is_active: req.body.is_active === 'on',
  });
  setFlash(req, 'success', 'Produkt wurde hinzugefügt.');
  res.redirect('/admin/products');
});

router.get('/products/:id/edit', (req, res) => {
  const item = store.get('products', req.params.id);
  if (!item) {
    setFlash(req, 'error', 'Produkt wurde nicht gefunden.');
    return res.redirect('/admin/products');
  }
  res.render('admin/product-form', { item, flash: takeFlash(req) });
});

router.post('/products/:id', upload.single('image'), async (req, res) => {
  const existing = store.get('products', req.params.id);
  if (!existing) {
    setFlash(req, 'error', 'Produkt wurde nicht gefunden.');
    return res.redirect('/admin/products');
  }
  const { name, tag_label, price_text, description, sort_order } = req.body;
  let image_path = existing.image_path;
  if (req.file) {
    deleteUploadedImage(existing.image_path);
    image_path = '/uploads/' + req.file.filename;
  }
  await store.update('products', req.params.id, {
    name: (name || '').trim(), tag_label: (tag_label || '').trim(),
    price_text: (price_text || '').trim(), description: (description || '').trim(),
    image_path, is_active: req.body.is_active === 'on',
    sort_order: Number(sort_order) || 0,
  });
  setFlash(req, 'success', 'Produkt wurde aktualisiert.');
  res.redirect('/admin/products');
});

router.post('/products/:id/delete', async (req, res) => {
  const existing = store.get('products', req.params.id);
  if (existing) deleteUploadedImage(existing.image_path);
  await store.remove('products', req.params.id);
  setFlash(req, 'success', 'Produkt wurde gelöscht.');
  res.redirect('/admin/products');
});

// ---------- Portfolio ----------
router.get('/portfolio', (req, res) => {
  res.render('admin/portfolio', { items: store.list('portfolio'), flash: takeFlash(req) });
});

router.post('/portfolio', upload.single('image'), async (req, res) => {
  const { title } = req.body;
  if (!req.file) {
    setFlash(req, 'error', 'Bitte laden Sie ein Foto hoch.');
    return res.redirect('/admin/portfolio');
  }
  await store.create('portfolio', {
    title: (title || '').trim() || 'Projekt',
    image_path: '/uploads/' + req.file.filename,
    is_active: true,
  });
  setFlash(req, 'success', 'Foto wurde zum Portfolio hinzugefügt.');
  res.redirect('/admin/portfolio');
});

router.post('/portfolio/:id/delete', async (req, res) => {
  const existing = store.get('portfolio', req.params.id);
  if (existing) deleteUploadedImage(existing.image_path);
  await store.remove('portfolio', req.params.id);
  setFlash(req, 'success', 'Foto wurde gelöscht.');
  res.redirect('/admin/portfolio');
});

// ---------- Reviews ----------
router.get('/reviews', (req, res) => {
  res.render('admin/reviews', { items: store.list('reviews'), flash: takeFlash(req) });
});

router.post('/reviews', async (req, res) => {
  const { author_name, quote, rating } = req.body;
  if (!author_name || !quote) {
    setFlash(req, 'error', 'Bitte Name und Bewertungstext angeben.');
    return res.redirect('/admin/reviews');
  }
  await store.create('reviews', {
    author_name: author_name.trim(), quote: quote.trim(),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    is_active: true,
  });
  setFlash(req, 'success', 'Bewertung wurde hinzugefügt.');
  res.redirect('/admin/reviews');
});

router.post('/reviews/:id/delete', async (req, res) => {
  await store.remove('reviews', req.params.id);
  setFlash(req, 'success', 'Bewertung wurde gelöscht.');
  res.redirect('/admin/reviews');
});

// ---------- Settings ----------
router.get('/settings', (req, res) => {
  res.render('admin/settings', { settings: store.getSettings(), flash: takeFlash(req) });
});

router.post('/settings', upload.fields([{ name: 'hero_image', maxCount: 1 }, { name: 'about_image', maxCount: 1 }]), async (req, res) => {
  const b = req.body;
  const current = store.getSettings();
  const fields = {
    business_name: (b.business_name || '').trim(),
    whatsapp_number: (b.whatsapp_number || '').replace(/[^0-9]/g, ''),
    contact_email: (b.contact_email || '').trim(),
    address: (b.address || '').trim(),
    opening_hours: (b.opening_hours || '').trim(),
    facebook_url: (b.facebook_url || '').trim(),
    instagram_url: (b.instagram_url || '').trim(),
    tiktok_url: (b.tiktok_url || '').trim(),
    hero_headline: (b.hero_headline || '').trim(),
    hero_subtext: (b.hero_subtext || '').trim(),
    about_text_1: (b.about_text_1 || '').trim(),
    about_text_2: (b.about_text_2 || '').trim(),
    hero_image_path: current.hero_image_path,
    about_image_path: current.about_image_path,
  };
  if (req.files && req.files.hero_image && req.files.hero_image[0]) {
    deleteUploadedImage(current.hero_image_path);
    fields.hero_image_path = '/uploads/' + req.files.hero_image[0].filename;
  }
  if (req.files && req.files.about_image && req.files.about_image[0]) {
    deleteUploadedImage(current.about_image_path);
    fields.about_image_path = '/uploads/' + req.files.about_image[0].filename;
  }
  await store.updateSettings(fields);
  setFlash(req, 'success', 'Einstellungen wurden gespeichert.');
  res.redirect('/admin/settings');
});

module.exports = router;
