# Spécification : préparation à l'examen civique, carte de résident

**Branche** : `001-examen-civique-cr`
**Créée le** : 2026-11-09
**Statut** : brouillon, en attente de validation des maquettes
**Maquettes** : https://claude.ai/artifact/QvTEUpySocxXHbC7e7gTWc
**Sources** : [docs/sources.md](../../docs/sources.md)

## Contexte

Depuis le 1er janvier 2026, une première carte de résident exige de réussir l'examen civique : 40 QCM en 45 minutes, 32 bonnes réponses minimum. Le ministère publie 209 questions de connaissance, sans corrigé. Les 12 mises en situation ne sont pas publiées.

L'application aide à réviser sur téléphone : un examen blanc pour situer son niveau, des leçons courtes, des cartes de révision espacée et un suivi de progression. Elle fonctionne sans compte ni serveur.

## Scénarios utilisateur et tests

### US1 - Créer son profil (priorité P1)

À la première ouverture, la personne saisit son prénom et, si elle la connaît, la date de son examen. Il n'y a qu'un profil par appareil : chacun utilise l'app sur son propre téléphone et ne voit que ses données. Pas de liste de profils ni de changement de profil.

**Pourquoi P1** : tout le suivi dépend du profil.

**Test indépendant** : ouvrir l'app vide, créer le profil, fermer et rouvrir l'app, modifier le prénom dans les réglages.

**Critères d'acceptation**
1. **Étant donné** une app sans profil, **quand** je l'ouvre, **alors** l'écran de première ouverture me demande mon prénom.
2. **Étant donné** un profil créé, **quand** je rouvre l'app, **alors** j'arrive directement sur l'accueil avec ma progression.
3. **Étant donné** les réglages, **quand** je touche « Effacer toutes mes données » et confirme, **alors** l'app revient à l'écran de première ouverture.

### US2 - Passer un examen blanc (priorité P1)

Depuis l'accueil, l'app recommande un examen blanc. Il reproduit l'examen réel : 40 questions (28 de connaissance, 12 mises en situation), 4 réponses dont 1 bonne, 45 minutes, correction à la fin.

**Pourquoi P1** : c'est le diagnostic qui oriente toute la révision.

**Test indépendant** : lancer un examen, répondre à 40 questions, vérifier le score.

**Critères d'acceptation**
1. **Étant donné** aucun examen passé, **quand** j'arrive sur l'accueil, **alors** la carte « Faites un examen blanc » est mise en avant.
2. **Étant donné** un examen en cours, **quand** le minuteur atteint 0, **alors** l'examen se termine et les questions sans réponse comptent comme fausses.
3. **Étant donné** un examen en cours, **quand** je ferme l'app puis la rouvre, **alors** je peux reprendre là où j'en étais.
4. **Étant donné** un examen, **quand** je réponds, **alors** l'app n'affiche pas si c'est juste avant la fin.

### US3 - Comprendre ses résultats et recevoir un plan de révision (priorité P1)

À la fin de l'examen : score sur 40, réussite ou non, score par thématique, et un plan de révision (leçons à lire, erreurs à revoir).

**Pourquoi P1** : c'est la valeur principale demandée.

**Test indépendant** : terminer un examen avec des erreurs ciblées sur une thématique et vérifier que le plan la priorise.

**Critères d'acceptation**
1. **Étant donné** un examen terminé, **quand** j'ouvre les résultats, **alors** je vois le score, l'écart au seuil de 32 et le score de chaque thématique.
2. **Étant donné** une thématique sous 80 %, **alors** elle est marquée « à renforcer ».
3. **Étant donné** des erreurs, **alors** le plan propose au plus 3 leçons, classées par nombre d'erreurs, puis la révision des erreurs en cartes.
4. **Étant donné** un examen terminé, **quand** j'ouvre la correction, **alors** chaque question montre ma réponse, la bonne réponse et une explication.

### US4 - Apprendre avec des leçons (priorité P2)

Cinq modules, un par thématique officielle. Chaque module contient des leçons courtes (5 à 8 minutes) avec un encadré « À retenir ». Chaque leçon est reliée aux questions officielles qu'elle couvre.

**Test indépendant** : ouvrir un module, lire une leçon, lancer « Me tester sur cette leçon ».

**Critères d'acceptation**
1. **Étant donné** l'accueil, **quand** je choisis un module, **alors** je vois ses leçons et celles déjà lues.
2. **Étant donné** une leçon lue, **quand** je lance le test, **alors** j'obtiens des cartes sur les questions liées à cette leçon.

### US5 - Réviser avec des cartes à répétition espacée (priorité P2)

Chaque question est une carte. Après avoir vu la réponse, je dis si je la connaissais : « Non », « Hésité » ou « Oui ». L'app reprogramme la carte en conséquence. Les erreurs d'examen deviennent des cartes du jour.

**Test indépendant** : réviser 10 cartes, avancer l'horloge d'un jour, vérifier quelles cartes reviennent.

**Critères d'acceptation**
1. **Étant donné** une erreur à l'examen blanc, **alors** la carte correspondante est due aujourd'hui.
2. **Étant donné** une carte notée « Oui », **alors** son intervalle augmente ; notée « Non », elle revient dans 10 minutes.

### US6 - Suivre sa progression et repasser un examen (priorité P3)

Historique des examens blancs, courbe des scores avec le seuil de 32, maîtrise par thématique, bouton pour repasser un examen.

**Test indépendant** : passer trois examens, vérifier l'historique et la courbe.

**Critères d'acceptation**
1. **Étant donné** plusieurs examens, **alors** la page Progrès les liste du plus ancien au plus récent avec leur score.
2. **Étant donné** la page Progrès, **quand** je touche « Refaire un examen blanc », **alors** un nouvel examen commence avec un nouveau tirage.

### Cas limites

- Le stockage du navigateur est vidé : l'app repart à zéro. Une sauvegarde manuelle (export et import d'un fichier) permet de restaurer.
- Safari peut effacer les données d'un site non utilisé pendant 7 jours. L'app installée sur l'écran d'accueil n'est pas concernée : l'app invite à l'installer.
- Aucun réseau : tout fonctionne hors ligne après la première visite.
- Deux examens commencés : un seul examen en cours ; en lancer un autre demande d'abandonner le premier.
- La liste officielle change : la nouvelle version remplace l'ancienne ; les questions retirées disparaissent des tirages mais restent visibles dans l'historique des examens passés.

## Exigences

### Exigences fonctionnelles

- **FR-001** : L'app DOIT gérer un seul profil local par appareil (prénom, date d'examen), sans compte ni mot de passe, modifiable et effaçable depuis les réglages.
- **FR-002** : L'app DOIT stocker toutes les données sur l'appareil et fonctionner hors ligne.
- **FR-003** : L'examen blanc DOIT compter 40 questions : 28 tirées des questions officielles de connaissance CR et 12 mises en situation.
- **FR-004** : La répartition par thématique DOIT suivre l'arrêté du 10 octobre 2025.
- **FR-005** : Chaque question DOIT avoir 4 réponses, 1 seule bonne, une explication et un lien vers la leçon qui la couvre.
- **FR-006** : Les mises en situation et les réponses DOIVENT être marquées comme rédigées par l'app, car aucun corrigé officiel n'existe.
- **FR-007** : L'examen DOIT être limité à 45 minutes et pouvoir être repris après fermeture de l'app.
- **FR-008** : Les résultats DOIVENT être enregistrés avec la date, la réponse à chaque question et le score par thématique.
- **FR-009** : Le plan de révision DOIT être calculé localement à partir des erreurs (règles décrites dans [plan.md](plan.md)).
- **FR-010** : Les cartes DOIVENT suivre un calendrier de répétition espacée à 3 niveaux de réponse.
- **FR-011** : L'app DOIT pouvoir être installée sur l'écran d'accueil d'un iPhone.
- **FR-012** : L'app DOIT permettre d'exporter et d'importer les données d'un profil dans un fichier.
- **FR-013** : Chaque leçon DOIT citer sa source officielle.
- **FR-014** : Les questions officielles DOIVENT correspondre à la dernière liste publiée par le ministère. Un script compare la copie locale à la liste en ligne et au jeu de données data.gouv, et signale toute différence.
- **FR-015** : Chaque thématique DOIT avoir sa couleur pastel, reprise partout (modules, questions, résultats, cartes), selon la palette de [plan.md](plan.md).

### Entités clés

- **Profil** : prénom, date d'examen facultative, date de création. Un seul par appareil.
- **Question** : identifiant, thématique, type (connaissance ou situation), officielle ou non, énoncé, 4 réponses, bonne réponse, explication, leçon liée.
- **Leçon** : identifiant, thématique, titre, durée de lecture, contenu, source.
- **Examen** : date de début et de fin, liste des questions tirées, réponses données, score total et par thématique.
- **État de carte** : question, niveau, prochaine date de révision.

## Critères de succès

- **SC-001** : Une nouvelle personne commence un examen blanc moins d'une minute après la première ouverture.
- **SC-002** : Les 209 questions officielles CR ont chacune 4 réponses, une explication et une leçon liée.
- **SC-003** : 100 % des réponses ont été relues par un humain avant la mise en ligne.
- **SC-004** : L'app reste utilisable sans réseau et en mode avion.
- **SC-005** : Le parcours complet (profil, examen, résultats, leçon, cartes) passe un test de bout en bout sur une largeur de téléphone (390 px).
- **SC-006** : Coût d'hébergement : 0 €.

## Hors périmètre v1

- Niveaux CSP et naturalisation.
- Plusieurs profils sur un même appareil.
- Synchronisation entre appareils et comptes en ligne.
- Coach IA rédigé par un modèle de langage.
- Traductions de l'interface.
