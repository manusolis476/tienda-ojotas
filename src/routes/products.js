const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../auth");

const router = express.Router();

// Público: catálogo completo
router.get("/", (req, res) => {
  res.json(db.getProducts());
});

// Admin: reemplaza la lista de talles disponibles de un producto
router.put("/:id/sizes", requireAdmin, (req, res) => {
  const { sizes } = req.body;
  if (!Array.isArray(sizes)) {
    return res.status(400).json({ error: "Formato de talles inválido" });
  }
  const products = db.getProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  product.sizes = sizes;
  db.saveProducts(products);
  res.json(product);
});

// Admin: actualiza el precio de un producto
router.put("/:id/price", requireAdmin, (req, res) => {
  const { price } = req.body;
  if (typeof price !== "number" || price < 0) {
    return res.status(400).json({ error: "Precio inválido" });
  }
  const products = db.getProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  product.price = price;
  db.saveProducts(products);
  res.json(product);
});

// Admin: actualiza el nombre de un producto
router.put("/:id/name", requireAdmin, (req, res) => {
  const { name } = req.body;
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Nombre inválido" });
  }
  const products = db.getProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  product.name = name.trim();
  db.saveProducts(products);
  res.json(product);
});

// Admin: actualiza la imagen de un producto (recibe la URL que devolvió /api/upload)
router.put("/:id/image", requireAdmin, (req, res) => {
  const { image } = req.body;
  if (typeof image !== "string") {
    return res.status(400).json({ error: "Imagen inválida" });
  }
  const products = db.getProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  product.image = image;
  db.saveProducts(products);
  res.json(product);
});

// Admin: crea un producto nuevo
router.post("/", requireAdmin, (req, res) => {
  const { name, price, sizes, models, image } = req.body;
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Nombre inválido" });
  }
  if (typeof price !== "number" || price < 0) {
    return res.status(400).json({ error: "Precio inválido" });
  }
  const products = db.getProducts();
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  let id = slug || "producto";
  let n = 1;
  while (products.some((p) => p.id === id)) {
    id = `${slug}-${n++}`;
  }
  const product = {
    id,
    name: name.trim(),
    price,
    image: typeof image === "string" ? image : "",
    sizes: Array.isArray(sizes) ? sizes : [],
    models: Array.isArray(models) && models.length ? models : ["Único"],
  };
  products.push(product);
  db.saveProducts(products);
  res.status(201).json(product);
});

// Admin: borra un producto
router.delete("/:id", requireAdmin, (req, res) => {
  const products = db.getProducts();
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  products.splice(idx, 1);
  db.saveProducts(products);
  res.json({ ok: true });
});

module.exports = router;
