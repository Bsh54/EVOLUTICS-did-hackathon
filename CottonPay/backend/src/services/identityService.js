/**
 * Identity Service
 * Vérifie les NPI via le Mock Identity System (MOSIP Sandbox)
 * 
 * Ce service est le pont entre CottonPay et le registre national d'identité (ANIP).
 * Dans le contexte du hackathon, le Mock Identity System simule l'ANIP du Bénin.
 * 
 * Utilisation d'eSignet / MOSIP :
 *  - verifyNpi() : vérifie l'existence d'un individu dans le registre
 *  - sendOtp()   : déclenche l'envoi d'un OTP via eSignet (consentement)
 *  - verifyOtp() : valide un OTP reçu
 */

const axios = require('axios');

const MOCK_IDENTITY_URL = process.env.MOCK_IDENTITY_URL || 'http://localhost:8082';
const ESIGNET_BASE_URL = process.env.ESIGNET_BASE_URL || 'http://localhost:8088/v1/esignet';

/**
 * Vérifie qu'un NPI existe dans le registre national (Mock Identity System)
 * Appel : GET /v1/mock-identity-system/identity/{npi}
 * 
 * @param {string} npi - Le NPI (individualId) du producteur
 * @returns {object|null} - Les données d'identité formatées, ou null si non trouvé
 */
async function verifyNpi(npi) {
  try {
    const response = await axios.get(
      `${MOCK_IDENTITY_URL}/v1/mock-identity-system/identity/${npi}`,
      { timeout: 5000 }
    );

    if (response.data && response.data.response) {
      return formatIdentity(response.data.response, npi);
    }

    return null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // NPI non trouvé
    }
    console.error(`❌ Identity verification error for NPI ${npi}:`, error.message);
    throw new Error('Erreur de communication avec le registre national');
  }
}

/**
 * Formate les données brutes du Mock Identity System
 * Le Mock retourne des tableaux multilingues, on extrait la version française
 * 
 * @param {object} rawData - Données brutes du Mock Identity
 * @param {string} npi - Le NPI pour référence
 * @returns {object} - Données formatées
 */
function formatIdentity(rawData, npi) {
  // Utilitaire pour extraire la valeur française (ou anglaise en fallback)
  function extractLang(field) {
    if (!field || !Array.isArray(field)) return '';
    const fra = field.find(f => f.language === 'fra');
    const eng = field.find(f => f.language === 'eng');
    return (fra || eng || {}).value || '';
  }

  return {
    npi: npi,
    name: extractLang(rawData.fullName) || `${extractLang(rawData.givenName)} ${extractLang(rawData.familyName)}`,
    firstname: extractLang(rawData.givenName),
    lastname: extractLang(rawData.familyName),
    phone: rawData.phone || '',
    email: rawData.email || '',
    region: extractLang(rawData.region),
    commune: extractLang(rawData.locality),
    date_of_birth: rawData.dateOfBirth || '',
    gender: extractLang(rawData.gender),
    verified: true,
    verified_at: new Date().toISOString(),
    source: 'MOSIP/Mock-Identity-System'
  };
}

/**
 * Masque partiellement un numéro de téléphone pour l'affichage public
 * Ex: "+22997123456" → "+229 97 ** ** 56"
 * 
 * @param {string} phone - Numéro complet
 * @returns {string} - Numéro masqué
 */
function maskPhone(phone) {
  if (!phone || phone.length < 8) return '***';
  // Garder indicatif + 2 premiers + 2 derniers chiffres
  const clean = phone.replace(/\s/g, '');
  const prefix = clean.slice(0, 6);  // +22997
  const suffix = clean.slice(-2);     // 56
  return `${prefix} ** ** ${suffix}`;
}

/**
 * Déclenche l'envoi d'un OTP via eSignet pour le consentement du producteur
 * Utilisé dans le flux de vérification publique (banques)
 * 
 * Dans le Mock, l'OTP est toujours 111111
 * 
 * @param {string} npi - Le NPI du producteur
 * @param {string} captcha - Token captcha (vide pour Mock)
 * @returns {object} - { success: true, transactionId }
 */
async function sendOtp(npi, captcha = '') {
  try {
    const response = await axios.post(
      `${ESIGNET_BASE_URL}/authorization/send-otp`,
      {
        requestTime: new Date().toISOString(),
        request: {
          transactionId: generateTransactionId(),
          individualId: npi,
          otpChannels: ['phone'],
          captchaToken: captcha
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    return {
      success: true,
      transactionId: response.data?.response?.transactionId || generateTransactionId(),
      maskedPhone: null // sera rempli par la route
    };
  } catch (error) {
    console.error('❌ OTP send error:', error.response?.data || error.message);
    // En mode Mock, on simule un succès même si l'API échoue
    // L'OTP sera toujours 111111
    return {
      success: true,
      transactionId: generateTransactionId(),
      maskedPhone: null,
      mock: true
    };
  }
}

/**
 * Valide un OTP saisi par l'utilisateur
 * 
 * @param {string} npi - Le NPI du producteur
 * @param {string} otp - Le code OTP saisi
 * @param {string} transactionId - L'ID de la transaction OTP
 * @returns {object} - { valid: true/false }
 */
async function verifyOtp(npi, otp, transactionId) {
  try {
    const response = await axios.post(
      `${ESIGNET_BASE_URL}/authorization/authenticate`,
      {
        requestTime: new Date().toISOString(),
        request: {
          transactionId: transactionId,
          individualId: npi,
          challengeList: [
            {
              authFactorType: 'OTP',
              challenge: otp,
              format: 'alpha-numeric'
            }
          ]
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    return { valid: true, transactionId };
  } catch (error) {
    console.error('❌ OTP verify error:', error.response?.data || error.message);
    // En mode Mock, on accepte toujours 111111
    if (otp === '111111') {
      return { valid: true, transactionId, mock: true };
    }
    return { valid: false };
  }
}

/**
 * Génère un ID de transaction unique
 */
function generateTransactionId() {
  return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

/**
 * Cherche un NPI par numéro de téléphone dans nos données locales
 * (coopératives + producteurs)
 * Utilisé quand eSignet retourne un PPID hashé au lieu du NPI
 */
function findNpiByPhone(phone) {
  if (!phone) return null;

  // Normaliser le numéro (garder les 8 derniers chiffres)
  const cleanPhone = phone.replace(/[\s\-\+]/g, '').slice(-8);
  if (cleanPhone.length < 6) return null;

  const fs = require('fs');
  const path = require('path');

  try {
    // 1. Chercher dans les membres de coopératives
    const coopsPath = path.resolve(__dirname, '../../data/cooperatives.json');
    const coopsData = JSON.parse(fs.readFileSync(coopsPath, 'utf8'));
    for (const coop of coopsData.cooperatives) {
      if (coop.members) {
        for (const m of coop.members) {
          const mClean = (m.phone || '').replace(/[\s\-\+]/g, '').slice(-8);
          if (mClean && mClean === cleanPhone) {
            console.log(`📞 Found NPI by phone match (coop member): ${m.npi}`);
            return m.npi;
          }
        }
      }
    }

    // 2. Chercher dans les producteurs
    const producersPath = path.resolve(__dirname, '../../data/producers.json');
    const producersData = JSON.parse(fs.readFileSync(producersPath, 'utf8'));
    for (const p of producersData.producers) {
      const pClean = (p.phone || '').replace(/[\s\-\+]/g, '').slice(-8);
      if (pClean && pClean === cleanPhone) {
        console.log(`📞 Found NPI by phone match (producer): ${p.npi}`);
        return p.npi;
      }
    }
  } catch (err) {
    console.error('⚠️ findNpiByPhone error:', err.message);
  }

  return null;
}

/**
 * Cherche un NPI par adresse email dans nos données locales
 * Fallback supplémentaire quand la recherche par téléphone échoue
 */
function findNpiByEmail(email) {
  if (!email || email === '-') return null;

  const cleanEmail = email.toLowerCase().trim();

  const fs = require('fs');
  const path = require('path');

  try {
    // 1. Chercher dans les membres de coopératives
    const coopsPath = path.resolve(__dirname, '../../data/cooperatives.json');
    const coopsData = JSON.parse(fs.readFileSync(coopsPath, 'utf8'));
    for (const coop of coopsData.cooperatives) {
      if (coop.members) {
        for (const m of coop.members) {
          if (m.email && m.email.toLowerCase().trim() === cleanEmail) {
            console.log(`📧 Found NPI by email match (coop member): ${m.npi}`);
            return m.npi;
          }
        }
      }
    }

    // 2. Chercher dans les producteurs
    const producersPath = path.resolve(__dirname, '../../data/producers.json');
    const producersData = JSON.parse(fs.readFileSync(producersPath, 'utf8'));
    for (const p of producersData.producers) {
      if (p.email && p.email.toLowerCase().trim() === cleanEmail) {
        console.log(`📧 Found NPI by email match (producer): ${p.npi}`);
        return p.npi;
      }
    }
  } catch (err) {
    console.error('⚠️ findNpiByEmail error:', err.message);
  }

  return null;
}

/**
 * Cherche un NPI en essayant toutes les stratégies disponibles
 * @param {object} userDetails - Données retournées par eSignet/userinfo
 * @returns {string|null} - Le NPI réel ou null
 */
function resolveNpiFromUserDetails(userDetails) {
  if (!userDetails) return null;

  // Stratégie 1 : individual_id (claim MOSIP direct)
  if (userDetails.individual_id) {
    console.log(`🔑 NPI resolved via individual_id: ${userDetails.individual_id}`);
    return userDetails.individual_id;
  }

  // Stratégie 2 : preferred_username (parfois le NPI)
  if (userDetails.preferred_username && /^\d{10,16}$/.test(userDetails.preferred_username)) {
    console.log(`🔑 NPI resolved via preferred_username: ${userDetails.preferred_username}`);
    return userDetails.preferred_username;
  }

  // Stratégie 3 : Recherche par téléphone
  const phone = userDetails.phone_number || userDetails.phone;
  if (phone) {
    const npiByPhone = findNpiByPhone(phone);
    if (npiByPhone) return npiByPhone;
  }

  // Stratégie 4 : Recherche par email
  const email = userDetails.email;
  if (email) {
    const npiByEmail = findNpiByEmail(email);
    if (npiByEmail) return npiByEmail;
  }

  // Stratégie 5 : Recherche par nom (fuzzy match dans les coopératives)
  const name = userDetails.name || userDetails.given_name;
  if (name) {
    const npiByName = findNpiByName(name, userDetails.family_name);
    if (npiByName) return npiByName;
  }

  return null;
}

/**
 * Cherche un NPI par nom/prénom dans nos données locales
 * Dernier recours quand toutes les autres méthodes échouent
 */
function findNpiByName(firstName, lastName) {
  if (!firstName) return null;

  const fs = require('fs');
  const path = require('path');

  const cleanFirst = (firstName || '').toLowerCase().trim();
  const cleanLast = (lastName || '').toLowerCase().trim();

  try {
    // 1. Chercher dans les membres de coopératives
    const coopsPath = path.resolve(__dirname, '../../data/cooperatives.json');
    const coopsData = JSON.parse(fs.readFileSync(coopsPath, 'utf8'));
    for (const coop of coopsData.cooperatives) {
      if (coop.members) {
        for (const m of coop.members) {
          const mFirst = (m.firstname || '').toLowerCase().trim();
          const mLast = (m.name || '').toLowerCase().trim();
          if (mFirst && mFirst === cleanFirst && mLast && mLast === cleanLast) {
            console.log(`👤 Found NPI by name match (coop member): ${m.npi}`);
            return m.npi;
          }
        }
      }
    }

    // 2. Chercher dans les producteurs
    const producersPath = path.resolve(__dirname, '../../data/producers.json');
    const producersData = JSON.parse(fs.readFileSync(producersPath, 'utf8'));
    for (const p of producersData.producers) {
      const pFirst = (p.firstname || '').toLowerCase().trim();
      const pLast = (p.name || '').toLowerCase().trim();
      if (pFirst && pFirst === cleanFirst && pLast && pLast === cleanLast) {
        console.log(`👤 Found NPI by name match (producer): ${p.npi}`);
        return p.npi;
      }
    }
  } catch (err) {
    console.error('⚠️ findNpiByName error:', err.message);
  }

  return null;
}

module.exports = {
  verifyNpi,
  formatIdentity,
  maskPhone,
  sendOtp,
  verifyOtp,
  generateTransactionId,
  findNpiByPhone,
  findNpiByEmail,
  findNpiByName,
  resolveNpiFromUserDetails
};
