/**
 * VP Auth Service — login par présentation de credential (eid / wallet)
 *
 * Le chef de coopérative se connecte en PROUVANT qu'il détient un credential
 * "membre" CottonPay (émis une fois après vérification eSignet). Flux SSI :
 *   createProofRequest -> QR -> le wallet présente -> proofStatus (verified + claims)
 *
 * S'appuie sur eidStack (Credo agent) : /issuance/offer, /verification/*.
 */

const axios = require('axios');

const EIDSTACK_URL = process.env.EIDSTACK_URL || 'http://localhost:4000';
let _memberCredDefId = null;

/** Résout dynamiquement le credDef du credential "membre" depuis eidStack. */
async function resolveMemberCredDefId() {
  if (_memberCredDefId) return _memberCredDefId;
  const res = await axios.get(`${EIDSTACK_URL}/issuance/credential-definitions`, { timeout: 10000, params: { page: 1, limit: 100 } });
  const items = (res.data?.data?.items) || res.data?.data || res.data?.items || [];
  const cd = items.find(c => {
    const n = (c.name || c.tag || '').toLowerCase();
    const id = (c.cred_def_id || c.credDefId || '').toLowerCase();
    const sn = (c.schema?.name || '').toLowerCase();
    return n.includes('member') || id.includes('member') || sn.includes('member');
  });
  if (!cd) throw new Error('CredDef "membre" introuvable dans eidStack');
  _memberCredDefId = cd.cred_def_id || cd.credDefId;
  return _memberCredDefId;
}

/** Émet un credential "membre" au chef (enrôlement, une fois). Retourne le QR d'acceptation. */
async function issueMemberCredential({ npi, name, cooperative_id, role = 'chef' }) {
  const credentialDefinitionId = await resolveMemberCredDefId();
  const attributes = [
    { name: 'npi', value: String(npi) },
    { name: 'name', value: String(name || '') },
    { name: 'cooperative_id', value: String(cooperative_id || '') },
    { name: 'role', value: String(role) }
  ];
  const res = await axios.post(`${EIDSTACK_URL}/issuance/offer`, { credentialDefinitionId, attributes }, { timeout: 30000 });
  return res.data?.data || res.data;
}

/** Démarre un login : crée une demande de preuve (npi + name) restreinte au credential membre. */
async function startLogin() {
  const credDefId = await resolveMemberCredDefId();
  const res = await axios.post(`${EIDSTACK_URL}/verification/createProofRequest`, {
    credDefId,
    attributes: [{ name: 'npi' }, { name: 'name' }],
    comment: 'CottonPay — connexion coopérative'
  }, { timeout: 30000 });
  return res.data?.data || res.data;
}

/** Vérifie l'état d'un login. Retourne { state, verified, npi, name }. */
async function checkLogin(proofRecordId) {
  const res = await axios.get(`${EIDSTACK_URL}/verification/proofStatus`, { params: { proofRecordId }, timeout: 15000 });
  const d = res.data?.data || res.data;
  const state = d.state;
  const verified = ['presentation-received', 'done', 'verified'].includes(state);
  const claims = d.claims || {};
  return { state, verified, npi: claims.npi || null, name: claims.name || null };
}

module.exports = { resolveMemberCredDefId, issueMemberCredential, startLogin, checkLogin };
