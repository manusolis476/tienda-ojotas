function money(n) {
  return "$" + n.toLocaleString("es-AR");
}

const inputStyle =
  "padding:.5rem .6rem;border:1px solid var(--line);border-radius:2px;font-family:var(--font-body);font-size:.95rem;width:100%;";

async function checkSession() {
  const res = await fetch("/api/auth/session");
  const data = await res.json();
  if (!data.isAdmin) {
    window.location.href = "/admin/";
  }
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen");
  return data.url;
}

function renderSizeEditor(container, sizes, newSizeInput, addSizeBtn) {
  function renderSizes() {
    container.innerHTML = "";
    sizes.forEach((entry, idx) => {
      const chip = document.createElement("span");
      chip.style.display = "inline-flex";
      chip.style.alignItems = "center";
      chip.style.gap = ".3rem";
      chip.className = "chip" + (entry.available ? "" : " marked-unavailable");
      chip.style.cursor = "default";

      const label = document.createElement("button");
      label.type = "button";
      label.textContent = entry.size;
      label.style.cssText = "background:none;border:none;color:inherit;font:inherit;cursor:pointer;padding:0;";
      label.addEventListener("click", () => {
        entry.available = !entry.available;
        renderSizes();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "✕";
      remove.title = "Sacar este talle de la lista";
      remove.style.cssText = "background:none;border:none;color:inherit;cursor:pointer;opacity:.6;padding:0;";
      remove.addEventListener("click", () => {
        sizes.splice(idx, 1);
        renderSizes();
      });

      chip.appendChild(label);
      chip.appendChild(remove);
      container.appendChild(chip);
    });
  }
  renderSizes();

  addSizeBtn.addEventListener("click", () => {
    const value = newSizeInput.value.trim();
    if (!value) return;
    if (sizes.some((s) => s.size === value)) {
      alert("Ese talle ya está en la lista.");
      return;
    }
    sizes.push({ size: value, available: true });
    newSizeInput.value = "";
    renderSizes();
  });

  return renderSizes;
}

async function loadProducts() {
  const res = await fetch("/api/products");
  const products = await res.json();
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  // --- Tarjeta para agregar un producto nuevo ---
  const addCard = document.createElement("div");
  addCard.className = "product";
  addCard.style.border = "2px dashed var(--line)";
  let newImage = "";
  addCard.innerHTML = `
    <p class="product-name">Agregar producto nuevo</p>
    <div class="field">
      <label>Foto</label>
      <div class="thumb" id="newThumb" style="max-width:140px;"></div>
      <input type="file" accept="image/*" class="new-image-input">
    </div>
    <div class="field">
      <label>Nombre</label>
      <input type="text" class="new-name-input" placeholder="Ej: Ojota verano" style="${inputStyle}">
    </div>
    <div class="field">
      <label>Precio</label>
      <input type="number" class="new-price-input" placeholder="0" min="0" step="100" style="${inputStyle}">
    </div>
    <div class="field">
      <label>Talles (separados por coma, ej: 38,39,40)</label>
      <input type="text" class="new-sizes-input" placeholder="38,39,40,41,42" style="${inputStyle}">
    </div>
    <div class="field">
      <label>Modelos / colores (separados por coma)</label>
      <input type="text" class="new-models-input" placeholder="Negro,Blanco" style="${inputStyle}">
    </div>
    <button class="btn btn-pay create-btn">Crear producto</button>
  `;
  const newThumb = addCard.querySelector("#newThumb");
  const newImageInput = addCard.querySelector(".new-image-input");
  const newNameInput = addCard.querySelector(".new-name-input");
  const newPriceInput = addCard.querySelector(".new-price-input");
  const newSizesInput = addCard.querySelector(".new-sizes-input");
  const newModelsInput = addCard.querySelector(".new-models-input");
  const createBtn = addCard.querySelector(".create-btn");

  newImageInput.addEventListener("change", async () => {
    const file = newImageInput.files[0];
    if (!file) return;
    newThumb.textContent = "Subiendo...";
    try {
      newImage = await uploadImage(file);
      newThumb.innerHTML = `<img src="${newImage}" style="width:100%;height:100%;object-fit:cover;">`;
    } catch (err) {
      alert(err.message);
      newThumb.textContent = "";
    }
  });

  createBtn.addEventListener("click", async () => {
    const name = newNameInput.value.trim();
    const price = Number(newPriceInput.value);
    if (!name || !price) {
      alert("Completá al menos nombre y precio.");
      return;
    }
    const sizes = newSizesInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((size) => ({ size, available: true }));
    const models = newModelsInput.value
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    createBtn.disabled = true;
    createBtn.textContent = "Creando...";
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, sizes, models, image: newImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear");
      loadProducts();
    } catch (err) {
      alert(err.message);
      createBtn.disabled = false;
      createBtn.textContent = "Crear producto";
    }
  });

  grid.appendChild(addCard);

  // --- Tarjetas de productos existentes ---
  products.forEach((p) => {
    const el = document.createElement("div");
    el.className = "product";
    let sizes = p.sizes.map((s) => ({ ...s })); // copia editable
    let image = p.image || "";

    el.innerHTML = `
      <div class="field">
        <label>Foto</label>
        <div class="thumb img-preview" style="max-width:140px;">
          ${image ? `<img src="${image}" style="width:100%;height:100%;object-fit:cover;">` : ""}
        </div>
        <input type="file" accept="image/*" class="image-input">
      </div>
      <div class="field">
        <label>Nombre</label>
        <input type="text" class="name-input" value="${p.name}" style="${inputStyle}">
      </div>
      <div class="field">
        <label>Precio</label>
        <input type="number" class="price-input" value="${p.price}" min="0" step="100" style="${inputStyle}">
      </div>
      <div class="field">
        <label>Talles (tocar para agotar / reponer, la X saca el talle de la lista)</label>
        <div class="chip-row size-row"></div>
        <div style="display:flex;gap:.4rem;margin-top:.4rem;">
          <input type="text" class="new-size-input" placeholder="Nuevo talle (ej: 44)"
            style="flex:1;padding:.4rem .5rem;border:1px solid var(--line);border-radius:2px;font-family:var(--font-body);font-size:.82rem;">
          <button type="button" class="btn-admin add-size-btn">Agregar talle</button>
        </div>
      </div>
      <div style="display:flex;gap:.5rem;">
        <button class="btn btn-pay save-btn">Guardar</button>
        <button class="btn-admin delete-btn" type="button" style="border-color:#a13b3b;color:#a13b3b;">Borrar</button>
      </div>
    `;

    const sizeRow = el.querySelector(".size-row");
    const imgPreview = el.querySelector(".img-preview");
    const imageInput = el.querySelector(".image-input");
    const nameInput = el.querySelector(".name-input");
    const priceInput = el.querySelector(".price-input");
    const newSizeInput = el.querySelector(".new-size-input");
    const addSizeBtn = el.querySelector(".add-size-btn");
    const saveBtn = el.querySelector(".save-btn");
    const deleteBtn = el.querySelector(".delete-btn");

    renderSizeEditor(sizeRow, sizes, newSizeInput, addSizeBtn);

    imageInput.addEventListener("change", async () => {
      const file = imageInput.files[0];
      if (!file) return;
      imgPreview.textContent = "Subiendo...";
      try {
        image = await uploadImage(file);
        imgPreview.innerHTML = `<img src="${image}" style="width:100%;height:100%;object-fit:cover;">`;
      } catch (err) {
        alert(err.message);
        imgPreview.textContent = "";
      }
    });

    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`¿Borrar "${p.name}" de la tienda? Esta acción no se puede deshacer.`)) return;
      deleteBtn.disabled = true;
      try {
        const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("No se pudo borrar");
        loadProducts();
      } catch (err) {
        alert(err.message);
        deleteBtn.disabled = false;
      }
    });

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";
      try {
        const newPrice = Number(priceInput.value);
        const newName = nameInput.value.trim();
        const results = await Promise.all([
          fetch(`/api/products/${p.id}/sizes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sizes }),
          }),
          fetch(`/api/products/${p.id}/price`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ price: newPrice }),
          }),
          fetch(`/api/products/${p.id}/name`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
          }),
          fetch(`/api/products/${p.id}/image`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image }),
          }),
        ]);
        if (results.some((r) => !r.ok)) throw new Error("No se pudo guardar");
        saveBtn.textContent = "Guardado ✓";
      } catch (err) {
        saveBtn.textContent = "Error, reintentar";
      } finally {
        setTimeout(() => {
          saveBtn.disabled = false;
          saveBtn.textContent = "Guardar";
        }, 1500);
      }
    });

    grid.appendChild(el);
  });
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/admin/";
});

checkSession();
loadProducts();
