/**
 * CottonPay — i18n (FR par défaut / EN)
 * Traduction par dictionnaire appliquée aux nœuds de texte + contenu dynamique.
 *
 * Endpoint anglais : ajouter ?lang=en à n'importe quelle URL.
 * Le choix est mémorisé (localStorage cp_lang).
 * Un sélecteur FR|EN flottant est injecté sur toutes les pages.
 */
(function () {
  'use strict';

  // ============================================================
  // DICTIONNAIRE  (clé = texte français exact, valeur = anglais)
  // ============================================================
  var DICT = {
    // ---- NOUVELLE LANDING (2026) ----
    "CottonPay — La preuve infalsifiable de chaque livraison de coton": "CottonPay — Tamper-proof evidence for every cotton delivery",
    "Le problème": "The problem",
    "La solution": "The solution",
    "Chaque livraison de coton, une": "Every cotton delivery,",
    "preuve infalsifiable": "tamper-proof evidence",
    "CottonPay transforme le bordereau papier en preuve numérique signée sur la blockchain. Le tonnage ne peut plus être trafiqué, et chaque producteur bâtit sa crédibilité financière.":
      "CottonPay turns the paper receipt into digital evidence signed on the blockchain. Tonnage can no longer be tampered with, and every producer builds financial credibility.",
    "Voir comment ça marche": "See how it works",
    "Preuve vérifiable sur la blockchain BCovrin — sans compte requis": "Evidence verifiable on the BCovrin blockchain — no account required",
    "Reçu de livraison": "Delivery receipt",
    "Certifié": "Certified",
    "Poids pesé": "Weighed amount",
    "Point de collecte": "Collection point",
    "Date": "Date",
    "Gravé sur la blockchain. Scannez pour vérifier l'authenticité — impossible à modifier.":
      "Recorded on the blockchain. Scan to verify authenticity — impossible to alter.",
    "du PIB du Bénin repose sur le coton": "of Benin's GDP relies on cotton",
    "perdus par les producteurs sur des tonnages trafiqués": "lost by producers to tampered tonnages",
    "producteur de coton de la zone CFA": "cotton producer in the CFA zone",
    "Sans preuve, le producteur est vulnérable.": "Without proof, the producer is vulnerable.",
    "À la pesée, c'est la coopérative qui note le poids. Le paysan doit faire confiance à un chiffre qu'il ne peut pas contester.":
      "At weighing, the cooperative records the weight. The farmer must trust a figure they cannot contest.",
    "Tonnages sous-estimés": "Underestimated tonnages",
    "On inscrit 900 kg pour 1000 kg livrés. Les 100 kg « disparus » sont autant d'argent perdu pour le producteur.":
      "900 kg is recorded for 1000 kg delivered. The 100 \"missing\" kg is money lost by the producer.",
    "Retards de paiement": "Payment delays",
    "Livré en mars, parfois seulement 20 % payé en juin. Sans document fiable, difficile de réclamer son dû.":
      "Delivered in March, sometimes only 20% paid by June. Without reliable proof, hard to claim what's owed.",
    "Aucun historique": "No history",
    "Le producteur reste invisible pour les banques : pas de trace vérifiable de ce qu'il a réellement livré.":
      "The producer stays invisible to banks: no verifiable record of what they actually delivered.",
    "Une preuve que personne ne peut trafiquer.": "Evidence no one can tamper with.",
    "À la pesée, le poids réel est enregistré et signé par l'identité numérique du producteur, puis gravé sur la blockchain. Le reçu devient une preuve définitive.":
      "At weighing, the real weight is recorded and signed by the producer's digital identity, then written to the blockchain. The receipt becomes definitive evidence.",
    "Infalsifiable": "Tamper-proof",
    "— une fois émis, le reçu ne peut plus être modifié par personne.": "— once issued, the receipt can no longer be modified by anyone.",
    "Vérifiable par tous": "Verifiable by anyone",
    "— banque, acheteur ou union scannent le QR, sans compte.": "— bank, buyer or union scan the QR, no account.",
    "Un historique de confiance": "A trusted history",
    "— la base du futur accès au crédit.": "— the basis for future access to credit.",
    "Identité nationale (NPI)": "National identity (NPI)",
    "Le producteur est authentifié de façon fiable.": "The producer is reliably authenticated.",
    "Blockchain": "Blockchain",
    "Le reçu est scellé et impossible à altérer.": "The receipt is sealed and impossible to alter.",
    "Wallet e-ID": "e-ID wallet",
    "Le producteur garde sa preuve dans son téléphone.": "The producer keeps their proof on their phone.",
    "Trois étapes, quelques secondes.": "Three steps, a few seconds.",
    "On pèse la livraison": "Weigh the delivery",
    "Le chef de coopérative enregistre le producteur et le poids réel du coton livré.":
      "The cooperative lead records the producer and the real weight of cotton delivered.",
    "On émet le reçu": "Issue the receipt",
    "Un reçu numérique est signé par l'identité et gravé sur la blockchain, avec un QR.":
      "A digital receipt is signed by the identity and written to the blockchain, with a QR.",
    "La preuve circule": "The proof travels",
    "Le producteur repart avec sa preuve. N'importe qui peut la vérifier en scannant le QR.":
      "The producer leaves with their proof. Anyone can verify it by scanning the QR.",
    "Du champ au marché, chaque kilo est tracé.": "From field to market, every kilo is traced.",
    "De la pesée à la vérification, la filière gagne en transparence et le producteur en crédibilité.":
      "From weighing to verification, the sector gains transparency and the producer gains credibility.",
    "Aujourd'hui": "Today",
    "La preuve de chaque livraison.": "Proof of every delivery.",
    "Demain": "Tomorrow",
    "L'historique devient un accès au crédit.": "The history becomes access to credit.",
    "La vision": "The vision",
    "L'infrastructure de confiance de la filière coton.": "The trust infrastructure of the cotton sector.",
    "Au-delà de la preuve": "Beyond the proof",
    "De la preuve au financement.": "From proof to financing.",
    "Un historique de livraisons vérifié, c'est ce qui manque aux banques et IMF pour prêter en confiance aux producteurs. CottonPay fournit ce maillon — nous sommes le rail de confiance, pas le prêteur.":
      "A verified delivery history is what banks and MFIs lack to lend to producers with confidence. CottonPay provides that link — we are the trust rail, not the lender.",
    "Ce qu'on nous demande souvent.": "What we're often asked.",
    "Le producteur a-t-il besoin d'un smartphone ?": "Does the producer need a smartphone?",
    "Non. C'est le chef de coopérative qui utilise l'application. Le producteur reçoit une preuve (QR) et n'a rien à installer.":
      "No. The cooperative lead uses the app. The producer receives a proof (QR) and installs nothing.",
    "En quoi le reçu est-il « infalsifiable » ?": "Why is the receipt \"tamper-proof\"?",
    "Le reçu est signé par l'identité nationale et scellé sur la blockchain. Une fois émis, il ne peut plus être modifié — le poids enregistré est définitif.":
      "The receipt is signed by the national identity and sealed on the blockchain. Once issued, it cannot be modified — the recorded weight is final.",
    "Qui peut vérifier un reçu ?": "Who can verify a receipt?",
    "N'importe qui — banque, acheteur, union — en scannant le QR du reçu. Aucun compte n'est nécessaire pour vérifier l'authenticité.":
      "Anyone — bank, buyer, union — by scanning the receipt QR. No account is needed to verify authenticity.",
    "CottonPay prête-t-il de l'argent ?": "Does CottonPay lend money?",
    "Non. CottonPay fournit la couche de confiance (la preuve et l'historique) qui permet aux banques et IMF de prêter aux producteurs. Nous sommes le rail, pas le prêteur.":
      "No. CottonPay provides the trust layer (the proof and history) that lets banks and MFIs lend to producers. We are the rail, not the lender.",
    "Prêt à sécuriser vos livraisons ?": "Ready to secure your deliveries?",
    "Rejoignez l'espace coopérative et émettez votre premier reçu infalsifiable dès aujourd'hui.":
      "Join the cooperative portal and issue your first tamper-proof receipt today.",
    "Traçabilité et paiement cotonnier · Campagne 2025-2026 · République du Bénin":
      "Cotton traceability & payment · 2025-2026 Season · Republic of Benin",

    // ---- <title> ----
    "CottonPay — Certifiez chaque livraison de coton": "CottonPay — Certify every cotton delivery",
    "CottonPay — Espace Coopérative": "CottonPay — Cooperative Portal",
    "Vérification des Livraisons — CottonPay": "Delivery Verification — CottonPay",

    // ---- NAV / commun ----
    "Comment ça marche": "How it works",
    "Coopératives": "Cooperatives",
    "Producteurs": "Producers",
    "Vérification": "Verification",
    "FAQ": "FAQ",
    "Espace Coopérative": "Cooperative Portal",
    "Vérifier un producteur": "Verify a producer",
    "Déconnexion": "Log out",

    // ---- HERO ----
    "Certifiez chaque": "Certify every",
    "livraison de coton.": "cotton delivery.",
    "Bâtissez la crédibilité": "Build financial",
    "financière.": "credibility.",
    "CottonPay transforme le bordereau papier en preuve numérique infalsifiable, grâce à l'identité nationale (NPI) et la blockchain. Les producteurs existent enfin dans le système financier formel.":
      "CottonPay turns the paper receipt into tamper-proof digital evidence, using national identity (NPI) and blockchain. Producers finally exist within the formal financial system.",
    "Campagne 2025–2026 · En direct": "2025–2026 Season · Live",
    "tonnes produites": "tonnes produced",
    "producteurs ciblés": "producers targeted",
    "réduction délai paiement": "shorter payment delay",
    "femmes agricultrices": "women farmers",
    "Propulsé par eSignet · MOSIP": "Powered by eSignet · MOSIP",
    "Infrastructure nationale d'identité du Bénin": "Benin's national identity infrastructure",

    // ---- HOW IT WORKS ----
    "Trois piliers, un système de confiance": "Three pillars, one trust system",
    "De l'identité nationale au crédit bancaire, CottonPay connecte chaque maillon de la chaîne cotonnière.":
      "From national identity to bank credit, CottonPay connects every link in the cotton chain.",
    "Identité vérifiée": "Verified identity",
    "Chaque acteur producteur, représentant CVPC, usine est authentifié via son NPI grâce à eSignet. Une identité nationale, un NPI, une personne réelle.":
      "Every actor — producer, CVPC representative, ginning mill — is authenticated via their NPI through eSignet. One national identity, one NPI, one real person.",
    "Livraisons certifiées": "Certified deliveries",
    "Chaque livraison génère un credential numérique signé sur blockchain Hyperledger Indy. Infalsifiable, horodaté, stocké dans le wallet du producteur via un QR code.":
      "Every delivery generates a digital credential signed on the Hyperledger Indy blockchain. Tamper-proof, timestamped, stored in the producer's wallet via a QR code.",
    "Crédit accessible": "Accessible credit",
    "L'historique vérifiable des livraisons ouvre l'accès au crédit formel à des taux bancaires. Fini l'endettement informel à 200% d'intérêt annuel.":
      "The verifiable delivery history unlocks access to formal credit at bank rates. No more informal debt at 200% annual interest.",

    // ---- COOP SECTION (landing) ----
    "Gérez vos producteurs et certifiez leurs livraisons": "Manage your producers and certify their deliveries",
    "Enregistrez les livraisons au point de collecte, émettez des credentials numériques vérifiables et gérez vos producteurs. Tout est tracé, horodaté et signé sur la blockchain.":
      "Record deliveries at the collection point, issue verifiable digital credentials and manage your producers. Everything is traced, timestamped and signed on the blockchain.",
    "Gestion des producteurs affiliés à votre CVPC": "Management of producers affiliated with your CVPC",
    "Enregistrement des livraisons par lot avec classement qualité (1er / 2ème choix)": "Batch delivery recording with quality grading (1st / 2nd grade)",
    "Credential numérique (QR code) + bordereau PDF téléchargeable": "Digital credential (QR code) + downloadable PDF receipt",
    "Fiche producteur avec historique complet et régénération de credentials": "Producer profile with full history and credential regeneration",
    "Accéder à l'espace coopérative": "Open the cooperative portal",
    "Poids total": "Total weight",
    "Qualité": "Quality",
    "Credential": "Credential",
    "1er choix": "1st grade",
    "2ème choix": "2nd grade",
    "✓ Émis": "✓ Issued",
    "En attente": "Pending",

    // ---- PRODUCER / WALLET SECTION ----
    "e-IDapp Wallet": "e-IDapp Wallet",
    "Vos preuves de livraison dans votre poche": "Your delivery proofs in your pocket",
    "Téléchargez e-IDapp pour recevoir et stocker vos preuves de livraison certifiées. Chaque credential est infalsifiable et accessible même hors-ligne.":
      "Download e-IDapp to receive and store your certified delivery proofs. Every credential is tamper-proof and available even offline.",
    "Scannez le QR code après chaque livraison": "Scan the QR code after each delivery",
    "Stockage hors-ligne et souverain sur votre téléphone": "Offline, self-sovereign storage on your phone",
    "Présentez votre historique certifié à une banque en un scan": "Show your certified history to a bank in a single scan",
    "Télécharger": "Download",

    // ---- VERIFY SECTION (landing) ----
    "Vérification des livraisons": "Delivery verification",
    "Accédez à l'historique certifié d'un producteur": "Access a producer's certified history",
    "Un NPI et l'authentification du producteur via eSignet (OTP national), et vous avez la preuve vérifiable de ses livraisons passées. Idéal pour les banques et institutions financières.":
      "A NPI plus the producer's authentication via eSignet (national OTP), and you get verifiable proof of their past deliveries. Ideal for banks and financial institutions.",
    "NPI du producteur": "Producer's NPI",
    "Vérifier ce producteur": "Verify this producer",
    "Le producteur devra s'authentifier via eSignet (OTP sur son téléphone).": "The producer must authenticate via eSignet (OTP on their phone).",

    // ---- FAQ ----
    "Questions fréquentes": "Frequently asked questions",
    "Tout ce que vous devez savoir": "Everything you need to know",
    "Comment un producteur reçoit-il son credential après une livraison ?": "How does a producer receive their credential after a delivery?",
    "Le producteur a-t-il besoin d'internet pour consulter ses credentials ?": "Does the producer need internet to view their credentials?",
    "Comment une banque vérifie-t-elle l'historique d'un producteur ?": "How does a bank verify a producer's history?",
    "Qu'est-ce qui empêche quelqu'un de falsifier un credential ?": "What prevents someone from forging a credential?",
    "Mon téléphone est perdu ou cassé — mes credentials sont-ils perdus ?": "My phone is lost or broken — are my credentials lost?",
    "Après l'enregistrement de la livraison par le représentant de la coopérative, un QR code apparaît à l'écran. Le producteur ouvre l'application":
      "After the cooperative representative records the delivery, a QR code appears on screen. The producer opens the",
    "sur son smartphone, scanne le QR code, et le credential est automatiquement stocké dans son portefeuille numérique. Tout se fait en quelques secondes.":
      "app on their smartphone, scans the QR code, and the credential is automatically stored in their digital wallet. It all takes a few seconds.",
    "Non.": "No.",
    "Une fois le credential scanné et stocké dans e-IDapp, il est accessible hors-ligne à tout moment. Le producteur peut le présenter à une banque ou un partenaire même en zone rurale sans couverture réseau.":
      "Once the credential is scanned and stored in e-IDapp, it is available offline at any time. The producer can present it to a bank or partner even in rural areas with no network coverage.",
    "La banque accède à la page de": "The bank goes to CottonPay's",
    "de CottonPay, saisit le NPI du producteur, puis le producteur — physiquement présent — s'authentifie via":
      "page, enters the producer's NPI, then the producer — physically present — authenticates via",
    "(OTP national). L'historique certifié s'affiche immédiatement. Aucun document papier n'est nécessaire.":
      "(national OTP). The certified history appears immediately. No paper document is needed.",
    "vérification publique": "public verification",
    "Chaque credential est signé cryptographiquement par la coopérative et enregistré sur la": "Each credential is cryptographically signed by the cooperative and recorded on the",
    "blockchain BCovrin": "BCovrin blockchain",
    "Toute tentative de modification rend la signature invalide. C'est le même principe qu'un acte notarié, mais numérique et vérifiable instantanément par n'importe qui.":
      "Any attempt to modify it invalidates the signature. It's the same principle as a notarized deed, but digital and instantly verifiable by anyone.",
    ". Toute tentative de modification rend la signature invalide. C'est le même principe qu'un acte notarié, mais numérique et vérifiable instantanément par n'importe qui.":
      ". Any attempt to modify it invalidates the signature. It's the same principle as a notarized deed, but digital and instantly verifiable by anyone.",
    "L'historique complet reste enregistré dans le système CottonPay et sur la blockchain. Votre représentant de coopérative peut régénérer les QR codes de vos credentials à tout moment depuis sa fiche producteur. Il vous suffit de réinstaller e-IDapp et de rescanner.":
      "The full history stays recorded in the CottonPay system and on the blockchain. Your cooperative representative can regenerate the QR codes of your credentials at any time from your producer profile. Just reinstall e-IDapp and rescan.",

    // ---- FOOTER ----
    "Propulsé par eSignet · MOSIP · Hyperledger Aries · BCovrin": "Powered by eSignet · MOSIP · Hyperledger Aries · BCovrin",
    "Team EVOLUTICS — Université d'Abomey-Calavi": "Team EVOLUTICS — University of Abomey-Calavi",

    // ---- Bannières d'erreur auth (index.html) ----
    "⚠️ Votre NPI n'est pas enregistré comme membre d'une coopérative. Si vous êtes producteur, connectez-vous via « Mon Espace ».":
      "⚠️ Your NPI is not registered as a cooperative member. If you are a producer, log in via “My Space”.",
    "⚠️ Votre NPI n'est pas enregistré comme producteur. Contactez votre coopérative pour vous affilier.":
      "⚠️ Your NPI is not registered as a producer. Contact your cooperative to get affiliated.",
    "⚠️ Session de connexion expirée. Veuillez réessayer.": "⚠️ Login session expired. Please try again.",
    "⚠️ Erreur de connexion avec eSignet. Veuillez réessayer.": "⚠️ Connection error with eSignet. Please try again.",
    "⚠️ Session de connexion invalide. Veuillez réessayer.": "⚠️ Invalid login session. Please try again.",
    "⚠️ Échec de la connexion avec eSignet (échange de jetons). Les clés du client OIDC sont peut-être désynchronisées. Veuillez réessayer.":
      "⚠️ eSignet login failed (token exchange). The OIDC client keys may be out of sync. Please try again.",
    "⚠️ Le jeton d'identité retourné par eSignet est invalide. Veuillez réessayer.": "⚠️ The identity token returned by eSignet is invalid. Please try again.",
    "⚠️ Une erreur inattendue s'est produite lors de la connexion. Veuillez réessayer.": "⚠️ An unexpected error occurred during login. Please try again.",
    "🔄 Réessayer la connexion": "🔄 Retry login",
    "Veuillez entrer un NPI valide (au moins 10 chiffres).": "Please enter a valid NPI (at least 10 digits).",

    // ============================================================
    //  ESPACE COOPÉRATIVE (coop/index.html + app.js)
    // ============================================================
    "Coopérative": "Cooperative",
    "Tableau de bord": "Dashboard",
    "Enregistrer livraison": "Record delivery",
    "Enregistrer producteur": "Register producer",
    "Tableau": "Home",
    "Livraison": "Delivery",
    "Producteur": "Producer",
    "Bonjour,": "Hello,",
    "Chargement...": "Loading...",
    "Producteurs affiliés": "Affiliated producers",
    "Livraisons enregistrées": "Deliveries recorded",
    "Lots fermés / en cours": "Batches closed / open",
    "Montant total campagne": "Total season amount",
    "Campagne 2025-2026": "2025-2026 Season",
    "Enregistrer un producteur": "Register a producer",
    "Rechercher par NPI ou nom...": "Search by NPI or name...",
    "NPI": "NPI",
    "Nom": "Name",
    "Commune": "Municipality",
    "Livraisons": "Deliveries",
    "Dernière": "Last",
    "Aucun producteur trouvé.": "No producer found.",
    "Enregistrer une livraison": "Record a delivery",
    "Rechercher": "Search",
    "Poids (kg)": "Weight (kg)",
    "Classement qualité": "Quality grading",
    "Prix unitaire": "Unit price",
    "Montant brut": "Gross amount",
    "Enregistrer la livraison": "Record the delivery",
    "Livraison enregistrée avec succès": "Delivery recorded successfully",
    "Le producteur peut scanner ce QR code avec": "The producer can scan this QR code with",
    "pour recevoir son credential numérique.": "to receive their digital credential.",
    "Télécharger le bordereau PDF": "Download PDF receipt",
    "Partager": "Share",
    "Enregistrer une autre livraison": "Record another delivery",
    "Enregistrer un nouveau producteur": "Register a new producer",
    "Entrez les 16 chiffres du NPI": "Enter the 16-digit NPI",
    "Le producteur doit être physiquement présent.": "The producer must be physically present.",
    "Vérifier": "Verify",
    "Affiliation réussie !": "Affiliation successful!",
    "Enregistrer un autre producteur": "Register another producer",
    "📦 Enregistrer une livraison →": "📦 Record a delivery →",
    "← Retour au tableau de bord": "← Back to dashboard",
    "Téléphone": "Phone",
    "📦 Enregistrer une livraison": "📦 Record a delivery",
    "Historique des livraisons": "Delivery history",
    "Aucune livraison enregistrée pour ce producteur.": "No delivery recorded for this producer.",
    "Résumé financier": "Financial summary",
    "Total livré": "Total delivered",
    "Nombre de livraisons": "Number of deliveries",
    "Total brut": "Total gross",
    "Total déductions": "Total deductions",
    "Net à payer": "Net payable",
    "Total payé": "Total paid",
    "Credential Numérique": "Digital Credential",
    "Scannez ce QR code avec": "Scan this QR code with",
    "pour récupérer le reçu certifié.": "to retrieve the certified receipt.",
    "Fermer": "Close",
    "16 chiffres": "16 digits",
    "Prix homologués": "Official prices",
    "Prélèvements": "Levies",
    "Crédit intrants": "Input credit",
    "AIC": "AIC",
    "Lot en cours :": "Current batch:",
    "livraisons": "deliveries",

    // ---- app.js dynamique ----
    "Erreur": "Error",
    "Erreur de chargement du producteur.": "Error loading the producer.",
    "Erreur de connexion.": "Connection error.",
    "Erreur réseau.": "Network error.",
    "Ce NPI n'existe pas dans le registre national.": "This NPI does not exist in the national registry.",
    "Réessayer": "Try again",
    "Enregistrer ce producteur d'abord": "Register this producer first",
    "Rechercher": "Search",
    "✅ Dans le wallet": "✅ In wallet",
    "📥 Reçu": "📥 Receipt",
    "📱 QR Credential": "📱 QR Credential",
    "🕐 Émission en cours": "🕐 Issuing...",
    "✅ Payé": "✅ Paid",
    "⏳ En attente": "⏳ Pending",
    "Aucune donnée de credential": "No credential data",
    "Poids": "Weight",
    "Crédit intrants": "Input credit",
    "Prélèvements AIC": "AIC levies",
    "⚠️ QR code indisponible": "⚠️ QR code unavailable",
    "eidStack non disponible": "eidStack unavailable",
    "Le NPI doit contenir 16 chiffres": "The NPI must contain 16 digits",
    "Ce NPI n'a pas été trouvé dans le registre national.": "This NPI was not found in the national registry.",
    "Retour": "Back",
    "Ce producteur est affilié à une autre coopérative.": "This producer is affiliated with another cooperative.",
    "Producteur identifié": "Producer identified",
    "Confirmer l'affiliation": "Confirm affiliation",
    "Annuler": "Cancel",
    "Vérification...": "Verifying...",
    "Enregistrement...": "Saving...",
    "Aucune livraison à télécharger.": "No delivery to download.",
    "Aucune livraison à partager.": "No delivery to share.",

    // ============================================================
    //  PAGE VÉRIFICATION PUBLIQUE (verify.html)
    // ============================================================
    "🏦 Vérification des livraisons": "🏦 Delivery verification",
    "Entrez le NPI d'un producteur pour consulter son historique de livraisons certifié sur la blockchain.":
      "Enter a producer's NPI to view their delivery history certified on the blockchain.",
    "Rechercher ce producteur": "Search this producer",
    "Producteur trouvé": "Producer found",
    "Le producteur doit s'authentifier via": "The producer must authenticate via",
    "pour autoriser la consultation de son historique.": "to authorize access to their history.",
    "🔐 Authentification eSignet (OTP)": "🔐 eSignet authentication (OTP)",
    "💡 Le producteur doit être": "💡 The producer must be",
    "Il saisira son NPI dans eSignet et recevra un": "They will enter their NPI in eSignet and receive an",
    ". Il saisira son NPI dans eSignet et recevra un": ". They will enter their NPI in eSignet and receive an",
    "pour autoriser l'accès à ses données.": "to authorize access to their data.",
    "physiquement présent": "physically present",
    "OTP sur son téléphone": "OTP on their phone",
    "← Modifier le NPI": "← Change the NPI",
    "✅ Identité vérifiée via eSignet": "✅ Identity verified via eSignet",
    "Le producteur a autorisé l'accès à son historique. Données certifiées sur la blockchain.":
      "The producer authorized access to their history. Data certified on the blockchain.",
    "🔄 Nouvelle vérification": "🔄 New verification",
    "← Retour à CottonPay": "← Back to CottonPay",
    "👤 Producteur": "👤 Producer",
    "Région": "Region",
    "📊 Résumé campagne": "📊 Season summary",
    "Poids total livré": "Total weight delivered",
    "Montant brut total": "Total gross amount",
    "📦 Détail des livraisons": "📦 Delivery details",
    "Aucune livraison enregistrée.": "No delivery recorded.",
    "Aucun producteur trouvé avec ce NPI.": "No producer found with this NPI.",
    "Erreur de connexion au serveur.": "Server connection error.",
    "Erreur de chargement de l'historique.": "Error loading the history.",

    // ---- termes courts ----
    "Chargement": "Loading",
    "Coopérative :": "Cooperative:",
    "Nom :": "Name:",
    "Commune :": "Municipality:",
    "Téléphone :": "Phone:"
  };

  // ============================================================
  // LOGIQUE
  // ============================================================
  var params = new URLSearchParams(location.search);
  var urlLang = params.get('lang');
  var lang = urlLang || localStorage.getItem('cp_lang') || 'fr';
  if (lang !== 'en' && lang !== 'fr') lang = 'fr';
  localStorage.setItem('cp_lang', lang);
  document.documentElement.setAttribute('lang', lang);

  function translateText(node) {
    var raw = node.nodeValue;
    if (!raw) return;
    var key = raw.trim();
    if (!key) return;
    if (DICT[key]) {
      node.nodeValue = raw.replace(key, DICT[key]);
    }
  }

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1 };

  function walk(root) {
    if (lang === 'fr') return;
    if (root.nodeType === Node.TEXT_NODE) { translateText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS[root.tagName]) return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return (n.parentNode && SKIP_TAGS[n.parentNode.tagName])
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = tw.nextNode())) translateText(n);
    // Attributs : placeholder
    var withPh = root.querySelectorAll ? root.querySelectorAll('[placeholder]') : [];
    for (var i = 0; i < withPh.length; i++) {
      var v = withPh[i].getAttribute('placeholder');
      if (v && DICT[v.trim()]) withPh[i].setAttribute('placeholder', DICT[v.trim()]);
    }
  }

  function translateTitle() {
    if (lang === 'fr' || !document.title) return;
    var k = document.title.trim();
    if (DICT[k]) document.title = DICT[k];
  }

  function apply() { walk(document.body); translateTitle(); }

  // Sélecteur FR|EN flottant
  function injectSwitcher() {
    if (document.getElementById('cpLangSwitch')) return;
    var css = document.createElement('style');
    css.textContent =
      '#cpLangSwitch{position:fixed;bottom:22px;right:22px;top:auto;z-index:99999;display:flex;' +
      'gap:4px;padding:5px;border-radius:10px;background:#fff;' +
      'border:1px solid #D8DEE7;box-shadow:0 6px 22px rgba(20,32,46,.14);' +
      'font-family:Arial,Helvetica,sans-serif;}' +
      '#cpLangSwitch button{border:none;background:none;cursor:pointer;font-size:15px;' +
      'font-weight:800;padding:9px 18px;border-radius:8px;color:#2554B0;line-height:1;' +
      'letter-spacing:.5px;transition:all .15s;}' +
      '#cpLangSwitch button:hover{background:rgba(37,84,176,.08);}' +
      '#cpLangSwitch button.on{background:#2554B0;color:#fff;}' +
      /* sur mobile, remonter au-dessus de la barre de navigation basse (espace coop) */
      '@media(max-width:768px){#cpLangSwitch{bottom:84px;right:14px;}' +
      '#cpLangSwitch button{font-size:15px;padding:9px 17px;}}';
    document.head.appendChild(css);
    var box = document.createElement('div');
    box.id = 'cpLangSwitch';
    box.innerHTML =
      '<button data-l="fr"' + (lang === 'fr' ? ' class="on"' : '') + '>FR</button>' +
      '<button data-l="en"' + (lang === 'en' ? ' class="on"' : '') + '>EN</button>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var l = b.getAttribute('data-l');
      if (l === lang) return;
      localStorage.setItem('cp_lang', l);
      var u = new URL(location.href);
      if (l === 'en') u.searchParams.set('lang', 'en'); else u.searchParams.delete('lang');
      location.href = u.toString();
    });
    document.body.appendChild(box);
  }

  // Traduction du contenu ajouté dynamiquement (app.js, verify.html…)
  function observe() {
    if (lang === 'fr') return;
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) walk(added[j]);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // API publique (pour usage manuel éventuel)
  window.i18n = {
    get lang() { return lang; },
    t: function (s) { return (lang === 'en' && DICT[s]) ? DICT[s] : s; },
    apply: apply
  };

  function boot() { apply(); injectSwitcher(); observe(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
