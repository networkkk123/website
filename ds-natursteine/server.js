// server.js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const { UPLOAD_DIR } = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // needed so secure cookies work behind Render's/most hosts' proxy

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Served separately (not just via the public/ folder above) because on a
// production host UPLOAD_DIR is usually pointed at a persistent disk
// outside the app folder, so files survive restarts and redeploys.
app.use('/uploads', express.static(UPLOAD_DIR));

if (!process.env.SESSION_SECRET) {
  console.warn('WARNUNG: SESSION_SECRET ist nicht gesetzt. Bitte in der .env-Datei definieren, bevor die Seite online geht.');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION, // requires HTTPS in production, which Render provides automatically
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
}));

app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Centralized error handler — keeps Multer/upload errors and anything
// unexpected from crashing the server or showing a raw stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError || /Nur Bilddateien/.test(err.message || '')) {
    if (req.session) req.session.flash = { type: 'error', message: err.message };
    return res.redirect('back');
  }
  res.status(500).send('Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.');
});

app.listen(PORT, () => {
  console.log(`DS Natursteine läuft auf http://localhost:${PORT}`);
});
