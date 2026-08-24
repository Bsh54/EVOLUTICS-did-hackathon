/**
 * Cooperative Service
 * Gestion des coopératives, producteurs affiliés et statistiques
 * 
 * Ce service gère la logique métier de l'espace coopérative :
 *  - Identification de la coopérative d'un membre via son NPI (vérifié par eSignet)
 *  - Gestion des producteurs affiliés (CRUD)
 *  - Calcul des statistiques du dashboard
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// ============================================
// UTILITAIRES LECTURE/ÉCRITURE JSON
// ============================================

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================
// COOPÉRATIVES
// ============================================

/**
 * Récupère la coopérative d'un membre par son NPI
 * Le NPI est celui retourné par eSignet après authentification OIDC
 * 
 * @param {string} memberNpi - NPI du membre accrédité (sub du token eSignet)
 * @returns {object|null} - La coopérative ou null si le NPI n'est pas un membre
 */
function getCoopByMemberNpi(memberNpi) {
  const { cooperatives } = readJSON('cooperatives.json');
  return cooperatives.find(coop =>
    coop.members_npi.includes(memberNpi)
  ) || null;
}

/**
 * Récupère une coopérative par son ID
 * @param {string} coopId
 * @returns {object|null}
 */
function getCoopById(coopId) {
  const { cooperatives } = readJSON('cooperatives.json');
  return cooperatives.find(c => c.id === coopId) || null;
}

// ============================================
// PRODUCTEURS
// ============================================

/**
 * Liste tous les producteurs affiliés à une coopérative
 * Enrichit chaque producteur avec son nombre de livraisons et la date de la dernière
 * 
 * @param {string} coopId - ID de la coopérative
 * @returns {Array} - Liste des producteurs enrichis
 */
function getProducers(coopId) {
  const { producers } = readJSON('producers.json');
  const { deliveries } = readJSON('deliveries.json');

  return producers
    .filter(p => p.cooperative_id === coopId)
    .map(producer => {
      const farmerDeliveries = deliveries.filter(d => d.farmer_npi === producer.npi);
      const lastDelivery = farmerDeliveries.sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      )[0];

      return {
        ...producer,
        delivery_count: farmerDeliveries.length,
        last_delivery_date: lastDelivery ? lastDelivery.date : null
      };
    });
}

/**
 * Récupère un producteur par son NPI (première occurrence, tous coops confondus)
 * Utilisé pour l'identité / le rôle "est producteur quelque part".
 * @param {string} npi - NPI du producteur
 * @returns {object|null}
 */
function getProducerByNpi(npi) {
  const { producers } = readJSON('producers.json');
  return producers.find(p => p.npi === npi) || null;
}

/**
 * Récupère l'enregistrement d'un producteur DANS une coopérative précise.
 * Un même NPI peut être affilié à plusieurs coopératives (multi-affiliation) :
 * il existe alors un enregistrement distinct par coopérative.
 * @param {string} npi
 * @param {string} coopId
 * @returns {object|null}
 */
function getProducerInCoop(npi, coopId) {
  const { producers } = readJSON('producers.json');
  return producers.find(p => p.npi === npi && p.cooperative_id === coopId) || null;
}

/**
 * Liste toutes les coopératives auxquelles un NPI est affilié.
 * @param {string} npi
 * @returns {string[]} - ids de coopératives
 */
function getProducerCoops(npi) {
  const { producers } = readJSON('producers.json');
  return producers.filter(p => p.npi === npi).map(p => p.cooperative_id);
}

/**
 * Vérifie si un producteur est affilié à une coopérative précise
 * @param {string} npi - NPI du producteur
 * @param {string} coopId - ID de la coopérative
 * @returns {boolean}
 */
function isProducerAffiliated(npi, coopId) {
  return getProducerInCoop(npi, coopId) !== null;
}

/**
 * Ajoute un producteur à une coopérative
 * Le producteur doit avoir été vérifié au préalable via identityService.verifyNpi()
 * 
 * @param {string} coopId - ID de la coopérative
 * @param {object} identityData - Données retournées par identityService.verifyNpi()
 * @param {string} registeredByNpi - NPI du membre qui enregistre (authentifié via eSignet)
 * @returns {object} - Le producteur ajouté
 */
function addProducer(coopId, identityData, registeredByNpi) {
  const data = readJSON('producers.json');

  // Multi-affiliation : on bloque uniquement si le producteur est DÉJÀ dans CETTE coopérative.
  // Il peut être affilié à d'autres coopératives en parallèle.
  const existingHere = data.producers.find(
    p => p.npi === identityData.npi && p.cooperative_id === coopId
  );
  if (existingHere) {
    throw new Error('Ce producteur est déjà affilié à votre coopérative');
  }

  const newProducer = {
    npi: identityData.npi,
    name: identityData.lastname || (identityData.name ? identityData.name.split(' ').pop() : '') || 'Inconnu',
    firstname: identityData.firstname || '',
    phone: identityData.phone || '',
    region: identityData.region || '',
    commune: identityData.commune || '',
    cooperative_id: coopId,
    registered_at: new Date().toISOString(),
    registered_by: registeredByNpi
  };

  data.producers.push(newProducer);
  writeJSON('producers.json', data);

  return newProducer;
}

/**
 * Recherche un producteur par NPI ou nom (filtrage côté serveur)
 * @param {string} coopId - ID de la coopérative
 * @param {string} query - Terme de recherche
 * @returns {Array}
 */
function searchProducers(coopId, query) {
  const producers = getProducers(coopId);
  if (!query || query.trim() === '') return producers;

  const q = query.toLowerCase().trim();
  return producers.filter(p =>
    p.npi.includes(q) ||
    p.name.toLowerCase().includes(q) ||
    p.firstname.toLowerCase().includes(q) ||
    `${p.firstname} ${p.name}`.toLowerCase().includes(q)
  );
}

// ============================================
// STATISTIQUES DASHBOARD
// ============================================

/**
 * Calcule les statistiques du dashboard pour une coopérative
 * @param {string} coopId - ID de la coopérative
 * @returns {object} - Stats complètes
 */
function getDashboardStats(coopId) {
  const { producers } = readJSON('producers.json');
  const { deliveries } = readJSON('deliveries.json');
  const { lots } = readJSON('lots.json');

  const coopProducers = producers.filter(p => p.cooperative_id === coopId);
  const coopDeliveries = deliveries.filter(d => d.cooperative_id === coopId);
  const coopLots = lots.filter(l => l.cooperative_id === coopId);

  const closedLots = coopLots.filter(l => l.status === 'closed');
  const openLots = coopLots.filter(l => l.status === 'open');

  const totalGross = coopDeliveries.reduce((sum, d) => sum + d.total_gross, 0);
  const totalNet = coopDeliveries.reduce((sum, d) => sum + d.total_net, 0);
  const totalPaid = coopDeliveries
    .filter(d => d.payment_status === 'paid')
    .reduce((sum, d) => sum + d.total_net, 0);

  return {
    total_producers: coopProducers.length,
    total_deliveries: coopDeliveries.length,
    lots_closed: closedLots.length,
    lots_open: openLots.length,
    current_lot: openLots[0] || null,
    total_gross: totalGross,
    total_net: totalNet,
    total_paid: totalPaid,
    total_pending: totalNet - totalPaid,
    total_weight_kg: coopDeliveries.reduce((sum, d) => sum + d.weight_kg, 0)
  };
}

module.exports = {
  getCoopByMemberNpi,
  getCoopById,
  getProducers,
  getProducerByNpi,
  getProducerInCoop,
  getProducerCoops,
  isProducerAffiliated,
  addProducer,
  searchProducers,
  getDashboardStats
};
