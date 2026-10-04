// Base de datos persistente usando MongoDB Atlas (gratis).
// Reemplaza los archivos JSON locales, que se perdían cada vez que
// Render reiniciaba o redesplegaba el servidor.

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

let client;
let db;

const SEED_PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

async function getDb() {
  if (db) return db;
  if (!process.env.MONGODB_URI) {
    throw new Error("Falta la variable MONGODB_URI (conexión a la base de datos)");
  }
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db("brilla-siempre");

  // Si la colección de productos está vacía (primera vez), la llenamos
  // con lo que haya en data/products.json como punto de partida.
  const count = await db.collection("products").countDocuments();
  if (count === 0 && fs.existsSync(SEED_PRODUCTS_FILE)) {
    const seed = JSON.parse(fs.readFileSync(SEED_PRODUCTS_FILE, "utf-8"));
    if (seed.length) {
      await db.collection("products").insertMany(seed);
    }
  }

  return db;
}

async function getProducts() {
  const database = await getDb();
  const products = await database.collection("products").find({}).toArray();
  return products.map(({ _id, ...rest }) => rest);
}

async function saveProducts(products) {
  const database = await getDb();
  const col = database.collection("products");
  await col.deleteMany({});
  if (products.length) {
    await col.insertMany(products.map((p) => ({ ...p })));
  }
}

async function getProduct(id) {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}

async function getOrders() {
  const database = await getDb();
  const orders = await database
    .collection("orders")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return orders.map(({ _id, ...rest }) => rest);
}

async function saveOrder(order) {
  const database = await getDb();
  await database.collection("orders").insertOne({ ...order });
}

async function updateOrderStatus(orderId, status) {
  const database = await getDb();
  await database.collection("orders").updateOne(
    { id: orderId },
    { $set: { status, updatedAt: new Date().toISOString() } }
  );
}

module.exports = {
  getProducts,
  saveProducts,
  getProduct,
  getOrders,
  saveOrder,
  updateOrderStatus,
};
