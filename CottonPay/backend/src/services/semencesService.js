/**
 * Semences Service — suivi de la qualité des semences distribuées
 *
 * La qualité des semences (variété, taux de germination) est l'un des facteurs
 * majeurs du rendement — et l'une des causes citées de la baisse de production.
 * Ce service trace, par producteur, la variété distribuée, la quantité et le taux
 * de germination, et calcule des statistiques + alertes (germination faible).
 *
 * Fichier de données : semences.json = { records: [] }
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE = 'semences.json';

// Variétés de coton cultivées au Bénin (taux de germination indicatif de référence)
const VARIETIES = [
  { code: 'OKP-768',   label: 'OKP 768',   ref_germination: 90 },
  { code: 'STAM-279A', label: 'STAM 279A', ref_germination: 88 },
  { code: 'H-279-1',   label: 'H 279-1',   ref_germination: 85 },
  { code: 'S-189',     label: 'S 189',     ref_germination: 82 }
];
const MIN_GERMINATION = 80; // seuil d'alerte

function readJSON() {
  const fp = path.join(DATA_DIR, FILE);
  if (!fs.existsSync(fp)) return { records: [] };
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}
function writeJSON(data) {
  fs.writeFileSync(path.join(DATA_DIR, FILE), JSON.stringify(data, null, 2), 'utf-8');
}

function getVarieties() { return VARIETIES; }

function distribute(coopId, producerNpi, variety, quantityKg, germinationRate, registeredByNpi) {
  const v = VARIETIES.find(x => x.code === variety);
  if (!v) throw new Error(`Variété inconnue: ${variety}`);
  const quantity_kg = Number(quantityKg);
  if (!(quantity_kg > 0)) throw new Error('Quantité invalide');
  let germination = germinationRate != null && germinationRate !== '' ? Number(germinationRate) : v.ref_germination;
  if (germination < 0 || germination > 100) throw new Error('Taux de germination invalide (0-100)');

  const data = readJSON();
  const now = new Date();
  const id = 'SEM-' + now.toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(data.records.length + 1).padStart(3, '0');
  const record = {
    id, cooperative_id: coopId, producer_npi: producerNpi,
    variety: v.code, variety_label: v.label, quantity_kg,
    germination_rate: germination, low_germination: germination < MIN_GERMINATION,
    date: now.toISOString(), registered_by: registeredByNpi
  };
  data.records.push(record);
  writeJSON(data);
  return record;
}

function listByCoop(coopId) {
  return readJSON().records.filter(r => r.cooperative_id === coopId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getByProducer(npi, coopId) {
  return readJSON().records.filter(r => r.producer_npi === npi && r.cooperative_id === coopId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getStats(coopId) {
  const recs = readJSON().records.filter(r => r.cooperative_id === coopId);
  const byVariety = {};
  let totalKg = 0, germSum = 0, lowCount = 0;
  recs.forEach(r => {
    byVariety[r.variety_label] = (byVariety[r.variety_label] || 0) + r.quantity_kg;
    totalKg += r.quantity_kg;
    germSum += r.germination_rate;
    if (r.low_germination) lowCount++;
  });
  return {
    total_kg: totalKg,
    distributions: recs.length,
    avg_germination: recs.length ? Math.round(germSum / recs.length) : null,
    low_germination_count: lowCount,
    by_variety: Object.entries(byVariety).map(([label, kg]) => ({ label, kg })).sort((a, b) => b.kg - a.kg)
  };
}

module.exports = { getVarieties, distribute, listByCoop, getByProducer, getStats, MIN_GERMINATION };
