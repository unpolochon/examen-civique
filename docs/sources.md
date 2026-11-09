# Sources de l'examen civique (carte de résident)

Recensement fait le 9 novembre 2026. Les sources officielles font foi. Les autres servent seulement à repérer les sujets qui tombent.

## Ce que dit le cadre officiel

- Base légale : loi du 26 janvier 2024, décret n° 2025-647 et arrêté du 10 octobre 2025 (programme, épreuves, organisation).
- Exigé depuis le 1er janvier 2026 pour une première carte de séjour pluriannuelle (CSP) ou une première carte de résident (CR). Pas pour un renouvellement.
- 40 QCM en français, 45 minutes, sur ordinateur ou tablette.
- 28 questions de connaissance et 12 mises en situation.
- 4 réponses proposées, 1 seule bonne.
- Réussite à 32/40 (80 %). On peut repasser autant de fois que nécessaire. L'attestation n'expire pas.
- Une réussite au niveau CR vaut aussi pour le niveau CSP.
- Organismes agréés : CCI Paris Île-de-France et France Éducation International.

## Sources officielles (contenu réutilisable, Licence Ouverte 2.0)

| Source | Contenu | Usage dans l'app |
|---|---|---|
| [Formation civique - accueil](https://formation-civique.interieur.gouv.fr/) | Site du ministère de l'Intérieur | Point d'entrée |
| [Informations générales sur l'examen](https://formation-civique.interieur.gouv.fr/examen-civique/informations-g%C3%A9n%C3%A9rales-sur-lexamen-civique/) | Format, seuil, public concerné | Règles de l'examen blanc |
| [Liste officielle des questions CR](https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-cr/) | 209 questions de connaissance, sans réponses | Banque de questions, copiée dans `data/official/cr-questions.json` |
| [Liste officielle des questions CSP](https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-csp/) | Questions niveau CSP | Hors périmètre v1 |
| [Fiches par thématique](https://formation-civique.interieur.gouv.fr/fiches-par-thematiques/) | Cours officiels des 5 thématiques | Base des leçons et des corrections |
| [Fiches par journée](https://formation-civique.interieur.gouv.fr/fiches-par-journ%C3%A9e/) | Même contenu, découpé par journée de formation | Complément |
| [Ministère de l'Intérieur - examen civique](https://www.immigration.interieur.gouv.fr/limmigration-en-france/sejour-des-etrangers/lexamen-civique-pour-demander-titre-de-sejour) | Page de référence | Vérification |
| [Manuel du candidat (FEI)](https://www.france-education-international.fr/document/manuelcandidatexamencivique) | Déroulement le jour J | Conseils pratiques |
| [Quiz France Fraternité](https://www.ensemble-en-france.org/quiz-examen-civique-gratuit-debutant/) | 5 quiz thématiques, 75 questions corrigées, recommandé par le ministère | Référence pour trancher les divergences (voir [divergences.md](divergences.md)) |

Les 5 thématiques officielles et le nombre de questions de connaissance CR publiées :

| Thématique | Questions publiées |
|---|---|
| Principes et valeurs de la République | 40 |
| Système institutionnel et politique | 50 |
| Droits et devoirs | 38 |
| Histoire, géographie et culture | 49 |
| Vivre dans la société française | 32 |
| **Total** | **209** |

## Fraîcheur de la liste locale

Vérification du 2026-11-09 :

- La page officielle CR, téléchargée deux fois dans la journée, n'a pas changé.
- Les 209 questions de `data/official/cr-questions.json` correspondent exactement au jeu data.gouv « Examen civique - CR » (à jour au 02/10/2026).
- Le jeu leqcmcivique.fr (18/10/2026) en partage 207 ; les 2 autres diffèrent seulement par une faute de frappe ou une formulation (« Qu'est-ce qui », « sans élection »).

La tâche T031 automatise cette vérification.

## Jeux de données ouverts (non officiels pour les réponses)

Le ministère ne publie aucun corrigé. Ces jeux proposent des réponses. Ils servent à recouper, pas à faire foi.

- [data.gouv.fr - Examen civique CR](https://www.data.gouv.fr/datasets/examen-civique-cr) : les 209 questions en JSON, sans réponses.
- [data.gouv.fr - leqcmcivique.fr](https://www.data.gouv.fr/organizations/leqcmcivique-fr/datasets) : questions CR, CSP et naturalisation avec des propositions de bonnes réponses.
- [data.gouv.fr - Coq Civique](https://www.data.gouv.fr/organizations/coq-civique) : réponses proposées, licence ouverte.

## Retours d'expérience et sites de préparation

À lire avec prudence : ce sont surtout des sites commerciaux. Le ministère avertit que les sites payants peuvent contenir de fausses informations.

- [testciviquefrance.fr - premiers résultats 2026](https://www.testciviquefrance.fr/articles/premiers-resultats-test-civique-2026-taux-reussite-retours-experience) : taux de réussite annoncé autour de 72 %, sans source officielle ; signale une question piège sur l'hymne national.
- [prepacivique.fr - avis](https://www.prepacivique.fr/avis) : témoignages de candidats qui retrouvent des questions proches de la liste officielle.
- [franceaccueil.com - guide](https://franceaccueil.com/examen-civique-qcm-guide-complet-pour-reussir/) : réponses expliquées, examen d'entraînement en PDF.
- [Connexion France](https://www.connexionfrance.com/news/new-civic-tests-for-foreigners-in-france-launch-amid-criticism/762116) et [FrenchEntrée](https://www.frenchentree.com/living-in-france/moving-to-france/visas-residency/frances-civics-test-for-residency-cards-citizenship-everything-you-need-to-know/) : contexte et premiers retours.

Aucun forum ne recense de façon fiable les mises en situation tombées. L'app génère donc ses propres mises en situation, marquées « non officielles ».

## Répartition par thématique

Confirmée sur Légifrance le 2026-11-09 (article 3 de l'arrêté du 10 octobre 2025, version en vigueur) : 11 / 6 / 11 / 8 / 4 questions, dont 6 mises en situation en « Principes et valeurs » et 6 en « Droits et devoirs ». Détail par notion et connaissances attendues : [referentiel.md](referentiel.md).
