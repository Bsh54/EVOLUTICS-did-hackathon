# CottonPay — Vision Produit & Stratégie

> Document de travail — synthèse de la recherche sur la filière coton au Bénin
> et repositionnement stratégique de CottonPay.
> Date : 2026-07-25. À garder comme référence, à faire évoluer.

---

## 0. Le constat de départ (honnête)

CottonPay actuel est une **prouesse technique** (eSignet/OIDC, Verifiable Credentials,
blockchain Hyperledger/BCovrin, QR) **en quête d'un problème**. C'est l'erreur classique :
*solution cherchant un problème*.

Le produit actuel — **le reçu de pesée bilingue avec QR** — correspond au problème le
**moins rentable** de la filière (cf. #3 ci-dessous). Et l'argent réel, la douleur la plus
intense, est ailleurs (#1, le crédit).

**⚠️ CADRAGE IMPORTANT (décision utilisateur 2026-07-25) :** le pivot porte sur la **VALEUR**
(quel problème, quel payeur), PAS sur le cœur technique. **MOSIP (eSignet, identité vérifiée)
+ la blockchain (Verifiable Credentials) sont LE CŒUR NON NÉGOCIABLE de la solution** — c'est
le différenciateur. Sans eux, CottonPay = un simple logiciel de reçu copiable. Avec eux =
identité souveraine + preuve infalsifiable, ce qui fonde justement la valeur du crédit (#1 :
créance vérifiable) et de la traçabilité (#2 : passeport infalsifiable).

**Décision : on ne jette pas CottonPay. On PIVOTE la valeur, on GARDE le cœur techno.**
On construit crédit / mobile money / traçabilité PAR-DESSUS le socle MOSIP+blockchain.
Le vrai chantier v2 n'est pas de simplifier la techno, mais de **fiabiliser le déploiement**
(la cause des crashes v1 = RAM sous Docker eSignet, pas la techno elle-même).

---

## 1. La filière coton au Bénin (contexte clé)

- Le coton = **~40 % des recettes d'exportation**, cœur de l'économie. *« Quand le coton va, tout va. »*
- Bénin = **1er producteur africain** ces dernières années.
- Production : a culminé à **~700 000 t**, refluée à **~500 000 t** (pluviométrie + qualité semences).
  Campagne 2024-25 ≈ **669 000 t**.
- **~183 746 producteurs**, dans **2 206 CVPC** (coopératives villageoises), sur **47 communes**.
- Bassins : **Borgou, Alibori (Banikoara++), Atacora, Zou**.

### Acteurs (gouvernance interprofessionnelle privée depuis 2016)

| Acteur | Rôle |
|---|---|
| **AIC** (Association Interprofessionnelle du Coton) | Chef d'orchestre. 3 familles : producteurs, égreneurs, distributeurs d'intrants. Gère les "fonctions critiques" : recherche, encadrement, intrants, contrôle qualité, commercialisation. Négocie les prix. |
| **FN-CVPC** | Fédération des coopératives villageoises → CVPC → unions communales (USPP/UCPC). **= le "chef de coopérative" de l'app.** |
| **SODECO** | Principal égreneur (créé 2008 à la privatisation). Égrenage, certification, trading. Capacité ~620 000 t. |
| **ANEC** | Association nationale des égreneurs. |
| **ATDA** | Agences territoriales de développement agricole (encadrement État). |
| **État** (Min. Agriculture) | Homologue les prix chaque campagne, pilote la stratégie industrielle. |

### Chaîne de valeur (le marché qui passe et revient)

```
INTRANTS (semences, engrais, insecticides à crédit via AIC/distributeurs)
   ↓
PRODUCTEUR (CVPC) — culture, récolte du coton-graine
   ↓
PESÉE / MARCHÉ AUTOGÉRÉ au village (bordereau ← produit actuel de CottonPay)
   ↓
ÉGRENAGE (SODECO & autres) : coton-graine → fibre (~42 %) + graines
   ↓  ├─ fibre
   │  └─ sous-produits (huile, tourteau, aliment bétail)
   ↓
COMMERCIALISATION / GDIZ (transformation locale) / export
```

### Mécanisme prix + crédit (cœur financier)

- **Prix homologués administrativement** chaque campagne. 2024-25 → 2026-27 :
  conventionnel **1er choix = 300 FCFA/kg**, 2e choix **250 FCFA/kg** ; **bio = 360 FCFA/kg** (1er choix).
- **Bonus reconquête** : +10 FCFA/kg dès seuil de 700 000 t (≈ 7 Mds FCFA reversés).
- **Intrants à crédit** en début de campagne, remboursés à la vente (déc.–fév.).
- **Caution solidaire** : la CVPC garantit collectivement ; défaut d'un membre → les autres épongent.
- 🔴 **Point noir** : crédit informel à **100–200 %/an** quand le crédit formel manque.

### Réformes (contexte politique)

- **Avant 2012** : gestion déléguée au privé (AIC).
- **Avril 2012** : accord-cadre annulé (malversations), reprise par l'État.
- **Avril 2016** : Talon rétablit l'AIC → gouvernance privée interprofessionnelle (cadre actuel).
- **2020-2025** : virage industriel **GDIZ** (Glo-Djigbé) — transformation locale
  (Btex, BTC : filature, tissu, prêt-à-porter). 18 unités, +25 000 emplois (objectif 300 000 d'ici 2030).
  Exporte déjà vers Kiabi, marques US.
- **2025** : le Bénin **interdit l'export de coton brut** → tout transformer localement (« Made in Benin »).

---

## 2. Les 3 vraies sources de valeur

### #1 🔴 Crédit informel à 100–200 %/an — LE plus gros problème
- **Douleur** : le producteur n'a pas de trésorerie entre semis et vente ; crédit formel insuffisant → usure.
- **Où CottonPay entre** : le bordereau devient une **preuve de créance opposable et infalsifiable**
  ("a livré 500 kg → dû 150 000 FCFA à prix homologué") → une IMF prête à taux normal ; l'usure perd son marché.
- **Qui paie** : IMF / banques (commission sur crédit), ou AIC. **Plus gros marché, douleur maximale.**

### #2 🟢 Traçabilité champ → GDIZ / export « Made in Benin certifié »
- **Douleur** : interdiction d'export brut → tout via GDIZ ; acheteurs internationaux (Kiabi, US)
  **exigent traçabilité + durabilité**, aujourd'hui faible/papier.
- **Où CottonPay entre** : **seul cas où blockchain/VC est vraiment justifiée** — passeport numérique
  infalsifiable champ → pesée → égrenage → GDIZ → produit fini. Vend plus cher à l'international.
- **Qui paie** : égreneurs / GDIZ / marques (pas le paysan). Légitimité institutionnelle.

### #3 🟡 Opacité de la pesée (litiges producteur ↔ coopérative)
- **Douleur** : pesée = source de litiges (sous-pesée, classement 1er vs 2e choix). Tout sur cahier.
- **Où CottonPay entre** : **le bordereau actuel** — reçu horodaté, signé, transparent.
- **Qui paie** : faible disposition à payer (le cahier + tampon suffisent "assez"). Utile mais ne fonde pas à soi seul une entreprise.

---

## 3. L'idée directrice : UNE colonne vertébrale, monétisée 3 fois

Les 3 valeurs ne sont pas 3 produits — c'est **UN seul pipeline de données** capturé une fois (à la pesée) :

```
        LA DONNÉE CAPTURÉE UNE FOIS (pesée traçable = le bordereau)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   #3 TRANSPARENCE       #1 CRÉANCE            #2 PASSEPORT
   pesée/litige      → crédit formel      → traçabilité GDIZ/export
   (adoption)          (le gros $)          (prestige + $ export)
```

- **#3 = porte d'entrée** (facile, gratuite → adoption).
- **#1 = moteur de revenus** (créance → crédit → commission).
- **#2 = levier institutionnel** (export tracé → légitimité AIC/GDIZ/État).

On ne fait pas 3 chantiers : on fait **une plateforme, déployée par étapes**.

---

## 4. Fonctionnalités à greffer (besoins réels de la filière)

**Autour du producteur / CVPC :**
- 💰 **Paiement mobile money** (MTN/Moov) sur le bordereau → payé sans cash, traçable. *Donne enfin son sens à "CottonPay".*
- 🌾 **Gestion des intrants à crédit** : sacs reçus, prix homologué, dette à rembourser en temps réel.
- ⚖️ **Caution solidaire numérisée** : cercle de garantie (qui garantit qui, qui a remboursé).
- 📊 **Prix homologués affichés** (300 / 250 / 360 FCFA) → fin de l'opacité.

**Autour de la campagne / production :**
- 🌦️ **Alertes météo/pluviométrie** — *le* facteur de la chute 700k→500k t. Grosse valeur, coût faible (API météo).
- 🌱 **Suivi qualité des semences** — 2e cause citée.
- 🚜 **Coordination mécanisation** — priorité gouvernementale.

**Autour du financement / institutionnel :**
- 🏦 **Scoring de crédit** basé sur l'historique de livraisons (2-3 campagnes) → confiance IMF.
- 📈 **Dashboard USPP / FN-CVPC / AIC** : production agrégée, paiements, litiges par commune. *= ce qu'on vend à l'AIC.*

---

## 5. Feuille de route (phases — ne PAS tout faire à la fois)

1. **Phase 1 (maintenant)** : solidifier le socle #3 + **paiement mobile money**. Adoption + sens du nom.
2. **Phase 2** : intrants + prix homologués + météo (features collantes, peu coûteuses, fidélisantes).
3. **Phase 3** : preuve de créance + scoring → **partenariat IMF** (le revenu).
4. **Phase 4** : passeport traçabilité GDIZ (international, prestige).

Chaque phase **réutilise la donnée de la précédente**. Rien n'est jeté.

**Interlocuteurs à démarcher** : AIC + FN-CVPC (gestion privée, pas l'État directement) ;
pilote sur une **USPP / union communale** ; IMF pour la partie crédit ; GDIZ/égreneurs pour l'export.

---

## 6. Sources

- Jeune Afrique — Talon reprend la filière coton
- Monographie filière coton — INStaD
- Fiche AIC — Inter-réseaux
- Gouv.bj — Reconquête des 700 000 tonnes
- SODECO — À propos
- Matin Libre — Prix campagne 2024-2025 ; Bilan campagne Borgou / FN-CVPC
- Actus du Bénin — Prix 2026-2027
- Cahiers Agricultures — Crédit de trésorerie des producteurs
- The Voice of Africa — Interdiction export coton brut
- CADRECO / Arise IIP — GDIZ
