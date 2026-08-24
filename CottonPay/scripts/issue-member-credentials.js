/**
 * issue-member-credentials.js — ADMIN ONLY
 *
 * Émet le credential "membre" CottonPay à chaque chef de coopérative connu
 * (depuis cooperatives.json). Chaque chef scanne ENSUITE son QR (invitationUrl)
 * une seule fois pour recevoir le credential dans son wallet — après quoi il se
 * connecte uniquement par wallet (plus besoin d'eSignet).
 *
 * Usage : node scripts/issue-member-credentials.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const vpAuthService = require('../backend/src/services/vpAuthService');

const DATA = path.join(__dirname, '../backend/data/cooperatives.json');

(async () => {
  const { cooperatives } = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
  console.log(`\n=== Émission des credentials membres (${cooperatives.length} coopératives) ===\n`);
  for (const coop of cooperatives) {
    for (const m of (coop.members || [])) {
      const name = `${m.firstname || ''} ${m.name || ''}`.trim();
      try {
        const cred = await vpAuthService.issueMemberCredential({
          npi: m.npi, name, cooperative_id: coop.id, role: m.role || 'chef'
        });
        console.log(`✅ ${coop.name} — ${name} (NPI ${m.npi})`);
        console.log(`   QR à scanner : ${cred.invitationUrl}\n`);
      } catch (e) {
        console.log(`❌ ${coop.name} — ${name} : ${e.response?.data?.error || e.message}\n`);
      }
    }
  }
  console.log('=== Terminé. Chaque chef scanne son QR une fois pour activer son login wallet. ===');
})();
