// Uso: npm run hash-password
// Pide una contraseña por consola y devuelve el hash para pegar en
// ADMIN_PASSWORD_HASH dentro del .env. Así la contraseña real nunca
// queda escrita en texto plano en ningún archivo.

const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Elegí la contraseña de admin: ", (password) => {
  const hash = bcrypt.hashSync(password, 10);
  console.log("\nPegá esta línea en tu archivo .env:\n");
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  rl.close();
});
