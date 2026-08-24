# CottonPay — La preuve infalsifiable de chaque livraison de coton

<p align="center">
  <img src="logo.jpeg" alt="CottonPay Logo" width="180"/>
</p>

CottonPay transforme le bordereau papier de livraison de coton en **preuve numérique infalsifiable**,
grâce à l'**identité nationale (NPI)** et à la **blockchain**. À la pesée, le poids réel est enregistré
et signé, puis gravé sur le registre **BCovrin** : le tonnage ne peut plus être trafiqué, et chaque
producteur bâtit un **historique de confiance** — la base d'un futur accès au crédit.

Le cœur technique combine l'authentification **eSignet (MOSIP)**, l'émission de credentials via
**eidStack** (Hyperledger Aries / AnonCreds) et un **wallet e-ID** mobile (e-IDapp).

---

## Le problème résolu

Au Bénin, le coton représente une part majeure du PIB, mais les producteurs perdent jusqu'à **10 %**
de leurs revenus à cause de **tonnages sous-estimés** à la pesée et de **retards de paiement**, faute
de preuve opposable. CottonPay attaque directement ce problème.

| Sans CottonPay | Avec CottonPay |
| --- | --- |
| Le poids est noté à la main, contestable | Poids signé et scellé sur la blockchain |
| Le producteur n'a aucune preuve | Le producteur repart avec un reçu vérifiable (QR) |
| Invisible pour les banques | Historique de livraisons fiable = crédibilité financière |

---

## Ce que fait la plateforme (v2)

- **Login par wallet e-ID** : le chef de coopérative se connecte en présentant un credential « membre »
  (Verifiable Presentation), sans mot de passe.
- **Enrôlement admin** : un espace admin protégé émet les credentials des chefs et affiche leur QR.
- **Enregistrement de livraison** : producteur + poids réel + qualité → calcul des montants et déductions.
- **Émission d'un reçu blockchain** : un Verifiable Credential signé + QR de preuve.
- **Vérification publique** : n'importe qui (banque, acheteur, union) peut vérifier un reçu via son QR.
- **Suivi de créance manuel** : chaque livraison crée une créance suivie du statut « dû » à « réglé »
  (sans décaissement automatique).
- **Interface bilingue FR / EN** (switch de langue sur toutes les pages).

> Note produit : la version en ligne est recentrée sur **la preuve de livraison**. D'autres modules
> filière (intrants à crédit, caution solidaire, semences, mécanisation, vue AIC) existent dans le
> code en réserve (roadmap) mais sont masqués de l'interface pour garder le parcours focus.

---

## Démo en ligne

- Application : **https://cottonpay2.shadrakbessanh.me**
- Espace coopérative (login wallet) : **/coop/login.html**
- Espace admin (enrôlement) : **/admin/** (protégé par une clé administrateur)

Parcours de démonstration :

1. **Admin** émet le credential d'un chef depuis `/admin/` → un QR d'enrôlement s'affiche.
2. Le chef **scanne ce QR une fois** avec son wallet e-ID pour recevoir sa carte « membre ».
3. Le chef se connecte via **/coop/login.html** (scan de connexion), enregistre une livraison,
   émet le reçu blockchain, et le producteur repart avec son QR de preuve.

---

## Identité visuelle

Charte sobre et institutionnelle : **bleu** (`#2554B0`) pour la marque et les actions, **ambre**
(`#B8863B`) pour signaler la preuve certifiée, fond neutre, une **police unique** classique, **aucun
emoji**. Détails dans `CHARTE-GRAPHIQUE.md`.

---

## Architecture

```
EVOLUTICS-did-hackathon/
├── CottonPay/                 # Application principale
│   ├── frontend/              # Interface (HTML/CSS/JS)
│   │   ├── index.html         #   Landing (preuve, bilingue)
│   │   ├── i18n.js            #   Traduction FR/EN + switch de langue
│   │   ├── coop/              #   Espace coopérative (login wallet + dashboard)
│   │   ├── admin/             #   Espace admin d'enrôlement
│   │   └── verify.html        #   Vérification publique d'un reçu
│   ├── backend/               # API REST Node.js + Express
│   │   └── src/
│   │       ├── routes/        #   auth, coop, admin, verify, identity...
│   │       └── services/      #   vpAuth, delivery, creance, coop, sales...
│   └── scripts/               # Enregistrement OIDC, enrôlement, seed
├── esignet-master/            # Authentification MOSIP (Docker)
├── eidStack-CMU/              # Émission de credentials (NestJS, Aries)
└── e-IDapp_CMU/               # Wallet mobile (React Native)
```

### Services et ports

| Port | Service               | Rôle                              |
| ---- | --------------------- | --------------------------------- |
| 3002 | CottonPay             | Application principale            |
| 4000 | eidStack              | API d'émission / vérification VC  |
| 3021 | Agent DIDComm         | Transport des credentials         |
| 3000 | eSignet UI            | Authentification (enrôlement)     |
| 8088 | eSignet Backend       | API OIDC                          |
| 8082 | Mock Identity         | Registre d'identité de test (NPI) |

---

## Flux techniques

### Login par wallet e-ID (Verifiable Presentation)

```
Chef → /coop/login.html
    ↓ POST /auth/vp-login/start
eidStack crée une demande de preuve → QR
    ↓ le wallet scanne et présente son credential "membre"
    ↓ GET /auth/vp-login/status (polling)
Vérification : le NPI présenté est-il un membre de coopérative ?
    ↓ oui → session ouverte → /coop/
```

### Enrôlement (admin only)

```
Admin → /admin/  (clé ADMIN_KEY)
    ↓ POST /api/admin/enroll { npi, name, cooperative_id, role }
vpAuthService → POST eidStack /issuance/offer
    ↓ invitationUrl + QR renvoyés et affichés
Le chef scanne une fois → reçoit sa carte "membre" dans son wallet
```

### Émission d'un reçu de livraison

```
Chef → enregistre une livraison (producteur, poids, qualité)
    ↓ POST eidStack /issuance/offer (attributs du reçu)
eidStack signe le credential sur BCovrin → QR
    ↓ le producteur scanne → reçu stocké dans son wallet
Preuve infalsifiable, vérifiable par tous
```

---

## Installation locale (développement)

### Prérequis

- Windows 10/11 avec WSL 2, ou Linux
- Docker (20.10+), Node.js 18+, Git

### Démarrage rapide

```bash
git clone https://github.com/Bsh54/EVOLUTICS-did-hackathon.git
cd EVOLUTICS-did-hackathon
./install.sh      # prérequis, réseau Docker mosip_network, deps, .env, dossiers
./start.sh        # conteneurs eSignet, client OIDC, backend CottonPay
```

Application locale : **http://localhost:3002**

Pour eidStack (émission de credentials, dans WSL Ubuntu) : voir `install-eidstack.sh` et
`setup-agent.sh` (enregistrement du DID **ENDORSER** sur http://test.bcovrin.vonx.io/ puis
initialisation de l'agent SSI).

### Variable d'environnement admin

L'espace d'enrôlement `/admin/` est protégé par une clé, définie dans le `.env` :

```
ADMIN_KEY=<votre-cle-admin>
```

---

## Déploiement

L'application tourne sous **PM2** derrière un tunnel Cloudflare. Les fichiers modifiés sont poussés
vers le serveur puis le service est redémarré :

```
pm2 restart cottonpay-v2 --update-env
```

> Les scripts de déploiement contiennent des identifiants serveur et **ne sont pas versionnés**
> (voir `.gitignore`). Ne jamais committer de secrets.

---

## Ressources

- Vision produit : `VISION-PRODUIT.md`
- Plan de travaux : `PLAN-TRAVAUX-V2.md`
- Charte graphique : `CHARTE-GRAPHIQUE.md`
- Démo vidéo : https://youtu.be/4Qb5R3kSnQI
- Présentation : https://youtu.be/TbJYOXCMzmM

---

## Équipe

Team EVOLUTICS — Université d'Abomey-Calavi (UAC)
