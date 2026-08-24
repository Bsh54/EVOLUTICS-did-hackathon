/**
 * Intrants Service — gestion des intrants à crédit
 *
 * En début de campagne, la coopérative distribue des intrants à crédit aux
 * producteurs (engrais, insecticides, semences). Cette dette est récupérée
 * automatiquement à la vente (déduction "crédit intrants" de 90 FCFA/kg sur
 * chaque livraison — voir deliveryService / paymentService).
 *
 * Ce service transforme cette dette en un VRAI COMPTE par producteur :
 *   solde = total distribué (reçu à crédit)  −  total récupéré (déjà déduit des livraisons)
 *
 * Fichier de données : intrants.json = { distributions: [] }
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE = 'intrants.json';

// Catalogue des intrants de la campagne (prix FCFA indicatifs, modifiables à la distribution)
const CATALOG = [
  { type: 'npk',         label: 'Engrais NPK (sac 50 kg)', unit: 'sac',    default_price: 14000 },
  { type: 'uree',        label: 'Urée (sac 50 kg)',        unit: 'sac',    default_price: 13000 },
  { type: 'insecticide', label: 'Insecticide',             unit: 'litre',  default_price: 3500 },
  { type: 'herbicide',   label: 'Herbicide',               unit: 'litre',  default_price: 3000 },
  { type: 'semences',    label: 'Semences',                unit: 'kg',     default_price: 500 }
];

function readJSON(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return { distributions: [] };
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}
function writeJSON(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}

function getCatalog() { return CATALOG; }

/** Total d'intrants déjà récupéré pour un producteur (déductions "crédit intrants" des livraisons). */
function getRecovered(npi, coopId) {
  const dv = readJSON('deliveries.json');
  return (dv.deliveries || [])
    .filter(d => d.farmer_npi === npi && d.cooperative_id === coopId)
    .reduce((s, d) => s + (d.input_credit_deduction || 0), 0);
}

/**
 * Enregistre une distribution d'intrants à crédit à un producteur.
 * @param {string} coopId
 * @param {string} producerNpi
 * @param {Array} items - [{ type, quantity, unit_price }]
 * @param {string} registeredByNpi
 */
function distribute(coopId, producerNpi, items, registeredByNpi) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Aucun intrant sélectionné');

  const lines = items.map(it => {
    const cat = CATALOG.find(c => c.type === it.type);
    if (!cat) throw new Error(`Intrant inconnu: ${it.type}`);
    const quantity = Number(it.quantity);
    const unit_price = it.unit_price != null ? Number(it.unit_price) : cat.default_price;
    if (!(quantity > 0)) throw new Error(`Quantité invalide pour ${cat.label}`);
    if (!(unit_price >= 0)) throw new Error(`Prix invalide pour ${cat.label}`);
    return { type: cat.type, label: cat.label, unit: cat.unit, quantity, unit_price, subtotal: quantity * unit_price };
  });

  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  const data = readJSON(FILE);
  const now = new Date();
  const id = 'INT-' + now.toISOString().slice(0, 10).replace(/-/g, '') + '-' + String((data.distributions.length + 1)).padStart(3, '0');

  const record = {
    id, cooperative_id: coopId, producer_npi: producerNpi,
    date: now.toISOString(), items: lines, total, registered_by: registeredByNpi
  };
  data.distributions.push(record);
  writeJSON(FILE, data);
  return record;
}

/** Compte d'intrants d'un producteur : distribué, récupéré, solde. */
function getAccount(npi, coopId) {
  const data = readJSON(FILE);
  const distributions = data.distributions.filter(d => d.producer_npi === npi && d.cooperative_id === coopId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const total_distributed = distributions.reduce((s, d) => s + d.total, 0);
  const total_recovered = getRecovered(npi, coopId);
  const balance = total_distributed - total_recovered;
  return { npi, total_distributed, total_recovered, balance, distributions };
}

/** Liste les comptes d'intrants de tous les producteurs ayant reçu des intrants dans la coop. */
function listAccounts(coopId) {
  const data = readJSON(FILE);
  const npis = [...new Set(data.distributions.filter(d => d.cooperative_id === coopId).map(d => d.producer_npi))];
  return npis.map(npi => {
    const acc = getAccount(npi, coopId);
    return { npi, total_distributed: acc.total_distributed, total_recovered: acc.total_recovered, balance: acc.balance, distribution_count: acc.distributions.length };
  }).sort((a, b) => b.balance - a.balance);
}

/** Totaux coopérative (pour dashboard). */
function getCoopTotals(coopId) {
  const data = readJSON(FILE);
  const dists = data.distributions.filter(d => d.cooperative_id === coopId);
  const total_distributed = dists.reduce((s, d) => s + d.total, 0);
  const npis = [...new Set(dists.map(d => d.producer_npi))];
  const total_recovered = npis.reduce((s, npi) => s + getRecovered(npi, coopId), 0);
  return { total_distributed, total_recovered, balance: total_distributed - total_recovered, beneficiaries: npis.length };
}

module.exports = { getCatalog, distribute, getAccount, listAccounts, getCoopTotals };
