const bcrypt = require("bcryptjs");

function checkLogin(user, password) {
  const validUser = user === process.env.ADMIN_USER;
  const validPassword =
    process.env.ADMIN_PASSWORD_HASH &&
    bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);
  return validUser && validPassword;
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: "No autorizado" });
}

module.exports = { checkLogin, requireAdmin };
