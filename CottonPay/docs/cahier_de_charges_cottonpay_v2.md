# CAHIER DE CHARGES — CottonPay v2

> **Plateforme de Certification Numérique des Livraisons de Coton**
> Identité Décentralisée × Credentials Vérifiables × Mobile Money

---

| | |
|---|---|
| **Projet** | CottonPay — Module de l'écosystème EVOLUTICS Digital ID |
| **Version** | 2.0 |
| **Date** | Mai 2026 |
| **Équipe** | Team EVOLUTICS — Université d'Abomey-Calavi (UAC), Bénin |
| **Cadre** | Africa Digital ID Hackathon 2026 (ID4Africa × CMU Africa × MSC) |
| **Finalité** | Continental Finals — ID4Africa AGM, Abidjan, 12-15 mai 2026 |

---

## Table des Matières

1. [Contexte Général](#1-contexte-général)
2. [Le Problème — Storytelling](#2-le-problème--storytelling)
3. [Chiffres Clés — L'ampleur du problème](#3-chiffres-clés--lampleur-du-problème)
4. [La Solution CottonPay](#4-la-solution-cottonpay) *(→ Partie 2)*
5. [Architecture Technique](#5-architecture-technique) *(→ Partie 2)*
6. [Spécifications Fonctionnelles](#6-spécifications-fonctionnelles) *(→ Partie 2)*
7. [Justification des Choix Techniques](#7-justification-des-choix-techniques) *(→ Partie 3)*
8. [Planning & Livrables](#8-planning--livrables) *(→ Partie 3)*

---

## 1. Contexte Général

### 1.1. Le coton au Bénin : un pilier économique

Le coton est surnommé **« l'or blanc »** du Bénin. Il n'est pas qu'une simple culture agricole : il est le moteur économique de tout le nord du pays et la première source de devises d'exportation de la nation.

**En chiffres (campagne 2024-2025) :**

| Indicateur | Valeur | Source |
|---|---|---|
| Production nationale | **637 063 tonnes** de coton graine | [Xinhua / news.cn](https://news.cn) |
| Rang en Afrique de l'Ouest | **1er producteur** (devant le Mali) | [CIRAD](https://cirad.fr) |
| Part dans le PIB | **6 à 13%** du PIB national | [La Marina BJ](https://lamarinabj.com) |
| Recettes d'exportation | ~**50%** des exportations totales | [Kdaara TV](https://kdaaratv.bj) |
| Nombre de producteurs | **500 000+** personnes | AIC — Association Interprofessionnelle du Coton |
| Surface moyenne par producteur | **< 2 hectares** | AIC |
| Rendement moyen | **1 198 kg/ha** (record 2024-2025) | [Xinhua](https://xinhuanet.com) |

> **Ce que cela signifie concrètement :** Plus d'un demi-million de familles béninoises dépendent directement du coton pour vivre. Quand le système de paiement du coton dysfonctionne, ce sont des millions de personnes qui souffrent.

### 1.2. Comment fonctionne la filière coton ?

Pour comprendre le problème que CottonPay résout, il faut d'abord comprendre comment le coton voyage du champ jusqu'au paiement du producteur. Voici le parcours, expliqué simplement :

```
🌱 JUIN         Le producteur sème le coton
                 (il a reçu engrais et insecticides À CRÉDIT via sa coopérative)

🌿 JUIL-SEPT    Le coton pousse, le producteur traite et entretient

🌾 OCT-NOV      Récolte manuelle, capsule par capsule

📦 OCT-MARS     COMMERCIALISATION : le producteur amène son coton
                 au marché de collecte organisé par sa coopérative (CVPC)

⚖️  AU MARCHÉ    Le coton est pesé, classé (1er ou 2ème choix),
                 et un BORDEREAU PAPIER est remis au producteur

🚛 ÉVACUATION   Des camions transportent le coton vers les usines d'égrenage

🏭 ÉGRENAGE     L'usine transforme le coton graine en fibre exportable

💰 MARS-JUIN    Le producteur est ENFIN payé
                 (après déduction du crédit intrants)
```

**Les acteurs clés :**

| Acteur | Rôle | Analogie simple |
|---|---|---|
| **Producteur** | Cultive et livre le coton | L'employé qui fait le travail |
| **CVPC** (Coopérative Villageoise) | Organise la collecte, distribue les intrants | Le chef d'équipe local |
| **AIC** (Association Interprofessionnelle) | Coordonne toute la filière, fixe les prix | Le directeur général |
| **CSPR** (Centrale de Paiements) | Gère les flux d'argent | Le comptable / la banque |
| **Égreneur** | Achète et transforme le coton | L'usine / le client final |

### 1.3. Le cadre réglementaire

| Texte / Institution | Ce qu'il impose |
|---|---|
| **ANIP** — Agence Nationale d'Identification | Le NPI (Numéro Personnel d'Identification) est obligatoire pour tout citoyen béninois. C'est la base de l'identité numérique. Source : [anip.bj](https://anip.bj) |
| **SNIF 2023-2027** — Stratégie Nationale d'Inclusion Financière | Objectif : passer de 69% (2016) à 90%+ (2026) d'inclusion financière. Source : [spsnif.gouv.bj](https://spsnif.gouv.bj) |
| **Homologation annuelle des prix** | Le Conseil des Ministres fixe les prix : 300 FCFA/kg (1er choix), 250 FCFA/kg (2ème choix) pour 2025-2026. |
| **Loi sur les organisations professionnelles agricoles** | Encadre la création et le fonctionnement des CVPC. |

---

## 2. Le Problème — Storytelling

### 2.1. L'histoire de Kodjo

> *Kodjo Mensah a 42 ans. Il cultive du coton à Banikoara, dans le nord du Bénin, depuis qu'il a 18 ans. Chaque année, c'est la même histoire.*

**Octobre 2025.** Kodjo a travaillé pendant 5 mois. Il a semé, désherbé, traité, et récolté à la main — capsule par capsule — ses 2 hectares de coton. Au total : **500 kg de coton graine**.

Il amène sa récolte au **marché de collecte** organisé par sa coopérative (la CVPC de Banikoara-Centre). Son coton est pesé sur une balance mécanique. Un agent de classement l'évalue : **1er choix**. Le secrétaire de la CVPC note dans un registre papier :

```
Nom : Kodjo Mensah
NPI : 1234567890123456
Poids : 500 kg
Qualité : 1er choix
Date : 15/10/2025
```

Kodjo reçoit un **bordereau de livraison** — une feuille de papier manuscrite. C'est sa **seule preuve** qu'il a livré 500 kg de coton.

**Novembre 2025.** Kodjo a besoin d'argent. Ses enfants doivent payer les frais scolaires (25 000 FCFA). Sa femme est malade (15 000 FCFA de médicaments). Il n'a plus de nourriture stockée.

Il va voir la **banque**. La réponse est toujours la même :

> *« Monsieur Mensah, nous ne pouvons pas vous accorder de crédit. Vous n'avez pas d'historique bancaire, pas de garantie, et votre bordereau papier n'est pas une preuve recevable. »*

Kodjo se tourne alors vers **Mama Adjovi**, une prêteuse informelle du village. Elle lui prête **50 000 FCFA** — mais à un taux effectif de **100% sur 4 mois**.

**Mars 2026.** Le paiement du coton arrive enfin. Voici le calcul :

```
Revenu brut :     500 kg × 300 FCFA     = 150 000 FCFA
Crédit intrants :  (engrais + pesticides) = - 45 000 FCFA
Prélèvement AIC : 500 × 18 FCFA         = -  9 000 FCFA
                                           ─────────────
Montant net CSPR :                        =  96 000 FCFA
Remboursement Mama Adjovi :               = -100 000 FCFA
                                           ─────────────
RESTE POUR KODJO :                        =  - 4 000 FCFA ❌
```

**Kodjo a travaillé 10 mois. Il finit endetté de 4 000 FCFA.**

Et le cycle recommence l'année suivante.

### 2.2. Ce n'est pas un cas isolé

L'histoire de Kodjo est celle de **centaines de milliers de producteurs** au Bénin. Le problème n'est pas le prix du coton ni la productivité — les deux sont en hausse. Le problème est **structurel** :

```
┌─────────────────────────────────────────────────────┐
│                LE CERCLE VICIEUX                     │
│                                                      │
│  Livraison  ──→  Bordereau papier  ──→  Pas de       │
│  du coton        (non vérifiable)      preuve pour    │
│                                        les banques    │
│      ↑                                     │         │
│      │                                     ↓         │
│  Endettement ←── Prêteur informel ←── Refus de      │
│  accru           (taux 50-100%)       crédit formel  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 2.3. Les 4 failles du système actuel

| # | Faille | Conséquence |
|---|---|---|
| **1** | **Le bordereau est en papier** — il est manuscrit, falsifiable, perdable | Le producteur n'a aucune preuve fiable de sa livraison |
| **2** | **Le registre de la CVPC est en papier** — il peut être modifié, perdu, détruit | Aucune traçabilité vérifiable des transactions |
| **3** | **Les écarts de poids** entre le marché et l'usine ne sont pas contestables | Le producteur perd du revenu sans recours |
| **4** | **Pas d'identité numérique vérifiable** pour le producteur | Invisible pour les banques et services financiers |

---

## 3. Chiffres Clés — L'ampleur du problème

### 3.1. Identité numérique en Afrique

| Indicateur | Valeur | Source |
|---|---|---|
| Personnes sans identité officielle dans le monde | **800 millions** (dont >50% en Afrique subsaharienne) | [Banque Mondiale — ID4D, 2024](https://id4d.worldbank.org/) |
| Couverture d'identité fondamentale en Afrique subsaharienne | ~**80%** des adultes | [Banque Mondiale — ID4D](https://worldbank.org) |
| Adultes sans ID qui ne peuvent pas acheter une carte SIM | **41%** | [Banque Mondiale — Global Findex](https://worldbank.org) |
| Adultes non bancarisés à cause du manque d'ID (Afrique de l'Ouest) | **>30%** | [Banque Mondiale](https://worldbank.org) |
| Adultes recevant des paiements agricoles en cash en Afrique | **140 millions** | [Banque Mondiale — Global Findex](https://worldbank.org) |

### 3.2. Inclusion financière au Bénin

| Indicateur | 2016 | 2024 | Source |
|---|---|---|---|
| Taux d'inclusion financière | 69% | ~90% | [wadagni.bj](https://wadagni.bj) / SNIF |
| Taux de bancarisation élargi | 63% | 87% | [wadagni.bj](https://wadagni.bj) |

> **Attention** : ces chiffres masquent une réalité rurale. En zone cotonnière (Borgou, Alibori, Atacora), le taux de bancarisation réel des producteurs reste significativement inférieur à la moyenne nationale.

### 3.3. Mobile Money en Afrique (2024)

| Indicateur | Valeur | Source |
|---|---|---|
| Comptes mobile money en Afrique subsaharienne | **1,1 milliard** | [GSMA, 2024](https://gsma.com) |
| Volume de transactions mobile money en Afrique | **>1 000 milliards $** | [GSMA / Forbes Africa](https://forbesafrica.com) |
| Contribution au PIB de l'Afrique subsaharienne | **~190 milliards $** | [Daba Finance](https://dabafinance.com) |

> **Ce que cela signifie :** L'infrastructure mobile money EXISTE déjà. Le problème n'est pas l'absence de technologie de paiement — c'est l'absence de **preuve vérifiable** de ce que le producteur a livré, qui empêche son accès aux services financiers.

---

*→ Suite dans [Partie 2](./cahier_de_charges_cottonpay_part2.md) : Solution, Architecture, Spécifications fonctionnelles*


---

# CAHIER DE CHARGES — CottonPay v2 (Partie 2/3)

> *Suite de la [Partie 1](./cahier_de_charges_cottonpay_part1.md)*

---

## 4. La Solution CottonPay

### 4.1. Vision

**CottonPay** transforme le bordereau papier en un **credential numérique infalsifiable**, stocké dans le portefeuille numérique (wallet) du producteur, et vérifiable par quiconque — banques, coopératives, institutions.

> **En une phrase :** CottonPay donne au producteur de coton une preuve numérique, souveraine et vérifiable de chaque kilogramme qu'il a livré.

### 4.2. Ce que CottonPay fait concrètement

```
AVANT CottonPay                        AVEC CottonPay
─────────────────                       ──────────────────

📝 Bordereau papier manuscrit     →     📱 Credential numérique signé
   (falsifiable, perdable)                 (infalsifiable, permanent)

📓 Registre CVPC sur cahier       →     💻 Dashboard coopérative en ligne
   (modifiable après coup)                 (horodaté, tracé, non-répudiable)

❌ Pas de preuve pour la banque   →     ✅ Profil vérifiable par QR code
                                           (historique de livraisons certifié)

❌ Identité invérifiable          →     ✅ Authentification via NPI/eSignet
                                           (identité nationale vérifiée)
```

### 4.3. Positionnement dans la chaîne existante

CottonPay **ne remplace aucun acteur**. Il s'insère dans le processus existant pour le numériser :

```
                    Processus actuel (inchangé)
                    ────────────────────────────
Producteur → amène son coton → pesée → classement qualité
                                          │
                              ┌────────────┤
                              │  AVANT     │  AVEC CottonPay
                              │            │
                              │  Registre  │  Le représentant CVPC
                              │  papier    │  ouvre CottonPay sur son
                              │  CVPC      │  téléphone/ordinateur
                              │            │
                              │  Bordereau │  → Se connecte via eSignet
                              │  papier au │  → Saisit NPI producteur
                              │  producteur│  → Enregistre poids + qualité
                              │            │  → Transaction certifiée
                              │            │  → QR code généré
                              │            │  → Producteur scanne
                              │            │  → Credential dans son wallet
                              └────────────┘
```

### 4.4. Les 3 espaces de CottonPay

| Espace | Utilisateur | Fonction |
|---|---|---|
| **Espace Coopérative** | Représentant CVPC (président/secrétaire) | Enregistrer les livraisons, gérer les producteurs, émettre les credentials |
| **Espace Producteur** | Producteur de coton | Consulter son historique, ses credentials, son profil |
| **Vérification Publique** | Banques, assureurs, tiers | Vérifier l'authenticité d'un producteur et son historique via NPI |

---

## 5. Architecture Technique

### 5.1. Vue d'ensemble

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  NAVIGATEUR  │────▶│  CottonPay       │────▶│  eSignet/MOSIP   │
│  (Utilisat.) │◀────│  Backend (3002)  │◀────│  (Auth OIDC)     │
└──────────────┘     │                  │     │  - eSignet (8088) │
                     │  Express.js      │     │  - eSignet UI     │
                     │  + Sessions      │     │    (3000)         │
                     │  + JSON Data     │     │  - Mock Identity  │
                     └───────┬──────────┘     │    (8082)         │
                             │                │  - Redis (6379)   │
                             │                │  - Postgres (5455)│
                             ▼                └──────────────────┘
                     ┌──────────────────┐
                     │  eidStack-CMU    │
                     │  (Agent SSI)     │
                     │  Port 4000       │
                     │                  │
                     │  - Hyperledger   │
                     │    Aries         │
                     │  - BCovrin       │
                     │    (Testnet)     │
                     │  - DIDComm v2    │
                     └──────────────────┘
```

### 5.2. Composants détaillés

#### A. Frontend (Navigateur web)

Ce que voit l'utilisateur. Aucune installation requise — un simple navigateur suffit.

| Page | Fichier | Fonction |
|---|---|---|
| Page d'accueil | `index.html` | Présentation, liens de connexion, vérification publique |
| Espace Coopérative | `coop/index.html` + `coop/app.js` | Dashboard coopérative, enregistrement livraisons |
| Espace Producteur | `producer/index.html` + `producer/app.js` | Profil, historique, credentials |
| Vérification publique | `verify.html` | Vérification d'un producteur par son NPI |

#### B. Backend (Serveur Node.js — Port 3002)

Le « cerveau » de l'application. Il traite les demandes et orchestre les services.

| Module | Fichier | Rôle |
|---|---|---|
| Authentification | `routes/auth.js` | Flux OIDC avec eSignet (login, callback, logout) |
| Coopérative | `routes/coop.js` | API de gestion des livraisons et producteurs |
| Vérification | `routes/verify.js` | API de vérification publique par NPI |
| Middleware auth | `middleware/auth.js` | Vérification des rôles (coop vs producteur) |
| Service auth | `services/authService.js` | Échange de tokens, validation JWT |
| Service coop | `services/coopService.js` | Logique métier coopérative |
| Service delivery | `services/deliveryService.js` | Gestion des livraisons |
| Service identity | `services/identityService.js` | Résolution NPI, vérification OTP |

#### C. Infrastructure d'Identité (Docker — eSignet/MOSIP)

5 conteneurs Docker qui simulent un système d'identité nationale :

| Conteneur | Port | Rôle |
|---|---|---|
| **esignet** | 8088 | Serveur OIDC — gère l'authentification |
| **esignet-ui** | 3000 | Interface de connexion (saisie NPI + OTP) |
| **mock-identity-system** | 8082 | Simule le registre national d'identité (ANIP) |
| **postgres** | 5455 | Base de données d'eSignet |
| **redis** | 6379 | Cache de sessions eSignet |

#### D. Agent SSI — eidStack-CMU (Port 4000)

C'est le composant qui émet les **credentials vérifiables** (preuves numériques).

| Fonction | Détail |
|---|---|
| Émission de credentials | Crée un credential signé pour chaque livraison |
| QR code | Génère un QR code scannable par le wallet du producteur |
| Blockchain | Les schémas de credentials sont ancrés sur BCovrin (testnet Hyperledger Indy) |
| DIDComm | Communication sécurisée avec le wallet mobile |

### 5.3. Flux d'authentification OIDC (étape par étape)

Ce flux est celui utilisé par les banques, les gouvernements, et les grandes entreprises pour authentifier leurs utilisateurs de manière sécurisée. Voici comment il fonctionne dans CottonPay :

```
Étape 1 : L'utilisateur clique sur « Se connecter »
          ↓
Étape 2 : CottonPay génère un code secret temporaire (PKCE)
          et redirige vers eSignet
          ↓
Étape 3 : L'utilisateur saisit son NPI dans eSignet
          ↓
Étape 4 : eSignet envoie un OTP (code à usage unique)
          sur le téléphone de l'utilisateur
          ↓
Étape 5 : L'utilisateur saisit l'OTP
          ↓
Étape 6 : eSignet vérifie l'identité et renvoie un « code
          d'autorisation » à CottonPay
          ↓
Étape 7 : CottonPay échange ce code contre un « jeton d'accès »
          (en prouvant son identité avec sa clé privée RSA)
          ↓
Étape 8 : CottonPay récupère les informations de l'utilisateur
          et le redirige vers son espace (Coop ou Producteur)
```

> **Pourquoi ce flux est sécurisé :** À aucun moment CottonPay ne voit le mot de passe ou les données biométriques de l'utilisateur. Seul eSignet (le système national) vérifie l'identité. CottonPay reçoit uniquement une confirmation : « oui, cette personne est bien qui elle dit être ».

---

## 6. Spécifications Fonctionnelles

### 6.1. Espace Coopérative

**Qui l'utilise :** Le président ou le secrétaire de la CVPC (coopérative villageoise).

**Comment y accéder :** Se connecter via eSignet avec un NPI enregistré comme membre de coopérative.

#### Fonctionnalités :

| Fonction | Description | Priorité |
|---|---|---|
| **Dashboard** | Vue d'ensemble : nombre de producteurs, total livré, livraisons récentes | Haute |
| **Enregistrer une livraison** | Saisir NPI producteur + poids (kg) + qualité (1er/2ème choix). Vérifie que le producteur existe via eSignet/Mock Identity. Calcule automatiquement le montant. | Haute |
| **Liste des producteurs** | Tous les producteurs affiliés à la coopérative avec leur historique | Haute |
| **Vérifier un producteur** | Entrer un NPI pour voir le profil et l'historique d'un producteur | Moyenne |
| **Émission de credential** | Après validation d'une livraison, génère un QR code que le producteur peut scanner pour recevoir son credential dans son wallet | Haute |

#### Règles métier :

- Le prix est fixé automatiquement : **300 FCFA/kg** (1er choix) ou **265 FCFA/kg** (2ème choix)
- Le total est calculé : `poids × prix`
- Chaque livraison reçoit un **ID unique** auto-incrémenté (ex: `LIV-001`)
- L'horodatage est automatique et non modifiable
- Le NPI du représentant CVPC est tracé (qui a enregistré)

### 6.2. Espace Producteur

**Qui l'utilise :** Le producteur de coton individuel.

**Comment y accéder :** Se connecter via eSignet avec un NPI enregistré comme producteur.

#### Fonctionnalités :

| Fonction | Description | Priorité |
|---|---|---|
| **Mon profil** | Nom, NPI, coopérative d'affiliation | Haute |
| **Mes livraisons** | Historique complet avec dates, poids, qualité, montants | Haute |
| **Mes credentials** | Liste des credentials numériques reçus (avec QR codes) | Haute |
| **Mon résumé** | Total livré cette campagne, total payé, nombre de livraisons | Moyenne |

### 6.3. Vérification Publique

**Qui l'utilise :** N'importe qui — banques, assureurs, acheteurs, institutions.

**Comment y accéder :** Aucune connexion requise. Accessible depuis la page d'accueil.

#### Fonctionnalités :

| Fonction | Description | Priorité |
|---|---|---|
| **Vérifier par NPI** | Entrer un NPI à 16 chiffres pour voir le profil vérifié du producteur | Haute |
| **Validation OTP** | Le producteur reçoit un OTP sur son téléphone et doit le valider pour autoriser la consultation | Haute |
| **Résultat** | Affiche : nom, coopérative, historique de livraisons, total livré | Haute |

> **Pourquoi un OTP ?** C'est le **consentement du producteur**. Personne ne peut consulter son profil sans son accord explicite. C'est un principe fondamental de protection des données.

### 6.4. Flux de la livraison — Du champ au credential

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX DE LIVRAISON CottonPay                  │
│                                                                  │
│  1. Le producteur amène son coton au marché de collecte         │
│                        │                                         │
│  2. Le rep. CVPC ouvre CottonPay (Espace Coopérative)           │
│     et se connecte via eSignet avec son NPI                     │
│                        │                                         │
│  3. Il saisit le NPI du producteur                              │
│     → CottonPay vérifie l'identité via Mock Identity/eSignet   │
│     → Le producteur valide par OTP (111111 en test)             │
│                        │                                         │
│  4. Il saisit le poids et la qualité du coton                   │
│     → CottonPay calcule le montant automatiquement              │
│                        │                                         │
│  5. Il valide la livraison                                      │
│     → La transaction est horodatée et enregistrée               │
│     → Un ID unique est attribué (LIV-XXX)                       │
│                        │                                         │
│  6. CottonPay envoie la livraison à l'agent SSI (eidStack)     │
│     → Un credential vérifiable est créé                         │
│     → Un QR code est généré                                     │
│                        │                                         │
│  7. Le producteur scanne le QR code avec son wallet mobile      │
│     → Le credential est stocké dans son téléphone               │
│     → Il possède désormais une preuve INFALSIFIABLE              │
│                        │                                         │
│  8. Plus tard, une banque peut vérifier via « Vérification      │
│     Publique » → NPI + OTP → historique certifié affiché        │
└─────────────────────────────────────────────────────────────────┘
```

---

*→ Suite dans [Partie 3](./cahier_de_charges_cottonpay_part3.md) : Justification des choix techniques, Planning, Livrables*


---

# CAHIER DE CHARGES — CottonPay v2 (Partie 3/3)

> *Suite de la [Partie 2](./cahier_de_charges_cottonpay_part2.md)*

---

## 7. Justification des Choix Techniques

Chaque choix technologique de CottonPay répond à une **exigence concrète du terrain**. Aucune technologie n'a été choisie « parce qu'elle est à la mode » — chacune résout un problème spécifique.

### 7.1. Pourquoi eSignet / MOSIP pour l'authentification ?

| Critère | Pourquoi eSignet | Alternative rejetée |
|---|---|---|
| **Identité nationale** | eSignet est conçu pour s'interfacer avec les registres nationaux d'identité (comme l'ANIP au Bénin). Il utilise le NPI, le même numéro que celui sur la carte d'identité du producteur. | *Login/mot de passe classique* → Le producteur n'a pas d'adresse email. Il a un NPI. |
| **Standard OIDC** | eSignet implémente OpenID Connect, le même protocole utilisé par Google, Facebook, et les banques mondiales. C'est un standard prouvé, audité, sécurisé. | *Authentification maison* → Risque de failles de sécurité, pas de crédibilité institutionnelle. |
| **Souveraineté** | MOSIP est open-source et conçu pour les gouvernements africains. Les données restent dans le pays. | *Auth0, Firebase Auth* → Serveurs aux USA/Europe, dépendance à un fournisseur privé. |
| **Vérification OTP** | L'authentification par SMS/OTP fonctionne même sur un téléphone basique (pas besoin de smartphone). | *Biométrie seule* → Nécessite un lecteur d'empreintes, irréaliste en milieu rural. |
| **Open source** | Licence MIT. Aucun coût de licence, audit possible, communauté active. Source : [esignet.io](https://esignet.io) | *Solutions propriétaires* → Coût prohibitif pour un pays en développement. |

### 7.2. Pourquoi les Credentials Vérifiables (Hyperledger Aries) ?

> **Qu'est-ce qu'un credential vérifiable ?** C'est l'équivalent numérique d'un document officiel tamponné. Comme un diplôme ou un acte de naissance, mais impossible à falsifier car signé cryptographiquement.

| Critère | Pourquoi Aries/VCs | Alternative rejetée |
|---|---|---|
| **Infalsifiabilité** | Un credential signé cryptographiquement ne peut pas être modifié. Si quelqu'un change un seul chiffre (par ex. le poids), la signature devient invalide. | *PDF ou reçu imprimé* → Facilement modifiable avec n'importe quel logiciel. |
| **Souveraineté du producteur** | Le credential est stocké dans le wallet du producteur (son téléphone). Personne d'autre ne le contrôle — ni la coopérative, ni l'État, ni CottonPay. | *Base de données centralisée* → Si le serveur tombe, toutes les preuves sont perdues. Le producteur dépend d'un tiers. |
| **Vérification hors-ligne** | Une fois dans le wallet, le credential peut être présenté et vérifié sans connexion internet. | *API centralisée* → Nécessite internet à chaque vérification, irréaliste en zone rurale. |
| **Standard international** | Conforme aux standards W3C Verifiable Credentials et DIDComm v2, reconnus mondialement. | *Format propriétaire* → Pas interopérable, pas reconnu par les institutions internationales. |
| **Ancrage blockchain** | Les schémas sont ancrés sur BCovrin (Hyperledger Indy), un registre public et immuable. | *Pas de blockchain* → Aucune garantie que le schéma n'a pas été modifié après coup. |

### 7.3. Pourquoi Node.js / Express pour le backend ?

| Critère | Pourquoi Node.js | Avantage concret |
|---|---|---|
| **Écosystème npm** | Bibliothèques `jose` (JWT), `axios` (HTTP), `express-session` disponibles et maintenues | Développement rapide, moins de code à écrire |
| **JavaScript partout** | Même langage frontend et backend → un seul développeur peut travailler sur tout | Équipe réduite (contexte hackathon) |
| **Performance I/O** | Node.js excelle dans les opérations d'entrée/sortie (appels API, requêtes réseau) | CottonPay fait beaucoup d'appels à eSignet et eidStack |
| **Déploiement simple** | Un seul serveur sert le frontend ET le backend | Pas besoin d'infrastructure complexe |

### 7.4. Pourquoi le stockage JSON (et pas une base de données) ?

| Critère | Justification |
|---|---|
| **Simplicité** | Pour un prototype/MVP de hackathon, les fichiers JSON sont plus rapides à mettre en place qu'une base PostgreSQL ou MongoDB |
| **Portabilité** | Les données sont de simples fichiers texte, faciles à inspecter, sauvegarder, et transporter |
| **Évolutivité prévue** | En production, ces fichiers seraient remplacés par une base de données relationnelle. L'architecture en services (`coopService.js`, `deliveryService.js`) est conçue pour que ce remplacement soit transparent |

### 7.5. Pourquoi Docker pour l'infrastructure d'identité ?

| Critère | Justification |
|---|---|
| **Reproductibilité** | `docker compose up -d` lance l'infrastructure complète en une commande. Tout le jury peut reproduire la démo. |
| **Isolation** | Chaque service (eSignet, Postgres, Redis, Mock Identity) tourne dans son propre conteneur sans conflits |
| **Simulation réaliste** | Le Mock Identity System simule fidèlement le comportement d'un registre national d'identité |

---

## 8. Exigences Non-Fonctionnelles

### 8.1. Sécurité

| Exigence | Implémentation |
|---|---|
| Authentification forte | OIDC avec PKCE + OTP (double facteur) |
| Protection CSRF | State parameter + nonce dans le flux OIDC |
| Non-répudiation | Chaque action est signée par l'identité de l'utilisateur (NPI) |
| Chiffrement des clés | Clés RSA 2048 bits, stockées côté serveur uniquement |
| Sessions sécurisées | Cookies HttpOnly, Secure en production, durée 24h |
| Consentement | Vérification publique nécessite l'OTP du producteur |

### 8.2. Performance

| Exigence | Cible |
|---|---|
| Temps de réponse API | < 2 secondes |
| Temps de chargement page | < 3 secondes |
| Disponibilité | 99% (hors maintenance planifiée) |

### 8.3. Accessibilité

| Exigence | Justification |
|---|---|
| Interface responsive | Utilisable sur téléphone, tablette, et ordinateur |
| Polices lisibles | Raleway + Lora, tailles adaptées |
| Couleurs contrastées | Palette verte (coton) avec contrastes WCAG AA |
| Pas de dépendance JavaScript complexe | Vanilla JS, pas de framework lourd |

---

## 9. Planning de Développement

### 9.1. Phases du projet

| Phase | Période | Livrables |
|---|---|---|
| **Phase 1 — Idéation** | Déc 2025 – Fév 2026 | Cahier de charges, maquettes, architecture |
| **Phase 2 — Prototype** | Fév – Mars 2026 | MVP fonctionnel (auth + dashboard + livraisons) |
| **Phase 3 — Semi-finales** | Mars – Avril 2026 | Démo régionale, retours mentors, corrections |
| **Phase 4 — Finalisation** | Avril – Mai 2026 | Credential SSI, vérification publique, polish UI |
| **Phase 5 — Finale** | 12-15 Mai 2026 | Présentation ID4Africa AGM, Abidjan |

### 9.2. Livrables

| Livrable | Format | Description |
|---|---|---|
| Code source | Git (GitHub) | Monorepo `EVOLUTICS_DIGITAL_ID` |
| Documentation | Markdown | README, Cahier de charges, Guide de déploiement |
| Vidéo de démonstration | MP4 | Walkthrough du flux complet |
| Présentation | Slides | Pitch pour le jury (5-10 min) |
| Infrastructure | Docker Compose | Stack complète reproductible |
| Script de démarrage | `start.sh` | Démarrage en une commande |

---

## 10. Risques Identifiés et Mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| eSignet retourne un PPID hashé au lieu du NPI | Haute | Bloquant | Pré-capture du NPI côté client + claims OIDC explicites |
| Modules natifs incompatibles (eidStack sur Windows) | Haute | Moyen | eidStack en WSL/Linux ; fallback sans credential SSI |
| Internet instable en zone rurale | Haute | Moyen | Mode offline prévu ; credentials utilisables hors-ligne |
| Producteur sans smartphone | Haute | Moyen | Reçu papier avec QR pour scan différé ; canal USSD envisagé |
| Concurrence d'un acteur institutionnel (CSPR numérique) | Moyenne | Fort | CottonPay est complémentaire, pas concurrent de la CSPR |

---

## 11. Glossaire

| Terme | Définition simple |
|---|---|
| **NPI** | Numéro Personnel d'Identification — le numéro unique de chaque citoyen béninois, attribué par l'ANIP |
| **OIDC** | OpenID Connect — un protocole standardisé pour vérifier l'identité d'une personne en ligne |
| **PKCE** | Proof Key for Code Exchange — une protection supplémentaire contre le vol de codes d'authentification |
| **PPID** | Pairwise Pseudonymous Identifier — un identifiant hashé qu'eSignet utilise au lieu du NPI réel |
| **Credential Vérifiable** | Un document numérique signé cryptographiquement, impossible à falsifier |
| **Wallet** | Un portefeuille numérique (application mobile) qui stocke les credentials du producteur |
| **SSI** | Self-Sovereign Identity — identité auto-souveraine, où l'utilisateur contrôle ses propres données |
| **DIDComm** | Un protocole de communication sécurisé entre wallets et agents d'identité |
| **BCovrin** | Un réseau blockchain de test (Hyperledger Indy) utilisé pour ancrer les schémas de credentials |
| **CVPC** | Coopérative Villageoise des Producteurs de Coton — l'organisation locale des producteurs |
| **AIC** | Association Interprofessionnelle du Coton — l'organe central qui coordonne toute la filière |
| **CSPR** | Centrale de Sécurisation des Paiements et de Recouvrement — gère tous les flux financiers |
| **FCFA** | Franc CFA — la monnaie utilisée au Bénin (1 EUR ≈ 656 FCFA) |
| **OTP** | One-Time Password — un code à usage unique envoyé par SMS pour vérifier l'identité |

---

## 12. Références

| # | Source | URL |
|---|---|---|
| 1 | Banque Mondiale — ID4D (identité numérique) | [id4d.worldbank.org](https://id4d.worldbank.org/) |
| 2 | Banque Mondiale — Global Findex (inclusion financière) | [worldbank.org/globalfindex](https://www.worldbank.org/en/publication/globalfindex) |
| 3 | GSMA — State of Mobile Money 2024 | [gsma.com](https://www.gsma.com/mobilemoneymetrics/) |
| 4 | ANIP Bénin — Agence Nationale d'Identification | [anip.bj](https://anip.bj) |
| 5 | SNIF 2023-2027 — Inclusion financière Bénin | [spsnif.gouv.bj](https://spsnif.gouv.bj) |
| 6 | MOSIP — Plateforme d'identité open source | [mosip.io](https://mosip.io) |
| 7 | eSignet — Middleware OIDC | [esignet.io](https://esignet.io) |
| 8 | Hyperledger Aries — Identité décentralisée | [hyperledger.org/projects/aries](https://www.hyperledger.org/projects/aries) |
| 9 | ID4Africa / CMU Africa — Hackathon 2026 | [digitalidinnovations.com](https://digitalidinnovations.com) |
| 10 | Xinhua — Production coton Bénin 2024-2025 | [news.cn](https://news.cn) |
| 11 | CIRAD — Filière coton Afrique de l'Ouest | [cirad.fr](https://cirad.fr) |
| 12 | AIC — Association Interprofessionnelle du Coton | Documentation interne filière |

---

> **Document rédigé par Team EVOLUTICS — Université d'Abomey-Calavi (UAC)**
> Africa Digital ID Hackathon 2026 — Continental Finals
> ID4Africa AGM, Abidjan, Côte d'Ivoire — Mai 2026
