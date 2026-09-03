/**
 * invStore — magasin PERSISTANT (fichier) pour les invitations DIDComm.
 * On stocke l'URL cible (/oob?oob=...) sous un id court ; /inv/:id redirige (302).
 * Persisté sur disque pour survivre aux redémarrages du serveur (sinon les QR
 * déjà distribués deviennent morts après un restart).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../../data/invitations.json');
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); } catch { return {}; }
}
function save(map) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(map), 'utf-8');
  } catch (e) { console.warn('invStore save échoué:', e.message); }
}

function store(url) {
  const map = load();
  const id = crypto.randomBytes(6).toString('hex');
  map[id] = { url, exp: Date.now() + TTL_MS };
  // purge des entrées expirées au passage
  const now = Date.now();
  for (const k of Object.keys(map)) if (map[k].exp < now) delete map[k];
  save(map);
  return id;
}
function get(id) {
  const map = load();
  const e = map[id];
  if (!e || e.exp < Date.now()) return null;
  return e.url;
}

module.exports = { store, get };
