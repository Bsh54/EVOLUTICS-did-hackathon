/**
 * Seed multi-tenant CottonPay
 *
 *  - Crée 5 chefs de coopérative (identités vérifiées dans Mock Identity)
 *  - Crée / garantit 5 producteurs de test (identités Mock Identity)
 *  - Écrit 5 coopératives distinctes (cooperatives.json) → 5 dashboards indépendants
 *  - Écrit producers.json avec MULTI-AFFILIATION (un même NPI dans plusieurs coops)
 *    et un cas de DOUBLE RÔLE (un chef aussi producteur ailleurs)
 *
 * OTP par défaut pour tous : 111111
 * Usage : node scripts/seed-multitenant.js
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const MOCK_IDENTITY_URL = process.env.MOCK_IDENTITY_URL || 'http://localhost:8082';
const API_ENDPOINT = `${MOCK_IDENTITY_URL}/v1/mock-identity-system/identity`;
const DATA_DIR = path.join(__dirname, '../backend/data');

// ============================================================
// 5 CHEFS DE COOPÉRATIVE (un par coopérative)
// ============================================================
const CHIEFS = [
  { npi: '5000000000000001', givenName: 'Kokou',    familyName: 'Agossou',    phone: '+22996000001', locality: 'Parakou',   region: 'Borgou',  dob: '1980/03/12' },
  { npi: '5000000000000002', givenName: 'Sèna',     familyName: 'Ahouansou',  phone: '+22996000002', locality: 'Kandi',     region: 'Alibori', dob: '1985/07/22' },
  { npi: '5000000000000003', givenName: 'Bio',      familyName: 'Tamou',      phone: '+22996000003', locality: 'Banikoara', region: 'Alibori', dob: '1978/05/03' },
  { npi: '5000000000000004', givenName: 'Grâce',    familyName: 'Adandé',     phone: '+22996000004', locality: 'Gogounou',  region: 'Alibori', dob: '1990/09/14' },
  { npi: '5000000000000005', givenName: 'Pascal',   familyName: 'Hounkonnou', phone: '+22996000005', locality: 'Nikki',     region: 'Borgou',  dob: '1982/01/28' }
];

// ============================================================
// 5 PRODUCTEURS DE TEST (identités réutilisées / garanties)
// ============================================================
const PRODUCERS = [
  { npi: '1000000000000001', givenName: 'Adjovi',  familyName: 'Mensah',  phone: '+22997000001', locality: 'Parakou',   region: 'Borgou',  dob: '1978/04/10' },
  { npi: '1000000000000002', givenName: 'Koffi',   familyName: 'Dossou',  phone: '+22997000002', locality: 'Parakou',   region: 'Borgou',  dob: '1982/11/05' },
  { npi: '1000000000000003', givenName: 'Amina',   familyName: 'Bello',   phone: '+22997000003', locality: 'Kandi',     region: 'Alibori', dob: '1990/06/18' },
  { npi: '1000000000000004', givenName: 'Yao',     familyName: 'Tchabi',  phone: '+22997000004', locality: 'Nikki',     region: 'Borgou',  dob: '1975/01/30' },
  { npi: '1000000000000005', givenName: 'Fifamè',  familyName: 'Houngbo', phone: '+22997000005', locality: 'Banikoara', region: 'Alibori', dob: '1988/09/14' }
];

// ============================================================
// 5 COOPÉRATIVES (une par chef)
// ============================================================
const COOPS = [
  { id: 'coop-001', name: 'CVPC Borgou-Nord',   region: 'Borgou',  commune: 'Parakou',   chief: 0 },
  { id: 'coop-002', name: 'CVPC Alibori-Kandi',  region: 'Alibori', commune: 'Kandi',     chief: 1 },
  { id: 'coop-003', name: 'CVPC Banikoara',      region: 'Alibori', commune: 'Banikoara', chief: 2 },
  { id: 'coop-004', name: 'CVPC Gogounou',       region: 'Alibori', commune: 'Gogounou',  chief: 3 },
  { id: 'coop-005', name: 'CVPC Nikki',          region: 'Borgou',  commune: 'Nikki',     chief: 4 }
];

// ============================================================
// AFFILIATIONS par défaut : AUCUNE.
// Chaque coopérative démarre vide (seul le chef) ; c'est au chef d'enregistrer
// ses producteurs via l'interface. La multi-affiliation et le double rôle restent
// pleinement supportés par le code — ils se testent en enregistrant manuellement
// un même NPI dans plusieurs coops.
// (Pour re-semer des données de démo, remplir ce tableau, ex :
//   { npi: '1000000000000001', coops: ['coop-001', 'coop-002'] } )
// ============================================================
const AFFILIATIONS = [];

// ------------------------------------------------------------
function buildIdentityPayload(u) {
  return {
    requestTime: new Date().toISOString(),
    request: {
      individualId: u.npi,
      pin: '111111',
      email: `${u.givenName.toLowerCase()}.${u.familyName.toLowerCase()}@cottonpay.bj`,
      phone: u.phone,
      fullName: [{ language: 'eng', value: `${u.givenName} ${u.familyName}` }, { language: 'fra', value: `${u.givenName} ${u.familyName}` }],
      givenName: [{ language: 'eng', value: u.givenName }, { language: 'fra', value: u.givenName }],
      familyName: [{ language: 'eng', value: u.familyName }, { language: 'fra', value: u.familyName }],
      dateOfBirth: u.dob,
      gender: [{ language: 'eng', value: 'Male' }, { language: 'fra', value: 'Masculin' }],
      encodedPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      streetAddress: [{ language: 'eng', value: u.locality }, { language: 'fra', value: u.locality }],
      locality: [{ language: 'eng', value: u.locality }, { language: 'fra', value: u.locality }],
      region: [{ language: 'eng', value: u.region }, { language: 'fra', value: u.region }],
      postalCode: '00229',
      country: [{ language: 'eng', value: 'BEN' }, { language: 'fra', value: 'BEN' }]
    }
  };
}

async function ensureIdentity(u, role) {
  try {
    await axios.post(API_ENDPOINT, buildIdentityPayload(u), { headers: { 'Content-Type': 'application/json' } });
    console.log(`  ✅ ${role} | ${u.givenName} ${u.familyName} | NPI ${u.npi}`);
  } catch (e) {
    const msg = e.response?.data?.errors?.[0]?.errorMessage || e.message;
    if (/already|duplicate/i.test(msg)) console.log(`  ⚠️  ${role} | ${u.givenName} ${u.familyName} | NPI ${u.npi} (déjà existant)`);
    else console.error(`  ❌ ${role} | ${u.givenName} ${u.familyName} | ${msg}`);
  }
}

function findIdentity(npi) {
  return CHIEFS.concat(PRODUCERS).find(u => u.npi === npi);
}

async function main() {
  console.log('\n=== SEED MULTI-TENANT CottonPay ===\n');

  console.log('👔 Chefs de coopérative (Mock Identity) :');
  for (const c of CHIEFS) await ensureIdentity(c, 'CHEF');

  console.log('\n🌾 Producteurs (Mock Identity) :');
  for (const p of PRODUCERS) await ensureIdentity(p, 'PROD');

  // ---- cooperatives.json ----
  const cooperatives = COOPS.map(co => {
    const chief = CHIEFS[co.chief];
    return {
      id: co.id,
      name: co.name,
      region: co.region,
      commune: co.commune,
      campaign: '2025-2026',
      members_npi: [chief.npi],
      members: [{
        npi: chief.npi,
        name: chief.familyName,
        firstname: chief.givenName,
        phone: chief.phone,
        email: `${chief.givenName.toLowerCase()}.${chief.familyName.toLowerCase()}@cottonpay.bj`,
        role: 'president'
      }]
    };
  });
  fs.writeFileSync(path.join(DATA_DIR, 'cooperatives.json'), JSON.stringify({ cooperatives }, null, 2), 'utf-8');

  // ---- producers.json (multi-affiliation : un record par (npi, coop)) ----
  const producers = [];
  for (const aff of AFFILIATIONS) {
    const id = findIdentity(aff.npi);
    if (!id) { console.warn(`⚠️ identité introuvable pour ${aff.npi}`); continue; }
    for (const coopId of aff.coops) {
      const coop = COOPS.find(c => c.id === coopId);
      producers.push({
        npi: id.npi,
        name: id.familyName,
        firstname: id.givenName,
        phone: id.phone,
        region: id.region,
        commune: id.locality,
        cooperative_id: coopId,
        registered_at: new Date().toISOString(),
        registered_by: CHIEFS[coop.chief].npi
      });
    }
  }
  fs.writeFileSync(path.join(DATA_DIR, 'producers.json'), JSON.stringify({ producers }, null, 2), 'utf-8');

  // ---- résumé ----
  console.log('\n=== ÉCRIT ===');
  console.log(`  cooperatives.json : ${cooperatives.length} coopératives`);
  console.log(`  producers.json    : ${producers.length} enregistrements (multi-affiliation incluse)`);
  console.log('\n=== ACCÈS CHEFS (OTP 111111) ===');
  COOPS.forEach(co => {
    const ch = CHIEFS[co.chief];
    console.log(`  ${co.name.padEnd(22)} → NPI ${ch.npi} (${ch.givenName} ${ch.familyName})`);
  });
  console.log('\n=== ÉTAT ===');
  console.log('  Chaque coopérative démarre VIDE (seul le chef). Les producteurs sont à');
  console.log('  enregistrer via l\'interface. NPI producteurs disponibles : 1000000000000001..15');
  console.log('');
}

main().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
