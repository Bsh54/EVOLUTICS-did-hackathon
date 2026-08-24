/**
 * Créance Service — suivi manuel de la créance du producteur
 *
 * Une livraison EST une créance : dès la pesée, le producteur détient un droit
 * à paiement (total_net, après déduction crédit intrants + prélèvement AIC),
 * réglé de façon DIFFÉRÉE par la filière.
 *
 *   DUE ──(markSettled, le chef confirme le paiement filière)──▶ SETTLED
 *
 * Suivi MANUEL uniquement : pas de décaissement automatique, pas de Mobile Money.
 * Le chef marque la créance comme réglée quand le paiement filière a eu lieu.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

function readJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8'));
}
function writeJSON(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Ré-émet le credential blockchain pour refléter le nouvel état de paiement.
 * Best-effort : ne bloque JAMAIS l'opération si eidStack est indisponible.
 * Ne ré-émet que si un credential avait déjà été émis pour la livraison.
 */
async function reissueCredential(delivery) {
  try {
    if (!delivery.credential_exchange_id) return;
    const coopService = require('./coopService');
    const deliveryService = require('./deliveryService');
    const producer = coopService.getProducerByNpi(delivery.farmer_npi);
    const coop = coopService.getCoopById(delivery.cooperative_id);
    if (!coop) return;
    await deliveryService.issueDeliveryCredential(delivery, producer, coop, 'MàJ paiement (créance)');
    console.log(`Credential ré-émis (${delivery.id}) — statut paiement: ${delivery.claim_status}`);
  } catch (e) {
    console.warn(`Ré-émission credential non bloquante échouée (${delivery.id}):`, e.message);
  }
}

/** Garantit la présence des champs créance sur une livraison (rétro-compatible). */
function ensureClaimFields(d) {
  if (!d.claim_status || d.claim_status === 'advanced') {
    d.claim_status = d.payment_status === 'paid' ? 'settled' : 'due';
  }
  if (!('settlement' in d)) d.settlement = null;
  return d;
}

/** Vue "créance" enrichie (avec infos producteur) pour l'API/UI. */
function toCreanceView(d, producers) {
  const p = producers.find(x => x.npi === d.farmer_npi);
  return {
    delivery_id: d.id,
    farmer_npi: d.farmer_npi,
    farmer_name: p ? `${p.firstname} ${p.name}`.trim() : 'Inconnu',
    phone: p ? p.phone : '',
    date: d.date,
    lot_number: d.lot_number,
    weight_kg: d.weight_kg,
    quality: d.quality,
    total_gross: d.total_gross,
    input_credit_deduction: d.input_credit_deduction,
    aic_deduction: d.aic_deduction,
    net_due: d.total_net,
    claim_status: d.claim_status,
    settlement: d.settlement
  };
}

/** Liste les créances d'une coopérative, filtrables par statut. */
function listCreances(coopId, statusFilter) {
  const data = readJSON('deliveries.json');
  const { producers } = readJSON('producers.json');
  let changed = false;

  const views = data.deliveries
    .filter(d => d.cooperative_id === coopId)
    .map(d => { const before = d.claim_status; ensureClaimFields(d); if (d.claim_status !== before) changed = true; return d; })
    .filter(d => !statusFilter || d.claim_status === statusFilter)
    .map(d => toCreanceView(d, producers))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (changed) writeJSON('deliveries.json', data);
  return views;
}

/** Récupère une créance précise. */
function getCreance(deliveryId, coopId) {
  const data = readJSON('deliveries.json');
  const { producers } = readJSON('producers.json');
  const d = data.deliveries.find(x => x.id === deliveryId && x.cooperative_id === coopId);
  if (!d) return null;
  ensureClaimFields(d);
  return toCreanceView(d, producers);
}

/**
 * Marque une créance comme réglée (suivi manuel — aucun décaissement).
 * Le chef confirme que le paiement de la filière a bien eu lieu.
 */
async function markSettled(deliveryId, coopId) {
  const data = readJSON('deliveries.json');
  const { producers } = readJSON('producers.json');
  const d = data.deliveries.find(x => x.id === deliveryId && x.cooperative_id === coopId);
  if (!d) throw new Error('Créance introuvable');
  ensureClaimFields(d);

  if (d.claim_status === 'settled') throw new Error('Cette créance est déjà réglée');

  const at = new Date().toISOString();
  d.settlement = { at, net_due: d.total_net };
  d.claim_status = 'settled';
  d.payment_status = 'paid';
  d.paid_at = at;

  writeJSON('deliveries.json', data);
  await reissueCredential(d);
  return toCreanceView(d, producers);
}

module.exports = { listCreances, getCreance, markSettled };
