const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../auth");

const router = express.Router();

// Público: catálogo completo
router.get("/", async (req, res) => {
  try {
    res.json(await db.getProducts());
  } catch (err) {
    console.error("Error leyendo productos", err);
    res.status(500).json({ error: "No se pudieron cargar los productos" });
  }
});

// Admin: reemplaza la lista de talles disponibles de un producto
router.put("/:id/sizes", requireAdmin, async (req, res) => {
  try {
    const { sizes } = req.body;
    if (!Array.isArray(sizes)) {
      return res.status(400).json({ error: "Formato de talles inválido" });
    }
    const products = await db.getProducts();
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    product.sizes = sizes;
    await db.saveProducts(products);
    res.json(product);
  } catch (err) {
    console.error("Error guardando talles", err);
    res.status(500).json({ error: "No se pudo guardar" });
  }
});

// Admin: actualiza el precio de un producto
router.put("/:id/price", requireAdmin, async (req, res) => {
  try {
    const { price } = req.body;
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Precio inválido" });
    }
    const products = await db.getProducts();
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    product.price = price;
    await db.saveProducts(products);
    res.json(product);
  } catch (err) {
    console.error("Error guardando precio", err);
    res.status(500).json({ error: "No se pudo guardar" });
  }
});

// Admin: actualiza el nombre de un producto
router.put("/:id/name", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Nombre inválido" });
    }
    const products = await db.getProducts();
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    product.name = name.trim();
    await db.saveProducts(products);
    res.json(product);
  } catch (err) {
    console.error("Error guardando nombre", err);
    res.status(500).json({ error: "No se pudo guardar" });
  }
});

// Admin: actualiza la imagen de un producto (recibe la URL que devolvió /api/upload)
router.put("/:id/image", requireAdmin, async (req, res) => {
  try {
    const { image } = req.body;
    if (typeof image !== "string") {
      return res.status(400).json({ error: "Imagen inválida" });
    }
    const products = await db.getProducts();
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    product.image = image;
    await db.saveProducts(products);
    res.json(product);
  } catch (err) {
    console.error("Error guardando imagen", err);
    res.status(500).json({ error: "No se pudo guardar" });
  }
});

// Admin: crea un producto nuevo
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, price, sizes, models, image } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Nombre inválido" });
    }
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Precio inválido" });
    }
    const products = await db.getProducts();
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
    await db.saveProducts(products);
    res.status(201).json(product);
  } catch (err) {
    console.error("Error creando producto", err);
    res.status(500).json({ error: "No se pudo crear el producto" });
  }
});

// Admin: borra un producto
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const products = await db.getProducts();
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    products.splice(idx, 1);
    await db.saveProducts(products);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error borrando producto", err);
    res.status(500).json({ error: "No se pudo borrar" });
  }
});

module.exports = router;
