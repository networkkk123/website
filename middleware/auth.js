// middleware/auth.js
//
// Single-admin authentication. There's no "users" table — the one allowed
// username/password lives in environment variables (see .env.example), so
// nobody can log in unless they have the real server's secrets.

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  return next();
}

module.exports = { requireAdmin, redirectIfLoggedIn };
