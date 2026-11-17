# Bilan de départ — semaine 4

## Point de départ

Cette semaine commence sur la branche `feature/semaine-4-skills-tdd-recherche`.
La vérification Git réalisée avant la rédaction indiquait un arbre de travail
propre. Le dernier commit observé est `a1d6376 ci: limiter les verifications
automatiques a Windows`. Aucun commit ni push n'est effectué pour ce document.

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
écrits avant ou avec l'implémentation, puis le contrôle global sera relancé.

### Confrontation des constats EF-32 et EF-33

Le tableau confronte les constats du précédent audit aux assertions réellement
présentes. Les lignes marquées « constat écarté » ne sont pas des manques
actuels ; elles sont conservées pour éviter de répéter des recommandations
déjà appliquées.

| Cas | Test existant | Assertion utile | Manque confirmé ou constat écarté | Justification |
|---|---|---|---|---|
| Dépôt avec message | `crée une candidature avec un message pour un étudiant` dans [applications.test.ts:163](../backend/tests/applications.test.ts:163) | `POST 201`, message nettoyé, `IN_PROGRESS`, puis relecture par `GET` avec le même identifiant | Constat écarté | Le test prouve le contrat de réponse et la persistance. |
| Dépôt sans message | `crée une candidature sans message` dans [applications.test.ts:189](../backend/tests/applications.test.ts:189) | `message === null`, `IN_PROGRESS`, puis relecture de l'offre, de l'identifiant et du statut | Constat renforcé, manque corrigé | L'ancien test ne relisait pas la candidature après création ; l'assertion de relecture a été ajoutée. |
| Refus d'une offre non publiée | `refuse une offre %s conformément à RG-03` dans [applications.test.ts:210](../backend/tests/applications.test.ts:210) | `409`, code `OFFER_NOT_PUBLISHED`, puis liste vide pour `SUBMITTED`, `PENDING`, `ASSIGNED` et `ARCHIVED` | Constat écarté | Les quatre statuts et l'absence de création sont vérifiés. |
| Refus d'un administrateur ou d'un contact | `refuse un administrateur et un contact` dans [applications.test.ts:246](../backend/tests/applications.test.ts:246) | `403` et code `FORBIDDEN` pour chaque rôle | Constat renforcé, manque corrigé | Les statuts étaient déjà testés ; les deux codes d'erreur ont été ajoutés. |
| Doublon actif | `refuse une candidature active en doublon` dans [applications.test.ts:228](../backend/tests/applications.test.ts:228) et `refuse deux candidatures actives pour le même étudiant et la même offre` dans [constraints.test.ts:172](../backend/tests/db/constraints.test.ts:172) | code API `APPLICATION_EXISTS` et violation SQLite `UNIQUE` | Constat écarté | Le service et l'index partiel sont couverts séparément. |
| Retrait par le propriétaire | `retire la candidature en cours de l'étudiant connecté` dans [applications.test.ts:28](../backend/tests/applications.test.ts:28) et `retire une candidature en cours et conserve le statut affiché` dans [ApplicationsPage.test.tsx:112](../frontend/tests/ApplicationsPage.test.tsx:112) | statut `WITHDRAWN` relu côté API, puis libellé `Retirée` et bouton supprimé côté interface | Constat écarté | Le résultat métier et l'affichage sont vérifiés. |
| Retrait traité ou déjà retiré | `refuse le retrait d'une candidature %s` dans [applications.test.ts:53](../backend/tests/applications.test.ts:53) | `409 APPLICATION_NOT_WITHDRAWABLE`, puis statut initial inchangé | Constat écarté | Les cas `SELECTED`, `REJECTED` et `WITHDRAWN` sont paramétrés. |
| Retrait par un autre étudiant | `refuse le retrait d'une candidature appartenant à un autre étudiant` dans [applications.test.ts:40](../backend/tests/applications.test.ts:40) | `403 FORBIDDEN`, puis relecture des candidatures du propriétaire sans modification | Constat écarté | L'autorisation et l'absence d'effet de bord sont prouvées. |
| Retrait par un contact ou un administrateur | `refuse les rôles autres qu'étudiant` dans [applications.test.ts:69](../backend/tests/applications.test.ts:69) | `403` et `FORBIDDEN` pour les deux rôles | Constat écarté | Le contact, qui manquait dans l'ancien état, est maintenant testé. |
| Retrait refusé dans l'interface | `affiche l'erreur si le retrait est refusé et conserve le statut` dans [ApplicationsPage.test.tsx:139](../frontend/tests/ApplicationsPage.test.tsx:139) | alerte `statut 409`, statut `En cours` conservé, bouton `Retirer` réactivé | Constat renforcé, manque corrigé | Aucun test frontend ne couvrait auparavant l'échec du `DELETE`; le nouveau test détecterait une disparition ou une mutation optimiste incorrecte. |
| Recandidature après retrait | `autorise une nouvelle candidature après le retrait` dans [applications.test.ts:79](../backend/tests/applications.test.ts:79) | ancienne ligne `WITHDRAWN` et nouvelle ligne `IN_PROGRESS` avec un autre identifiant | Constat écarté | L'historique complet est relu après la nouvelle candidature. |
| Liste personnelle et isolation API | `retourne les candidatures de l'étudiant connecté avec les informations de l'offre` et `isole les résultats entre deux étudiants` dans [applications.test.ts:101](../backend/tests/applications.test.ts:101) | métadonnées de l'offre, statuts, longueurs et listes distinctes | Constat écarté | Les données personnelles et la séparation entre étudiants sont assertions directement. |
| Liste vide et profils interdits | `retourne une liste vide pour un étudiant sans candidature` et les tests d'accès dans [applications.test.ts:138](../backend/tests/applications.test.ts:138) | `200 []`, `403 FORBIDDEN` et `401` sans session | Constat écarté | Les états vide, interdit et non authentifié sont couverts côté API. |
| Quatre statuts dans l'interface | `affiche les informations de l'offre et les statuts français` dans [ApplicationsPage.test.tsx:54](../frontend/tests/ApplicationsPage.test.tsx:54) | `En cours`, `Retenue`, `Non retenue` et `Retirée` présents | Constat écarté | Les quatre libellés sont explicitement recherchés. |
| Relecture au retour sur les offres | `reconnaît une candidature %s après remontage de la page` dans [OffersPage.test.tsx:288](../frontend/tests/OffersPage.test.tsx:288) | bouton `Candidature envoyée` désactivé après démontage/remontage pour `IN_PROGRESS`, `SELECTED`, `REJECTED` | Constat écarté pour le comportement simulé | Le remontage et la relecture mockée sont testés ; cela ne prouve toutefois pas un essai navigateur avec une base réelle. |
| Isolation au changement de session frontend | `masque les candidatures précédentes au changement de session` dans [ApplicationsPage.test.tsx:68](../frontend/tests/ApplicationsPage.test.tsx:68) et `ignore l'historique de l'ancienne session reçu en retard` dans [OffersPage.test.tsx:380](../frontend/tests/OffersPage.test.tsx:380) | ancienne donnée masquée, nouveau jeton transmis, réponse tardive ignorée | Constat écarté | Les courses entre sessions sont couvertes par des réponses simulées. |

Les trois renforcements ont été exécutés avant le contrôle global. Aucun défaut
du code applicatif n'a été révélé : les tests ciblés ont réussi. Les nouveaux
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
mentionné par le skill existe. La vérification syntaxique Python a réussi sans
produire de fichier :

```text
python -B -m py_compile .github\skills\test-gap-audit\scripts\coverage_map.py
exit=0
```

Le skill mentionne aussi `docs-sync-audit` dans sa section « Related Skills ».
La vérification du dépôt ne trouve pas de dossier
`.github/skills/docs-sync-audit/`. Cette ressource locale est donc signalée
comme manquante ; aucun remplacement n'a été inventé ou installé. L'URL
externe `https://github.com/specialone0007/review-skills` est conservée dans
le skill et n'a pas été traitée comme une installation locale.

Le dépôt contient par ailleurs les instructions Copilot dans
[.github/copilot-instructions.md](../.github/copilot-instructions.md) et la
configuration Playwright dans [.vscode/mcp.json](../.vscode/mcp.json). Les
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

Le skill et son dossier restent non suivis par Git dans l'état observé ; cette
vérification n'a créé ni commit ni push.

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

### Travail prévu

Identifier puis installer uniquement les skills nécessaires au travail
demandé, en vérifiant leur portée et leur mode d'activation avant de les
utiliser. La configuration ne devra pas remplacer les contrôles du dépôt ni
introduire une dépendance inutile. Toute installation effective et son
résultat seront consignés séparément ; cette section ne constitue pas une
preuve d'installation.

## Recherche EF-30 et TDD

### Résultats observés

Le dépôt possède déjà un harnais de tests backend (Vitest/Supertest sur SQLite
en mémoire) et frontend (Vitest/Testing Library avec réponses API simulées).
Les tests existants de recherche d'entreprises montrent des assertions
réutilisables pour la validation du paramètre et le comportement de recherche.

Un cycle TDD spécifique à EF-30 a été réalisé. Les tests rouges ont d'abord été
préparés et exécutés avant toute modification applicative :

- backend : 22 tests réussis et 4 échecs attendus sur les nouveaux cas ;
- frontend : 22 tests réussis et 2 échecs attendus sur les nouveaux cas.

Après la validation explicite de l'utilisateur (`validated`), l'implémentation
a été ajoutée sans dépendance ni migration. Le contrat obtenu est le suivant :

- `GET /offers?title=...`, limité au titre et insensible à la casse ;
- espaces extérieurs ignorés, recherche vide équivalente à l'absence de filtre ;
- expression multi-mots conservée comme une seule expression ;
- combinaison avec `period` et maintien de la visibilité par profil ;
- liste vide et message `Aucune offre ne correspond à la recherche.` sans
  correspondance ;
- échappement des jokers SQL `%`, `_` et `\` ;
- validation des paramètres répétés ou non textuels avec `INVALID_QUERY`.

Les tests ciblés après implémentation ont réussi : 26/26 backend et 24/24
frontend. Le test frontend d'état vide a d'abord été corrigé pour saisir
explicitement un titre absent ; le défaut concernait le test, car une saisie
réellement vide devait afficher `Aucune offre à afficher.`.

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
[backend/http/offers.http](../backend/http/offers.http). Aucun commit ni push
n'a été effectué.

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
[docs/seed.md](seed.md). La colonne « Observé » ne contient pas de résultat
personnel : chaque essai non exécuté est explicitement marqué **À réaliser**.

| Cas | Profil | Saisie | Période | Résultat attendu | Observé |
|---|---|---|---|---|---|
| Fragment de titre | Anne Leclercq (administratrice) | `portail` | Toutes les périodes | L'offre `Refonte du portail client` apparaît. | **À réaliser** |
| Casse différente | Anne Leclercq (administratrice) | `PORTAIL` | Toutes les périodes | Même résultat que `portail` : `Refonte du portail client`. | **À réaliser** |
| Espaces périphériques | Anne Leclercq (administratrice) | `  qualité des données  ` | Toutes les périodes | Une seule offre apparaît : `Tableau de bord de qualité des données`. | **À réaliser** |
| Expression entière | Anne Leclercq (administratrice) | `qualité des données` | Toutes les périodes | L'expression complète correspond à `Tableau de bord de qualité des données`, et non à une recherche mot par mot réordonnée. | **À réaliser** |
| Recherche vide | Dmytro Kovalenko (étudiant) | champ vide | Toutes les périodes | La liste normale des offres accessibles s'affiche, limitée aux offres `PUBLISHED` visibles par un étudiant. | **À réaliser** |
| Aucune correspondance | Anne Leclercq (administratrice) | `titre inexistant` | Toutes les périodes | La liste est vide et le message `Aucune offre ne correspond à la recherche.` s'affiche. | **À réaliser** |
| Recherche avec période | Anne Leclercq (administratrice) | `API` | `P2` | `API REST de facturation` apparaît ; les offres hors `P2` ou sans correspondance sont absentes. | **À réaliser** |
| Visibilité étudiant | Dmytro Kovalenko (étudiant) | champ vide | `P2` | Seules les offres publiées de `P2` apparaissent, notamment `Application React de gestion de flotte`, `API REST de facturation`, `Tableau de bord de qualité des données` et `Assistant conversationnel interne`. Les offres soumises, en attente ou attribuées ne sont pas affichées. | **À réaliser** |
| Changement rapide de recherche | Anne Leclercq (administratrice) | saisir `portail`, puis remplacer rapidement par `API` | Toutes les périodes | Le résultat final correspond uniquement à `API REST de facturation` ; une réponse tardive de la recherche `portail` ne doit pas remplacer le résultat final. | **À réaliser** |
| Changement rapide de période | Dmytro Kovalenko (étudiant) | champ vide | passer rapidement de `Toutes les périodes` à `P2`, puis à `Autre` | Le résultat final correspond à `Autre` et reste limité aux offres publiées visibles par l'étudiant ; les résultats d'une période précédente ne doivent pas réapparaître. | **À réaliser** |

Pour chaque ligne, attendre la fin du chargement avant de noter le résultat,
puis renseigner la colonne « Observé » avec le profil réellement utilisé, les
résultats visibles et les éventuels écarts. Ne pas transformer la réussite
d'un test Vitest en observation navigateur.

## Essais navigateur

### Résultats observés

`npm.cmd run check` n'a exécuté aucun navigateur. Les tests frontend actuels
utilisent jsdom et des mocks d'API ; ils ne valident donc ni le lancement
simultané de l'API et de Vite, ni une recherche réelle dans l'interface.
Aucun essai navigateur réel n'a encore été exécuté après EF-30.

### Travail prévu

Après implémentation, démarrer l'application avec `npm.cmd run dev`, se
connecter avec au moins un administrateur et un étudiant, puis vérifier :

- saisie d'un titre et mise à jour des résultats ;
- titre inconnu et message d'état vide ;
- combinaison avec chaque période ;
- respect des offres visibles selon le profil ;
- annulation ou remplacement d'une recherche rapide ;
- absence de régression de la candidature depuis la liste.

Le compte utilisé, les actions et le résultat réellement observé devront être
notés. Un test jsdom réussi ne sera pas présenté comme une observation
navigateur.

## Hook optionnel

### Résultats observés

Le hook optionnel n'a pas été ajouté. La recherche tient dans le parcours
existant `OffersPage → useOffers → offers.service`, qui conserve déjà
l'annulation et l'isolation des sessions. Une abstraction supplémentaire
n'apporterait pas de bénéfice démontré pour ce périmètre.

### Travail prévu

Réévaluer ce choix uniquement si un futur besoin introduit un délai de frappe,
des erreurs de recherche dédiées ou un partage avec une autre page.

## Limites

- La recherche approximative et la gestion particulière des accents restent
  hors périmètre EF-30.
- Les essais navigateur réels restent à faire ; les résultats actuels sont
  uniquement automatisés.
- Les résultats de `npm.cmd run check` sont locaux ; aucune réussite de la CI
  distante n'est déduite.
- Les tests frontend simulent l'API et ne remplacent pas les essais dans un
  navigateur réel.
- Les essais personnels rapportés dans les bilans précédents restent
  distincts des observations réalisées cette semaine.
- La longueur maximale de 100 caractères et le paramètre `title` sont des
  choix implémentés et documentés ; ils ne constituent pas une recherche
  approximative.

## Clôture et traçabilité des preuves

### Ce qui a été vérifié par l'agent

- Le cycle TDD EF-30 est attesté dans la conversation exportée :
  [conversation-1.md](conversation-1.md). Les nouveaux tests ont été observés
  en échec avant l'implémentation, puis en réussite après le code. Les
  résultats ciblés consignés sont 26/26 backend et 24/24 frontend.
- La confrontation des constats EF-32 et EF-33 et les tests ajoutés sont
  détaillés dans la présente page. Les assertions portent sur le résultat
  métier, la persistance, les droits et les effets de bord ; aucun test
  supplémentaire n'est justifié par les constats déjà écartés.
- Le contrôle réellement relancé le 17 novembre 2026 est :

  ```text
  npm.cmd run check
  ```

  Résultat : **réussi**. Lint backend/frontend, vérifications TypeScript et
  builds backend/frontend réussis ; 10 fichiers et 148 tests backend réussis,
  8 fichiers et 74 tests frontend réussis, soit **222 tests réussis**.
- Le contrôle réellement relancé est également :

  ```text
  git -c core.whitespace=cr-at-eol diff --check
  ```

  Résultat : **réussi**, sans sortie ni erreur.

### Ce qui relève de la relecture personnelle

La relecture et la validation personnelles des tests ne sont pas documentées
par une observation indépendante dans les conversations exportées. Elles ne
doivent donc pas être présentées comme réalisées. La validation utilisateur
mentionnée dans le récit TDD est conservée comme élément de conversation, mais
elle ne remplace pas une nouvelle relecture personnelle explicitement
consignée.

Les essais navigateur n'ont pas été réalisés. Ni `npm.cmd run check`, ni les
tests jsdom ne constituent une observation dans un navigateur réel. Les dix
cas du protocole restent donc **À réaliser**, notamment la visibilité par
profil, les recherches rapides et la candidature depuis la liste.

### Hook et fichiers inutiles

Le hook optionnel n'a pas été réalisé : aucun hook Git n'a été ajouté ni
vérifié. Cette absence est volontaire et cohérente avec la décision de ne pas
ajouter une automatisation non nécessaire au périmètre.

Le diff relu ne contient pas de modification inutile à signaler. Le fichier
`demo-protected.txt`, conservé par la protection de l'environnement, n'a pas
été supprimé et n'est pas une modification fonctionnelle de cette semaine.
Il n'est pas inclus dans les changements documentés.

Les seules conversations exportées disponibles et réellement utilisées sont :

- [conversation-1.md](conversation-1.md), analyse, implémentation et validations
  de la recherche et du filtre ;
- [conversation-2.md](conversation-2.md), cadrage initial des candidatures,
  sans modification ni test exécuté dans cet export.

Aucune conversation exportée n'a été réécrite.
