/**
 * Payment Service
 * Gestion des lots de paiement et simulation d'approbation
 * 
 * Dans le contexte du hackathon :
 *  - Le paiement est une SIMULATION (bouton "Approuver")
 *  - CottonPay ne se substitue pas à la CSPR (Centrale de Sécurisation des Paiements)
 *  - L'objectif est de montrer que l'historique vérifiable ouvre l'accès au crédit
 *  
 * Les déductions sont réelles et conformes à la réglementation béninoise :
 *  - Crédit intrants : 90 FCFA/kg (avances semences/engrais récupérées)
 *  - Prélèvements AIC : 18 FCFA/kg (13 FCFA interprofession + 5 FCFA divers)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Constantes de la campagne 2025-2026 (prix homologués officiels — filière coton Bénin)
const CAMPAIGN = {
  name: '2025-2026',
  INPUT_CREDIT_PER_KG: 90,
  AIC_LEVY_PER_KG: 18,
  // Coton conventionnel
  PRICES: {
    '1er_choix': 300,
    '2eme_choix': 250
  },
  // Coton biologique (prix supérieurs homologués)
  PRICES_BIO: {
    '1er_choix': 360,
    '2eme_choix': 310
  },
  // Prime "reconquête" : +10 FCFA/kg dès que le seuil national de production est atteint
  RECONQUEST_BONUS_PER_KG: 10,
  RECONQUEST_THRESHOLD_TONNES: 700000
};

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================
// LOTS
// ============================================

/**
 * Liste les lots avec leur statut de paiement détaillé
 * Triés du plus ancien au plus récent (pour l'affichage dans l'UI)
 * 
 * @param {string} coopId - ID de la coopérative
 * @returns {Array} - Lots avec stats de paiement
 */
function getLots(coopId) {
  const { lots } = readJSON('lots.json');
  const { deliveries } = readJSON('deliveries.json');

  return lots
    .filter(l => l.cooperative_id === coopId)
    .map(lot => {
      const lotDeliveries = deliveries.filter(d => d.lot_number === lot.id);
      const paidDeliveries = lotDeliveries.filter(d => d.payment_status === 'paid');
      const pendingDeliveries = lotDeliveries.filter(d => d.payment_status === 'pending');

      const totalGross = lotDeliveries.reduce((s, d) => s + d.total_gross, 0);
      const totalNet = lotDeliveries.reduce((s, d) => s + d.total_net, 0);
      const totalPaid = paidDeliveries.reduce((s, d) => s + d.total_net, 0);

      return {
        ...lot,
        delivery_count: lotDeliveries.length,
        paid_count: paidDeliveries.length,
        pending_count: pendingDeliveries.length,
        payment_progress: lotDeliveries.length > 0
          ? Math.round((paidDeliveries.length / lotDeliveries.length) * 100)
          : 0,
        total_gross: totalGross,
        total_net: totalNet,
        total_paid: totalPaid,
        total_pending: totalNet - totalPaid,
        is_fully_paid: pendingDeliveries.length === 0 && lotDeliveries.length > 0
      };
    })
    // Afficher ceux qui ont des paiements en attente, du plus ancien au plus récent
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

/**
 * Récupère les livraisons détaillées d'un lot (pour l'affichage dans l'UI paiements)
 * 
 * @param {string} lotId - ID du lot
 * @param {string} coopId - ID de la coopérative (sécurité)
 * @returns {object} - { lot, deliveries }
 */
function getLotDetails(lotId, coopId) {
  const { lots } = readJSON('lots.json');
  const { deliveries } = readJSON('deliveries.json');
  const { producers } = readJSON('producers.json');

  const lot = lots.find(l => l.id === lotId && l.cooperative_id === coopId);
  if (!lot) return null;

  const lotDeliveries = deliveries
    .filter(d => d.lot_number === lotId)
    .map(delivery => {
      const producer = producers.find(p => p.npi === delivery.farmer_npi);
      return {
        ...delivery,
        farmer_name: producer ? `${producer.firstname} ${producer.name}` : 'Inconnu',
        farmer_commune: producer ? producer.commune : '',
        deductions: calculateDeductions(delivery)
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    lot,
    deliveries: lotDeliveries
  };
}

/**
 * Approuve le paiement d'une livraison (SIMULATION)
 * Change le statut de "pending" à "paid"
 * 
 * @param {string} deliveryId - ID de la livraison
 * @param {string} coopId - ID de la coopérative (sécurité)
 * @returns {object} - La livraison mise à jour
 */
function approvePayment(deliveryId, coopId) {
  const data = readJSON('deliveries.json');
  const delivery = data.deliveries.find(
    d => d.id === deliveryId && d.cooperative_id === coopId
  );

  if (!delivery) {
    throw new Error('Livraison non trouvée');
  }

  if (delivery.payment_status === 'paid') {
    throw new Error('Cette livraison est déjà payée');
  }

  delivery.payment_status = 'paid';
  delivery.paid_at = new Date().toISOString();

  writeJSON('deliveries.json', data);

  return delivery;
}

/**
 * Calcule les déductions pour une livraison
 * Conforme à la réglementation de la filière coton au Bénin
 * 
 * @param {object} delivery - La livraison
 * @returns {object} - { gross, inputCredit, aicLevy, net }
 */
function calculateDeductions(delivery) {
  const gross = delivery.total_gross;
  const inputCredit = delivery.weight_kg * CAMPAIGN.INPUT_CREDIT_PER_KG;
  const aicLevy = delivery.weight_kg * CAMPAIGN.AIC_LEVY_PER_KG;
  const net = gross - inputCredit - aicLevy;

  return {
    gross,
    inputCredit,
    aicLevy,
    net,
    input_credit_per_kg: CAMPAIGN.INPUT_CREDIT_PER_KG,
    aic_levy_per_kg: CAMPAIGN.AIC_LEVY_PER_KG
  };
}

/**
 * Retourne les infos de la campagne en cours (pour affichage dashboard)
 */
function getCampaignInfo() {
  return {
    name: CAMPAIGN.name,
    prices: CAMPAIGN.PRICES,
    prices_bio: CAMPAIGN.PRICES_BIO,
    reconquest_bonus_per_kg: CAMPAIGN.RECONQUEST_BONUS_PER_KG,
    reconquest_threshold_tonnes: CAMPAIGN.RECONQUEST_THRESHOLD_TONNES,
    deductions: {
      input_credit_per_kg: CAMPAIGN.INPUT_CREDIT_PER_KG,
      aic_levy_per_kg: CAMPAIGN.AIC_LEVY_PER_KG
    }
  };
}

module.exports = {
  getLots,
  getLotDetails,
  approvePayment,
  calculateDeductions,
  getCampaignInfo,
  CAMPAIGN
};
