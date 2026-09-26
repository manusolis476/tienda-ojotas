document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = document.getElementById("user").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");
  errorEl.style.display = "none";

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, password }),
  });

  if (res.ok) {
    window.location.href = "/admin/panel.html";
  } else {
    const data = await res.json();
    errorEl.textContent = data.error || "No se pudo iniciar sesión";
    errorEl.style.display = "block";
  }
});
