/**
 * invStore — petit magasin en mémoire pour les invitations DIDComm.
 * On stocke l'URL d'invitation complète (didcomm?oob=...) sous un id court,
 * et /inv/:id redirige (302) vers elle. Le wallet suit la redirection pour
 * récupérer le paramètre ?oob= (format qu'il sait lire).
 */
const crypto = require('crypto');

const MAP = new Map(); // id -> { url, exp }
const TTL_MS = 60 * 60 * 1000; // 1h

function store(url) {
  const id = crypto.randomBytes(6).toString('hex');
  MAP.set(id, { url, exp: Date.now() + TTL_MS });
  return id;
}
function get(id) {
  const e = MAP.get(id);
  if (!e || e.exp < Date.now()) { MAP.delete(id); return null; }
  return e.url;
}

module.exports = { store, get };
