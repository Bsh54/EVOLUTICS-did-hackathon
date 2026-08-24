# Plan de travaux — CottonPay v2

> Fichier de cadrage. On liste **quoi faire** avant de coder. On étale, on valide, **ensuite** on code.
> Statut : 🔴 à faire · 🟡 en cours · 🟢 fait

## Avancement refonte (branche `refonte-v2`)
- 🟢 Retrait Mobile Money (créance en suivi manuel dû → réglé)
- 🟢 Menu coop recentré sur la preuve (6 modules roadmap masqués)
- 🟢 Nouvelle identité : bleu institutionnel + ambre, police unique, zéro emoji
- 🟢 Login wallet restylé à la charte
- 🟢 Espace admin d'enrôlement (endpoint `/api/admin` + page `/admin/`, protégé par `ADMIN_KEY`)
- 🟢 Landing restylée à la charte
- 🟡 Refonte visuelle fine du dashboard (layout maquette : hero, stats, cartes registre)
- 🔴 Déploiement serveur 2 + `ADMIN_KEY` dans le `.env`
- 🔴 Test bout-en-bout login wallet (wallet mobile IDS)

---

## 🎯 Cap produit (acté)
**Histoire vendue : « CottonPay rend chaque livraison de coton infalsifiable. »**
La preuve de livraison (e-ID + blockchain) = la démo. Le crédit et les services = la roadmap.
Problème réel visé : tonnages sous-estimés à la pesée (fuite ~10 %) + retards de paiement,
faute de preuve. Le crédit = vision future (on est le rail de confiance, pas le prêteur).

## 🎯 Décisions actées
- **Retirer le Mobile Money** du système (front + back) : on ne sait pas faire de décaissement réel.
- **Démo = 4 écrans focus preuve** : tableau de bord · enregistrer producteur · enregistrer
  livraison (pesée) · reçu blockchain + QR (émission + vérification).
- **Retirer du menu (→ roadmap, code gardé en réserve, PAS supprimé)** :
  Créances · Intrants · Caution · Semences · Mécanisation · AIC.
  → concrètement : enlever ces entrées de la sidebar + bottom-nav (`frontend/coop/index.html`),
    garder les sections/pages et le back en réserve.

---

## 1. 🧹 Retrait du Mobile Money (priorité 1)

### Backend
- 🔴 Supprimer `backend/src/services/momoService.js` (le rail Mobile Money simulé).
- 🔴 Nettoyer `backend/src/services/creanceService.js` :
  - retirer les appels au décaissement MoMo (avance) et au remboursement (règlement).
  - décider ce qu'on garde du **cycle créance** (voir question ouverte plus bas).
- 🔴 Nettoyer `backend/src/services/deliveryService.js` :
  - retirer `transaction_id` alimenté par la dernière transaction MoMo.
  - revoir `payment_status` / `claim_status` (garder un statut simple sans MoMo ?).
- 🔴 Nettoyer les routes dans `backend/src/routes/coop.js` liées aux créances/avance/règlement MoMo.
- 🔴 Retirer toute variable `.env` liée (`MOMO_PROVIDER`, etc.).

### Frontend
- 🔴 `frontend/coop/index.html` : retirer la section paiement du bordereau (statuts DUE/ADVANCED/SETTLED, avance, remboursement, montant reçu producteur).
- 🔴 `frontend/coop/app.js` : retirer les loaders/handlers créance liés au MoMo.
- 🔴 Retirer les clés i18n devenues inutiles (`payTitle`, `stDue`, `stAdvanced`, `stSettled`, `advPaid`, `lender`, `reimb`, `producerReceived`).

### ✅ Décision (tranchée) : suivi manuel de la créance
- On **garde la notion de créance** (dette due / réglée) mais **SANS décaissement automatique**.
- Le chef marque manuellement l'état : **« dû » → « réglé »**. Pas de simulation de paiement, pas de MoMo.
- Concrètement dans le code :
  - `creanceService.js` : garder `listCreances` / `getCreance` / le statut ; retirer `requestAdvance`
    et le décaissement ; remplacer `settle` par un simple **`markSettled`** (change juste le statut, aucune tx).
  - Statuts simplifiés : **DUE → SETTLED** (on supprime `ADVANCED`).
  - `deliveryService.js` : `payment_status` = statut créance (due/settled), **sans** `transaction_id`.
  - Front : garder l'affichage du statut + un bouton « Marquer comme réglé » ; retirer avance/remboursement/montant reçu.

---

## 2. 🛠️ Espace ADMIN d'enrôlement (à préparer)

Aujourd'hui l'enrôlement = script CLI `scripts/issue-member-credentials.js` → pas tenable.
On veut une **vraie page admin + endpoint** pour émettre les credentials nous-mêmes.

- 🔴 **Endpoint back** `POST /admin/enroll` (protégé, admin-only) : reçoit {coop, npi, nom, rôle}
  → appelle `vpAuthService.issueMemberCredential()` → renvoie l'`invitationUrl` (QR).
- 🔴 **Page admin** (accès protégé, séparé de l'espace chef) :
  - formulaire pour saisir/remplir un membre (coop, NPI, nom, rôle) et émettre sa carte ;
  - affichage du **QR d'enrôlement** proprement (au lieu de la sortie console) ;
  - liste des chefs déjà enrôlés.
- 🔴 **Protection d'accès** de cet espace (mot de passe admin / clé). NE JAMAIS exposer l'émission au public.
- 🔴 Garder le script CLI en secours (fallback).

## 3. 📋 Le reste (à préciser plus tard)

- 🔴 Revalider les 7 fonctionnalités filière après le retrait MoMo (aucune ne doit dépendre du MoMo).
- 🔴 Test de bout en bout du login wallet avec le wallet mobile IDS.

---

## 📝 Notes
- On ne touche PAS au cœur MOSIP + blockchain (login wallet, émission de reçus VC).
- Serveur 2 = prod v2 (`cottonpay2.shadrakbessanh.me`). Ne jamais rebooter, ne pas toucher aux autres services.
