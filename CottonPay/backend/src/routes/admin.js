/**
 * Admin Routes — enrôlement des membres (ADMIN ONLY)
 *
 * Espace protégé par une clé (ADMIN_KEY). Permet à l'administrateur d'émettre
 * le credential "membre" à un chef et de récupérer son QR d'enrôlement.
 * NE JAMAIS exposer l'émission au public.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const vpAuthService = require('../services/vpAuthService');

const DATA_DIR = path.join(__dirname, '../../data');
const ADMIN_KEY = process.env.ADMIN_KEY || 'cottonpay-admin';

/** Middleware : exige la clé admin (header x-admin-key ou body.key). */
function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key') || req.body?.key || req.query?.key;
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Clé admin invalide' });
  }
  next();
}

/** GET /admin/coops — liste des coopératives et de leurs membres (pour le formulaire). */
router.get('/coops', requireAdmin, (req, res) => {
  try {
    const { cooperatives } = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cooperatives.json'), 'utf-8'));
    const coops = cooperatives.map(c => ({
      id: c.id,
      name: c.name,
      commune: c.commune || '',
      members: (c.members || []).map(m => ({
        npi: m.npi,
        name: `${m.firstname || ''} ${m.name || ''}`.trim(),
        role: m.role || 'chef'
      }))
    }));
    res.json({ success: true, coops });
  } catch (e) {
    console.error('admin/coops error:', e.message);
    res.status(500).json({ error: 'Lecture des coopératives échouée' });
  }
});

/**
 * POST /admin/enroll — émet le credential membre et renvoie le QR d'enrôlement.
 * body: { key, npi, name, cooperative_id, role? }
 */
router.post('/enroll', requireAdmin, async (req, res) => {
  try {
    const { npi, name, cooperative_id, role } = req.body || {};
    if (!npi || !cooperative_id) {
      return res.status(400).json({ error: 'npi et cooperative_id requis' });
    }
    const cred = await vpAuthService.issueMemberCredential({
      npi, name, cooperative_id, role: role || 'chef'
    });
    console.log(`Enrôlement émis: ${name || npi} (${cooperative_id})`);
    res.json({
      success: true,
      invitationUrl: cred.invitationUrl,
      invitationQr: cred.invitationQr,
      shortUrl: cred.shortUrl,
      credentialExchangeId: cred.credentialExchangeId
    });
  } catch (e) {
    console.error('admin/enroll error:', e.response?.data || e.message);
    res.status(500).json({ error: 'Émission du credential échouée' });
  }
});

module.exports = router;
