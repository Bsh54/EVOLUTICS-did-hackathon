/**
 * Producer Routes
 * Espace Producteur — lecture seule
 * 
 * Le producteur se connecte via eSignet, et accède à :
 *  - Ses informations personnelles
 *  - L'historique de ses livraisons (avec statut paiement + credential)
 *  - Son résumé financier (brut, déductions, net)
 *  - La possibilité de ré-afficher le QR code d'un credential non encore scanné
 */

const express = require('express');
const router = express.Router();
const { requireProducerAuth } = require('../middleware/auth');
const coopService = require('../services/coopService');
const deliveryService = require('../services/deliveryService');
const paymentService = require('../services/paymentService');

// Toutes les routes nécessitent l'auth producteur
router.use(requireProducerAuth);

/**
 * GET /api/producer/dashboard
 * Dashboard complet du producteur connecté
 */
router.get('/dashboard', (req, res) => {
  try {
    const producer = req.producer;
    const coop = coopService.getCoopById(producer.cooperative_id);
    const deliveries = deliveryService.getDeliveriesByNpi(req.producerNpi);

    // Calculer le résumé financier
    const totalWeight = deliveries.reduce((s, d) => s + d.weight_kg, 0);
    const totalGross = deliveries.reduce((s, d) => s + d.total_gross, 0);
    const totalInputCredit = deliveries.reduce((s, d) => s + d.input_credit_deduction, 0);
    const totalAic = deliveries.reduce((s, d) => s + d.aic_deduction, 0);
    const totalNet = deliveries.reduce((s, d) => s + d.total_net, 0);
    const totalPaid = deliveries
      .filter(d => d.payment_status === 'paid')
      .reduce((s, d) => s + d.total_net, 0);

    // Enrichir les livraisons avec les déductions détaillées
    const enrichedDeliveries = deliveries.map(d => ({
      ...d,
      deductions: paymentService.calculateDeductions(d)
    }));

    res.json({
      success: true,
      producer: {
        npi: producer.npi,
        name: producer.name,
        firstname: producer.firstname,
        phone: producer.phone,
        region: producer.region,
        commune: producer.commune,
        cooperative: coop ? coop.name : 'Inconnu',
        cooperative_id: producer.cooperative_id,
        registered_at: producer.registered_at
      },
      deliveries: enrichedDeliveries,
      summary: {
        total_deliveries: deliveries.length,
        total_weight_kg: totalWeight,
        total_gross: totalGross,
        total_input_credit: totalInputCredit,
        total_aic: totalAic,
        total_net: totalNet,
        total_paid: totalPaid,
        total_pending: totalNet - totalPaid
      },
      campaign: paymentService.getCampaignInfo()
    });
  } catch (error) {
    console.error('❌ Producer dashboard error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du dashboard' });
  }
});

/**
 * GET /api/producer/credential/:deliveryId
 * Ré-affiche le QR code d'un credential si le statut est "issued" (pas encore scanné)
 * 
 * Si le credential a déjà été scanné (status = "accepted"), on refuse
 * car il est déjà dans le wallet du producteur.
 */
router.get('/credential/:deliveryId', async (req, res) => {
  try {
    const delivery = deliveryService.getDeliveryById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }

    // Sécurité : vérifier que c'est bien une livraison de ce producteur
    if (delivery.farmer_npi !== req.producerNpi) {
      return res.status(403).json({ error: 'Cette livraison ne vous appartient pas' });
    }

    // Vérifier le statut du credential
    if (delivery.credential_status === 'accepted') {
      return res.status(400).json({
        error: 'Credential déjà scanné',
        message: 'Ce credential est déjà dans votre IDS Wallet. Ouvrez l\'application pour le consulter.'
      });
    }

    if (!delivery.credential_exchange_id) {
      return res.status(400).json({
        error: 'Pas de credential',
        message: 'Aucun credential n\'a été émis pour cette livraison. Contactez votre coopérative.'
      });
    }

    // Ré-émettre le credential via eidStack (nouveau QR code)
    const producer = req.producer;
    const coop = coopService.getCoopById(producer.cooperative_id);

    const credential = await deliveryService.issueDeliveryCredential(
      delivery,
      producer,
      coop,
      'Ré-émission producteur'
    );

    res.json({
      success: true,
      message: 'QR code régénéré. Scannez-le avec IDS Wallet.',
      delivery_id: delivery.id,
      credential
    });
  } catch (error) {
    console.error('❌ Credential re-issue error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la régénération du QR code' });
  }
});

/**
 * GET /api/producer/credential-status/:deliveryId
 * Vérifie le statut du credential auprès d'eidStack et met à jour le JSON local
 * Utilisé par le frontend pour du polling automatique
 */
router.get('/credential-status/:deliveryId', async (req, res) => {
  try {
    const delivery = deliveryService.getDeliveryById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }

    if (delivery.farmer_npi !== req.producerNpi) {
      return res.status(403).json({ error: 'Cette livraison ne vous appartient pas' });
    }

    const status = await deliveryService.checkCredentialStatus(req.params.deliveryId);

    res.json({
      success: true,
      delivery_id: req.params.deliveryId,
      ...status
    });
  } catch (error) {
    console.error('❌ Credential status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/producer/receipt/:deliveryId
 * Génère un reçu HTML imprimable/téléchargeable pour une livraison certifiée
 */
router.get('/receipt/:deliveryId', (req, res) => {
  try {
    const delivery = deliveryService.getDeliveryById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }

    if (delivery.farmer_npi !== req.producerNpi) {
      return res.status(403).json({ error: 'Cette livraison ne vous appartient pas' });
    }

    const producer = req.producer;
    const coop = coopService.getCoopById(producer.cooperative_id);
    const qualityLabel = delivery.quality === '1er_choix' ? '1er Choix' : '2ème Choix';
    const fmtN = n => new Intl.NumberFormat('fr-FR').format(n);
    const dateStr = new Date(delivery.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const verifyUrl = `${appUrl}/verify?npi=${producer.npi}&delivery=${delivery.id}`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}&color=14532D`;

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Reçu ${delivery.id}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;max-width:650px;margin:40px auto;color:#14532D;padding:20px;}
  h1{font-size:22px;border-bottom:3px solid #15803D;padding-bottom:12px;}
  table{width:100%;border-collapse:collapse;margin:20px 0;}
  td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;}
  td:first-child{font-weight:600;color:#6b7280;width:45%;}
  .total{font-size:18px;font-weight:700;color:#15803D;}
  .badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;}
  .paid{background:#dcfce7;color:#15803D;} .pending{background:#fef9c3;color:#92400e;}
  .qr-section{display:flex;align-items:flex-end;justify-content:space-between;margin-top:32px;padding-top:20px;border-top:2px dashed #d1fae5;}
  .qr-box{text-align:center;}
  .qr-box img{border:2px solid #15803D;border-radius:8px;padding:4px;background:#fff;}
  .qr-label{font-size:11px;color:#6b7280;margin-top:6px;}
  .footer{margin-top:24px;font-size:11px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:16px;}
  @media print{body{margin:0;} .no-print{display:none!important;}}
</style></head><body>
<h1>🌿 CottonPay — Reçu de Livraison</h1>
<table>
  <tr><td>Référence</td><td><strong>${delivery.id}</strong></td></tr>
  <tr><td>Date de livraison</td><td>${dateStr}</td></tr>
  <tr><td>Producteur</td><td>${producer.firstname || ''} ${producer.name} (NPI: ${producer.npi})</td></tr>
  <tr><td>Coopérative</td><td>${coop ? coop.name : delivery.cooperative_id}</td></tr>
  <tr><td>Lot</td><td>${delivery.lot_number}</td></tr>
  <tr><td>Poids</td><td><strong>${fmtN(delivery.weight_kg)} kg</strong></td></tr>
  <tr><td>Qualité</td><td>${qualityLabel}</td></tr>
  <tr><td>Prix unitaire</td><td>${fmtN(delivery.unit_price)} FCFA/kg</td></tr>
  <tr><td>Montant brut</td><td>${fmtN(delivery.total_gross)} FCFA</td></tr>
  <tr><td>Crédit intrant</td><td>- ${fmtN(delivery.input_credit_deduction)} FCFA</td></tr>
  <tr><td>Prélèvement AIC</td><td>- ${fmtN(delivery.aic_deduction)} FCFA</td></tr>
  <tr><td>Montant net</td><td class="total">${fmtN(delivery.total_net)} FCFA</td></tr>
  <tr><td>Statut paiement</td><td><span class="badge ${delivery.payment_status === 'paid' ? 'paid' : 'pending'}">${delivery.payment_status === 'paid' ? '✅ Payé' : '⏳ En attente'}</span></td></tr>
  <tr><td>Credential</td><td><span class="badge paid">✅ Certifié — Dans le wallet</span></td></tr>
</table>
<div class="qr-section">
  <div>
    <p style="font-weight:600;margin-bottom:4px;">Vérification</p>
    <p style="font-size:12px;color:#6b7280;max-width:320px;">Scannez ce QR code pour vérifier l'authenticité de cette livraison sur la plateforme CottonPay.</p>
  </div>
  <div class="qr-box">
    <img src="${qrImgUrl}" alt="QR Vérification" width="130" height="130" />
    <p class="qr-label">Scan pour vérifier</p>
  </div>
</div>
<div style="text-align:center;margin:24px 0;" class="no-print">
  <button onclick="window.print()" style="background:#15803D;color:#fff;border:none;padding:12px 32px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;">🖨️ Imprimer / Enregistrer PDF</button>
</div>
<div class="footer">
  <p>Ce reçu a été généré par CottonPay. La livraison est attestée par un Verifiable Credential signé sur la blockchain.</p>
  <p>Campagne cotonnière 2025-2026 — République du Bénin</p>
</div>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('❌ Receipt generation error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du reçu' });
  }
});

module.exports = router;
