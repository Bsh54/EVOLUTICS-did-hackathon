/**
 * ensure-identities.js
 * Recrée UNIQUEMENT les identités dans le Mock Identity System (chefs + producteurs),
 * SANS écrire aucun fichier de données (cooperatives.json / producers.json préservés).
 *
 * Utilisé par le watchdog après un reset de la base eSignet, pour que les logins
 * refonctionnent sans perdre les producteurs/livraisons déjà enregistrés sur le disque.
 *
 * Usage : node scripts/ensure-identities.js
 */
require('dotenv').config();
const axios = require('axios');

const MOCK = process.env.MOCK_IDENTITY_URL || 'http://localhost:8082';
const EP = `${MOCK}/v1/mock-identity-system/identity`;

const CHIEFS = [
  { npi: '5000000000000001', g: 'Kokou',  f: 'Agossou',    ph: '+22996000001', loc: 'Parakou',   reg: 'Borgou',  dob: '1980/03/12' },
  { npi: '5000000000000002', g: 'Sèna',   f: 'Ahouansou',  ph: '+22996000002', loc: 'Kandi',     reg: 'Alibori', dob: '1985/07/22' },
  { npi: '5000000000000003', g: 'Bio',    f: 'Tamou',      ph: '+22996000003', loc: 'Banikoara', reg: 'Alibori', dob: '1978/05/03' },
  { npi: '5000000000000004', g: 'Grâce',  f: 'Adandé',     ph: '+22996000004', loc: 'Gogounou',  reg: 'Alibori', dob: '1990/09/14' },
  { npi: '5000000000000005', g: 'Pascal', f: 'Hounkonnou', ph: '+22996000005', loc: 'Nikki',     reg: 'Borgou',  dob: '1982/01/28' }
];

const PRODUCERS = [
  ['1000000000000001','Adjovi','Mensah','+22997000001','Parakou','Borgou','1978/04/10'],
  ['1000000000000002','Koffi','Dossou','+22997000002','Parakou','Borgou','1982/11/05'],
  ['1000000000000003','Amina','Bello','+22997000003','Kandi','Alibori','1990/06/18'],
  ['1000000000000004','Yao','Tchabi','+22997000004','Nikki','Borgou','1975/01/30'],
  ['1000000000000005','Fifamè','Houngbo','+22997000005','Bembèrèkè','Borgou','1988/09/14'],
  ['1000000000000006','Martial','Sossa','+22997000006','Banikoara','Alibori','1983/02/25'],
  ['1000000000000007','Grâce','Adandé','+22997000007','Gogounou','Alibori','1992/12/03'],
  ['1000000000000008','Rachid','Moussa','+22997000008','Kandi','Alibori','1979/08/07'],
  ['1000000000000009','Christelle','Agbossou','+22997000009','Sinendé','Borgou','1986/05/20'],
  ['1000000000000010','Bio','Tamou','+22997000010','Banikoara','Alibori','1973/10/11'],
  ['1000000000000011','Fatimath','Idrissou','+22997000011','Gogounou','Alibori','1991/03/28'],
  ['1000000000000012','Pascal','Hounkonnou','+22997000012','Nikki','Borgou','1980/07/16'],
  ['1000000000000013','Aïssatou','Garba','+22997000013','Kandi','Alibori','1987/11/09'],
  ['1000000000000014','Janvier','Akplogan','+22997000014','Bembèrèkè','Borgou','1976/06/02'],
  ['1000000000000015','Nafiou','Boni','+22997000015','Banikoara','Alibori','1984/01/19']
].map(a => ({ npi: a[0], g: a[1], f: a[2], ph: a[3], loc: a[4], reg: a[5], dob: a[6] }));

function payload(u) {
  const L = v => [{ language: 'eng', value: v }, { language: 'fra', value: v }];
  return { requestTime: new Date().toISOString(), request: {
    individualId: u.npi, pin: '111111',
    email: `${u.g.toLowerCase()}.${u.f.toLowerCase()}@cottonpay.bj`, phone: u.ph,
    fullName: L(`${u.g} ${u.f}`), givenName: L(u.g), familyName: L(u.f),
    dateOfBirth: u.dob, gender: L('Male'),
    encodedPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    streetAddress: L(u.loc), locality: L(u.loc), region: L(u.reg), postalCode: '00229', country: L('BEN')
  }};
}

async function ensure(u) {
  try { await axios.post(EP, payload(u), { headers: { 'Content-Type': 'application/json' } }); return 'ok'; }
  catch (e) {
    const m = e.response?.data?.errors?.[0]?.errorMessage || e.message;
    return /already|duplicate/i.test(m) ? 'exists' : ('ERR:' + m);
  }
}

(async () => {
  let ok = 0, err = 0;
  for (const u of CHIEFS.concat(PRODUCERS)) {
    const r = await ensure(u);
    if (r === 'ERR:') err++; else ok++;
    console.log(`  ${u.npi} ${u.g} ${u.f} -> ${r}`);
  }
  console.log(`ensure-identities: ${ok} ok, ${err} err`);
})();
