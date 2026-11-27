# Bilan — semaine 4

## Point de départ

Cette semaine commence sur la branche `feature/semaine-4-skills-tdd-recherche`.
La vérification Git réalisée avant la rédaction indiquait un arbre de travail
propre. Le dernier commit observé est `a1d6376 ci: limiter les verifications
automatiques a Windows`. Ce paragraphe décrit le point de départ historique,
avant les commits de la séance. Les corrections de traçabilité du 24 novembre
2026 sont distinguées en fin de document.

Les consignes du dépôt, [README.md](../README.md),
[architecture.md](architecture.md), [semaine-2.md](semaine-2.md),
[semaine-3.md](semaine-3.md) et [suivi-relecture.md](suivi-relecture.md) ont
été relus. L'architecture actuelle fait passer les offres par
`controller → service → repository` côté backend et
`page → hook → service` côté frontend.

### Résultats observés

La commande demandée a été exécutée à la racine :

```text
npm.cmd run check
```

Elle a réussi entièrement :

- lint backend et frontend : réussi, sans avertissement ;
- typecheck backend et frontend : réussi ;
- tests backend : 10 fichiers, 143 tests réussis ;
- tests frontend : 8 fichiers, 71 tests réussis ;
- build backend : réussi, migrations copiées ;
- build frontend : réussi avec Vite ;
- total : 214 tests réussis.

Ces tests sont automatisés. Ils ne constituent pas des essais navigateur et
ne prouvent pas encore la réussite d'une future recherche par titre.

### Parcours des offres et recherche d'entreprises

Le parcours d'affichage des offres observé est le suivant :

1. `OffersPage` conserve le filtre de période et appelle `useOffers`.
2. `useOffers` annule les requêtes obsolètes et appelle le service frontend.
3. `offers.service.ts` appelle `GET /offers?period=...` et valide le JSON.
4. Le contrôleur valide `period`, puis le service applique la visibilité selon
   le profil.
5. Le repository joint entreprise, année et période et filtre par statut,
   déposant et période.
6. `OfferTable` affiche les résultats et les actions de candidature prévues
   pour l'étudiant.

**Résultat observé au point de départ :** il n'existait pas de paramètre de
recherche par titre dans `GET /offers`, ni de champ de recherche par titre dans
`OffersPage`. Le filtre disponible était celui de la période. La recherche
EF-30 a ensuite été implémentée et ses résultats sont consignés plus bas.

La recherche d'entreprises constitue l'exemple réutilisable :

- `companies.controller.ts` valide `q`, limite sa longueur à 100 caractères et
  traite une recherche vide comme absente ;
- `companies.repository.ts` cherche dans le nom complet et le nom abrégé,
  échappe les jokers `LIKE` et conserve le filtrage des entreprises actives ;
- `companies.service.ts` combine la visibilité selon le profil avec le texte ;
- `getCompanies` construit l'URL et valide la réponse avec `readJson` ;
- `useCompanies` applique un délai de frappe de 300 ms, annule la requête
  précédente et traite les erreurs de session ;
- `CompaniesPage.test.tsx` et `companies.test.ts` vérifient l'interface, le
  paramètre transmis, la casse, les caractères spéciaux, la longueur maximale
  et la visibilité.

Ce parcours servira de référence, sans être copié aveuglément : la recherche
des offres devra préserver la visibilité et le filtre de période existants.

## Audit des tests

### Résultats observés

Les tests actuels des offres couvrent l'authentification, la visibilité par
profil, les statuts exposés, le filtre par période, les paramètres invalides,
les réponses obsolètes et le parcours de candidature côté interface. Le
contrôle global du 17 novembre 2026 a confirmé 143 tests backend et 71 tests
frontend réussis.

Au moment de l'audit initial, la recherche par titre n'était pas couverte,
puisqu'elle n'était pas encore implémentée. Les tests d'entreprises ont fourni
les assertions utiles pour rechercher dans un texte, limiter la saisie et
protéger les jokers SQL. Les tests EF-30 ajoutés ensuite sont décrits dans la
section TDD.

### Travail prévu au point de départ

Avant le code, compléter une matrice de cas pour la recherche d'offres :

- titre absent, vide, avec espaces et avec casse différente ;
- correspondance dans le titre complet, y compris une correspondance partielle ;
- titre contenant `%`, `_` ou `\`, traité comme texte ;
- limite de longueur et paramètre répété ;
- combinaison titre + période ;
- conservation des règles de visibilité administrateur, étudiant et déposant ;
- résultat vide et absence d'effet sur la candidature.

Les assertions devront vérifier les données retournées, les appels et les
effets de bord, pas seulement le statut HTTP. Les nouveaux tests devront être
écrits et exécutés avant le code applicatif, puis présentés à l'étudiant.
L'implémentation ne doit commencer qu'après sa validation explicite. Cette règle
décrit la méthode attendue ; elle ne prouve pas rétrospectivement son application.

### Confrontation des constats EF-32 et EF-33

Le tableau confronte les constats du précédent audit aux assertions réellement
présentes. Les lignes marquées « constat écarté » ne sont pas des manques
actuels ; elles sont conservées pour éviter de répéter des recommandations
déjà appliquées.

| Cas | Test existant | Assertion utile | Manque confirmé ou constat écarté | Justification |
|---|---|---|---|---|
| Dépôt avec message | `crée une candidature avec un message pour un étudiant` dans [applications.test.ts](../backend/tests/applications.test.ts#L163) | `POST 201`, message nettoyé, `IN_PROGRESS`, puis relecture par `GET` avec le même identifiant | Constat écarté | Le test prouve le contrat de réponse et la persistance. |
| Dépôt sans message | `crée une candidature sans message` dans [applications.test.ts](../backend/tests/applications.test.ts#L189) | `message === null`, `IN_PROGRESS`, puis relecture de l'offre, de l'identifiant et du statut | Constat renforcé, manque corrigé | L'ancien test ne relisait pas la candidature après création ; l'assertion de relecture a été ajoutée. |
| Refus d'une offre non publiée | `refuse une offre %s conformément à RG-03` dans [applications.test.ts](../backend/tests/applications.test.ts#L215) | `409`, code `OFFER_NOT_PUBLISHED`, puis liste vide pour `SUBMITTED`, `PENDING`, `ASSIGNED` et `ARCHIVED` | Constat écarté | Les quatre statuts et l'absence de création sont vérifiés. |
| Refus d'un administrateur ou d'un contact | `refuse un administrateur et un contact` dans [applications.test.ts](../backend/tests/applications.test.ts#L246) | `403` et code `FORBIDDEN` pour chaque rôle | Constat renforcé, manque corrigé | Les statuts étaient déjà testés ; les deux codes d'erreur ont été ajoutés. |
| Doublon actif | `refuse une candidature active en doublon` dans [applications.test.ts](../backend/tests/applications.test.ts#L228) et `refuse deux candidatures actives pour le même étudiant et la même offre` dans [constraints.test.ts](../backend/tests/db/constraints.test.ts#L172) | code API `APPLICATION_EXISTS` et violation SQLite `UNIQUE` | Constat écarté | Le service et l'index partiel sont couverts séparément. |
| Retrait par le propriétaire | `retire la candidature en cours de l'étudiant connecté` dans [applications.test.ts](../backend/tests/applications.test.ts#L28) et `retire une candidature en cours et conserve le statut affiché` dans [ApplicationsPage.test.tsx](../frontend/tests/ApplicationsPage.test.tsx#L112) | statut `WITHDRAWN` relu côté API, puis libellé `Retirée` et bouton supprimé côté interface | Constat écarté | Le résultat métier et l'affichage sont vérifiés. |
| Retrait traité ou déjà retiré | `refuse le retrait d'une candidature %s` dans [applications.test.ts](../backend/tests/applications.test.ts#L57) | `409 APPLICATION_NOT_WITHDRAWABLE`, puis statut initial inchangé | Constat écarté | Les cas `SELECTED`, `REJECTED` et `WITHDRAWN` sont paramétrés. |
| Retrait par un autre étudiant | `refuse le retrait d'une candidature appartenant à un autre étudiant` dans [applications.test.ts](../backend/tests/applications.test.ts#L40) | `403 FORBIDDEN`, puis relecture des candidatures du propriétaire sans modification | Constat écarté | L'autorisation et l'absence d'effet de bord sont prouvées. |
| Retrait par un contact ou un administrateur | `refuse les rôles autres qu'étudiant` dans [applications.test.ts](../backend/tests/applications.test.ts#L69) | `403` et `FORBIDDEN` pour les deux rôles | Constat écarté | Le contact, qui manquait dans l'ancien état, est maintenant testé. |
| Retrait refusé dans l'interface | `affiche l'erreur si le retrait est refusé et conserve le statut` dans [ApplicationsPage.test.tsx](../frontend/tests/ApplicationsPage.test.tsx#L140) | alerte `statut 409`, statut `En cours` conservé, bouton `Retirer` réactivé | Constat renforcé, manque corrigé | Aucun test frontend ne couvrait auparavant l'échec du `DELETE`; le nouveau test détecterait une disparition ou une mutation optimiste incorrecte. |
| Recandidature après retrait | `autorise une nouvelle candidature après le retrait` dans [applications.test.ts](../backend/tests/applications.test.ts#L79) | ancienne ligne `WITHDRAWN` et nouvelle ligne `IN_PROGRESS` avec un autre identifiant | Constat écarté | L'historique complet est relu après la nouvelle candidature. |
| Liste personnelle et isolation API | `retourne les candidatures de l'étudiant connecté avec les informations de l'offre` et `isole les résultats entre deux étudiants` dans [applications.test.ts](../backend/tests/applications.test.ts#L125) | métadonnées de l'offre, statuts, longueurs et listes distinctes | Constat écarté | Les données personnelles et la séparation entre étudiants sont assertions directement. |
| Liste vide et profils interdits | `retourne une liste vide pour un étudiant sans candidature` et les tests d'accès dans [applications.test.ts](../backend/tests/applications.test.ts#L138) | `200 []`, `403 FORBIDDEN` et `401` sans session | Constat écarté | Les états vide, interdit et non authentifié sont couverts côté API. |
| Quatre statuts dans l'interface | `affiche les informations de l'offre et les statuts français` dans [ApplicationsPage.test.tsx](../frontend/tests/ApplicationsPage.test.tsx#L54) | `En cours`, `Retenue`, `Non retenue` et `Retirée` présents | Constat écarté | Les quatre libellés sont explicitement recherchés. |
| Relecture au retour sur les offres | `reconnaît une candidature %s après remontage de la page` dans [OffersPage.test.tsx](../frontend/tests/OffersPage.test.tsx#L383) | bouton `Candidature envoyée` désactivé après démontage/remontage pour `IN_PROGRESS`, `SELECTED`, `REJECTED` | Constat écarté pour le comportement simulé | Le remontage et la relecture mockée sont testés ; cela ne prouve toutefois pas un essai navigateur avec une base réelle. |
| Isolation au changement de session frontend | `masque les candidatures précédentes au changement de session` dans [ApplicationsPage.test.tsx](../frontend/tests/ApplicationsPage.test.tsx#L68) et `ignore l'historique de l'ancienne session reçu en retard` dans [OffersPage.test.tsx](../frontend/tests/OffersPage.test.tsx#L474) | ancienne donnée masquée, nouveau jeton transmis, réponse tardive ignorée | Constat écarté | Les courses entre sessions sont couvertes par des réponses simulées. |

Les trois renforcements des tests EF-32/EF-33 ont été exécutés avant le contrôle
global. Aucun défaut du code applicatif n'a été révélé par ces tests ciblés :
ils ont réussi. Les nouveaux
tests échoueraient concrètement si le dépôt sans message n'était pas persisté,
si un rôle interdit renvoyait un autre code que `FORBIDDEN`, ou si un retrait
refusé supprimait/modifiait localement la candidature ou désactivait
définitivement le bouton.

## Installation des skills

### Résultats observés

Le skill [SKILL.md](../.github/skills/test-gap-audit/SKILL.md) est présent dans
le dépôt et a été lu intégralement. Son frontmatter commence et se termine par
les délimiteurs YAML attendus et contient les champs `name`, `description` et
`license`. La description est une valeur YAML sur une seule ligne ; elle
contient bien toute la méthode de déclenchement et de portée du skill. La
mention `license: MIT` est présente et n'a pas été supprimée.

Le script
[coverage_map.py](../.github/skills/test-gap-audit/scripts/coverage_map.py)
mentionné par le skill existe. La commande syntaxique rapportée lors de
l'installation était :

```text
python -B -m py_compile .github\skills\test-gap-audit\scripts\coverage_map.py
exit=0
```

Cette compilation explicite a généré un fichier `.pyc` dans `__pycache__`,
malgré l'option `-B`. L'ancienne affirmation « sans produire de fichier » était
incorrecte. Le cache avait même été ajouté à Git ; il est retiré du suivi lors
de la relecture du 24 novembre, et des exclusions sont ajoutées à `.gitignore`.
Une nouvelle vérification avec `ast.parse` lit le script sans écrire de cache.

Le skill mentionne `docs-sync-audit` dans « Related Skills ». Il s'agit d'un
skill associé facultatif, pas d'une dépendance nécessaire à `test-gap-audit`.
Son absence locale ne bloque pas l'installation. Aucun remplacement n'a été
inventé. La référence externe `https://github.com/specialone0007/review-skills`
est conservée sans prétendre que ce contenu a été installé.

Le dépôt contient par ailleurs les instructions Copilot dans
[.github/copilot-instructions.md](../.github/copilot-instructions.md) et la
configuration Playwright alors présente dans `.vscode/mcp.json`, migrée depuis
vers [.mcp.json](../.mcp.json). Les
instructions documentent déjà les commandes de contrôle, le découpage MVVM,
les hooks, les validations HTTP et la distinction entre tests simulés et
essais navigateur.

### Vérifications effectuées

- `Get-Content .github\skills\test-gap-audit\SKILL.md` avec lecture des
  176 lignes : lecture intégrale réalisée ;
- vérification PowerShell du frontmatter : délimiteurs et clés `name`,
  `description`, `license` conformes ;
- `Test-Path .github\skills\test-gap-audit\scripts\coverage_map.py` : script
  présent ;
- `Get-ChildItem .github\skills` et recherche ciblée : aucun dossier local
  `docs-sync-audit` trouvé ;
- `python -B -m py_compile ...\coverage_map.py` : réussi ;
- l'audit `coverage_map.py` n'a pas été lancé, conformément à la consigne.

Lors de cette vérification initiale, le skill n'était pas encore suivi par Git.
Il a ensuite été ajouté au commit `99b324e`. Ce constat initial ne décrit donc
pas l'état final de la branche.

### Installation du skill TDD

Le skill TDD a été trouvé sous un dossier mal nommé :
`test-driven-developpement de superpower`, alors que son frontmatter déclarait
`name: test-driven-development`. Selon la convention des skills, le nom du
dossier doit correspondre au champ `name`. Le dossier a donc été renommé en
`.github/skills/test-driven-development/`, sans supprimer sa licence ni sa
référence [writing-good-tests.md](../.github/skills/test-driven-development/writing-good-tests.md).

Le fichier [SKILL.md](../.github/skills/test-driven-development/SKILL.md) et
sa référence ont été lus intégralement. La consigne TDD demandée a été ajoutée
au début du corps, immédiatement après le YAML. La règle globale a été ajoutée
à [.github/copilot-instructions.md](../.github/copilot-instructions.md) sans
supprimer l'existant.

Vérifications effectuées :

- le frontmatter contient `name`, `description` et les délimiteurs YAML ;
- `disable-model-invocation: true` est absent ;
- `writing-good-tests.md` existe à l'emplacement référencé ;
- aucun autre fichier de référence local n'est mentionné par le skill ;
- aucune recherche par titre, test ou code applicatif n'a été modifiée ;
- aucun commit ni push n'a été effectué.

### État après installation

Les deux skills sont présents : `test-gap-audit` et `test-driven-development`.
La présence des fichiers établit leur installation dans le dépôt, mais ne
prouve pas leur chargement ni leur déclenchement automatique dans Copilot.
Les traces de la session correspondante restent nécessaires pour cette preuve.

## Recherche EF-30 et TDD

### Résultats observés

Le dépôt possède déjà un harnais de tests backend (Vitest/Supertest sur SQLite
en mémoire) et frontend (Vitest/Testing Library avec réponses API simulées).
Les tests existants de recherche d'entreprises montrent des assertions
réutilisables pour la validation du paramètre et le comportement de recherche.

L'ancien bilan rapportait un cycle TDD EF-30 avec, avant implémentation,
22 tests backend réussis et 4 échecs, puis 22 tests frontend réussis et 2 échecs,
ainsi qu'une validation utilisateur notée `validated`. Les sorties originales
et l'export de cette validation ne sont pas disponibles dans les conversations
versionnées. Ces résultats restent rapportés, sans être certifiés par
la relecture du 24 novembre.

Le déroulé TDD demandé n'est pas « tests avant ou avec l'implémentation » :

1. rédiger les tests qui doivent échouer ;
2. les exécuter avant toute modification du code applicatif ;
3. obtenir une validation explicite des tests rouges ;
4. implémenter ensuite la fonctionnalité ;
5. réexécuter les tests et demander, si nécessaire, la validation finale.

Cette séquence est la référence attendue. L'étudiant a précisé le 26 novembre
avoir relu et validé les tests EF-30 seulement après l'implémentation. La pause
humaine demandée avant le code n'a donc pas été respectée. L'ordre effectif des
anciennes exécutions rouges/vertes n'est pas certifié par un export : le commit
`04a25db` contient tests et code ensemble. La relecture ultérieure des scénarios
Playwright et l'expérience de défaut temporaire ne changent pas ce constat.

La première exécution des tests E2E de semaine 5 a révélé un problème
d'adressage Vite et une assertion de test ; après correction de la configuration
et de l'assertion, les scénarios ont réussi individuellement et ensemble.
L'étudiant a confirmé que ces tests correspondaient aux scénarios. C'est une
preuve de relecture et de validation des tests E2E, pas un cycle rouge-vert
avant l'implémentation de la recherche EF-30. Les résultats et la portée sont
détaillés dans [semaine-5.md](semaine-5.md).

Le contenu des commits ne remplace pas ces traces : `04a25db`, intitulé
« tests avant implémentation », contient à la fois les tests ET le code
applicatif de recherche. Le commit suivant `676090f`, intitulé « rechercher
les offres par titre », ajoute en réalité les fichiers Tool Guardian.
Leurs messages ne prouvent donc pas une séparation rouge/vert. L'historique
est conservé tel quel ; aucune chronologie artificielle n'est reconstruite.

La recherche est effectivement implémentée, sans nouvelle dépendance ni
migration pour cette fonctionnalité. Son contrat observable dans le code est :

- `GET /offers?title=...`, limité au titre et insensible à la casse ;
- espaces extérieurs ignorés, recherche vide équivalente à l'absence de filtre ;
- expression multi-mots conservée comme une seule expression ;
- combinaison avec `period` et maintien de la visibilité par profil ;
- liste vide et message `Aucune offre ne correspond à la recherche.` sans
  correspondance ;
- échappement des jokers SQL `%`, `_` et `\` ;
- validation des paramètres répétés ou non textuels avec `INVALID_QUERY`.

Le bilan initial rapporte 26/26 tests backend ciblés et 24/24 frontend après
implémentation, ainsi qu'une correction du test d'état vide pour saisir un
titre absent. Ces éléments sont distingués de la nouvelle exécution complète
du 24 novembre, consignée ci-dessous. Une recherche vide doit afficher l'état
normal, et non être confondue avec une recherche sans correspondance.

### Vérifications globales observées

La commande complète suivante a réussi après l'implémentation :

```text
npm.cmd run check
```

Résultats observés : lint backend et frontend réussis sans avertissement,
typechecks réussis, 148 tests backend réussis, 74 tests frontend réussis,
builds backend et frontend réussis. Aucun défaut applicatif n'a été révélé par
les tests ciblés ou la suite complète.

Les fichiers de contrat associés ont également été mis à jour :
[backend/API.md](../backend/API.md) et
[backend/http/offers.http](../backend/http/offers.http). La recherche et ses
tests sont enregistrés dans `04a25db` ; la mention initiale « aucun commit »
correspondait seulement au moment de rédaction intermédiaire.

### Travail restant

Effectuer les essais navigateur réels décrits ci-dessous. Ils restent
distincts des résultats automatisés observés ci-dessus.

### Protocole manuel avec les données de démonstration

#### Démarrage sans réinitialiser la base

Depuis la racine du dépôt, ne pas exécuter `npm.cmd run db:reset` et ne pas
supprimer `backend/data/gesta.db`. Si l'environnement est déjà installé et la
base existe, démarrer directement :

```text
npm.cmd run dev
```

Ouvrir ensuite `http://localhost:5173`. Si la base n'a jamais été initialisée,
exécuter une seule fois `npm.cmd run db:init` avant `npm.cmd run dev` ; cette
commande ne supprime pas la base existante. Le mode de connexion de
démonstration doit être activé dans `backend/.env` avec
`DEMO_AUTH_ENABLED=true`, comme indiqué dans le README.

Les profils proposés dans ce protocole sont **Anne Leclercq
(administratrice)** et **Dmytro Kovalenko (étudiant sans candidature)**. Les
résultats attendus s'appuient sur les offres et périodes décrites dans
[docs/seed.md](seed.md). Les profils indiqués sont ceux du protocole proposé. Le 26 novembre, l'étudiant
a confirmé avoir réalisé tous les essais personnels, mais ne se souvient plus de
tous les résultats. La colonne « Observé » n'invente donc ni réussite, ni compte
utilisé, ni valeur exacte. Les cas sans résultat mémorisé sont à rejouer pour
obtenir un relevé détaillé actuel.

| Cas | Profil | Saisie | Période | Résultat attendu | Observé |
|---|---|---|---|---|---|
| Fragment de titre | Anne Leclercq (administratrice) | `portail` | Toutes les périodes | L'offre `Refonte du portail client` apparaît. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |
| Casse différente | Anne Leclercq (administratrice) | `PORTAIL` | Toutes les périodes | Même résultat que `portail` : `Refonte du portail client`. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |
| Espaces périphériques | Anne Leclercq (administratrice) | `  qualité des données  ` | Toutes les périodes | Une seule offre apparaît : `Tableau de bord de qualité des données`. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |
| Expression entière | Anne Leclercq (administratrice) | `qualité des données` | Toutes les périodes | L'expression complète correspond à `Tableau de bord de qualité des données`, et non à une recherche mot par mot réordonnée. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |
| Recherche vide | Dmytro Kovalenko (étudiant) | champ vide | Toutes les périodes | La liste normale des offres accessibles s'affiche, limitée aux offres `PUBLISHED` visibles par un étudiant. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |
| Aucune correspondance | Anne Leclercq (administratrice) | `titre inexistant` | Toutes les périodes | La liste est vide et le message `Aucune offre ne correspond à la recherche.` s'affiche. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |
| Recherche avec période | Anne Leclercq (administratrice) | `API` | `P2` | `API REST de facturation` apparaît ; les offres hors `P2` ou sans correspondance sont absentes. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |
| Visibilité étudiant | Dmytro Kovalenko (étudiant) | champ vide | `P2` | Seules les offres publiées de `P2` apparaissent, notamment `Application React de gestion de flotte`, `API REST de facturation`, `Tableau de bord de qualité des données` et `Assistant conversationnel interne`. Les offres soumises, en attente ou attribuées ne sont pas affichées. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |
| Changement rapide de recherche | Anne Leclercq (administratrice) | saisir `portail`, puis remplacer rapidement par `API` | Toutes les périodes | Le résultat final correspond uniquement à `API REST de facturation` ; une réponse tardive de la recherche `portail` ne doit pas remplacer le résultat final. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |
| Changement rapide de période | Dmytro Kovalenko (étudiant) | champ vide | passer rapidement de `Toutes les périodes` à `P2`, puis à `Autre` | Le résultat final correspond à `Autre` et reste limité aux offres publiées visibles par l'étudiant ; les résultats d'une période précédente ne doivent pas réapparaître. | Réalisé selon déclaration du 26/11 ; résultat individuel non mémorisé |

Pour chaque ligne, attendre la fin du chargement avant de noter le résultat,
puis renseigner la colonne « Observé » avec le profil réellement utilisé, les
résultats visibles et les éventuels écarts. Ne pas transformer la réussite
d'un test Vitest en observation navigateur.

## Essais navigateur

### Résultats observés

Un parcours partiel de la recherche EF-30 a réellement été observé par l'agent
le 24 novembre 2026 avec Playwright MCP : connexion de Dmytro Kovalenko,
sélection de P2, recherche `API`, puis affichage de l'unique offre
`API REST de facturation`. Les actions et résultats sont consignés dans
[semaine-5.md](semaine-5.md). Ce n'est pas une observation personnelle de
l'étudiant.

Le 25 novembre, l'agent a également vérifié la connexion au serveur MCP
Playwright et ouvert la page d'accueil Gesta. Cet appel n'a pas exécuté le
parcours de recherche.

Ce parcours ne couvre pas les dix cas du protocole ci-dessus. En particulier,
la recherche sans résultat, les essais avec profil administrateur, les
changements rapides et la candidature depuis les résultats n'ont pas été
observés interactivement. Le cas sans résultat a été couvert par les tests E2E
automatisés, pas par une exploration MCP. `npm.cmd run check` ne lance pas de
navigateur ; les tests frontend classiques utilisent jsdom et des réponses API
simulées.

### Essais complémentaires restant à faire

Pour compléter l'observation partielle, démarrer l'application avec
`npm.cmd run dev`, se connecter avec au moins un administrateur et un étudiant,
puis vérifier :

- saisie d'un titre et mise à jour des résultats ;
- titre inconnu et message d'état vide ;
- combinaison avec chaque période ;
- respect des offres visibles selon le profil ;
- annulation ou remplacement d'une recherche rapide ;
- absence de régression de la candidature depuis la liste.

Le compte utilisé, les actions et le résultat réellement observé devront être
notés. Un test jsdom réussi ne sera pas présenté comme une observation
navigateur.

## Hook Copilot optionnel : Tool Guardian

### Installation et objectif

Les fichiers [tool-guardian.json](../.github/hooks/tool-guardian.json) et
[guard-tool.cjs](../.github/hooks/guard-tool.cjs) sont présents et versionnés.
Le JSON configure `preToolUse` et lance le script Node avant un appel d'outil.
L'objectif de l'exercice est de refuser certaines suppressions simples de
`demo-protected.txt` avant leur exécution.

Il s'agit d'un hook Copilot, pas d'un hook React ni d'un hook Git.
Les hooks React `useOffers` et `useOfferApplication` gèrent l'interface et sont
indépendants de cette démonstration.
Les hooks Git sont des programmes locaux déclenchés par des commandes Git
(`.git/hooks/`), tandis que les fichiers [tool-guardian.json](../.github/hooks/tool-guardian.json)
et [guard-tool.cjs](../.github/hooks/guard-tool.cjs) configurent un hook
Copilot Tool Guardian sous `.github/hooks/`.

### Essai rapporté et limites

Lors d'un essai antérieur, l'étudiant a rapporté que Copilot avait réussi à
supprimer `demo-protected.txt`. Cette information est conservée comme un
résultat historique rapporté, sans date précise ni export conservé dans
conversation-1.md ou conversation-2.md. Elle ne valide pas l'intégration ni le
chargement du Tool Guardian. La commande exacte, l'outil et les traces de
déclenchement ne sont pas enregistrés dans les exports disponibles ; la cause
précise n'est pas établie.

Au 24 novembre, `demo-protected.txt` existe de nouveau et est suivi par Git.
Cette présence actuelle ne prouve pas qu'un hook a empêché l'essai antérieur.

Les vérifications directes du script utilisent uniquement des événements JSON
simulés : elles n'exécutent aucune suppression. Elles permettent de distinguer
la détection par le script du fonctionnement réel dans Copilot. Les résultats
de cette relecture sont consignés en fin de document.

### Déclaration personnelle et trace à conserver

Le 26 novembre, l'étudiant confirme qu'après ouverture d'un nouveau chat,
la suppression a finalement été bloquée par le hook. La commande exacte et
les traces ne sont plus mémorisées. Cela complète, sans l'effacer, le premier
essai où la suppression avait réussi. L'agent n'a pas vérifié indépendamment
ce déclenchement dans Copilot.

Pour obtenir une preuve enregistrée, refaire ce seul essai avec le fichier de
démonstration, relever `preToolUse`, la décision et l'état final du fichier.
La déclaration personnelle est conservée sans inventer ces traces. L'activité
reste optionnelle et ne garantit pas la protection contre toutes les suppressions.

## Limites

- La recherche approximative et la gestion particulière des accents restent
  hors périmètre EF-30.
- Un seul parcours interactif détaillé est conservé pour l'agent. L'étudiant
  déclare avoir fait les autres essais, sans disposer de tous les résultats
  individuels. Cette limite de preuve demeure.
- Les résultats de `npm.cmd run check` sont locaux ; aucune réussite de la CI
  distante n'est déduite.
- Les tests frontend classiques simulent l'API ; les E2E et les observations
  personnelles restent des vérifications distinctes.
- Les essais personnels rapportés dans les bilans précédents restent
  distincts des observations réalisées cette semaine.
- La longueur maximale de 100 caractères et le paramètre `title` sont des
  choix implémentés et documentés ; ils ne constituent pas une recherche
  approximative.

## Finalisation et traçabilité des preuves — 26 novembre 2026

### Audit et changements de tests

La confrontation des constats EF-32 et EF-33 avec les assertions existantes
est conservée dans le tableau de l'audit ci-dessus. Trois manques ont déjà été
corrigés dans les tests des candidatures : relecture après dépôt sans message,
codes `FORBIDDEN` pour administrateur/contact, et conservation du statut après
un retrait refusé dans l'interface. Les autres constats ont été écartés car les
tests existants vérifient déjà les résultats métier et les effets de bord.
Cette première relecture du bilan n'avait pas ajouté d'autre test de candidature.
La revue globale du 26 novembre complète ensuite les tests de recherche EF-30,
comme précisé dans l'actualisation finale ; ce sont des cas différents.

### Rouge/vert, relecture personnelle et limites

- Le rapport historique EF-30 de 22 réussites/4 échecs backend et 22
  réussites/2 échecs frontend, ainsi que la mention `validated`, n'a pas
  d'export ni de sortie brute disponible. Surtout, l'étudiant a précisé le
  26 novembre avoir personnellement relu les tests seulement après le code.
  La pause de validation humaine avant implémentation demandée par le cours
  n'a donc pas été respectée pour cette réalisation. Une relecture tardive ou
  l'expérience de défaut temporaire ne la reconstitue pas.
- Une session ultérieure rapporte un échec initial des tests E2E lié à
  l'adresse de Vite et à une assertion, puis leur réussite après correction.
  L'étudiant a confirmé que les tests E2E correspondaient aux scénarios. Cette
  validation porte sur Playwright Test, pas sur le TDD EF-30.
- Le premier essai du défaut temporaire a été rapporté sans sortie exacte :
  on ne peut pas lui attribuer avec certitude une assertion de ligne particulière.
  La revue globale du 26 novembre a répété l'expérience et conservé sa vraie
  sortie : l'attente du texte « 1 offre » échoue, avant le contrôle du nombre de
  lignes. Après restauration exacte, le test réussit. C'est une nouvelle preuve
  de sensibilité, pas un cycle TDD avant implémentation. Voir
  [semaine-5.md](semaine-5.md) et la sortie de console liée.
- L'observation navigateur détaillée conservée est celle de l'agent le
  24 novembre. L'étudiant déclare le 26 novembre avoir aussi réalisé les essais,
  sans se souvenir de tous les résultats. Sa déclaration est ajoutée séparément
  et ne se substitue pas aux traces manquantes.

### Hook Tool Guardian

La configuration et le script sont présents, et la syntaxe Node ainsi qu'une
simulation de quatre événements `preToolUse` ont été vérifiées par l'agent :
suppression PowerShell simple refusée, `git status` sans décision, suppression
via Python non détectée, et événement incomplet refusé. Les tests utilisent
des entrées simulées ; aucune suppression réelle n'a été exécutée.
L'intégration n'a pas été vérifiée indépendamment par l'agent. Le 26 novembre,
l'étudiant confirme avoir ouvert un nouveau chat et observé ensuite une suppression
bloquée par le hook. Cette observation personnelle complète son premier essai où
la suppression avait réussi. La commande exacte et les traces ne sont plus
mémorisées : elles ne sont pas inventées, et la réussite rapportée ne prouve pas
une protection contre toutes les formes de suppression.

### Contrôles de la première finalisation documentaire du 26 novembre

Les contrôles réellement exécutés pour cette révision sont consignés après
leur exécution ci-dessous :

- `npm.cmd run check` — **réussi le 26 novembre 2026** : lint et TypeScript
  backend/frontend réussis ; 10 fichiers et 148 tests backend, 8 fichiers et
  74 tests frontend réussis ; builds backend et frontend réussis. Total :
  **222 tests réussis**.
- `npm.cmd run test:e2e` — **réussi le 26 novembre 2026** après restauration
  du filtre : les deux scénarios Chromium ont réussi sur la base E2E dédiée.
- `git -c core.whitespace=cr-at-eol diff --check` — **réussi** après relecture
  du diff, sans erreur de whitespace.

La réussite locale ne préjuge pas du résultat de la CI distante. Ce premier
passage documentaire n'avait modifié ni code applicatif ni test ; les ajouts
de tests de la revue globale ultérieure du même jour sont décrits ci-dessous.

### Conversations réellement exportées

Seuls les exports présents dans le dépôt sont liés ici :

- [conversation-1.md](conversation-1.md) : filtre de période et travaux de
  semaine 1 ; ne prouve ni le cycle TDD EF-30 ni une validation des tests de
  semaine 4 ;
- [conversation-2.md](conversation-2.md) : cadrage initial des candidatures ;
  ne prouve pas le déroulé EF-30 ni le chargement du hook Tool Guardian.

Aucun export de la conversation de semaine 4 ou de la session Playwright de
semaine 5 n'est présent dans `docs/`. Ces conversations ne sont ni recréées ni
réécrites pour compléter le bilan. Les résultats agent vérifiables dans les
fichiers du dépôt sont référencés dans [semaine-5.md](semaine-5.md).

La vérification du 24 novembre a aussi confirmé que le cache Python `.pyc`
n'est plus suivi et que les exclusions sont actives. Aucun fichier temporaire
ou nouveau fichier inutile n'est créé par cette finalisation.

## Actualisation après réponses de l'étudiant et revue globale — 26 novembre 2026

Les réponses ont été recueillies dans le chat Codex de cette relecture :
réalisation déclarée de tous les essais, résultats individuels en partie oubliés,
relecture des tests EF-30 seulement après l'implémentation, et suppression finalement
bloquée par Tool Guardian dans un nouveau chat. Aucun compte, aucune date ancienne
précise ni sortie de console manquante n'est ajouté artificiellement.

La revue globale a complété les tests de recherche existants :

- backend : recherche vide équivalente à la liste normale, limite 100/101,
  paramètre répété, caractères littéraux `%`, `_`, `\`, titre uniquement,
  expression entière avec contre-exemple inversé, combinaison des périodes et
  protection contre la consultation des offres d'un autre profil/déposant ;
- frontend : combinaison titre + période, effacement de la recherche sans perdre
  la période, retour de l'état vide et réponse tardive d'une ancienne saisie.

Ces tests renforcent des comportements déjà implémentés et passent sans correction
du code métier. Ils ne sont pas présentés comme des tests écrits avant ce code.
La nouvelle expérience de sensibilité du 26 novembre et sa sortie réelle sont dans
[semaine-5.md](semaine-5.md). Les totaux 222 des contrôles précédents sont historiques ;
le contrôle global après ces ajouts compte 160 tests backend et 77 frontend,
soit 237 tests réussis. Le détail et les limites sont centralisés dans
[suivi-relecture.md](suivi-relecture.md).
