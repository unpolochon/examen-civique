# Plan d'implémentation : préparation à l'examen civique, carte de résident

**Spécification** : [spec.md](spec.md)

## Résumé

Une web app installable (PWA), sans serveur. Le contenu (questions, leçons) est livré dans l'app sous forme de fichiers JSON et Markdown. Le profil unique et la progression sont stockés dans le navigateur. L'hébergement est gratuit sur GitHub Pages.

## Contexte technique

| Sujet | Choix | Raison |
|---|---|---|
| Langage | TypeScript | Types partagés entre contenu et logique |
| Interface | React 19 + Vite | Outillage standard, connu des agents |
| PWA | `vite-plugin-pwa` | Manifest et service worker hors ligne sans code maison |
| Routage | Routeur par hash (`#/examen`) | Fonctionne sur GitHub Pages sans configuration serveur |
| Style | CSS simple avec variables (palette ci-dessous, polices Inter et Space Grotesk) | Pas de dépendance de style |
| Stockage | `localStorage`, une seule clé, JSON versionné | Quelques centaines de Ko au plus, synchrone, simple |
| Tests unitaires | Vitest | Tirage d'examen, score, plan de révision, répétition espacée |
| Tests de bout en bout | Playwright, viewport iPhone (390 × 844) | Parcours complet comme un utilisateur |
| Hébergement | GitHub Pages via GitHub Actions | 0 €, HTTPS inclus |
| Backend | Aucun | Pas besoin : tout est local |

Le compte AWS n'est pas nécessaire en v1. Il servira si la synchronisation entre appareils ou un coach IA deviennent utiles.

## Palette (reprise des maquettes)

Fond gris clair, cartes blanches très arrondies (18 à 28 px), une couleur pastel par thématique, boutons indigo en forme de pilule.

| Jeton | Valeur | Usage |
|---|---|---|
| `--bg` | `#F2F3F7` | Fond des écrans |
| `--surface` | `#FFFFFF` | Cartes, champs, barre de navigation |
| `--ink` | `#1D1F2C` | Texte principal (aussi sur les pastels) |
| `--muted` | `#5B6072` | Texte secondaire |
| `--primary` | `#5B5BD6` | Boutons, éléments actifs |
| `--primary-soft` | `#E9E9FB` | Réponse choisie, minuteur |
| `--warn` | `#9A4A12` | « À renforcer », seuil de réussite |
| `--principes` | `#F7C6DA` (barre `#D9659A`) | Principes et valeurs |
| `--institutions` | `#BBD7F7` (barre `#4F8FE0`) | Système institutionnel |
| `--droits` | `#B5E3BE` (barre `#45A85F`) | Droits et devoirs |
| `--histoire` | `#F8DF8B` (barre `#D9A21B`) | Histoire, géographie, culture |
| `--societe` | `#FBD3BF` (barre `#E58A5C`) | Vivre dans la société |
| `--examen` | `#D5C8F5` | Examen blanc, résultats |

Le texte reste toujours `--ink` sur les pastels : le contraste dépasse 4,5:1. Les couleurs de barre ne portent jamais seules l'information (le score est toujours écrit).

## Structure du projet

```text
content/
  questions/<theme>.json        # questions officielles complétées + mises en situation
  lessons/<theme>/<lecon>.md    # leçons avec en-tête (titre, durée, source)
data/official/cr-questions.json # liste officielle brute, référence
scripts/validate-content.ts     # vérifie le contenu (4 choix, 1 bonne réponse, leçon existante)
scripts/check-official.ts       # compare la copie locale à la liste en ligne et à data.gouv
src/
  domain/                       # logique pure, testée
    exam.ts                     # tirage et score
    plan.ts                     # plan de révision
    srs.ts                      # répétition espacée
    storage.ts                  # profil, sauvegarde, export, import
  screens/                      # un fichier par écran des maquettes
  App.tsx
  styles.css
e2e/parcours.spec.ts
```

## Format du contenu

Question :

```json
{
  "id": "CR-011",
  "theme": "principes",
  "type": "connaissance",
  "official": true,
  "question": "Quelle est la devise de la France ?",
  "choices": ["Liberté, Égalité, Fraternité", "Travail, Famille, Patrie", "Unité, Progrès, Justice", "Liberté, Sécurité, Solidarité"],
  "answer": 0,
  "explanation": "La devise est inscrite à l'article 2 de la Constitution.",
  "notion": "principes.devise-symboles",
  "lesson": "principes/symboles"
}
```

`notion` prend une des valeurs de [docs/referentiel.md](../../docs/referentiel.md). Les mises en situation ont `"type": "situation"`, `"official": false` et une notion `*.situations` ; elles n'existent que pour `principes` et `droits`. L'ordre des choix est mélangé à l'affichage.

## Règles métier

### Tirage de l'examen blanc

1. Tirer les 40 questions selon la grille par notion de l'article 3 de l'arrêté ([docs/referentiel.md](../../docs/referentiel.md)) : 28 questions officielles de connaissance et 12 mises en situation (6 en `principes.situations`, 6 en `droits.situations`).
2. Donner priorité aux questions jamais vues, puis aux questions ratées.
3. Mélanger l'ordre des questions et des choix.

### Plan de révision

Calcul local, après chaque examen :

1. Score par thématique. Une thématique sous 80 % est « à renforcer ».
2. Pour chaque leçon, compter les erreurs de l'examen sur ses questions.
3. Proposer au plus 3 leçons, par nombre d'erreurs décroissant, en ne gardant que les thématiques à renforcer quand il y en a.
4. Rendre toutes les questions ratées dues aujourd'hui dans les cartes.

Limite connue : les règles ne tiennent compte que du dernier examen. Si elles s'avèrent trop pauvres, on pondérera avec les examens précédents et l'état des cartes.

### Répétition espacée

Système de Leitner à 6 niveaux, intervalles : 10 min, 1 j, 3 j, 7 j, 16 j, 35 j.

- « Non » : retour au niveau 0.
- « Hésité » : le niveau ne change pas.
- « Oui » : niveau + 1.

Une carte est considérée comme maîtrisée à partir du niveau 3 (intervalle d'au moins 7 jours) : c'est cette part qui donne la « maîtrise par thématique » de l'écran Progrès.

### Stockage

- Une seule clé `civique:data` : `{ version, profil, examens, examenEnCours, cartes, leconsLues }`. Pas de clé : écran de première ouverture.
- Le champ `version` permet de migrer les données lors des mises à jour.
- Export : téléchargement d'un fichier JSON. Import : lecture du fichier, validation, remplacement.

## Production du contenu

Le ministère ne publie aucun corrigé. Le contenu est donc rédigé, puis vérifié :

0. Avant toute rédaction, `scripts/check-official.ts` confirme que `data/official/cr-questions.json` correspond à la liste en ligne. Le 2026-11-09, les 209 questions correspondaient exactement au jeu de données data.gouv (à jour au 02/10/2026).
1. Les leçons sont rédigées à partir des fiches officielles par thématique (Licence Ouverte 2.0), en langage clair.
2. Pour chaque question officielle : une bonne réponse justifiée par la fiche officielle, trois distracteurs plausibles mais faux, une explication.
3. Recoupement automatique avec le jeu de données leqcmcivique.fr. Toute divergence est listée pour relecture humaine.
4. Relecture humaine de 100 % des réponses avant mise en ligne.
5. Mises en situation : 60 rédigées (30 en « Principes et valeurs », 30 en « Droits et devoirs », seules thématiques concernées par l'arrêté), marquées « non officielles ».

## Délégation aux agents Claude Maison

- Les tâches marquées `[P]` dans [tasks.md](tasks.md) peuvent tourner en parallèle, chacune dans son propre worktree git.
- La rédaction du contenu se fait par thématique : 5 agents en parallèle.
- Le superviseur (session principale) relit chaque livraison : tests verts, contenu validé par `scripts/validate-content.ts`, comparaison visuelle avec les maquettes.
