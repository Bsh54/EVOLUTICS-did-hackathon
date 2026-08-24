/**
 * Delivery Service
 * Gestion des livraisons de coton et des lots
 * 
 * Chaque livraison :
 *  - Est liée à un producteur vérifié (NPI dans le Mock Identity / ANIP)
 *  - Est enregistrée par un membre de coopérative authentifié (eSignet)
 *  - Génère un Verifiable Credential (via eidStack / BCovrin)
 *  - Est assignée à un lot de 10 livraisons
 * 
 * Le credential émis constitue la preuve numérique infalsifiable
 * de la livraison — c'est le cœur de la proposition de valeur CottonPay
 * pour le hackathon Africa Digital ID.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_DIR = path.join(__dirname, '../../data');
const EIDSTACK_URL = process.env.EIDSTACK_URL || 'http://localhost:4000';
const LOT_SIZE = 10;

// Constantes de prix campagne 2025-2026
const PRICES = {
  '1er_choix': 300,
  '2eme_choix': 250
};

const INPUT_CREDIT_PER_KG = 90;
const AIC_LEVY_PER_KG = 18;

// ============================================
// UTILITAIRES
// ============================================

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Génère un ID unique pour une livraison
 * Format : LIV-YYYYMMDD-NNN (séquentiel basé sur les livraisons existantes)
 */
function generateDeliveryId() {
  const { deliveries } = readJSON('deliveries.json');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

  // Trouver le plus grand numéro de séquence pour aujourd'hui
  const todayPrefix = `LIV-${dateStr}-`;
  const todayIds = deliveries
    .filter(d => d.id.startsWith(todayPrefix))
    .map(d => parseInt(d.id.replace(todayPrefix, ''), 10))
    .filter(n => !isNaN(n));

  const nextSeq = todayIds.length > 0 ? Math.max(...todayIds) + 1 : 1;
  return `LIV-${dateStr}-${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Génère un ID unique pour un lot
 * Format : LOT-NNN (incrémental)
 */
function generateLotId() {
  const { lots } = readJSON('lots.json');
  const maxNum = lots.reduce((max, lot) => {
    const num = parseInt(lot.id.replace('LOT-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `LOT-${String(maxNum + 1).padStart(3, '0')}`;
}

// ============================================
// LOTS
// ============================================

/**
 * Récupère ou crée le lot en cours pour une coopérative
 * Un lot est "ouvert" tant qu'il a moins de LOT_SIZE livraisons
 * 
 * @param {string} coopId - ID de la coopérative
 * @returns {object} - Le lot en cours (existant ou nouvellement créé)
 */
function getCurrentLot(coopId) {
  const lotsData = readJSON('lots.json');
  const { deliveries } = readJSON('deliveries.json');

  // Chercher un lot ouvert pour cette coopérative
  let openLot = lotsData.lots.find(
    l => l.cooperative_id === coopId && l.status === 'open'
  );

  if (openLot) {
    // Vérifier le nombre réel de livraisons
    const lotDeliveries = deliveries.filter(d => d.lot_number === openLot.id);
    openLot.delivery_count = lotDeliveries.length;

    // Si le lot est plein, le fermer et en créer un nouveau
    if (lotDeliveries.length >= LOT_SIZE) {
      openLot.status = 'closed';
      openLot.closed_at = new Date().toISOString();
      writeJSON('lots.json', lotsData);

      // Créer un nouveau lot
      return createNewLot(coopId, lotsData);
    }

    return openLot;
  }

  // Aucun lot ouvert → en créer un
  return createNewLot(coopId, lotsData);
}

/**
 * Crée un nouveau lot
 */
function createNewLot(coopId, lotsData) {
  if (!lotsData) lotsData = readJSON('lots.json');

  const newLot = {
    id: generateLotId(),
    cooperative_id: coopId,
    created_at: new Date().toISOString(),
    closed_at: null,
    status: 'open',
    delivery_count: 0
  };

  lotsData.lots.push(newLot);
  writeJSON('lots.json', lotsData);

  return newLot;
}

// ============================================
// LIVRAISONS
// ============================================

/**
 * Crée une nouvelle livraison
 * 
 * @param {object} params
 * @param {string} params.farmer_npi - NPI du producteur (vérifié)
 * @param {string} params.cooperative_id - ID de la coopérative
 * @param {string} params.registered_by_npi - NPI du membre enregistreur (authentifié via eSignet)
 * @param {number} params.weight_kg - Poids en kg
 * @param {string} params.quality - '1er_choix' ou '2eme_choix'
 * @returns {object} - La livraison créée avec toutes les déductions calculées
 */
function createDelivery({ farmer_npi, cooperative_id, registered_by_npi, weight_kg, quality }) {
  // Valider la qualité
  if (!PRICES[quality]) {
    throw new Error(`Qualité invalide: ${quality}. Valeurs acceptées: 1er_choix, 2eme_choix`);
  }

  // Valider le poids
  if (!weight_kg || weight_kg <= 0 || weight_kg > 10000) {
    throw new Error('Poids invalide. Doit être entre 1 et 10000 kg.');
  }

  // === Lecture atomique de toutes les données ===
  const deliveriesData = readJSON('deliveries.json');
  const lotsData = readJSON('lots.json');

  // Trouver ou créer le lot en cours (sur les données déjà lues)
  let currentLot = lotsData.lots.find(
    l => l.cooperative_id === cooperative_id && l.status === 'open'
  );

  if (currentLot) {
    // Compter le nombre réel de livraisons dans ce lot
    const lotDeliveryCount = deliveriesData.deliveries.filter(
      d => d.lot_number === currentLot.id
    ).length;

    // Si le lot est plein → le fermer et en créer un nouveau
    if (lotDeliveryCount >= LOT_SIZE) {
      currentLot.status = 'closed';
      currentLot.closed_at = new Date().toISOString();
      currentLot = _createLotInMemory(cooperative_id, lotsData);
    }
  } else {
    // Aucun lot ouvert → en créer un
    currentLot = _createLotInMemory(cooperative_id, lotsData);
  }

  // Générer un ID unique (séquentiel, basé sur les données déjà lues)
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const todayPrefix = `LIV-${dateStr}-`;
  const todayIds = deliveriesData.deliveries
    .filter(d => d.id.startsWith(todayPrefix))
    .map(d => parseInt(d.id.replace(todayPrefix, ''), 10))
    .filter(n => !isNaN(n));
  const nextSeq = todayIds.length > 0 ? Math.max(...todayIds) + 1 : 1;
  const deliveryId = `LIV-${dateStr}-${String(nextSeq).padStart(3, '0')}`;

  // Calculer les montants
  const unit_price = PRICES[quality];
  const total_gross = weight_kg * unit_price;
  const input_credit_deduction = weight_kg * INPUT_CREDIT_PER_KG;
  const aic_deduction = weight_kg * AIC_LEVY_PER_KG;
  const total_net = total_gross - input_credit_deduction - aic_deduction;

  // Créer la livraison
  const delivery = {
    id: deliveryId,
    farmer_npi,
    cooperative_id,
    registered_by_npi,
    date: now.toISOString(),
    weight_kg,
    quality,
    unit_price,
    total_gross,
    input_credit_deduction,
    aic_deduction,
    total_net,
    lot_number: currentLot.id,
    payment_status: 'pending',
    credential_status: 'pending',
    credential_exchange_id: null,
    // Cycle de vie de la créance (suivi manuel, voir creanceService)
    claim_status: 'due',       // due → settled
    settlement: null           // règlement filière (marqué manuellement)
  };

  // Ajouter aux données en mémoire
  deliveriesData.deliveries.push(delivery);

  // Mettre à jour le compteur du lot en mémoire
  const lot = lotsData.lots.find(l => l.id === currentLot.id);
  if (lot) {
    lot.delivery_count = deliveriesData.deliveries.filter(
      d => d.lot_number === lot.id
    ).length;
    if (lot.delivery_count >= LOT_SIZE) {
      lot.status = 'closed';
      lot.closed_at = now.toISOString();
    }
  }

  // === Écriture atomique : les deux fichiers d'un coup ===
  writeJSON('deliveries.json', deliveriesData);
  writeJSON('lots.json', lotsData);

  return delivery;
}

/**
 * Crée un lot en mémoire (sans écriture disque immédiate)
 */
function _createLotInMemory(coopId, lotsData) {
  const maxNum = lotsData.lots.reduce((max, lot) => {
    const num = parseInt(lot.id.replace('LOT-', ''), 10);
    return num > max ? num : max;
  }, 0);

  const newLot = {
    id: `LOT-${String(maxNum + 1).padStart(3, '0')}`,
    cooperative_id: coopId,
    created_at: new Date().toISOString(),
    closed_at: null,
    status: 'open',
    delivery_count: 0
  };

  lotsData.lots.push(newLot);
  return newLot;
}

// Cache pour le credential definition ID (résolu une seule fois depuis eidStack)
let _cachedCredDefId = null;

/**
 * Résout dynamiquement le credentialDefinitionId depuis eidStack
 * Cherche la CredDef dont le tag contient "CottonSaleReceipt"
 * Le résultat est mis en cache pour éviter de re-requêter à chaque livraison
 */
async function resolveCredDefId() {
  if (_cachedCredDefId) return _cachedCredDefId;

  try {
    const res = await axios.get(`${EIDSTACK_URL}/issuance/credential-definitions`, {
      timeout: 10000
    });

    const payload = res.data?.data || res.data;
    const items = payload?.items || payload || [];

    // Chercher la CredDef "CottonSaleReceipt" (case-insensitive, aussi dans le schema lié)
    const credDef = items.find(cd => {
      const n = (cd.name || '').toLowerCase();
      const cid = (cd.cred_def_id || '').toLowerCase();
      const sn = (cd.schema?.name || '').toLowerCase();
      return n.includes('cotton') || cid.includes('cotton') || sn.includes('cotton');
    });

    if (credDef && credDef.cred_def_id) {
      _cachedCredDefId = credDef.cred_def_id;
      console.log('✅ Resolved CottonSaleReceipt CredDef ID:', _cachedCredDefId);
      return _cachedCredDefId;
    }

    throw new Error('CottonSaleReceiptCredential CredDef non trouvée dans eidStack. Avez-vous lancé setup-agent.sh ?');
  } catch (error) {
    console.error('❌ CredDef resolution error:', error.response?.data || error.message);
    throw new Error('Impossible de résoudre le CredDef ID. Vérifiez que eidStack est en marche et que setup-agent.sh a été exécuté.');
  }
}

/**
 * Émet un Verifiable Credential pour une livraison via eidStack
 * Le credential est signé sur la blockchain BCovrin et peut être
 * scanné par le producteur via IDS Wallet
 * 
 * @param {object} delivery - La livraison
 * @param {object} producer - Données du producteur
 * @param {object} coop - Données de la coopérative
 * @param {string} registeredByName - Nom du membre enregistreur
 * @returns {object} - { invitationUrl, qrCodeDataUrl, credentialExchangeId }
 */
async function issueDeliveryCredential(delivery, producer, coop, registeredByName) {
  try {
    // 1. Résoudre le vrai credentialDefinitionId depuis eidStack
    const credentialDefinitionId = await resolveCredDefId();

    // 2. Formater les attributs au format attendu par eidStack : [{name, value}]
    //    IMPORTANT : Les noms DOIVENT correspondre EXACTEMENT aux attributs du schema
    //    enregistré sur BCovrin (CottonSaleReceiptCredential)
    const now = new Date(delivery.date);

    // Refléter l'état RÉEL de la créance dans le credential (preuve blockchain).
    // payment_status = cycle de vie : due | settled (suivi manuel, sans Mobile Money)
    const paymentStatus = delivery.claim_status || delivery.payment_status || 'due';

    const attributes = [
      { name: 'farmer_npi', value: delivery.farmer_npi },
      { name: 'sale_date', value: delivery.date.split('T')[0] },
      { name: 'sale_time', value: now.toTimeString().split(' ')[0] },
      { name: 'cotton_weight_kg', value: String(delivery.weight_kg) },
      { name: 'unit_price_fcfa', value: String(delivery.unit_price) },
      { name: 'total_amount_fcfa', value: String(delivery.total_gross) },
      { name: 'payment_reference', value: delivery.id },
      { name: 'payment_status', value: paymentStatus },
      { name: 'payment_method', value: 'Filière (différé)' },
      { name: 'transaction_id', value: delivery.id },
      { name: 'collection_point', value: `${coop.name} - Lot ${delivery.lot_number}` }
    ];

    console.log('📦 Issuing delivery credential via eidStack:', { credentialDefinitionId, attributes });

    // 3. Appeler la bonne route eidStack : POST /issuance/offer
    const response = await axios.post(
      `${EIDSTACK_URL}/issuance/offer`,
      {
        credentialDefinitionId,
        attributes
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    // 4. Mapper correctement la réponse (eidStack encapsule dans data.data via handleController)
    const result = response.data?.data || response.data;

    // Mettre à jour la livraison avec les infos du credential
    const data = readJSON('deliveries.json');
    const deliveryRecord = data.deliveries.find(d => d.id === delivery.id);
    if (deliveryRecord) {
      deliveryRecord.credential_status = 'issued';
      deliveryRecord.credential_exchange_id = result.credentialExchangeId || null;
      writeJSON('deliveries.json', data);
    }

    console.log('✅ Credential issued successfully:', {
      credentialExchangeId: result.credentialExchangeId,
      hasInvitationUrl: !!result.invitationUrl,
      hasQrCode: !!result.invitationQr
    });

    return {
      invitationUrl: result.invitationUrl,
      qrCodeDataUrl: result.invitationQr,        // eidStack retourne "invitationQr" pas "qrCodeDataUrl"
      credentialExchangeId: result.credentialExchangeId
    };
  } catch (error) {
    console.error('❌ Credential issuance error:', error.response?.data || error.message);
    throw new Error('Erreur lors de l\'émission du credential. Vérifiez que eidStack est en marche et que setup-agent.sh a été exécuté.');
  }
}

/**
 * Liste toutes les livraisons d'une coopérative
 * @param {string} coopId
 * @returns {Array}
 */
function getDeliveriesByCoopId(coopId) {
  const { deliveries } = readJSON('deliveries.json');
  return deliveries
    .filter(d => d.cooperative_id === coopId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Liste toutes les livraisons d'un producteur (par NPI)
 * @param {string} npi
 * @returns {Array}
 */
function getDeliveriesByNpi(npi) {
  const { deliveries } = readJSON('deliveries.json');
  return deliveries
    .filter(d => d.farmer_npi === npi)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Liste les livraisons d'un producteur DANS une coopérative précise.
 * Nécessaire pour la multi-affiliation : la fiche producteur d'une coop
 * ne doit montrer que les livraisons enregistrées par cette coop.
 * @param {string} npi
 * @param {string} coopId
 * @returns {Array}
 */
function getDeliveriesByNpiAndCoop(npi, coopId) {
  const { deliveries } = readJSON('deliveries.json');
  return deliveries
    .filter(d => d.farmer_npi === npi && d.cooperative_id === coopId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Récupère une livraison par son ID
 * @param {string} deliveryId
 * @returns {object|null}
 */
function getDeliveryById(deliveryId) {
  const { deliveries } = readJSON('deliveries.json');
  return deliveries.find(d => d.id === deliveryId) || null;
}

/**
 * Retourne les livraisons d'un producteur SANS les infos sensibles
 * (pour la page de vérification publique : pas de statut paiement ni credential)
 * 
 * @param {string} npi
 * @returns {Array}
 */
function getPublicDeliveriesByNpi(npi) {
  const deliveries = getDeliveriesByNpi(npi);
  return deliveries.map(d => ({
    id: d.id,
    date: d.date,
    cooperative_id: d.cooperative_id,
    weight_kg: d.weight_kg,
    quality: d.quality,
    unit_price: d.unit_price,
    total_gross: d.total_gross,
    lot_number: d.lot_number,
    registered_by_npi: d.registered_by_npi
    // PAS de payment_status ni credential_status
  }));
}

/**
 * Vérifie le statut d'un credential auprès d'eidStack et met à jour deliveries.json
 * 
 * eidStack retourne l'état Credo (ex: 'offer-sent', 'done', etc.)
 * Quand l'état est 'done', cela signifie que le producteur a scanné le QR et
 * accepté le credential dans son wallet → on met à jour credential_status à 'accepted'
 * 
 * @param {string} deliveryId - ID de la livraison
 * @returns {object} - { credential_status, eidstack_state }
 */
async function checkCredentialStatus(deliveryId) {
  const data = readJSON('deliveries.json');
  const delivery = data.deliveries.find(d => d.id === deliveryId);

  if (!delivery) {
    throw new Error('Livraison non trouvée');
  }

  // Si pas de credential_exchange_id, rien à vérifier
  if (!delivery.credential_exchange_id) {
    return { credential_status: delivery.credential_status, eidstack_state: null };
  }

  // Si déjà accepté, pas besoin de re-vérifier
  if (delivery.credential_status === 'accepted') {
    return { credential_status: 'accepted', eidstack_state: 'done' };
  }

  try {
    const res = await axios.get(
      `${EIDSTACK_URL}/issuance/offerStatus?credentialExchangeId=${delivery.credential_exchange_id}`,
      { timeout: 10000 }
    );

    const state = res.data?.data || res.data;
    const stateStr = typeof state === 'string' ? state : state?.state || state;

    console.log(`🔍 Credential status for ${deliveryId}: ${stateStr}`);

    // 'done' dans Credo = credential accepté par le wallet du producteur
    if (stateStr === 'done' || stateStr === 'credential-issued') {
      delivery.credential_status = 'accepted';
      writeJSON('deliveries.json', data);
      console.log(`✅ Delivery ${deliveryId} credential status updated to 'accepted'`);
    }

    return { credential_status: delivery.credential_status, eidstack_state: stateStr };
  } catch (error) {
    console.error('❌ Credential status check error:', error.response?.data || error.message);
    return { credential_status: delivery.credential_status, eidstack_state: 'error' };
  }
}

module.exports = {
  createDelivery,
  issueDeliveryCredential,
  checkCredentialStatus,
  getDeliveriesByCoopId,
  getDeliveriesByNpi,
  getDeliveriesByNpiAndCoop,
  getDeliveryById,
  getPublicDeliveriesByNpi,
  getCurrentLot,
  generateDeliveryId,
  PRICES,
  INPUT_CREDIT_PER_KG,
  AIC_LEVY_PER_KG,
  LOT_SIZE
};

