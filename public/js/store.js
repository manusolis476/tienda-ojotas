function money(n) {
  return "$" + n.toLocaleString("es-AR");
}

const CART_KEY = "brilla-siempre-cart";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

let cart = loadCart();

function addToCart(item) {
  // Si ya está el mismo producto + talle + modelo, suma cantidad
  const existing = cart.find(
    (c) => c.productId === item.productId && c.size === item.size && c.model === item.model
  );
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
}

function renderCart() {
  const cartCount = document.getElementById("cartCount");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const totalQty = cart.reduce((sum, it) => sum + it.quantity, 0);
  cartCount.textContent = totalQty;

  cartItemsEl.innerHTML = "";
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Todavía no agregaste nada.</p>';
  } else {
    cart.forEach((it, idx) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div>
          <strong>${it.name}</strong><br>
          talle ${it.size} · ${it.model} · x${it.quantity}<br>
          ${money(it.price * it.quantity)}
        </div>
        <button class="cart-item-remove" type="button">Quitar</button>
      `;
      row.querySelector(".cart-item-remove").addEventListener("click", () => removeFromCart(idx));
      cartItemsEl.appendChild(row);
    });
  }

  cartTotalEl.textContent = cart.length ? "Total: " + money(cartTotal()) : "";
  checkoutBtn.disabled = cart.length === 0;
}

function setupCartPanel() {
  const cartButton = document.getElementById("cartButton");
  const cartPanel = document.getElementById("cartPanel");
  const cartOverlay = document.getElementById("cartOverlay");
  const closeCart = document.getElementById("closeCart");
  const checkoutBtn = document.getElementById("checkoutBtn");

  function open() {
    cartPanel.classList.add("open");
    cartOverlay.classList.add("open");
  }
  function close() {
    cartPanel.classList.remove("open");
    cartOverlay.classList.remove("open");
  }

  cartButton.addEventListener("click", open);
  closeCart.addEventListener("click", close);
  cartOverlay.addEventListener("click", close);

  checkoutBtn.addEventListener("click", async () => {
    if (!cart.length) return;
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Generando pago...";
    try {
      const res = await fetch("/api/payments/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((it) => ({
            productId: it.productId,
            size: it.size,
            model: it.model,
            quantity: it.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar el pago");
      localStorage.removeItem(CART_KEY);
      window.location.href = data.init_point;
    } catch (err) {
      alert(err.message);
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Pagar todo";
    }
  });
}

async function loadConfig() {
  const res = await fetch("/api/config");
  const config = await res.json();
  document.getElementById("whatsappNote").textContent = config.whatsapp
    ? `Consultas: ${config.whatsapp}`
    : "";
}

async function loadProducts() {
  const res = await fetch("/api/products");
  const products = await res.json();
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  products.forEach((p) => {
    const el = document.createElement("div");
    el.className = "product";
    const state = { size: null, model: p.models[0] };

    el.innerHTML = `
      <div class="thumb">
        ${
          p.image
            ? `<img src="${p.image}" alt="${p.name}">`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                 <path d="M4 16c0-3 1-5 3-5s2 2 3 2 1-2 3-2 3 2 3 5"/>
                 <path d="M8 11V8m8 3V8"/>
               </svg>`
        }
      </div>
      <p class="product-name">${p.name}</p>
      <p class="product-price">${money(p.price)}</p>
      <div class="field">
        <label>Talle</label>
        <div class="chip-row size-row"></div>
      </div>
      <div class="field">
        <label>Modelo</label>
        <div class="chip-row model-row"></div>
      </div>
      <p class="stock-note">Elegí un talle disponible.</p>
      <button class="btn btn-pay" disabled>Agregar al carrito</button>
    `;

    const sizeRow = el.querySelector(".size-row");
    const modelRow = el.querySelector(".model-row");
    const addBtn = el.querySelector(".btn-pay");
    const stockNote = el.querySelector(".stock-note");

    p.sizes.forEach(({ size, available }) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = size;
      chip.className = "chip" + (available ? "" : " unavailable");
      chip.disabled = !available;
      chip.addEventListener("click", () => {
        state.size = size;
        sizeRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
        chip.classList.add("selected");
        updateButton();
      });
      sizeRow.appendChild(chip);
    });

    p.models.forEach((model, mi) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = model;
      chip.className = "chip" + (mi === 0 ? " selected" : "");
      chip.addEventListener("click", () => {
        state.model = model;
        modelRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
        chip.classList.add("selected");
      });
      modelRow.appendChild(chip);
    });

    function updateButton() {
      addBtn.disabled = !state.size;
      stockNote.textContent = state.size
        ? `Talle ${state.size} seleccionado.`
        : "Elegí un talle disponible.";
    }

    addBtn.addEventListener("click", () => {
      addToCart({
        productId: p.id,
        name: p.name,
        price: p.price,
        size: state.size,
        model: state.model,
      });
      addBtn.textContent = "Agregado ✓";
      setTimeout(() => (addBtn.textContent = "Agregar al carrito"), 1200);
    });

    grid.appendChild(el);
  });
}

loadConfig();
loadProducts();
setupCartPanel();
renderCart();
