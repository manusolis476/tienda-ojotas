require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");

const productsRoutes = require("./routes/products");
const authRoutes = require("./routes/auth");
const paymentsRoutes = require("./routes/payments");
const uploadRoutes = require("./routes/upload");

const app = express();

app.use(express.json());
app.use(
  cookieSession({
    name: "session",
    secret: process.env.SESSION_SECRET,
    maxAge: 12 * 60 * 60 * 1000, // 12 horas
    httpOnly: true,
    sameSite: "lax",
  })
);

// Config pública mínima que necesita el frontend (número de WhatsApp como texto)
app.get("/api/config", (req, res) => {
  res.json({ whatsapp: process.env.WHATSAPP_NUMBER || "" });
});

app.use("/api/products", productsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/upload", uploadRoutes);

app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tienda corriendo en http://localhost:${PORT}`);
});
