/**
 * Cooperative Routes
 * Espace Coopérative — API complète
 * 
 * Toutes les routes nécessitent une authentification eSignet
 * et que le NPI soit enregistré comme membre de coopérative.
 * 
 * Le middleware requireCoopAuth attache automatiquement :
 *  - req.coop     : données de la coopérative
 *  - req.memberNpi : NPI du membre connecté
 */

const express = require('express');
const router = express.Router();
const { requireCoopAuth } = require('../middleware/auth');
const coopService = require('../services/coopService');
const deliveryService = require('../services/deliveryService');
const paymentService = require('../services/paymentService');
const creanceService = require('../services/creanceService');
const intrantsService = require('../services/intrantsService');
const cautionService = require('../services/cautionService');
const weatherService = require('../services/weatherService');
const semencesService = require('../services/semencesService');
const mecanisationService = require('../services/mecanisationService');
const aicService = require('../services/aicService');
const identityService = require('../services/identityService');

// Toutes les routes de ce fichier nécessitent l'auth coopérative
router.use(requireCoopAuth);

// ============================================
// DASHBOARD
// ============================================

/**
 * GET /api/coop/dashboard
 * Retourne les statistiques du dashboard + infos campagne
 */
router.get('/dashboard', (req, res) => {
  try {
    const stats = coopService.getDashboardStats(req.coop.id);
    const campaign = paymentService.getCampaignInfo();

    res.json({
      success: true,
      coop: {
        id: req.coop.id,
        name: req.coop.name,
        region: req.coop.region,
        commune: req.coop.commune
      },
      member: {
        npi: req.memberNpi,
        name: req.session.user.name
      },
      stats,
      campaign
    });
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du dashboard' });
  }
});

// ============================================
// PRODUCTEURS
// ============================================

/**
 * GET /api/coop/producers
 * Liste des producteurs affiliés (avec recherche optionnelle)
 * Query: ?q=terme de recherche
 */
router.get('/producers', (req, res) => {
  try {
    const query = req.query.q || '';
    const producers = query
      ? coopService.searchProducers(req.coop.id, query)
      : coopService.getProducers(req.coop.id);

    res.json({
      success: true,
      count: producers.length,
      producers
    });
  } catch (error) {
    console.error('❌ Producers list error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des producteurs' });
  }
});

/**
 * GET /api/coop/producers/:npi
 * Détail d'un producteur + ses livraisons
 */
router.get('/producers/:npi', (req, res) => {
  try {
    // Multi-affiliation : on récupère l'enregistrement du producteur DANS cette coopérative
    const producer = coopService.getProducerInCoop(req.params.npi, req.coop.id);

    if (!producer) {
      return res.status(404).json({ error: 'Ce producteur n\'est pas affilié à votre coopérative' });
    }

    // Ne montrer que les livraisons enregistrées par cette coopérative
    const deliveries = deliveryService.getDeliveriesByNpiAndCoop(req.params.npi, req.coop.id);

    res.json({
      success: true,
      producer,
      deliveries,
      summary: {
        total_deliveries: deliveries.length,
        total_weight_kg: deliveries.reduce((s, d) => s + d.weight_kg, 0),
        total_gross: deliveries.reduce((s, d) => s + d.total_gross, 0),
        total_net: deliveries.reduce((s, d) => s + d.total_net, 0),
        total_paid: deliveries.filter(d => d.payment_status === 'paid').reduce((s, d) => s + d.total_net, 0)
      }
    });
  } catch (error) {
    console.error('❌ Producer detail error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du producteur' });
  }
});

/**
 * POST /api/coop/producers/verify
 * Vérifie un NPI sans enregistrer (preview)
 * Body: { npi: string }
 * 
 * IMPORTANT: Cette route DOIT être définie AVANT POST /producers
 * pour éviter qu'Express ne la confonde avec POST /producers/:npi
 */
router.post('/producers/verify', async (req, res) => {
  try {
    const { npi } = req.body;

    if (!npi || npi.trim().length === 0) {
      return res.status(400).json({ error: 'Le NPI est requis' });
    }

    const identity = await identityService.verifyNpi(npi.trim());

    if (!identity) {
      return res.status(404).json({
        found: false,
        message: 'Ce NPI n\'existe pas dans le registre national'
      });
    }

    // Multi-affiliation : distinguer "affilié quelque part" et "affilié à CETTE coop"
    const inThisCoop = coopService.getProducerInCoop(npi.trim(), req.coop.id);
    const otherCoops = coopService.getProducerCoops(npi.trim()).filter(id => id !== req.coop.id);

    res.json({
      found: true,
      identity: {
        npi: identity.npi,
        name: identity.name,
        firstname: identity.firstname,
        lastname: identity.lastname,
        phone: identityService.maskPhone(identity.phone),
        region: identity.region,
        commune: identity.commune
      },
      already_affiliated: !!inThisCoop,
      affiliated_to_this_coop: !!inThisCoop,
      other_coops_count: otherCoops.length
    });
  } catch (error) {
    console.error('❌ NPI verify error:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

/**
 * POST /api/coop/producers
 * Enregistrer un nouveau producteur
 * Body: { npi: string }
 * 
 * Étapes :
 * 1. Vérifier le NPI dans le Mock Identity System
 * 2. Vérifier qu'il n'est pas déjà affilié
 * 3. L'ajouter à la coopérative
 */
router.post('/producers', async (req, res) => {
  try {
    const { npi } = req.body;

    if (!npi || npi.trim().length === 0) {
      return res.status(400).json({ error: 'Le NPI est requis' });
    }

    // Étape 1 : Vérifier l'identité dans le registre national
    const identity = await identityService.verifyNpi(npi.trim());

    if (!identity) {
      return res.status(404).json({
        error: 'NPI non trouvé',
        message: 'Ce NPI n\'existe pas dans le registre national'
      });
    }

    // Étape 2 : Multi-affiliation — on bloque uniquement s'il est déjà dans CETTE coopérative.
    // L'affiliation à d'autres coopératives en parallèle est autorisée.
    const inThisCoop = coopService.getProducerInCoop(npi.trim(), req.coop.id);
    if (inThisCoop) {
      return res.status(409).json({
        error: 'Déjà affilié',
        message: 'Ce producteur est déjà affilié à votre coopérative',
        producer: inThisCoop
      });
    }

    // Étape 3 : Enregistrer le producteur
    const producer = coopService.addProducer(req.coop.id, identity, req.memberNpi);

    console.log(`✅ Producer registered: ${producer.firstname} ${producer.name} (${npi}) by ${req.memberNpi}`);

    res.status(201).json({
      success: true,
      message: 'Producteur enregistré avec succès',
      producer
    });
  } catch (error) {
    console.error('❌ Producer registration error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'enregistrement' });
  }
});

// ============================================
// LIVRAISONS
// ============================================

/**
 * GET /api/coop/deliveries
 * Liste des livraisons de la coopérative
 * Query: ?npi=... pour filtrer par producteur
 */
router.get('/deliveries', (req, res) => {
  try {
    let deliveries;

    if (req.query.npi) {
      // Vérifier que le producteur est dans cette coopérative
      if (!coopService.isProducerAffiliated(req.query.npi, req.coop.id)) {
        return res.status(403).json({ error: 'Ce producteur n\'est pas dans votre coopérative' });
      }
      deliveries = deliveryService.getDeliveriesByNpi(req.query.npi);
    } else {
      deliveries = deliveryService.getDeliveriesByCoopId(req.coop.id);
    }

    res.json({
      success: true,
      count: deliveries.length,
      deliveries
    });
  } catch (error) {
    console.error('❌ Deliveries list error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des livraisons' });
  }
});

/**
 * POST /api/coop/deliveries
 * Enregistrer une nouvelle livraison
 * Body: { farmer_npi, weight_kg, quality }
 * 
 * Étapes :
 * 1. Vérifier que le producteur est affilié
 * 2. Créer la livraison (calculs + lot auto)
 * 3. Émettre un Verifiable Credential via eidStack
 * 4. Retourner le QR code à scanner
 */
router.post('/deliveries', async (req, res) => {
  try {
    const { farmer_npi, weight_kg, quality } = req.body;

    // Validation
    if (!farmer_npi) {
      return res.status(400).json({ error: 'Le NPI du producteur est requis' });
    }
    if (!weight_kg || weight_kg <= 0) {
      return res.status(400).json({ error: 'Le poids doit être supérieur à 0' });
    }
    if (!quality || !['1er_choix', '2eme_choix'].includes(quality)) {
      return res.status(400).json({ error: 'La qualité doit être "1er_choix" ou "2eme_choix"' });
    }

    // Vérifier l'affiliation À CETTE coopérative (multi-affiliation)
    const producer = coopService.getProducerInCoop(farmer_npi, req.coop.id);
    if (!producer) {
      return res.status(404).json({
        error: 'Producteur non affilié',
        message: 'Ce producteur n\'est pas enregistré dans votre coopérative. Veuillez l\'enregistrer d\'abord.'
      });
    }

    // Créer la livraison
    const delivery = deliveryService.createDelivery({
      farmer_npi,
      cooperative_id: req.coop.id,
      registered_by_npi: req.memberNpi,
      weight_kg: parseFloat(weight_kg),
      quality
    });

    console.log(`📦 Delivery created: ${delivery.id} | ${weight_kg}kg ${quality} | ${producer.firstname} ${producer.name}`);

    // Émettre le Verifiable Credential via eidStack (via salesService qui est déjà prouvé fonctionnel)
    let credential = null;
    let credentialError = null;
    try {
      const salesService = require('../services/salesService');
      const credDefId = await salesService.getCottonSaleCredDefId();
      
      const credentialAttributes = [
        { name: 'farmer_npi', value: delivery.farmer_npi },
        { name: 'sale_date', value: delivery.date.split('T')[0] },
        { name: 'sale_time', value: new Date(delivery.date).toISOString().split('T')[1].split('.')[0] },
        { name: 'cotton_weight_kg', value: String(delivery.weight_kg) },
        { name: 'unit_price_fcfa', value: String(delivery.unit_price) },
        { name: 'total_amount_fcfa', value: String(delivery.total_gross) },
        { name: 'payment_reference', value: delivery.id },
        { name: 'payment_status', value: delivery.payment_status || 'pending' },
        { name: 'payment_method', value: 'Filière (différé)' },
        { name: 'transaction_id', value: delivery.id },
        { name: 'collection_point', value: `${req.coop.name} - Lot ${delivery.lot_number}` }
      ];

      console.log('📦 Issuing credential with credDefId:', credDefId);
      const credentialOffer = await salesService.issueCredential(credDefId, credentialAttributes);

      // Mettre à jour la livraison
      const data = require('fs').readFileSync(require('path').join(__dirname, '../../data/deliveries.json'), 'utf-8');
      const deliveriesData = JSON.parse(data);
      const record = deliveriesData.deliveries.find(d => d.id === delivery.id);
      if (record) {
        record.credential_status = 'issued';
        record.credential_exchange_id = credentialOffer.credentialExchangeId || null;
        require('fs').writeFileSync(
          require('path').join(__dirname, '../../data/deliveries.json'),
          JSON.stringify(deliveriesData, null, 2), 'utf-8'
        );
      }

      credential = {
        invitationUrl: credentialOffer.invitationUrl,
        qrCodeDataUrl: credentialOffer.invitationQr,
        credentialExchangeId: credentialOffer.credentialExchangeId
      };
      console.log(`📜 Credential issued for delivery ${delivery.id}`);
    } catch (credError) {
      credentialError = credError.message || 'Erreur inconnue';
      console.warn(`⚠️ Credential issuance failed:`, credError.message);
      console.error(credError);
    }

    res.status(201).json({
      success: true,
      message: 'Livraison enregistrée avec succès',
      delivery,
      credential,
      credentialError,
      deductions: {
        gross: delivery.total_gross,
        input_credit: delivery.input_credit_deduction,
        aic: delivery.aic_deduction,
        net: delivery.total_net
      }
    });
  } catch (error) {
    console.error('❌ Delivery creation error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'enregistrement de la livraison' });
  }
});

// ============================================
// LOTS & PAIEMENTS
// ============================================

/**
 * GET /api/coop/lots
 * Liste des lots avec statut de paiement
 */
router.get('/lots', (req, res) => {
  try {
    const lots = paymentService.getLots(req.coop.id);
    const currentLot = deliveryService.getCurrentLot(req.coop.id);

    res.json({
      success: true,
      current_lot: currentLot,
      lots
    });
  } catch (error) {
    console.error('❌ Lots list error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des lots' });
  }
});

/**
 * GET /api/coop/lots/:id
 * Détail d'un lot avec ses livraisons
 */
router.get('/lots/:id', (req, res) => {
  try {
    const result = paymentService.getLotDetails(req.params.id, req.coop.id);

    if (!result) {
      return res.status(404).json({ error: 'Lot non trouvé' });
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Lot detail error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du lot' });
  }
});

/**
 * POST /api/coop/payments/:deliveryId
 * Approuver le paiement d'une livraison (simulation)
 */
router.post('/payments/:deliveryId', (req, res) => {
  try {
    const delivery = paymentService.approvePayment(req.params.deliveryId, req.coop.id);

    console.log(`💰 Payment approved: ${delivery.id} | ${delivery.total_net} FCFA`);

    res.json({
      success: true,
      message: 'Paiement approuvé',
      delivery
    });
  } catch (error) {
    console.error('❌ Payment approval error:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de l\'approbation' });
  }
});

// ============================================
// CRÉANCES — cycle de vie (DUE → AVANCÉE → SOLDÉE)
// ============================================

/**
 * GET /api/coop/creances
 * Liste les créances de la coopérative (option ?status=due|settled)
 */
router.get('/creances', (req, res) => {
  try {
    const creances = creanceService.listCreances(req.coop.id, req.query.status);
    res.json({ success: true, creances });
  } catch (error) {
    console.error('Créances list error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des créances' });
  }
});

/**
 * GET /api/coop/creances/:deliveryId
 * Détail d'une créance (montants, statut de règlement)
 */
router.get('/creances/:deliveryId', (req, res) => {
  try {
    const creance = creanceService.getCreance(req.params.deliveryId, req.coop.id);
    if (!creance) return res.status(404).json({ error: 'Créance introuvable' });
    res.json({ success: true, creance });
  } catch (error) {
    console.error('Créance detail error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement de la créance' });
  }
});

/**
 * POST /api/coop/creances/:deliveryId/settle
 * Suivi manuel : le chef marque la créance comme réglée (paiement filière effectué).
 */
router.post('/creances/:deliveryId/settle', async (req, res) => {
  try {
    const creance = await creanceService.markSettled(req.params.deliveryId, req.coop.id);
    console.log(`Créance réglée ${creance.delivery_id} | ${creance.farmer_name}`);
    res.json({ success: true, message: 'Créance marquée comme réglée', creance });
  } catch (error) {
    console.error('Settle error:', error);
    res.status(400).json({ error: error.message || 'Erreur lors du règlement' });
  }
});

// ============================================
// VUE UNION / AIC (agrégée, toutes coopératives)
// ============================================

/** GET /api/coop/aic/overview — consolidation interprofessionnelle */
router.get('/aic/overview', (req, res) => {
  try {
    res.json({ success: true, overview: aicService.getOverview() });
  } catch (error) {
    console.error('❌ AIC overview error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement de la vue union' });
  }
});

// ============================================
// MÉCANISATION (matériel partagé)
// ============================================

/** GET /api/coop/mecanisation — parc + réservations + stats + types */
router.get('/mecanisation', (req, res) => {
  try {
    res.json({
      success: true,
      types: mecanisationService.getTypes(),
      stats: mecanisationService.getStats(req.coop.id),
      equipments: mecanisationService.listEquipments(req.coop.id),
      reservations: mecanisationService.listReservations(req.coop.id)
    });
  } catch (error) {
    console.error('❌ Mécanisation error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement' });
  }
});

/** POST /api/coop/mecanisation/equipment — ajouter du matériel. body: { name, type } */
router.post('/mecanisation/equipment', (req, res) => {
  try {
    const { name, type } = req.body || {};
    const eq = mecanisationService.addEquipment(req.coop.id, name, type);
    res.json({ success: true, message: 'Matériel ajouté', equipment: eq });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erreur' });
  }
});

/** POST /api/coop/mecanisation/reserve — réserver. body: { equipment_id, producer_npi, date, note } */
router.post('/mecanisation/reserve', (req, res) => {
  try {
    const { equipment_id, producer_npi, date, note } = req.body || {};
    if (producer_npi && !coopService.isProducerAffiliated(producer_npi, req.coop.id)) {
      return res.status(400).json({ error: 'Ce producteur n\'est pas affilié à votre coopérative' });
    }
    const resv = mecanisationService.reserve(req.coop.id, equipment_id, producer_npi, date, note, req.memberNpi);
    console.log(`🚜 Réservation: ${resv.id} | ${resv.equipment_name} le ${resv.date}`);
    res.json({ success: true, message: 'Réservation enregistrée', reservation: resv });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erreur' });
  }
});

/** POST /api/coop/mecanisation/reserve/:id/cancel — annuler une réservation */
router.post('/mecanisation/reserve/:id/cancel', (req, res) => {
  try {
    const r = mecanisationService.cancelReservation(req.coop.id, req.params.id);
    res.json({ success: true, message: 'Réservation annulée', reservation: r });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erreur' });
  }
});

// ============================================
// SEMENCES (qualité / variétés)
// ============================================

/** GET /api/coop/semences/varieties — catalogue des variétés */
router.get('/semences/varieties', (req, res) => {
  res.json({ success: true, varieties: semencesService.getVarieties() });
});

/** GET /api/coop/semences — historique + statistiques */
router.get('/semences', (req, res) => {
  try {
    res.json({ success: true, stats: semencesService.getStats(req.coop.id), records: semencesService.listByCoop(req.coop.id) });
  } catch (error) {
    console.error('❌ Semences list error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des semences' });
  }
});

/** POST /api/coop/semences — enregistrer une distribution de semences */
router.post('/semences', (req, res) => {
  try {
    const { producer_npi, variety, quantity_kg, germination_rate } = req.body || {};
    if (!producer_npi) return res.status(400).json({ error: 'NPI du producteur requis' });
    if (!coopService.isProducerAffiliated(producer_npi, req.coop.id)) {
      return res.status(400).json({ error: 'Ce producteur n\'est pas affilié à votre coopérative' });
    }
    const record = semencesService.distribute(req.coop.id, producer_npi, variety, quantity_kg, germination_rate, req.memberNpi);
    console.log(`🌱 Semences: ${record.id} | ${record.variety_label} ${record.quantity_kg}kg (germ ${record.germination_rate}%) → ${producer_npi}`);
    res.json({ success: true, message: 'Semences enregistrées', record });
  } catch (error) {
    console.error('❌ Semences error:', error);
    res.status(400).json({ error: error.message || 'Erreur' });
  }
});

/** GET /api/coop/semences/:npi — historique semences d'un producteur */
router.get('/semences/:npi', (req, res) => {
  try {
    res.json({ success: true, records: semencesService.getByProducer(req.params.npi, req.coop.id) });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// ============================================
// MÉTÉO / PLUVIOMÉTRIE
// ============================================

/** GET /api/coop/weather — prévision 7 jours + alertes pour la commune de la coop */
router.get('/weather', async (req, res) => {
  try {
    const commune = req.coop.commune || req.coop.region || 'Parakou';
    const forecast = await weatherService.getForecast(commune);
    res.json({ success: true, forecast });
  } catch (error) {
    console.error('❌ Weather error:', error.message);
    res.status(503).json({ error: 'Service météo momentanément indisponible' });
  }
});

// ============================================
// INTRANTS À CRÉDIT
// ============================================

/**
 * GET /api/coop/intrants/catalog
 * Catalogue des intrants (types + prix indicatifs)
 */
router.get('/intrants/catalog', (req, res) => {
  res.json({ success: true, catalog: intrantsService.getCatalog() });
});

/**
 * GET /api/coop/intrants
 * Liste des comptes d'intrants des producteurs + totaux coopérative
 */
router.get('/intrants', (req, res) => {
  try {
    res.json({
      success: true,
      totals: intrantsService.getCoopTotals(req.coop.id),
      accounts: intrantsService.listAccounts(req.coop.id)
    });
  } catch (error) {
    console.error('❌ Intrants list error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des intrants' });
  }
});

/**
 * POST /api/coop/intrants
 * Distribuer des intrants à crédit à un producteur
 * body: { producer_npi, items: [{ type, quantity, unit_price? }] }
 */
router.post('/intrants', (req, res) => {
  try {
    const { producer_npi, items } = req.body || {};
    if (!producer_npi) return res.status(400).json({ error: 'NPI du producteur requis' });
    if (!coopService.isProducerAffiliated(producer_npi, req.coop.id)) {
      return res.status(400).json({ error: 'Ce producteur n\'est pas affilié à votre coopérative' });
    }
    const record = intrantsService.distribute(req.coop.id, producer_npi, items, req.memberNpi);
    console.log(`🌾 Intrants distribués: ${record.id} | ${record.total} FCFA → ${producer_npi}`);
    res.json({ success: true, message: 'Intrants distribués à crédit', distribution: record });
  } catch (error) {
    console.error('❌ Intrants distribute error:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de la distribution' });
  }
});

/**
 * GET /api/coop/intrants/:npi
 * Compte d'intrants détaillé d'un producteur
 */
router.get('/intrants/:npi', (req, res) => {
  try {
    res.json({ success: true, account: intrantsService.getAccount(req.params.npi, req.coop.id) });
  } catch (error) {
    console.error('❌ Intrants account error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du compte' });
  }
});

// ============================================
// CAUTION SOLIDAIRE (cercles de garantie)
// ============================================

/** GET /api/coop/caution — liste des cercles + risque */
router.get('/caution', (req, res) => {
  try {
    res.json({ success: true, groups: cautionService.listGroups(req.coop.id) });
  } catch (error) {
    console.error('❌ Caution list error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des cercles' });
  }
});

/** POST /api/coop/caution — créer un cercle. body: { name, members: [npi] } */
router.post('/caution', (req, res) => {
  try {
    const { name, members } = req.body || {};
    (members || []).forEach(npi => {
      if (!coopService.isProducerAffiliated(npi, req.coop.id)) {
        throw new Error(`Le producteur ${npi} n'est pas affilié à votre coopérative`);
      }
    });
    const group = cautionService.createGroup(req.coop.id, name, members, req.memberNpi);
    console.log(`🤝 Cercle de caution créé: ${group.id} (${group.member_count} membres)`);
    res.json({ success: true, message: 'Cercle de caution créé', group });
  } catch (error) {
    console.error('❌ Caution create error:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de la création' });
  }
});

/** GET /api/coop/caution/:id — détail d'un cercle */
router.get('/caution/:id', (req, res) => {
  try {
    const group = cautionService.getGroup(req.params.id, req.coop.id);
    if (!group) return res.status(404).json({ error: 'Cercle introuvable' });
    res.json({ success: true, group });
  } catch (error) {
    console.error('❌ Caution detail error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du cercle' });
  }
});

/** POST /api/coop/caution/:id/members — ajouter un membre. body: { npi } */
router.post('/caution/:id/members', (req, res) => {
  try {
    const { npi } = req.body || {};
    if (!coopService.isProducerAffiliated(npi, req.coop.id)) {
      return res.status(400).json({ error: 'Ce producteur n\'est pas affilié à votre coopérative' });
    }
    const group = cautionService.addMember(req.params.id, req.coop.id, npi);
    res.json({ success: true, message: 'Membre ajouté', group });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erreur' });
  }
});

/** POST /api/coop/caution/:id/members/remove — retirer un membre. body: { npi } */
router.post('/caution/:id/members/remove', (req, res) => {
  try {
    const group = cautionService.removeMember(req.params.id, req.coop.id, (req.body || {}).npi);
    res.json({ success: true, message: 'Membre retiré', group });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erreur' });
  }
});

// ============================================
// CREDENTIAL (QR) — pour la fiche producteur
// ============================================

/**
 * GET /api/coop/deliveries/:deliveryId/credential
 * Ré-affiche ou régénère le QR code d'un credential
 * Accessible depuis la fiche producteur dans l'espace coopérative
 */
router.get('/deliveries/:deliveryId/credential', async (req, res) => {
  try {
    const delivery = deliveryService.getDeliveryById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }

    // Vérifier que la livraison appartient à cette coopérative
    if (delivery.cooperative_id !== req.coop.id) {
      return res.status(403).json({ error: 'Cette livraison n\'appartient pas à votre coopérative' });
    }

    if (delivery.credential_status === 'accepted') {
      return res.status(400).json({
        error: 'Credential déjà scanné',
        message: 'Ce credential est déjà dans le wallet du producteur.'
      });
    }

    if (!delivery.credential_exchange_id) {
      return res.status(400).json({
        error: 'Pas de credential',
        message: 'Aucun credential n\'a été émis pour cette livraison.'
      });
    }

    // Ré-émettre le credential via eidStack
    const producer = coopService.getProducerByNpi(delivery.farmer_npi);
    const credential = await deliveryService.issueDeliveryCredential(
      delivery,
      producer,
      req.coop,
      'Ré-émission via espace coopérative'
    );

    res.json({
      success: true,
      message: 'QR code régénéré.',
      delivery_id: delivery.id,
      credential
    });
  } catch (error) {
    console.error('❌ Credential re-issue error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la régénération du QR code' });
  }
});

// ============================================
// REÇU / BORDEREAU
// ============================================

/**
 * GET /api/coop/receipt/:deliveryId
 * Génère un bordereau HTML premium imprimable/téléchargeable
 * Design professionnel avec QR code de vérification en bas à droite
 */
router.get('/receipt/:deliveryId', (req, res) => {
  try {
    const delivery = deliveryService.getDeliveryById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }

    if (delivery.cooperative_id !== req.coop.id) {
      return res.status(403).json({ error: 'Cette livraison n\'appartient pas à votre coopérative' });
    }

    const producer = coopService.getProducerByNpi(delivery.farmer_npi);
    const coop = req.coop;

    // ---- Langue (suivie depuis le frontend via ?lang=en) ----
    const lang = req.query.lang === 'en' ? 'en' : 'fr';
    const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
    const T = lang === 'en' ? {
      docTitle: 'Delivery Receipt', platform: 'Cotton traceability platform',
      docType: 'Delivery Receipt', producer: '🧑‍🌾 Producer', name: 'Name', npi: 'NPI',
      commune: 'Municipality', coop: '🏢 Cooperative', date: 'Date', batch: 'Batch',
      finTitle: '💰 Financial details', colDesc: 'Description', colAmount: 'Amount',
      cotton: 'Cotton', inputCredit: 'Input credit', aicLevy: 'AIC levy',
      netPay: 'Net payable to producer', verifyTitle: "🔍 Authenticity verification",
      verifyText: 'This receipt is linked to a <strong>Verifiable Credential</strong> signed on the BCovrin blockchain. Scan the QR code opposite to verify the authenticity of this transaction on the CottonPay platform.',
      issuedOn: 'Issued on', scanVerify: 'Scan to verify',
      footer1: '<strong>CottonPay</strong> — Cotton traceability &amp; payment platform · 2025-2026 Season · Republic of Benin',
      footer2: 'This document is authoritative. The delivery is attested by a digitally signed Verifiable Credential.',
      btnPrint: '🖨️ Print / Save PDF', btnShare: '📤 Share PDF',
      q1: '1st grade', q2: '2nd grade',
      payTitle: 'Payment status', stDue: 'Awaiting settlement', stSettled: 'Settled'
    } : {
      docTitle: 'Bordereau', platform: 'Plateforme de traçabilité cotonnière',
      docType: 'Bordereau de Livraison', producer: '🧑‍🌾 Producteur', name: 'Nom', npi: 'NPI',
      commune: 'Commune', coop: '🏢 Coopérative', date: 'Date', batch: 'Lot',
      finTitle: '💰 Détails financiers', colDesc: 'Désignation', colAmount: 'Montant',
      cotton: 'Coton', inputCredit: 'Crédit intrants', aicLevy: 'Prélèvement AIC',
      netPay: 'Net à payer au producteur', verifyTitle: "🔍 Vérification d'authenticité",
      verifyText: "Ce bordereau est lié à un <strong>Verifiable Credential</strong> signé sur la blockchain BCovrin. Scannez le QR code ci-contre pour vérifier l'authenticité de cette transaction sur la plateforme CottonPay.",
      issuedOn: 'Émis le', scanVerify: 'Scanner pour vérifier',
      footer1: '<strong>CottonPay</strong> — Plateforme de traçabilité et paiement cotonnier · Campagne 2025-2026 · République du Bénin',
      footer2: 'Ce document fait foi. La livraison est attestée par un Verifiable Credential signé numériquement.',
      btnPrint: '🖨️ Imprimer / Enregistrer PDF', btnShare: '📤 Partager le PDF',
      q1: '1er Choix', q2: '2ème Choix',
      payTitle: 'Statut de paiement', stDue: 'En attente de règlement', stSettled: 'Réglé'
    };

    const qualityLabel = delivery.quality === '1er_choix' ? T.q1 : T.q2;
    const fmtN = n => new Intl.NumberFormat(locale).format(n);
    const dateStr = new Date(delivery.date).toLocaleDateString(locale, { day:'2-digit', month:'long', year:'numeric' });
    const printDate = new Date().toLocaleDateString(locale, { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const verifyUrl = `${appUrl}/verify?npi=${delivery.farmer_npi}&delivery=${delivery.id}&lang=${lang}`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}&color=14532D`;

    // ---- Section paiement (suivi manuel : due / settled) ----
    const claim = delivery.claim_status === 'settled' ? 'settled' : 'due';
    const stLabel = claim === 'settled' ? T.stSettled : T.stDue;
    const stStyle = claim === 'settled'
      ? 'color:#15803D;background:#dcfce7'
      : 'color:#92400e;background:#fef9c3';
    const paymentSection = `
<div class="finance-section">
  <h3>${T.payTitle}</h3>
  <div><span style="display:inline-block;${stStyle};padding:8px 16px;border-radius:24px;font-size:13px;font-weight:700;">${stLabel}</span></div>
</div>`;

    const html = `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="UTF-8"><title>${T.docTitle} ${delivery.id}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Plus Jakarta Sans','Segoe UI',sans-serif;max-width:780px;margin:0 auto;color:#1a1a1a;padding:40px 32px;background:#fff;}

  /* Header */
  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:3px solid #15803D;margin-bottom:32px;}
  .header-left{display:flex;align-items:center;gap:16px;}
  .logo{width:48px;height:48px;background:linear-gradient(135deg,#15803D,#22c55e);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:800;font-family:'Lora',serif;}
  .brand h1{font-family:'Lora',serif;font-size:22px;font-weight:700;color:#14532D;}
  .brand p{font-size:11px;color:#6b7280;letter-spacing:0.5px;text-transform:uppercase;margin-top:2px;}
  .doc-type{text-align:right;}
  .doc-type h2{font-size:16px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:1px;}
  .doc-type p{font-size:12px;color:#6b7280;margin-top:4px;}

  /* Info grid */
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;}
  .info-box{background:#f0fdf4;border-radius:12px;padding:16px 20px;border:1px solid #dcfce7;}
  .info-box h4{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;font-weight:600;}
  .info-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;}
  .info-row .label{color:#6b7280;}
  .info-row .value{font-weight:600;color:#1a1a1a;}

  /* Financial table */
  .finance-section{margin-bottom:28px;}
  .finance-section h3{font-size:14px;font-weight:700;color:#14532D;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;}
  table{width:100%;border-collapse:collapse;}
  th{background:#f0fdf4;color:#14532D;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:10px 16px;text-align:left;font-weight:700;border-bottom:2px solid #dcfce7;}
  td{padding:12px 16px;font-size:14px;border-bottom:1px solid #f3f4f6;}
  td:last-child{text-align:right;font-weight:600;}
  tr.deduction td{color:#dc2626;}
  tr.deduction td:last-child::before{content:"− ";}
  tr.total-row{background:linear-gradient(135deg,#f0fdf4,#dcfce7);}
  tr.total-row td{font-size:18px;font-weight:800;color:#15803D;border-bottom:none;padding:16px;}

  /* Status badges */
  .badges{display:flex;gap:12px;margin-bottom:28px;}
  .badge{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:24px;font-size:13px;font-weight:600;}
  .badge-paid{background:#dcfce7;color:#15803D;}
  .badge-pending{background:#fef9c3;color:#92400e;}
  .badge-credential{background:#e0f2fe;color:#0369a1;}

  /* QR + Footer */
  .footer-section{display:flex;align-items:flex-end;justify-content:space-between;margin-top:32px;padding-top:24px;border-top:2px dashed #dcfce7;}
  .footer-left{max-width:380px;}
  .footer-left h4{font-size:13px;font-weight:700;color:#14532D;margin-bottom:8px;}
  .footer-left p{font-size:12px;color:#6b7280;line-height:1.6;}
  .qr-box{text-align:center;}
  .qr-box img{border:2px solid #15803D;border-radius:12px;padding:6px;background:#fff;box-shadow:0 4px 16px rgba(21,128,61,0.15);}
  .qr-label{font-size:10px;color:#6b7280;margin-top:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}

  /* Print footer */
  .print-footer{margin-top:32px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;}
  .print-footer strong{color:#6b7280;}

  /* Action buttons */
  .actions{display:flex;gap:12px;justify-content:center;margin:32px 0 0;}
  .btn{border:none;padding:14px 28px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all 0.2s;font-family:inherit;}
  .btn-primary{background:linear-gradient(135deg,#15803D,#22c55e);color:#fff;box-shadow:0 4px 16px rgba(21,128,61,0.3);}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(21,128,61,0.4);}
  .btn-outline{background:transparent;border:2px solid #15803D;color:#15803D;}
  .btn-outline:hover{background:#f0fdf4;}

  @media print{
    body{margin:0;padding:20px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .no-print{display:none!important;}
    .info-box{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    tr.total-row{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  }
</style></head><body>

<!-- Header -->
<div class="header">
  <div class="header-left">
    <img src="${appUrl}/logo.jpeg" alt="CottonPay" style="width:48px;height:48px;object-fit:contain;border-radius:12px;">
    <div class="brand">
      <h1>CottonPay</h1>
      <p>${T.platform}</p>
    </div>
  </div>
  <div class="doc-type">
    <h2>${T.docType}</h2>
    <p>${delivery.id}</p>
  </div>
</div>

<!-- Info boxes -->
<div class="info-grid">
  <div class="info-box">
    <h4>${T.producer}</h4>
    <div class="info-row"><span class="label">${T.name}</span><span class="value">${producer ? `${producer.firstname || ''} ${producer.name}` : delivery.farmer_npi}</span></div>
    <div class="info-row"><span class="label">${T.npi}</span><span class="value">${delivery.farmer_npi}</span></div>
    <div class="info-row"><span class="label">${T.commune}</span><span class="value">${producer ? producer.commune || '—' : '—'}</span></div>
  </div>
  <div class="info-box">
    <h4>${T.coop}</h4>
    <div class="info-row"><span class="label">${T.name}</span><span class="value">${coop.name}</span></div>
    <div class="info-row"><span class="label">${T.date}</span><span class="value">${dateStr}</span></div>
    <div class="info-row"><span class="label">${T.batch}</span><span class="value">${delivery.lot_number}</span></div>
  </div>
</div>

<!-- Financial breakdown -->
<div class="finance-section">
  <h3>${T.finTitle}</h3>
  <table>
    <thead>
      <tr><th>${T.colDesc}</th><th style="text-align:right">${T.colAmount}</th></tr>
    </thead>
    <tbody>
      <tr><td>${T.cotton} ${qualityLabel} — ${fmtN(delivery.weight_kg)} kg × ${fmtN(delivery.unit_price)} FCFA/kg</td><td>${fmtN(delivery.total_gross)} FCFA</td></tr>
      <tr class="deduction"><td>${T.inputCredit} (90 FCFA/kg × ${fmtN(delivery.weight_kg)} kg)</td><td>${fmtN(delivery.input_credit_deduction)} FCFA</td></tr>
      <tr class="deduction"><td>${T.aicLevy} (18 FCFA/kg × ${fmtN(delivery.weight_kg)} kg)</td><td>${fmtN(delivery.aic_deduction)} FCFA</td></tr>
      <tr class="total-row"><td>${T.netPay}</td><td>${fmtN(delivery.total_net)} FCFA</td></tr>
    </tbody>
  </table>
</div>

${paymentSection}

<!-- QR + verification -->
<div class="footer-section">
  <div class="footer-left">
    <h4>${T.verifyTitle}</h4>
    <p>${T.verifyText}</p>
    <p style="margin-top:8px;font-size:11px;color:#9ca3af;">${T.issuedOn} ${printDate}</p>
  </div>
  <div class="qr-box">
    <img src="${qrImgUrl}" alt="QR" width="150" height="150" />
    <p class="qr-label">${T.scanVerify}</p>
  </div>
</div>

<!-- Print footer -->
<div class="print-footer">
  <p>${T.footer1}</p>
  <p>${T.footer2}</p>
</div>

<!-- Actions (hidden in print) -->
<div class="actions no-print">
  <button class="btn btn-primary" onclick="window.print()">${T.btnPrint}</button>
  <button class="btn btn-outline" onclick="shareBordereau()">${T.btnShare}</button>
</div>

<script>
function shareBordereau() {
  // Sur mobile : window.print() ouvre le dialogue système avec option Partager/PDF
  // Sur desktop : ouvre le dialogue d'impression avec option "Enregistrer en PDF"
  window.print();
}
</script>

</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('❌ Receipt generation error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du bordereau' });
  }
});

module.exports = router;

