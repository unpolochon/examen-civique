# Tâches : préparation à l'examen civique, carte de résident

**Entrées** : [spec.md](spec.md), [plan.md](plan.md), maquettes https://claude.ai/artifact/QvTEUpySocxXHbC7e7gTWc

Format : `[ID] [P?] [Histoire] Description`

- **[P]** : peut tourner en parallèle (fichiers différents, pas de dépendance).
- **[USx]** : histoire utilisateur de [spec.md](spec.md).
- Une tâche est terminée quand ses tests passent et que le superviseur l'a relue.

## Phase 1 : mise en place

- [x] T001 Initialiser le projet : Vite + React + TypeScript, `vite-plugin-pwa`, ESLint, Vitest, Playwright, git. Fichiers : `package.json`, `vite.config.ts`, `tsconfig.json`.
- [x] T002 [P] Déploiement GitHub Pages par GitHub Actions à chaque push sur `main`. Fichier : `.github/workflows/deploy.yml`.
- [x] T003 [P] Vérifier sur Légifrance la répartition des 40 questions par thématique. Fait : [docs/referentiel.md](../../docs/referentiel.md).

## Phase 2 : fondations (bloque les histoires utilisateur)

- [x] T004 Types du contenu (`Question`, `Lesson`) et script `scripts/validate-content.ts` : 4 choix, 1 bonne réponse, leçon existante, 209 questions officielles présentes. Lancé dans `npm test`.
- [x] T005 [P] Module de stockage `src/domain/storage.ts` : un profil unique, version, export, import, effacement. Tests Vitest.
- [x] T006 [P] Coquille de l'app : routeur par hash, barre de navigation basse, jetons CSS de la palette pastel de [plan.md](plan.md), polices Inter et Space Grotesk. Fichiers : `src/App.tsx`, `src/styles.css`.
- [x] T031 [P] Script `scripts/check-official.ts` : télécharge la liste officielle CR et le jeu data.gouv, compare avec `data/official/cr-questions.json`, échoue en cas de différence. Commande `npm run check:official`.

## Phase 3 : contenu (en parallèle, un agent par thématique)

Chaque tâche produit `content/questions/<theme>.json` et `content/lessons/<theme>/*.md` à partir des fiches officielles, en suivant le format de [plan.md](plan.md).

Chaque question est rattachée à une notion de [docs/referentiel.md](../../docs/referentiel.md).

- [x] T007 [P] Thématique « Principes et valeurs de la République » : 40 questions officielles + 30 mises en situation + leçons.
- [x] T008 [P] Thématique « Système institutionnel et politique » : 50 questions officielles + leçons.
- [x] T009 [P] Thématique « Droits et devoirs » : 38 questions officielles + 30 mises en situation + leçons.
- [x] T010 [P] Thématique « Histoire, géographie et culture » : 49 questions officielles + leçons.
- [x] T011 [P] Thématique « Vivre dans la société française » : 32 questions officielles + leçons.
- [x] T012 Recouper les bonnes réponses avec le jeu de données leqcmcivique.fr et produire `docs/divergences.md` (dépend de T007 à T011).
- [ ] T013 Relecture humaine de toutes les réponses et des divergences (Paul).

## Phase 4 : US1 - Profil (P1)

- [x] T014 [US1] Écran de première ouverture : prénom, date d'examen facultative, bouton « Commencer ». Fichier : `src/screens/Bienvenue.tsx`.
- [x] T015 [US1] Redirection vers cet écran tant qu'aucun profil n'existe ; sinon ouverture directe sur l'accueil.

## Phase 5 : US2 - Examen blanc (P1)

- [x] T016 [P] [US2] Tirage et score dans `src/domain/exam.ts` : 28 + 12, répartition de T003, priorité aux questions non vues, mélange. Tests Vitest.
- [x] T017 [US2] Écran d'examen : question, 4 choix, minuteur de 45 min, « À revoir », progression, sauvegarde à chaque réponse, reprise après fermeture. Fichier : `src/screens/Examen.tsx`.
- [x] T018 [US2] Accueil : carte « Faites un examen blanc » mise en avant tant qu'aucun examen n'est terminé, liste des 5 modules. Fichier : `src/screens/Accueil.tsx`.

## Phase 6 : US3 - Résultats et plan de révision (P1)

- [x] T019 [P] [US3] Plan de révision dans `src/domain/plan.ts` selon les règles de [plan.md](plan.md). Tests Vitest avec des examens types.
- [x] T020 [US3] Écran de résultats : score, écart au seuil, scores par thématique, plan de révision. Fichier : `src/screens/Resultats.tsx`.
- [x] T021 [US3] Correction détaillée : réponse donnée, bonne réponse, explication, lien vers la leçon. Fichier : `src/screens/Correction.tsx`.

## Phase 7 : US4 - Leçons (P2)

- [x] T022 [US4] Liste des leçons d'un module et lecteur de leçon (Markdown, encadré « À retenir », source), marquage « lue ». Fichiers : `src/screens/Module.tsx`, `src/screens/Lecon.tsx`.
- [x] T023 [US4] Bouton « Me tester sur cette leçon » qui ouvre les cartes de la leçon.

## Phase 8 : US5 - Cartes (P2)

- [x] T024 [P] [US5] Répétition espacée dans `src/domain/srs.ts` (Leitner, 6 niveaux). Tests Vitest avec horloge simulée.
- [x] T025 [US5] Écran de cartes : recto, verso, réponses « Non », « Hésité », « Oui ». Les erreurs d'examen deviennent dues. Fichier : `src/screens/Cartes.tsx`.

## Phase 9 : US6 - Progression (P3)

- [x] T026 [US6] Écran Progrès : courbe des scores avec le seuil de 32, maîtrise par thématique, « Refaire un examen blanc ». Fichier : `src/screens/Progression.tsx`.

## Phase 10 : finitions

- [x] T027 [P] Écran Réglages : modifier prénom et date, exporter, importer, effacer toutes les données avec confirmation. Fichier : `src/screens/Reglages.tsx`.
- [x] T028 [P] Installation sur iPhone : icônes, manifest, message « Ajouter à l'écran d'accueil » sur Safari.
- [x] T029 Test de bout en bout Playwright sur viewport iPhone : profil, examen complet, résultats, leçon, cartes, progression, mode hors ligne.
- [x] T030 Revue visuelle et accessibilité de chaque écran face aux maquettes (contrastes, cibles de 44 px, lecteur d'écran).

## Dépendances et ordre

- Phase 1, puis phase 2. Les phases 3 à 9 démarrent ensuite.
- Le contenu (phase 3) peut avancer en parallèle de l'interface (phases 4 à 9). L'interface utilise un petit jeu de questions factices tant que le contenu n'est pas prêt.
- MVP : phases 1, 2, 4, 5 et 6 avec le contenu d'au moins une thématique.

## Lots parallèles proposés pour les agents Claude

1. T002, T003, T005, T006, T031 après T001.
2. T007 à T011 (un agent par thématique).
3. T016, T019, T024 (logique pure, testée).
4. Les écrans, dans l'ordre des histoires utilisateur.
