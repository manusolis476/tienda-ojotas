const express = require("express");
const { checkLogin } = require("../auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { user, password } = req.body;
  if (checkLogin(user, password)) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Usuario o contraseña incorrectos" });
});

router.post("/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.get("/session", (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

module.exports = router;
