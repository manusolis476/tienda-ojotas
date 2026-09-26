const express = require("express");
const crypto = require("crypto");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const db = require("../db");

const router = express.Router();

function getClient() {
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
}

function orderCode() {
  return "P-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

// Crea el pedido (pendiente) y la preferencia de pago de Mercado Pago.
// Recibe un carrito con uno o más productos y arma un solo pago con todo junto.
// Devuelve la URL (init_point) a la que hay que redirigir al cliente.
router.post("/create-preference", async (req, res) => {
  try {
    const { items: cartItems } = req.body;
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    const orderItems = [];
    for (const item of cartItems) {
      const product = db.getProduct(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Producto no encontrado: ${item.productId}` });
      }
      const sizeEntry = product.sizes.find((s) => s.size === item.size);
      if (!sizeEntry || !sizeEntry.available) {
        return res.status(400).json({ error: `El talle ${item.size} de ${product.name} no está disponible` });
      }
      orderItems.push({
        productId: product.id,
        productName: product.name,
        size: item.size,
        model: item.model,
        price: product.price,
        quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
      });
    }

    const code = orderCode();
    const order = {
      id: code,
      items: orderItems,
      total: orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    db.saveOrder(order);

    const client = getClient();
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: orderItems.map((it) => ({
          id: it.productId,
          title: `${it.productName} - talle ${it.size} - ${it.model}`,
          quantity: it.quantity,
          unit_price: it.price,
          currency_id: "ARS",
        })),
        external_reference: code,
        back_urls: {
          success: `${process.env.PUBLIC_URL}/pago-exitoso.html?codigo=${code}`,
          failure: `${process.env.PUBLIC_URL}/pago-fallido.html?codigo=${code}`,
          pending: `${process.env.PUBLIC_URL}/pago-pendiente.html?codigo=${code}`,
        },
        auto_return: "approved",
        notification_url: `${process.env.PUBLIC_URL}/api/payments/webhook`,
      },
    });

    res.json({ code, init_point: result.init_point });
  } catch (err) {
    console.error("Error creando preferencia de pago", err);
    res.status(500).json({ error: "No se pudo iniciar el pago" });
  }
});

// Mercado Pago llama a esta URL cuando cambia el estado de un pago.
router.post("/webhook", async (req, res) => {
  try {
    const paymentId = req.query.id || req.body?.data?.id;
    const topic = req.query.type || req.body?.type;
    if (topic === "payment" && paymentId) {
      const client = getClient();
      const payment = new Payment(client);
      const info = await payment.get({ id: paymentId });
      const code = info.external_reference;
      if (code) {
        db.updateOrderStatus(code, info.status); // approved / rejected / pending / etc.
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Error procesando webhook de Mercado Pago", err);
    res.sendStatus(200); // igual respondemos 200 para que MP no reintente en loop
  }
});

module.exports = router;
