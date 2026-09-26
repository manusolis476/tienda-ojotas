# Tienda de ojotas — backend propio

Sitio con:
- Catálogo público (talles con disponibilidad, modelo).
- Botón **Pagar** que crea una preferencia de pago en tu cuenta de Mercado Pago y redirige ahí.
- Número de WhatsApp mostrado como texto (no como link automático).
- Panel de admin (`/admin`) con usuario y contraseña para marcar talles agotados/disponibles.

## 1. Instalar

Necesitás [Node.js](https://nodejs.org) instalado (versión 18 o superior).

```bash
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Completá `.env`:

- `ADMIN_USER`: el usuario con el que vas a entrar a `/admin`.
- `ADMIN_PASSWORD_HASH`: NO pongas la contraseña en texto plano. Corré:
  ```bash
  npm run hash-password
  ```
  Te va a pedir la contraseña y te da un hash para pegar en esta variable.
- `SESSION_SECRET`: cualquier texto largo y random (por ejemplo generado en https://generate-secret.vercel.app/32).
- `MP_ACCESS_TOKEN`: en tu cuenta de Mercado Pago, andá a **Tu negocio > Configuración > Credenciales** y copiá el **Access Token de producción**.
- `WHATSAPP_NUMBER`: tu número, tal cual querés que se vea en la página.
- `PUBLIC_URL`: la URL final de tu sitio (ver paso 4). Mientras probás en tu compu, dejalo en `http://localhost:3000`.

## 3. Probar en tu computadora

```bash
npm start
```

Abrí `http://localhost:3000` para la tienda, y `http://localhost:3000/admin` para el panel.

Nota: mientras estés en `localhost`, Mercado Pago no puede redirigirte de vuelta correctamente (necesita una URL pública). Para probar el flujo de pago completo, hace falta tenerlo desplegado (paso 4) o usar una herramienta como [ngrok](https://ngrok.com) para exponer tu `localhost` temporalmente.

## 4. Subirlo a internet con tu propio dominio

Este proyecto es un servidor Node.js normal, así que sirve en casi cualquier hosting. Opciones simples y con capa gratuita:

- **[Render](https://render.com)**: creás un "Web Service", conectás tu repositorio (o subís el código), comando de build `npm install`, comando de start `npm start`, y cargás ahí las mismas variables de entorno del `.env`.
- **[Railway](https://railway.app)**: mismo esquema, subís el proyecto y cargás las variables de entorno desde su panel.

Pasos generales:

1. Subí este código a un repositorio de GitHub (o subilo directo si el hosting lo permite).
2. Creá el servicio en el hosting elegido, apuntando a este proyecto.
3. Cargá todas las variables del `.env` en el panel de variables de entorno del hosting (nunca subas el archivo `.env` a GitHub).
4. Una vez desplegado, el hosting te da una URL (ej. `tutienda.onrender.com`). Actualizá `PUBLIC_URL` con esa URL.
5. Comprá tu dominio (por ejemplo en NIC Argentina, Namecheap o GoDaddy) y seguí las instrucciones del hosting para conectar un "dominio personalizado" (Custom Domain) — normalmente es apuntar un registro DNS tipo CNAME.
6. Actualizá de nuevo `PUBLIC_URL` con tu dominio final una vez que esté conectado.

## Estructura del proyecto

```
src/            servidor y lógica (rutas, autenticación, datos)
public/         lo que ve el navegador (tienda, admin, páginas de resultado de pago)
data/           productos y pedidos guardados como JSON
```

## Ampliar más adelante

- Reemplazar el almacenamiento en JSON por una base de datos real (Postgres, SQLite) si el catálogo crece.
- Agregar fotos: subir las imágenes a `public/images/` y poner la ruta en el campo `image` de `data/products.json`.
- Agregar más de un usuario admin, o roles.
