// scripts/hash-password.js
//
// Generates the ADMIN_PASSWORD_HASH value for your .env file.
// Run with:  npm run hash-password
// It will ask you to type a password, then print a hash to paste into .env.

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Neues Admin-Passwort eingeben: ', (password) => {
  if (!password || password.length < 8) {
    console.log('\nBitte ein Passwort mit mindestens 8 Zeichen verwenden. Bitte erneut versuchen.');
    rl.close();
    process.exit(1);
  }
  const hash = bcrypt.hashSync(password, 10);
  console.log('\nFügen Sie diese Zeile in Ihre .env-Datei ein (oder in die Umgebungsvariablen Ihres Hosting-Anbieters):\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  rl.close();
});
