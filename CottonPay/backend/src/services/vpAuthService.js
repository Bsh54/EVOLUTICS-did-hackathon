/**
 * VP Auth Service — login par présentation de credential (eid / wallet)
 *
 * MIGRÉ vers le e-IDStack hébergé (test.e-idstack.com) : le wallet fait partie de
 * cet écosystème (trust registry, médiateur, face verification). On émet le credential
 * "membre" et on vérifie la preuve via leur API v1.
 *
 * Auth : en-têtes x-api-key + x-tenant-id (dans le .env).
 * Endpoints : POST /issuance/oob-offer, POST /verification/createproofRequest,
 *             GET /verification/proofStatus, GET /verification/proofs/{id}.
 */

const axios = require('axios');
const invStore = require('./invStore');

const BASE = process.env.EIDSTACK2_URL || 'https://test.e-idstack.com/api/v1';
const API_KEY = process.env.EIDSTACK2_API_KEY || '';
const TENANT = process.env.EIDSTACK2_TENANT || '';
const MEMBER_CRED_DEF = process.env.EIDSTACK2_MEMBER_CREDDEF || '';
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://cottonpay2.shadrakbessanh.me';

function H() {
  return { 'x-api-key': API_KEY, 'x-tenant-id': TENANT, 'Content-Type': 'application/json' };
}
function qr(url) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(url);
}

/**
 * Construit le deep link attendu par le wallet e-ID :
 *   polyid://invite?shortUrl=<notre redirection>&type=offer|proof
 * `fullInvitationUrl` = l'URL didcomm?oob=... renvoyée par e-IDStack (trop longue pour un QR),
 * qu'on stocke et sert via /inv/:id (302), format que le wallet sait résoudre.
 */
function toDeepLink(fullInvitationUrl, type) {
  // On extrait le paramètre oob et on le sert via NOTRE domaine (/oob?oob=...),
  // pour éviter le 414 de l'endpoint didcomm distant (URL de 13 Ko).
  const m = /[?&]oob=([^&]+)/.exec(fullInvitationUrl);
  const oob = m ? m[1] : '';
  const target = `${PUBLIC_URL}/oob?oob=${oob}&type=${type}`;
  const id = invStore.store(target);
  const shortUrl = `${PUBLIC_URL}/inv/${id}`;
  return `polyid://invite?shortUrl=${shortUrl}&type=${type}`;
}

/** Résout le credDef "membre" (via env, sinon en interrogeant la liste). */
let _cache = MEMBER_CRED_DEF || null;
async function resolveMemberCredDefId() {
  if (_cache) return _cache;
  const res = await axios.get(`${BASE}/issuance/credential-definitions`, { headers: H(), timeout: 15000 });
  const items = res.data?.data?.items || res.data?.data || res.data || [];
  const cd = (Array.isArray(items) ? items : []).find(c => JSON.stringify(c).toLowerCase().includes('member'));
  _cache = cd?.credentialDefinitionId || cd?.cred_def_id || cd?.credDefId;
  if (!_cache) throw new Error('CredDef "membre" introuvable sur e-IDStack');
  return _cache;
}

/** Émet le credential "membre" (OOB, sans connexion) → renvoie le QR d'acceptation. */
async function issueMemberCredential({ npi, name, cooperative_id, role = 'chef' }) {
  const credentialDefinitionId = await resolveMemberCredDefId();
  const res = await axios.post(`${BASE}/issuance/oob-offer`, {
    credentialDefinitionId,
    attributes: {
      npi: String(npi),
      name: String(name || ''),
      cooperative_id: String(cooperative_id || ''),
      role: String(role)
    }
  }, { headers: H(), timeout: 60000 });
  const d = res.data?.data || res.data;
  const deep = toDeepLink(d.invitationUrl, 'offer');
  return {
    invitationUrl: deep,
    invitationQr: qr(deep),
    shortUrl: d.shortUrl,
    credentialExchangeId: d.outOfBandId
  };
}

/** Démarre un login : demande de preuve épinglée à la cred def membre (npi + name). */
async function startLogin() {
  const credDefId = await resolveMemberCredDefId();
  const res = await axios.post(`${BASE}/verification/createproofRequest`, {
    credDefId,
    attributes: [{ name: 'npi' }, { name: 'name' }],
    comment: 'CottonPay — connexion coopérative'
  }, { headers: H(), timeout: 60000 });
  const d = res.data?.data || res.data;
  const deep = toDeepLink(d.invitationUrl, 'proof');
  return {
    proofRecordId: d.proofRecordId,
    invitationUrl: deep,
    verificationQr: qr(deep),
    shortUrl: d.shortUrl
  };
}

/** Cherche récursivement la valeur révélée d'un attribut (npi/name) dans un objet preuve. */
function deepFindAttr(obj, attrName) {
  let found = null;
  (function walk(o) {
    if (found != null || !o || typeof o !== 'object') return;
    // format anoncreds : revealed_attrs[key] = { raw, ... } avec un name associé
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v && typeof v === 'object') {
        if ((v.name === attrName || k === attrName) && (v.raw != null || v.value != null)) {
          found = v.raw != null ? v.raw : v.value; return;
        }
        walk(v);
      }
    }
  })(obj);
  return found;
}

/** Vérifie l'état d'un login. Retourne { state, verified, npi, name }. */
async function checkLogin(proofRecordId) {
  const res = await axios.get(`${BASE}/verification/proofStatus`, { headers: H(), params: { proofRecordId }, timeout: 15000 });
  const d = res.data?.data || res.data;
  const state = d.state;
  console.log('[VP-DEBUG] proofStatus state=', state, ' payload=', JSON.stringify(d).slice(0, 900));
  const verified = ['presentation-received', 'done', 'verified', 'abandoned', 'presentation_received'].includes(state);
  let npi = deepFindAttr(d, 'npi');
  let name = deepFindAttr(d, 'name');
  // Si la preuve est validée mais que proofStatus ne porte pas les attributs, on va chercher le détail.
  if (verified && (npi == null || name == null)) {
    try {
      const det = await axios.get(`${BASE}/verification/proofs/${proofRecordId}`, { headers: H(), timeout: 15000 });
      const dd = det.data?.data || det.data;
      if (npi == null) npi = deepFindAttr(dd, 'npi');
      if (name == null) name = deepFindAttr(dd, 'name');
    } catch (e) { /* best effort */ }
  }
  return { state, verified, npi: npi || null, name: name || null };
}

module.exports = { resolveMemberCredDefId, issueMemberCredential, startLogin, checkLogin };
