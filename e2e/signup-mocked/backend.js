// Loads modules from the API repository so a few checks can run the REAL server-side rules (validators, document
// check, Turnstile verification, e-mail template) against what the browser produced.
// The API repo is expected next to this one ("rayen-buisness BACKEND"); set BACKEND_DIR to put it elsewhere.
// Nothing here starts the API, opens a database or sends an e-mail: only pure modules are required.
const fs = require('fs');
const path = require('path');

const BACKEND_DIR = process.env.BACKEND_DIR || path.resolve(__dirname, '..', '..', '..', 'rayen-buisness BACKEND');

function backend(relativePath) {
  const file = path.join(BACKEND_DIR, relativePath);
  if (!fs.existsSync(file)) {
    throw new Error(`API source not found: ${file}\nSet BACKEND_DIR to the folder of the API repository.`);
  }
  return require(file);
}

module.exports = { backend, BACKEND_DIR };
