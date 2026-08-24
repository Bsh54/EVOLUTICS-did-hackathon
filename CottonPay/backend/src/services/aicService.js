/**
 * AIC Service — vue institutionnelle agrégée (union / interprofession)
 *
 * Agrège les données de TOUTES les coopératives pour offrir à l'USPP / la FN-CVPC /
 * l'AIC une vision consolidée : production, paiements (créances), intrants, par
 * coopérative et par commune. Lecture seule, données agrégées (pas de détail nominatif).
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

function rd(f) {
  const fp = path.join(DATA_DIR, f);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch (e) { return null; }
}

function getOverview() {
  const coops = (rd('cooperatives.json') || {}).cooperatives || [];
  const producers = (rd('producers.json') || {}).producers || [];
  const deliveries = (rd('deliveries.json') || {}).deliveries || [];
  const intrants = (rd('intrants.json') || {}).distributions || [];

  const perCoop = coops.map(c => {
    const cd = deliveries.filter(d => d.cooperative_id === c.id);
    const total_weight = cd.reduce((s, d) => s + (d.weight_kg || 0), 0);
    const total_net = cd.reduce((s, d) => s + (d.total_net || 0), 0);
    const creances = { due: 0, advanced: 0, settled: 0 };
    cd.forEach(d => { const st = d.claim_status || (d.payment_status === 'paid' ? 'settled' : 'due'); creances[st] = (creances[st] || 0) + 1; });
    const intr = intrants.filter(i => i.cooperative_id === c.id);
    const intr_distributed = intr.reduce((s, i) => s + (i.total || 0), 0);
    const intr_recovered = cd.reduce((s, d) => s + (d.input_credit_deduction || 0), 0);
    return {
      id: c.id, name: c.name, region: c.region || '', commune: c.commune || '',
      producers: producers.filter(p => p.cooperative_id === c.id).length,
      deliveries: cd.length, total_weight, total_net,
      creances, intrant_balance: intr_distributed - intr_recovered
    };
  }).sort((a, b) => b.total_weight - a.total_weight);

  // Agrégation par commune
  const communeMap = {};
  perCoop.forEach(c => {
    const key = c.commune || c.region || '—';
    if (!communeMap[key]) communeMap[key] = { commune: key, coops: 0, producers: 0, total_weight: 0, total_net: 0 };
    communeMap[key].coops++;
    communeMap[key].producers += c.producers;
    communeMap[key].total_weight += c.total_weight;
    communeMap[key].total_net += c.total_net;
  });
  const byCommune = Object.values(communeMap).sort((a, b) => b.total_weight - a.total_weight);

  const totals = {
    cooperatives: coops.length,
    producers: producers.length,
    deliveries: deliveries.length,
    total_weight: perCoop.reduce((s, c) => s + c.total_weight, 0),
    total_net: perCoop.reduce((s, c) => s + c.total_net, 0),
    intrant_balance: perCoop.reduce((s, c) => s + c.intrant_balance, 0),
    creances: perCoop.reduce((acc, c) => {
      acc.due += c.creances.due || 0; acc.advanced += c.creances.advanced || 0; acc.settled += c.creances.settled || 0; return acc;
    }, { due: 0, advanced: 0, settled: 0 })
  };

  return { totals, per_coop: perCoop, by_commune: byCommune, generated_at: new Date().toISOString() };
}

module.exports = { getOverview };
