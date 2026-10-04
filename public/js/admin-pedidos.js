function money(n) {
  return "$" + n.toLocaleString("es-AR");
}

async function checkSession() {
  const res = await fetch("/api/auth/session");
  const data = await res.json();
  if (!data.isAdmin) {
    window.location.href = "/admin/";
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-AR");
  } catch (e) {
    return iso;
  }
}

async function loadOrders() {
  const list = document.getElementById("ordersList");
  try {
    const res = await fetch("/api/payments/orders");
    if (!res.ok) throw new Error("No se pudieron cargar los pedidos");
    const orders = await res.json();

    if (!orders.length) {
      list.innerHTML = '<p class="cart-empty">Todavía no hay pedidos.</p>';
      return;
    }

    list.innerHTML = "";
    orders.forEach((order) => {
      const card = document.createElement("div");
      card.className = "order-card";

      const itemsHtml = (order.items || [])
        .map(
          (it) =>
            `${it.productName} — talle ${it.size} · ${it.model} · x${it.quantity} (${money(
              it.price * it.quantity
            )})`
        )
        .join("<br>");

      const shipping = order.shipping || {};

      card.innerHTML = `
        <div class="top">
          <span class="order-code">${order.id}</span>
          <span class="order-status">${order.status || "pending"}</span>
        </div>
        <div style="font-size:.8rem;opacity:.6;">${formatDate(order.createdAt)}</div>
        <div class="order-items">${itemsHtml}</div>
        <div style="font-weight:600;">Total: ${money(order.total || 0)}</div>
        <div class="order-shipping">
          <strong>Envío:</strong><br>
          ${shipping.name || "-"}<br>
          ${shipping.address || "-"}<br>
          Tel: ${shipping.phone || "-"} · DNI: ${shipping.dni || "-"}
        </div>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p class="cart-empty">${err.message}</p>`;
  }
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/admin/";
});

checkSession();
loadOrders();
