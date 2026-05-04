/**
 * Création de tous les utilisateurs test dans le Mock Identity System
 * 
 * Usage: node scripts/create-test-users.js
 * 
 * Crée :
 *  - 2 membres de coopérative (accès Espace Coopérative)
 *  - 15 producteurs de coton (accès Espace Producteur)
 * 
 * OTP par défaut pour tous : 111111
 */

require('dotenv').config();
const axios = require('axios');

const MOCK_IDENTITY_URL = process.env.MOCK_IDENTITY_URL || 'http://localhost:8082';
const API_ENDPOINT = `${MOCK_IDENTITY_URL}/v1/mock-identity-system/identity`;

// ============================================
// MEMBRES DE COOPÉRATIVE (accès Espace Coop)
// ============================================
const COOP_MEMBERS = [
  {
    individualId: '9876543210987654',
    pin: '111111',
    phone: '+22996000001',
    email: 'kokou.agossou@cvpc.bj',
    givenName: 'Kokou',
    familyName: 'Agossou',
    fullName: 'Kokou Agossou',
    locality: 'Parakou',
    region: 'Borgou',
    dob: '1980/03/12'
  },
  {
    individualId: '8765432109876543',
    pin: '111111',
    phone: '+22996000002',
    email: 'sena.ahouansou@cvpc.bj',
    givenName: 'Sèna',
    familyName: 'Ahouansou',
    fullName: 'Sèna Ahouansou',
    locality: 'Parakou',
    region: 'Borgou',
    dob: '1985/07/22'
  }
];

// ============================================
// PRODUCTEURS DE COTON (accès Espace Producteur)
// ============================================
const PRODUCERS = [
  { individualId: '1000000000000001', givenName: 'Adjovi',    familyName: 'Mensah',     phone: '+22997000001', locality: 'Parakou',    region: 'Borgou',  dob: '1978/04/10' },
  { individualId: '1000000000000002', givenName: 'Koffi',     familyName: 'Dossou',     phone: '+22997000002', locality: 'Parakou',    region: 'Borgou',  dob: '1982/11/05' },
  { individualId: '1000000000000003', givenName: 'Amina',     familyName: 'Bello',      phone: '+22997000003', locality: 'Kandi',      region: 'Alibori', dob: '1990/06/18' },
  { individualId: '1000000000000004', givenName: 'Yao',       familyName: 'Tchabi',     phone: '+22997000004', locality: 'Nikki',      region: 'Borgou',  dob: '1975/01/30' },
  { individualId: '1000000000000005', givenName: 'Fifamè',    familyName: 'Houngbo',    phone: '+22997000005', locality: 'Bembèrèkè', region: 'Borgou',  dob: '1988/09/14' },
  { individualId: '1000000000000006', givenName: 'Martial',   familyName: 'Sossa',      phone: '+22997000006', locality: 'Banikoara',  region: 'Alibori', dob: '1983/02/25' },
  { individualId: '1000000000000007', givenName: 'Grâce',     familyName: 'Adandé',     phone: '+22997000007', locality: 'Gogounou',   region: 'Alibori', dob: '1992/12/03' },
  { individualId: '1000000000000008', givenName: 'Rachid',    familyName: 'Moussa',     phone: '+22997000008', locality: 'Kandi',      region: 'Alibori', dob: '1979/08/07' },
  { individualId: '1000000000000009', givenName: 'Christelle',familyName: 'Agbossou',   phone: '+22997000009', locality: 'Sinendé',    region: 'Borgou',  dob: '1986/05/20' },
  { individualId: '1000000000000010', givenName: 'Bio',       familyName: 'Tamou',      phone: '+22997000010', locality: 'Banikoara',  region: 'Alibori', dob: '1973/10/11' },
  { individualId: '1000000000000011', givenName: 'Fatimath',  familyName: 'Idrissou',   phone: '+22997000011', locality: 'Gogounou',   region: 'Alibori', dob: '1991/03/28' },
  { individualId: '1000000000000012', givenName: 'Pascal',    familyName: 'Hounkonnou', phone: '+22997000012', locality: 'Nikki',      region: 'Borgou',  dob: '1980/07/16' },
  { individualId: '1000000000000013', givenName: 'Aïssatou',  familyName: 'Garba',      phone: '+22997000013', locality: 'Kandi',      region: 'Alibori', dob: '1987/11/09' },
  { individualId: '1000000000000014', givenName: 'Janvier',   familyName: 'Akplogan',   phone: '+22997000014', locality: 'Bembèrèkè', region: 'Borgou',  dob: '1976/06/02' },
  { individualId: '1000000000000015', givenName: 'Nafiou',    familyName: 'Boni',       phone: '+22997000015', locality: 'Banikoara',  region: 'Alibori', dob: '1984/01/19' }
];

// ============================================
// CONSTRUCTION DU PAYLOAD MOCK IDENTITY
// ============================================
function buildIdentityPayload(user) {
  return {
    requestTime: new Date().toISOString(),
    request: {
      individualId: user.individualId,
      pin: user.pin || '111111',
      email: user.email || `${user.givenName.toLowerCase()}.${user.familyName.toLowerCase()}@test.bj`,
      phone: user.phone,
      fullName: [
        { language: 'eng', value: `${user.givenName} ${user.familyName}` },
        { language: 'fra', value: `${user.givenName} ${user.familyName}` }
      ],
      givenName: [
        { language: 'eng', value: user.givenName },
        { language: 'fra', value: user.givenName }
      ],
      familyName: [
        { language: 'eng', value: user.familyName },
        { language: 'fra', value: user.familyName }
      ],
      dateOfBirth: user.dob,
      gender: [
        { language: 'eng', value: 'Male' },
        { language: 'fra', value: 'Masculin' }
      ],
      encodedPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      streetAddress: [
        { language: 'eng', value: user.locality },
        { language: 'fra', value: user.locality }
      ],
      locality: [
        { language: 'eng', value: user.locality },
        { language: 'fra', value: user.locality }
      ],
      region: [
        { language: 'eng', value: user.region },
        { language: 'fra', value: user.region }
      ],
      postalCode: '00229',
      country: [
        { language: 'eng', value: 'BEN' },
        { language: 'fra', value: 'BEN' }
      ]
    }
  };
}

// ============================================
// EXÉCUTION
// ============================================
async function createUser(user, role) {
  const payload = buildIdentityPayload(user);
  try {
    await axios.post(API_ENDPOINT, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`  ✅ ${role} | ${user.givenName} ${user.familyName} | NPI: ${user.individualId} | Tél: ${user.phone}`);
    return true;
  } catch (error) {
    const msg = error.response?.data?.errors?.[0]?.errorMessage || error.message;
    if (msg.includes('already') || msg.includes('duplicate')) {
      console.log(`  ⚠️  ${role} | ${user.givenName} ${user.familyName} | NPI: ${user.individualId} | Déjà existant`);
      return true;
    }
    console.error(`  ❌ ${role} | ${user.givenName} ${user.familyName} | Erreur: ${msg}`);
    return false;
  }
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║       CottonPay — Création des utilisateurs test     ║
║       Mock Identity System: ${MOCK_IDENTITY_URL}       
╚══════════════════════════════════════════════════════╝
`);

  let success = 0;
  let failed = 0;

  // Créer les membres de coopérative
  console.log('📋 MEMBRES DE COOPÉRATIVE (Espace Coop)');
  console.log('─'.repeat(70));
  for (const member of COOP_MEMBERS) {
    const ok = await createUser(member, 'COOP ');
    ok ? success++ : failed++;
  }

  console.log('');

  // Créer les producteurs
  console.log('🌾 PRODUCTEURS DE COTON (Espace Producteur)');
  console.log('─'.repeat(70));
  for (const producer of PRODUCERS) {
    const ok = await createUser(producer, 'PROD ');
    ok ? success++ : failed++;
  }

  // Résumé
  console.log(`
${'─'.repeat(70)}
📊 RÉSUMÉ
   Total: ${success + failed} | ✅ Succès: ${success} | ❌ Échecs: ${failed}

🔑 INFORMATIONS DE CONNEXION
   OTP par défaut : 111111 (pour tous les utilisateurs)

👤 COMPTES COOPÉRATIVE (pour se connecter à l'Espace Coop)
   NPI: 9876543210987654  →  Kokou Agossou
   NPI: 8765432109876543  →  Sèna Ahouansou

👨‍🌾 COMPTES PRODUCTEUR (pour se connecter à Mon Espace)
   NPI: 1000000000000001  →  Adjovi Mensah
   NPI: 1000000000000002  →  Koffi Dossou
   ... (15 producteurs au total)
`);
}

main().catch(err => {
  console.error('Erreur fatale:', err.message);
  process.exit(1);
});
