# APEX FITNESS — Mini brand book (v2)

*Projet pédagogique fictif — Cnam Versailles LCVM, ESC 132.*
*Identité refaite avec le skill UI/UX Pro Max (`design-system/apex-fitness/MASTER.md`) : style « Vibrant & Block-based », paire typographique « Sports/Fitness ». Contrastes revérifiés et corrigés pour le niveau WCAG AA.*

## 1. Plateforme de marque
- **Promesse :** Le sport qui s'adapte à toi.
- **Baseline :** Scanne. Pousse. La machine s'occupe du reste.
- **Valeurs :** simplicité · personnalisation · progression visible · inclusivité.
- **Personnalité :** énergique, directe, sportive, accessible. Des blocs francs et des couleurs vives, plutôt que le « luxe tech » feutré.

## 2. Logo — piste recommandée : B « Sommet »
Un **anneau de résistance ouvert** (ouverture de 60° au sommet) traversé par un **« A » en chevron** dont la pointe sort de l'anneau : on dépasse sa limite. Le **pixel de scan** (un module de QR code) remplace la barre du A.

- **Pistes écartées :** A « Orbite » (le lien avec le nom reste implicite) ; C « Coin » (très tech, peu sportive ; à garder comme motif secondaire).
- **Logotype :** APEX en Barlow Condensed ExtraBold (800), en capitales ; FITNESS en Barlow Condensed SemiBold (600), interlettrage +50 %, en Orange doux sur fond sombre.
- **Versions :**
  - sombre : anneau Craie, chevron Orange Énergie, pixel Vert Go ;
  - claire : Encre, orange foncé #C2410C, vert foncé #15803D ;
  - monochrome : une seule couleur ;
  - bloc / favicon : symbole Encre sur pavé Orange Énergie aux coins arrondis.
- **Zone de protection :** 2 × la hauteur du pixel de scan tout autour.
- **Taille minimale :** symbole 16 px ; logo complet 110 px à l'écran, 28 mm en impression.
- **Interdits :** déformer, pivoter ou recolorer le logo, fermer l'anneau, ajouter une ombre ou un dégradé.

## 3. Palette
| Couleur | Hex | Rôle |
|---|---|---|
| **Orange Énergie** | `#F97316` | Couleur de marque, blocs, mots surlignés |
| **Vert Go** | `#22C55E` | Boutons d'action (CTA) et réussite uniquement |
| Ardoise | `#1F2937` | Fond principal |
| Encre | `#0F172A` | Fond profond, texte posé sur les couleurs |
| Craie | `#F8FAFC` | Texte principal |
| Carte / Atténué / Bordure | `#313742` / `#37414F` / `#374151` | Surfaces |
| Texte secondaire / tertiaire | `#CBD5E1` / `#94A3B8` | Chapeaux / mentions |
| Orange doux / Vert doux | `#FB923C` / `#4ADE80` | Petits textes colorés sur cartes |
| Erreur / Erreur doux | `#EF4444` / `#FCA5A5` | Aplats / texte d'erreur |

**Contrastes vérifiés :**

| Texte / fond | Ratio | Niveau |
|---|---|---|
| Craie sur Ardoise | 14,03:1 | AAA |
| Encre sur Orange | 6,37:1 | AA |
| Encre sur Vert Go | 7,83:1 | AAA |
| Orange doux sur Carte | 5,28:1 | AA |
| Texte secondaire sur Carte | 8,06:1 | AAA |

**Corrections apportées au skill :**
- Son bouton « texte blanc sur vert » ne fait que 2,28:1 : il a été remplacé par du texte Encre.
- L'orange en petit texte sur une carte ne fait que 4,27:1 : on utilise l'Orange doux à la place.

## 4. Typographie (Google Fonts, licence OFL)
- **Barlow Condensed** 500 à 800 : titres en capitales, chiffres (chiffres à largeur fixe), boutons, étiquettes. Interligne serré (0,9 à 0,95).
- **Barlow** 400 à 700 : texte courant à 17 px (jamais moins de 16 px), interligne 1,6, 60 caractères par ligne au maximum.

## 5. Formes, motifs et animations
- **Mot-bloc :** un mot clé par titre, posé sur un bloc orange (ou vert) incliné de −2°.
- **Ombre décalée :** 6 × 6 px, pleine et sans flou. C'est la signature « bloc ».
- **Rayons :** cartes 16 px, grands blocs 20 px, boutons et champs 8 px, étiquettes 4 px.
- **Motifs animés :** grille, rayures en mouvement, bandeaux défilants. Ils se mettent en pause au survol et restent figés si l'utilisateur a demandé moins d'animations.
- **Animations :**
  - survols en 200 ms ;
  - apparitions en cascade : 400 ms, courbe back.out(1.4), 60 ms entre chaque élément ;
  - une seule section épinglée (le scrollytelling 3D).
- **Icônes :** jeu unique Lucide, trait de 2,25. Jamais d'emoji.
- **Gamification :** séries de jours, niveaux, défis du mois et badges dans l'appli (le skill déconseille un concept sans gamification).

## 6. Ton de voix
- **Énergique :** verbes d'action, rythme ternaire (Scanne. Pousse. Progresse.).
- **Simple :** zéro jargon. On **tutoie l'adhérent**, on **vouvoie le futur franchisé**.
- **Honnête :** chiffres sourcés ou signalés comme hypothèses ; personas marqués comme fictifs, jamais de faux témoignages.
- ✅ « Ton programme est prêt. Scanne la machine 4. »
- ❌ « Veuillez procéder à l'identification de l'équipement via le module QR. »
