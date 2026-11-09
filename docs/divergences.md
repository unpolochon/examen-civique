# Divergences et doutes à relire

Liste de contrôle pour la relecture humaine (tâche T013, Paul). Elle reprend en un seul endroit :

- les questions qui ont un champ `review` dans `content/questions/*.json` (9 questions) ;
- les divergences avec le jeu leqcmcivique.fr du 18/10/2026, non officiel (2 questions : CR-033 et CR-187) ;
- les points de vigilance des fiches de relecture par thématique, dans [content-review/](content-review/).

Les fiches par thématique gardent le détail : sources consultées, choix exclus pour éviter deux réponses défendables, erreurs relevées dans les fiches officielles.

Comment relire : cochez la case (`[x]`) quand le point est tranché. Si la réponse ou la leçon doit changer, notez la décision dans la fiche de la thématique et corrigez le contenu.

**Priorité**

- **1** : la bonne réponse peut être contestée, ou l’examen réel peut attendre une autre réponse.
- **2** : la réponse est juste, mais une formulation, un distracteur ou un rattachement est à valider.
- **3** : vérification de source ou de leçon, sans effet attendu sur les réponses.

Les thématiques suivent l’ordre de l’app. Dans chaque thématique, les points sont classés par priorité.

## Bilan

| Thématique | Champs `review` | Divergences leqcmcivique | Points à relire |
|---|---|---|---|
| Principes et valeurs | 2 | 1 | 5 |
| Système institutionnel | 2 | 0 | 8 |
| Droits et devoirs | 1 | 0 | 8 |
| Histoire, géographie, culture | 3 | 0 | 8 |
| Vivre dans la société | 1 | 1 | 9 |
| **Total** | **9** | **2** | **38** |

## Principes et valeurs de la République

Détail : [content-review/principes.md](content-review/principes.md).

| Relu | Prio. | id | Thème | Question | Notre réponse | Doute |
|---|---|---|---|---|---|---|
| [ ] | 1 | CR-033 | principes | Que peut faire un usager du service public dans une mairie ? | Porter un signe religieux, en respectant les règles du service | `review` et divergence. leqcmcivique lit la question comme une question sur les démarches (se marier, déclarer une naissance, s’inscrire sur les listes électorales). Nous suivons le bloc laïcité de la liste officielle. Nos distracteurs restent faux dans les deux lectures. |
| [ ] | 1 | CR-031 | principes | À l’école publique, qui peut porter des signes religieux très visibles ? | Les parents d’élèves qui viennent à l’école | `review`. Les fiches ne citent pas les parents. Réponse déduite de la règle des usagers et de l’étude du Conseil d’État de 2013. Vérifier qu’aucune loi récente n’a changé la règle (cas du parent accompagnateur de sortie scolaire). |
| [ ] | 3 | CR-020 | principes | Sur quel document peut-on voir Marianne ? | Sur les documents officiels, comme la carte d’identité | La fiche cite la carte d’identité. La réponse est plus large pour rester juste quel que soit le modèle de carte. |
| [ ] | 3 | CR-003, CR-012, CR-013, CR-026 | principes | Titre de séjour, répudiation, impôts, régime de la France | (voir le contenu) | Les fiches « Principes et valeurs » ne traitent pas ces sujets. La source citée est une fiche d’une autre thématique. Vérifier que la source convient. |
| [ ] | 3 | `principes/laicite-principes` | principes | (leçon) | (leçon) | Phrase ajoutée sur le régime particulier de l’Alsace et de la Moselle (Concordat), absente de la fiche. Les réponses suivent la règle générale de la loi de 1905. |

## Système institutionnel et politique

Détail : [content-review/institutions.md](content-review/institutions.md).

| Relu | Prio. | id | Thème | Question | Notre réponse | Doute |
|---|---|---|---|---|---|---|
| [ ] | 2 | CR-084 | institutions | Où est le siège du Parlement européen ? | À Strasbourg | `review`. « À Bruxelles » est gardé comme distracteur, car c’est la confusion la plus courante. Le Parlement y travaille aussi. Décider s’il faut garder ce distracteur. |
| [ ] | 2 | CR-042 | institutions | Le président de la République a commis un crime. Quelle proposition est correcte ? | Il pourra être jugé après la fin de son mandat | `review`. Les fiches ne traitent pas ce cas. Réponse fondée sur les articles 67 et 68 de la Constitution. Conforme à leqcmcivique. |
| [ ] | 2 | CR-047 | institutions | Est-ce que le vote est obligatoire ? | Non, voter est un droit et non une obligation | leqcmcivique écrit « un droit et un devoir civique », la fiche « un droit et non un devoir ». Notre formulation est vraie dans les deux lectures. |
| [ ] | 3 | CR-063 | institutions | Quelle condition est nécessaire pour voter aux élections ? | Avoir au moins 18 ans | Plusieurs conditions sont nécessaires, la réponse en retient une. Les distracteurs (logement, emploi, diplôme) ne sont des conditions dans aucun cas. |
| [ ] | 3 | CR-073 | institutions | Depuis quand l’euro est-elle la monnaie unique ? | Depuis 2002 | Une fiche associe l’euro à la BCE en 1998. La fiche d’histoire et l’arrêté retiennent 2002. 1998 et 1999 sont exclus des choix. |
| [ ] | 3 | CR-076 | institutions | Combien de communes environ existe-t-il en France ? | Environ 35 000 | Les fiches donnent « plus de 35 000 » et « 34 875 ». La réponse convient aux deux. |
| [ ] | 3 | CR-077, CR-090 | institutions | Traité de l’Union européenne ; pays fondateur | Le traité de Maastricht ; L’Italie | L’UE est fondée en 1992 par 12 États. Les distracteurs évitent les autres États de 1992 pour ne pas avoir deux réponses défendables. |
| [ ] | 3 | Leçons `institutions/*` | institutions | (leçons) | (leçons) | Nombres datés, exacts en novembre 2026 : 577 députés, 348 sénateurs, 720 eurodéputés dont 81 pour la France, 101 départements, 18 régions. À revérifier après une réforme. |

## Droits et devoirs

Détail : [content-review/droits.md](content-review/droits.md).

| Relu | Prio. | id | Thème | Question | Notre réponse | Doute |
|---|---|---|---|---|---|---|
| [ ] | 1 | CR-110 | droits | Concernant l’utilisation des réseaux sociaux, quelle proposition est correcte ? | Les insultes et les messages de haine y sont punis par la loi | `review`. Aucune fiche ne traite des réseaux sociaux. Réponse déduite de l’article 11 de la DDHC. La majorité numérique (loi du 7 juillet 2023, non appliquée) n’est pas reprise et aucun distracteur ne porte sur l’âge. |
| [ ] | 2 | CR-091 | droits | À quelle liberté la PMA fait-elle référence ? | La liberté d’avoir des enfants | leqcmcivique propose aussi « la liberté de disposer de son corps ». Aucun distracteur ne parle du corps ou de la famille. |
| [ ] | 2 | CR-105 | droits | Quelle liberté permet à une personne de croire en la religion de son choix ? | La liberté de conscience | La fiche droits parle de « liberté de culte ou de religion ». Aucun distracteur ne parle du culte ou de la religion. |
| [ ] | 2 | Leçon `droits/limites-des-libertes` | droits | (leçon) | (leçon) | Écart entre fiche et droit en vigueur. La fiche donne 3 000 € comme amende maximale d’une contravention ; la leçon dit 1 500 €, 3 000 € en récidive (article 131-13 du Code pénal). Même prudence pour les crimes et les délits. Si l’examen suit la fiche, une question future pourrait attendre 3 000 €. |
| [ ] | 3 | CR-092 et série CR-091 à CR-128 | droits | Au nom de quoi l’État justifie-t-il la restriction des droits ? | Au nom de l’ordre public et de l’intérêt général | Rattachement aux notions déduit de l’ordre de la liste officielle (non publié). CR-092 reste en `droits.fondamentaux` mais renvoie à la leçon `limites-des-libertes`. |
| [ ] | 3 | CR-095, CR-097, CR-099, CR-102, CR-105, CR-109 | droits | (voir le contenu) | (voir le contenu) | Sujets absents des fiches « Droits et devoirs ». La source citée est une fiche d’une autre thématique. |
| [ ] | 3 | SIT-DRO-008, SIT-DRO-024 | droits | Divorce sans l’accord de l’autre époux ; renouvellement du titre de séjour | Thomas peut demander le divorce au juge, même si sa femme refuse ; Demander le renouvellement avant la fin de validité de sa carte | Mises en situation rédigées par nous. SIT-DRO-008 précise que les époux vivent séparés. SIT-DRO-024 ne donne aucun délai chiffré, car il varie selon le titre. |
| [ ] | 3 | Leçons `droits/*` | droits | (leçons) | (leçons) | Faits vérifiés hors des fiches : amende de 135 € pour un déchet jeté, IVG jusqu’à 14 semaines, loi de 1881 sur la presse, vote des femmes (1944), article 89, loi de 2019 sur les violences éducatives, numéros 3018 et 3977, Pharos. Vote présenté comme un devoir civique sans obligation légale. |

## Histoire, géographie et culture

Détail : [content-review/histoire.md](content-review/histoire.md).

| Relu | Prio. | id | Thème | Question | Notre réponse | Doute |
|---|---|---|---|---|---|---|
| [ ] | 1 | CR-172 | histoire | Quel est le classement de la langue française parmi les langues les plus parlées dans le monde ? | Quatrième | `review`. L’arrêté du 10 octobre 2025 (annexe I) dit 5e (OIF 2022). La fiche officielle et l’OIF de mars 2026 disent 4e. « Cinquième » est exclu des choix. Décider si l’examen réel suit l’arrêté ou la fiche. |
| [ ] | 1 | CR-165 | histoire | Lequel de ces départements de France est le plus touristique ? | Paris | `review`. Aucune fiche ne classe les départements. leqcmcivique accepte aussi les Alpes-Maritimes, le Var et la Savoie : ils sont exclus des choix. |
| [ ] | 2 | CR-136 | histoire | Depuis quand les Français élisent-ils le président de la République au suffrage universel direct ? | Depuis 1962 | `review`. Les fiches ne donnent pas l’année. Date du référendum du 28 octobre 1962 ; première élection en 1965, absente des choix. |
| [ ] | 2 | CR-167 | histoire | Combien de personnes parlent français dans le monde ? | Plus de 300 millions | L’arrêté dit 321 millions, la fiche et l’OIF 2026 disent 396 millions. La réponse est vraie dans les deux cas. |
| [ ] | 2 | CR-132 | histoire | Lequel de ces personnages a un lien avec la République française ? | Charles de Gaulle | Question vague. Marianne serait aussi une bonne réponse : elle n’est pas dans les choix. Les distracteurs sont des rois. |
| [ ] | 3 | CR-173 | histoire | Quelle cathédrale célèbre a été en partie détruite par un incendie en 2019 ? | La cathédrale Notre-Dame de Paris | La réouverture de décembre 2024, absente de la fiche, est citée dans l’explication et la leçon. |
| [ ] | 3 | CR-134, CR-137, CR-153, CR-160, CR-162 | histoire | (voir le contenu) | (voir le contenu) | Réponses formulées autrement que leqcmcivique, avec le même sens. |
| [ ] | 3 | Leçons `histoire/*` | histoire | (leçons) | (leçons) | Incohérences des fiches non reprises : armistice daté du 20 et du 22 juin 1940 (retenu : 22 juin) ; fin du régime de Vichy (aucune date dans la leçon) ; premier mandat de Charles de Gaulle (retenu : 1959-1969). |

## Vivre dans la société française

Détail : [content-review/societe.md](content-review/societe.md).

| Relu | Prio. | id | Thème | Question | Notre réponse | Doute |
|---|---|---|---|---|---|---|
| [ ] | 1 | CR-207 | societe | Des parents ne respectent pas l’obligation d’instruction pour leurs enfants. Quelle sanction maximale risquent-ils ? | 6 mois de prison et 7 500 € d’amende | `review`. La fiche ne donne pas de chiffres. Chiffres de l’article 227-17-1 du Code pénal. L’article 227-17 prévoit jusqu’à 2 ans et 30 000 € : aucun distracteur ne les reprend, mais « sanction maximale » reste à relire. |
| [ ] | 1 | CR-187 | societe | Concernant l’accès aux soins, quelle proposition est correcte ? | Chacun peut choisir librement son médecin | Divergence de choix, sans contradiction. leqcmcivique retient l’accès aux soins pour tous ou le remboursement partiel. Nos distracteurs sont faux et ne recoupent pas leurs propositions. |
| [ ] | 2 | CR-179, CR-180, CR-186 | societe | Inscription à l’école ; autorité parentale après divorce ; numéro de la police | La mairie ; Les deux parents, sauf décision contraire du juge ; Le 17 | Rattachement aux notions déduit des blocs de la liste officielle (non publié). CR-179 et CR-180 sont en `societe.installation`, CR-186 en `societe.soins`. |
| [ ] | 2 | Leçon `societe/sejour-nationalite-permis` | societe | (leçon) | (leçon) | Écart entre fiche et droit en vigueur. La fiche demande le niveau A2 pour tout titre de plus d’un an. La leçon suit le décret n° 2025-647 : A2 pour une carte pluriannuelle, B1 pour une carte de résident. |
| [ ] | 2 | CR-202 | societe | Qui peut manger à la cantine scolaire ? | Tous les élèves qui le souhaitent, sans discrimination | La fiche dit qu’une cantine existe partout. La loi garantit l’accès à tous quand le service existe : la leçon et l’explication le précisent. |
| [ ] | 3 | Leçons `societe/*` | societe | (leçons) | (leçons) | Formulations prudentes face aux fiches : responsabilité civile (obligatoire pour une voiture et pour un locataire), déclaration d’impôt « au printemps », renouvellement du titre « au moins 3 mois avant ». |
| [ ] | 3 | Leçons `societe/*` | societe | (leçons) | (leçons) | Faits vérifiés hors des fiches : congé parental, allocations chômage (le seuil de 5 mois du 1er avril 2026 n’est pas cité), absences scolaires, vacances, contraception des mineurs, mariage religieux après le mariage civil. |
| [ ] | 3 | CR-181, CR-185, CR-197, CR-205 | societe | (voir le contenu) | (voir le contenu) | Réponses hors des fiches de la thématique. La source citée est la fiche officielle la plus proche. |
| [ ] | 3 | Leçon `societe/etat-civil-et-famille` | societe | (leçon) | (leçon) | La fiche « La déclaration de mariage » dit que le mariage entre cousins germains est interdit ; le Code civil l’autorise. La leçon n’en parle pas. Aucune question ne porte sur ce point. |
