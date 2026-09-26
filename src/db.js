// Base de datos simple basada en archivos JSON.
// Para una tienda chica alcanza; si crece mucho, migrar a Postgres/SQLite es
// cuestión de reemplazar las funciones de este archivo, el resto del código
// no se entera.

const fs = require("fs");
const path = require("path");

const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");
const ORDERS_FILE = path.join(__dirname, "..", "data", "orders.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getProducts() {
  return readJson(PRODUCTS_FILE);
}

function saveProducts(products) {
  writeJson(PRODUCTS_FILE, products);
}

function getProduct(id) {
  return getProducts().find((p) => p.id === id);
}

function getOrders() {
  return readJson(ORDERS_FILE);
}

function saveOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  writeJson(ORDERS_FILE, orders);
}

function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    writeJson(ORDERS_FILE, orders);
  }
  return order;
}

module.exports = {
  getProducts,
  saveProducts,
  getProduct,
  getOrders,
  saveOrder,
  updateOrderStatus,
};
