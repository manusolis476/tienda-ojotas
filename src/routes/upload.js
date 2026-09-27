const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { requireAdmin } = require("../auth");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Guardamos el archivo en memoria (no en disco) y lo mandamos directo a Cloudinary,
// así funciona igual en Render (que no guarda archivos de forma permanente).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("El archivo tiene que ser una imagen"));
    }
    cb(null, true);
  },
});

router.post("/", requireAdmin, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({
        error: "Falta configurar Cloudinary (variables CLOUDINARY_* en el servidor)",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "brilla-siempre" },
      (error, result) => {
        if (error) {
          console.error("Error subiendo a Cloudinary", error);
          return res.status(500).json({ error: "No se pudo subir la imagen" });
        }
        res.json({ url: result.secure_url });
      }
    );
    uploadStream.end(req.file.buffer);
  });
});

module.exports = router;
