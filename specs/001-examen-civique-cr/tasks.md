# Tâches : préparation à l'examen civique, carte de résident

**Entrées** : [spec.md](spec.md), [plan.md](plan.md), maquettes https://claude.ai/artifact/QvTEUpySocxXHbC7e7gTWc

Format : `[ID] [P?] [Histoire] Description`

- **[P]** : peut tourner en parallèle (fichiers différents, pas de dépendance).
- **[USx]** : histoire utilisateur de [spec.md](spec.md).
- Une tâche est terminée quand ses tests passent et que le superviseur l'a relue.

## Phase 1 : mise en place

- [ ] T001 Initialiser le projet : Vite + React + TypeScript, `vite-plugin-pwa`, ESLint, Vitest, Playwright, git. Fichiers : `package.json`, `vite.config.ts`, `tsconfig.json`.
- [ ] T002 [P] Déploiement GitHub Pages par GitHub Actions à chaque push sur `main`. Fichier : `.github/workflows/deploy.yml`.
- [ ] T003 [P] Vérifier sur Légifrance la répartition des 40 questions par thématique (annexe de l'arrêté du 10 octobre 2025). Consigner le résultat dans `docs/sources.md` et `src/domain/exam.ts`.

## Phase 2 : fondations (bloque les histoires utilisateur)

- [ ] T004 Types du contenu (`Question`, `Lesson`) et script `scripts/validate-content.ts` : 4 choix, 1 bonne réponse, leçon existante, 209 questions officielles présentes. Lancé dans `npm test`.
- [ ] T005 [P] Module de stockage `src/domain/storage.ts` : un profil unique, version, export, import, effacement. Tests Vitest.
- [ ] T006 [P] Coquille de l'app : routeur par hash, barre de navigation basse, jetons CSS de la palette pastel de [plan.md](plan.md), polices Inter et Space Grotesk. Fichiers : `src/App.tsx`, `src/styles.css`.
- [ ] T031 [P] Script `scripts/check-official.ts` : télécharge la liste officielle CR et le jeu data.gouv, compare avec `data/official/cr-questions.json`, échoue en cas de différence. Commande `npm run check:official`.

## Phase 3 : contenu (en parallèle, un agent par thématique)

Chaque tâche produit `content/questions/<theme>.json` et `content/lessons/<theme>/*.md` à partir des fiches officielles, en suivant le format de [plan.md](plan.md).

- [ ] T007 [P] Thématique « Principes et valeurs de la République » : 40 questions officielles + 12 mises en situation + leçons.
- [ ] T008 [P] Thématique « Système institutionnel et politique » : 50 questions officielles + 12 mises en situation + leçons.
- [ ] T009 [P] Thématique « Droits et devoirs » : 38 questions officielles + 12 mises en situation + leçons.
- [ ] T010 [P] Thématique « Histoire, géographie et culture » : 49 questions officielles + 12 mises en situation + leçons.
- [ ] T011 [P] Thématique « Vivre dans la société française » : 32 questions officielles + 12 mises en situation + leçons.
- [ ] T012 Recouper les bonnes réponses avec le jeu de données leqcmcivique.fr et produire `docs/divergences.md` (dépend de T007 à T011).
- [ ] T013 Relecture humaine de toutes les réponses et des divergences (Paul).

## Phase 4 : US1 - Profil (P1)

- [ ] T014 [US1] Écran de première ouverture : prénom, date d'examen facultative, bouton « Commencer ». Fichier : `src/screens/Bienvenue.tsx`.
- [ ] T015 [US1] Redirection vers cet écran tant qu'aucun profil n'existe ; sinon ouverture directe sur l'accueil.

## Phase 5 : US2 - Examen blanc (P1)

- [ ] T016 [P] [US2] Tirage et score dans `src/domain/exam.ts` : 28 + 12, répartition de T003, priorité aux questions non vues, mélange. Tests Vitest.
- [ ] T017 [US2] Écran d'examen : question, 4 choix, minuteur de 45 min, « À revoir », progression, sauvegarde à chaque réponse, reprise après fermeture. Fichier : `src/screens/Examen.tsx`.
- [ ] T018 [US2] Accueil : carte « Faites un examen blanc » mise en avant tant qu'aucun examen n'est terminé, liste des 5 modules. Fichier : `src/screens/Accueil.tsx`.

## Phase 6 : US3 - Résultats et plan de révision (P1)

- [ ] T019 [P] [US3] Plan de révision dans `src/domain/plan.ts` selon les règles de [plan.md](plan.md). Tests Vitest avec des examens types.
- [ ] T020 [US3] Écran de résultats : score, écart au seuil, scores par thématique, plan de révision. Fichier : `src/screens/Resultats.tsx`.
- [ ] T021 [US3] Correction détaillée : réponse donnée, bonne réponse, explication, lien vers la leçon. Fichier : `src/screens/Correction.tsx`.

## Phase 7 : US4 - Leçons (P2)

- [ ] T022 [US4] Liste des leçons d'un module et lecteur de leçon (Markdown, encadré « À retenir », source), marquage « lue ». Fichiers : `src/screens/Module.tsx`, `src/screens/Lecon.tsx`.
- [ ] T023 [US4] Bouton « Me tester sur cette leçon » qui ouvre les cartes de la leçon.

## Phase 8 : US5 - Cartes (P2)

- [ ] T024 [P] [US5] Répétition espacée dans `src/domain/srs.ts` (Leitner, 6 niveaux). Tests Vitest avec horloge simulée.
- [ ] T025 [US5] Écran de cartes : recto, verso, réponses « Non », « Hésité », « Oui ». Les erreurs d'examen deviennent dues. Fichier : `src/screens/Cartes.tsx`.

## Phase 9 : US6 - Progression (P3)

- [ ] T026 [US6] Écran Progrès : courbe des scores avec le seuil de 32, maîtrise par thématique, « Refaire un examen blanc ». Fichier : `src/screens/Progression.tsx`.

## Phase 10 : finitions

- [ ] T027 [P] Écran Réglages : modifier prénom et date, exporter, importer, effacer toutes les données avec confirmation. Fichier : `src/screens/Reglages.tsx`.
- [ ] T028 [P] Installation sur iPhone : icônes, manifest, message « Ajouter à l'écran d'accueil » sur Safari.
- [ ] T029 Test de bout en bout Playwright sur viewport iPhone : profil, examen complet, résultats, leçon, cartes, progression, mode hors ligne.
- [ ] T030 Revue visuelle et accessibilité de chaque écran face aux maquettes (contrastes, cibles de 44 px, lecteur d'écran).

## Dépendances et ordre

- Phase 1, puis phase 2. Les phases 3 à 9 démarrent ensuite.
- Le contenu (phase 3) peut avancer en parallèle de l'interface (phases 4 à 9). L'interface utilise un petit jeu de questions factices tant que le contenu n'est pas prêt.
- MVP : phases 1, 2, 4, 5 et 6 avec le contenu d'au moins une thématique.

## Lots parallèles proposés pour les agents Maison

1. T002, T003, T005, T006, T031 après T001.
2. T007 à T011 (un agent par thématique).
3. T016, T019, T024 (logique pure, testée).
4. Les écrans, dans l'ordre des histoires utilisateur.
