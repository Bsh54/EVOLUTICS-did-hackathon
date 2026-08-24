# Charte graphique — CottonPay v2

> Langage visuel de la refonte UI/UX. Synthèse de 3 références (Arva · Ambrook · Brex).
> **North star :** « Un registre agricole de confiance — la preuve, rendue simple. »
> Agricole (Arva) + Registre/confiance (Ambrook) + Clarté d'ingénieur (Brex).

---

## 0. Notre audience → règles non négociables

Le design sert DEUX publics à la fois. Chaque décision doit passer ce filtre.

**A. Le chef de coopérative (terrain, mobile, faible littératie numérique)**
- **Mobile-first absolu** : tout se pense d'abord sur téléphone tenu à une main.
- **Une action principale par écran.** Pas de choix multiples qui hésitent.
- **Cibles tactiles ≥ 48px.** Doigts, pas curseurs.
- **Contraste fort** : l'écran est lu **en plein soleil**, dehors.
- **Icône + texte** toujours ensemble (jamais icône seule).
- **Textes courts**, langage concret (« Peser une livraison », pas « Nouvelle transaction »).
- **États lisibles** (réseau faible) : chargement, succès, erreur, hors-ligne — explicites.
- **Bilingue FR/EN**, libellés courts qui tiennent dans les deux langues.

**B. L'investisseur (démo, desktop, exige du premium)**
- Sobriété, hiérarchie nette, sensation « institution sérieuse ».
- La **preuve** (reçu blockchain, QR) doit être le héros visuel.
- Zéro bug visuel, alignements parfaits, rythme d'espacement régulier.

---

## 1. Couleurs (tokens)

### Marque & surfaces
| Token | Valeur | Rôle |
|---|---|---|
| `--cp-forest` | `#07503F` | **Couleur de marque.** Barre de nav, actions principales, en-têtes. Vert coton/agriculture. |
| `--cp-forest-deep` | `#053B2E` | Survol/pressé du vert, fonds sombres de section. |
| `--cp-gold` | `#E8B672` | **Accent unique = la valeur/la preuve.** Badge « certifié », highlight du reçu. À doser. |
| `--cp-canvas` | `#FCFAF1` | Fond de page (parchemin chaud — « registre »). |
| `--cp-paper` | `#EFE9E0` | Surface secondaire, séparateurs, bandes de section. |
| `--cp-white` | `#FFFFFF` | Cartes, champs, contenu premier plan. |

### Texte
| Token | Valeur | Rôle |
|---|---|---|
| `--cp-ink` | `#211B15` | Texte principal (brun-noir chaud, pas de noir pur). |
| `--cp-ink-soft` | `#434F40` | Texte secondaire, labels. |
| `--cp-ink-muted` | `#96897B` | Texte tertiaire, placeholders. |

### États (sémantiques — usage strict, jamais décoratif)
| Token | Valeur | Rôle |
|---|---|---|
| `--cp-success` | `#2E7D52` | Livraison enregistrée, reçu émis, vérifié ✅. |
| `--cp-warning` | `#C9871F` | En attente, action requise. |
| `--cp-danger`  | `#C0392B` | Erreur, échec de vérification. |
| `--cp-info`    | `#3E6B8C` | Information neutre. |

### Bordures
| Token | Valeur | Rôle |
|---|---|---|
| `--cp-border` | `#C7BCAF` | Bordures fines de cartes, dividers. |
| `--cp-border-strong` | `#211B15` | Bordure appuyée (champ actif, contour de preuve). |

> **Règle d'or couleur :** vert = marque/navigation · or = LA preuve/valeur · le reste = neutres chauds.
> Les couleurs d'état ne servent QU'aux états. Jamais de couleur « pour décorer ».

---

## 2. Typographie

Deux familles. Serif pour la voix (gravité, « document officiel »), sans-serif pour l'usage.

- **Titres / display →** `Lora` (serif, chaleureux, sérieux). Substitut : `Georgia, serif`.
- **UI / corps / boutons →** `Plus Jakarta Sans` (déjà en place, propre, lisible). Substitut : `system-ui`.

### Échelle (mobile-first, tailles minimales généreuses pour la lisibilité terrain)
| Rôle | Taille | Interligne | Famille | Poids |
|---|---|---|---|---|
| display | 40px | 1.1 | Lora | 700 |
| heading | 28px | 1.15 | Lora | 700 |
| heading-sm | 22px | 1.2 | Lora | 600 |
| subheading | 18px | 1.35 | Jakarta | 600 |
| **body** | **16px** | 1.5 | Jakarta | 400 | ← jamais en-dessous de 16px pour du texte lu |
| label | 14px | 1.4 | Jakarta | 600 |
| caption | 13px | 1.45 | Jakarta | 500 |

> **Terrain :** corps minimum **16px**. Boutons ≥ 16px. Rien de « fin » (poids 100-300 interdits pour le texte).

---

## 3. Espacement, formes, élévation

- **Échelle d'espace (base 4) :** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
- **Rayons :** boutons `12px` · cartes `16px` · grandes cartes `20px` · champs `12px` · pilules `999px`.
- **Densité :** confortable. `gap` d'éléments 8-16px · padding carte 20-24px · gap de section 32-48px.
- **Largeur max contenu :** 1200px (desktop) ; pleine largeur avec marges 16px (mobile).
- **Élévation :** privilégier bordure fine + changement de fond (style registre).
  Ombres douces UNIQUEMENT sur éléments flottants (modale, menu, bouton principal collant).
  - `--cp-shadow-sm: 0 1px 2px rgba(33,27,21,.06)`
  - `--cp-shadow-md: 0 6px 20px rgba(7,80,63,.10)` (accent vert dans l'ombre)

---

## 4. Composants (specs)

### Bouton principal (CTA)
Fond `--cp-forest` · texte blanc · rayon 12px · **hauteur min 52px (terrain)** · padding 16px 24px · poids 700.
Survol → `--cp-forest-deep`. Un seul CTA vert par écran.

### Bouton secondaire (ghost)
Fond transparent · texte `--cp-forest` · bordure 1px `--cp-forest` · rayon 12px · même hauteur.

### Bouton « preuve » (accent)
Pour l'action de valeur (Émettre le reçu / Voir la preuve) : fond `--cp-gold` · texte `--cp-ink` · rayon 12px.

### Carte
Fond blanc · bordure 1px `--cp-border` · rayon 16px · padding 20-24px · pas d'ombre par défaut.
Carte « registre » (livraison/reçu) : fond `--cp-canvas`, filet or à gauche 3px = signal de preuve.

### Champ de saisie
Fond blanc · bordure 1px `--cp-border` · rayon 12px · **hauteur 52px** · texte 16px.
Focus → bordure `--cp-forest` 2px. Label 14px au-dessus, toujours visible (pas de placeholder seul).

### Badge de statut
Pilule · 13px 600 · fond teinté 12% de la couleur d'état + texte de la couleur d'état.
Ex : ✅ Vérifié (success) · ⏳ En attente (warning) · ✕ Non valide (danger).

### Navigation
- **Mobile :** barre inférieure fixe, 3-4 items max, icône + label, cible 56px.
- **Desktop :** sidebar verticale `--cp-forest`, item actif = fond blanc/or.

### Modale
Fond blanc · rayon 20px · `--cp-shadow-md` · overlay `rgba(33,27,21,.45)` · un titre, une action.

---

## 5. Imagerie & iconographie

- **Photos :** vraies scènes agricoles béninoises (champs de coton, pesée, coopérative), légèrement désaturées et chaudes. Jamais de stock générique « corporate ».
- **Icônes :** style trait (line), monochrome `--cp-ink`, épaisseur régulière, toujours accompagnées d'un label.
- **La preuve = héros visuel :** le reçu/QR est mis en scène (cadre, filet or, badge vérifié), pas caché dans un coin.
- **Placeholders assumés :** si une photo manque, cadre au bon ratio + note d'art direction (ne pas laisser vide).

---

## 6. Mouvement

- Transitions courtes et fonctionnelles : `150ms ease` (couleur, fond, opacité) ; `250ms` pour les changements d'état d'écran.
- Feedback tactile immédiat au tap (léger scale/opacité). Pas d'animation gratuite.
- Émission de reçu / vérification réussie = **une** micro-célébration (check animé) — un seul moment fort.

---

## 7. Accessibilité (obligatoire)

- Contraste texte ≥ **4.5:1** (viser 7:1 pour usage extérieur).
- Cibles tactiles ≥ 48px, espacées ≥ 8px.
- Jamais la couleur seule pour porter un sens (toujours + icône/texte).
- Focus visible sur tout élément interactif.
- Zoom navigateur jusqu'à 200% sans casse.

---

## 8. À faire / à éviter

**À faire**
- Une action principale claire par écran.
- Neutres chauds (parchemin) partout ; vert pour la marque ; or pour la preuve.
- Bordures + fonds pour structurer (esprit registre), ombres rares.
- Libellés concrets et courts, bilingues.

**À éviter**
- Gris froids génériques (#ccc, #eee) → utiliser les neutres chauds de la palette.
- Multiplier les couleurs vives ; l'or reste rare et précieux.
- Texte < 16px pour du contenu lu ; poids fins.
- Coins durs (respecter les rayons) ; ombres lourdes/glossy.
- Icône sans label ; plusieurs CTA concurrents sur un écran.

---

## Références sources
Arva (arva.com) · Ambrook (ambrook.com) · Brex (brex.com) — via Refero.
