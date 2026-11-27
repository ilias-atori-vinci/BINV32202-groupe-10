# Architecture

Organisation du code de Gesta et parcours déjà implémentés.

## Vue d'ensemble

```text
gesta/
├── package.json        # workspaces npm et commandes communes
├── backend/            # API Express + SQLite
│   ├── API.md          # documentation des routes
│   ├── http/           # requêtes REST Client
│   ├── src/
│   └── tests/
├── frontend/           # application React (Vite)
│   ├── src/
│   └── tests/
└── docs/
```

En développement, le frontend appelle `/api/...`. Vite transmet ces requêtes au backend
(`http://localhost:3000`) en retirant le préfixe `/api`.

## Backend

```text
Requête HTTP
   ↓
main.ts → app.ts ─ middlewares (authenticate, authorize, errorHandler)
   ↓
controllers → services → repositories → SQLite
                 ↕
     mappers : DBO (ligne SQL) ↔ objet métier ↔ DTO (réponse de l'API)
```

| Dossier | Responsabilité |
|---|---|
| `main.ts` | Lit la configuration, initialise la base, démarre le serveur |
| `app.ts` | Crée l'application Express et branche routes et middlewares |
| `config.ts` | Variables d'environnement et garde du mode démo |
| `controllers/` | Routes, validation des paramètres et du corps, réponses HTTP |
| `services/` | Règles métier ; ne reçoivent jamais `Request` ni `Response` |
| `services/permissions.ts` | Règles d'accès nommées (`isAdmin`, `hasContactRole`, `canListOffers`…) |
| `repositories/` | Requêtes SQL ; retournent des DBO (données brutes) |
| `models/` | Types DBO, objets métier et DTO |
| `mappers/` | Conversions entre DBO, objets métier et DTO |
| `middlewares/` | `authenticate` (401), `authorize` (403), gestion centralisée des erreurs |
| `utils/` | `HttpError`, signature et vérification des jetons |
| `db/` | Connexion, migrations SQL, données de démonstration |

Chaque couche est créée par une fonction (`createCompaniesRepository(db)`,
`createCompaniesService(repository)`…) et assemblée dans `app.ts`. Les tests créent ainsi
une application complète sur une base SQLite en mémoire.

Une erreur se signale par `throw new HttpError(statut, code, message)`. Le middleware
`errorHandler` la transforme en réponse JSON `{ "error": { "code", "message" } }`.

### Base de données

- `db/migrations/NNN_nom.sql` : appliquées dans l'ordre de leur nom, une seule fois chacune
  (table `schema_migrations`). Pour faire évoluer le schéma, **ajoutez un nouveau fichier**
  (`002_….sql`) sans modifier les migrations existantes.
- Les clés étrangères, unicités et valeurs autorisées sont vérifiées par SQLite. Les règles
  métier (qui peut faire quoi, transitions de statut…) relèvent des services.
- Les statuts sont stockés en codes anglais (`PUBLISHED`) ; le frontend affiche les
  libellés français.
- `db/seed/` contient les données de démonstration, décrites dans [seed.md](seed.md).
  `seedIds.ts` donne un nom stable à chaque identifiant, utilisable dans les tests.

### Identification et droits

1. `POST /auth/demo-login` retourne un jeton qui ne contient que l'identité (`kind`, `id`).
2. Le frontend l'envoie dans l'en-tête `Authorization` de chaque requête.
3. `authenticate` vérifie le jeton, puis **relit en base** le compte, ses rôles et ses
   entreprises (`req.user`). Absent, invalide ou compte inactif : 401.
4. `authorize(règle)` refuse la requête avec un 403 si la règle n'est pas respectée.
5. Le service filtre les données selon l'utilisateur (par exemple, les offres visibles).

## Frontend

Le frontend suit le modèle MVVM du cours.

```text
pages → hooks → services ou utils → models
  ↓
components
```

| Dossier | Responsabilité |
|---|---|
| `models/` | Types des données reçues de l'API |
| `services/` | Appels HTTP ; vérifient le statut et valident le JSON avec un type guard |
| `utils/` | `readJson`, type guards, libellés français, stockage du jeton, règles d'affichage |
| `hooks/` | État prêt à afficher (`useCompanies`, `useOffers`…) et session (`useAuth`) |
| `components/` | Composants réutilisables, sans connaissance des routes |
| `pages/` | Une page par route ; assemble hooks et composants |
| `App.tsx` | Session (appel unique de `useAuth`) et routes |

`useAuth` est appelé une seule fois, dans `App`. Le jeton et la fonction de déconnexion
sont transmis aux pages par les props. Sur une réponse 401, les hooks appellent
`onUnauthorized` et l'utilisateur revient à l'écran de connexion.

## Parcours de référence

Deux fonctionnalités traversent toutes les couches. Elles servent de modèle pour les
nouvelles.

### Liste des entreprises

| Couche | Fichier |
|---|---|
| Route | `backend/src/controllers/companies.controller.ts` (`GET /companies?q=`) |
| Service | `backend/src/services/companies.service.ts` (entreprises actives pour les non-administrateurs) |
| Repository | `backend/src/repositories/companies.repository.ts` |
| Modèles et mapper | `backend/src/models/company.ts`, `backend/src/mappers/company.mapper.ts` |
| Tests API | `backend/tests/companies.test.ts` |
| Service frontend | `frontend/src/services/companies.service.ts` |
| Hook | `frontend/src/hooks/useCompanies.ts` (délai de frappe, annulation) |
| Page et composants | `frontend/src/pages/CompaniesPage.tsx`, `CompanyTable.tsx`, `SearchField.tsx` |
| Tests interface | `frontend/tests/CompaniesPage.test.tsx` |

### Liste des offres selon le profil

| Couche | Fichier |
|---|---|
| Route | `backend/src/controllers/offers.controller.ts` (`GET /offers`, `authorize(canListOffers)`) |
| Service | `backend/src/services/offers.service.ts` (visibilité selon le profil) |
| Repository | `backend/src/repositories/offers.repository.ts` (jointures entreprise, année, période) |
| Modèles et mapper | `backend/src/models/offer.ts`, `backend/src/mappers/offer.mapper.ts` |
| Tests API | `backend/tests/offers.test.ts` |
| Service frontend | `frontend/src/services/offers.service.ts` |
| Hook | `frontend/src/hooks/useOffers.ts` |
| Page et composants | `frontend/src/pages/OffersPage.tsx`, `OfferTable.tsx` |
| Tests interface | `frontend/tests/OffersPage.test.tsx`, `NavBar.test.tsx` |

## Tests

- Backend (`backend/tests/`) : Vitest et Supertest sur une base SQLite en mémoire, jamais
  sur la base de développement. `tests/helpers/testApp.ts` crée l'application ;
  `tokenFor(kind, id)` fournit un jeton pour un utilisateur du seed.
- Frontend (`frontend/tests/`) : Vitest et Testing Library ; `tests/helpers/fetchMock.ts`
  simule les réponses de l'API.

## Conventions particulières

- Les imports relatifs du backend se terminent par `.ts` : TypeScript les réécrit en
  `.js` à la compilation.
- Le jeton est envoyé tel quel dans l'en-tête `Authorization`, sans préfixe `Bearer`.
- Le port de l'API se règle avec `API_PORT` (et non `PORT`).

## Dépôt d'une candidature depuis les offres

`OffersPage` assemble les composants et conserve le filtre par période.
`useOfferApplication` relit les candidatures de l'étudiant, gère la sélection,
l'envoi, les erreurs et la confirmation. Il utilise `applications.service.ts`,
qui valide le statut HTTP puis le JSON via `readJson`.

Les candidatures `IN_PROGRESS`, `SELECTED` et `REJECTED` empêchent un nouvel
envoi pour la même offre. `WITHDRAWN` ne le bloque pas. Les actions sont proposées
après lecture des candidatures ; si celle-ci échoue, la page conserve les offres
et affiche une erreur. Un rechargement permet de réessayer. L'état est isolé par
session ; une réponse d'un ancien envoi ne modifie pas la session suivante.
Le serveur reste la protection définitive contre les doublons et les accès interdits.

## Exécution automatique des contrôles

`.github/workflows/check.yml` exécute `npm ci` puis `npm run check` avec la version
Node définie dans `.nvmrc`, sous Windows, lors des pushes et pull requests.
Les tests utilisent leur base SQLite en mémoire : le workflow ne lance ni
`npm run setup` ni une réinitialisation de base de développement.
L'existence du workflow ne prouve pas sa réussite : consulter le résultat de la PR.

## Recherche par titre et périmètre de la tranche EF-30

Le parcours est `OffersPage → useOffers → offers.service → GET /offers →
offers.controller → offers.service → offers.repository`. La page conserve les
valeurs de saisie ; le hook associe chaque chargement à la session, la période et
le titre, puis ignore les réponses obsolètes. Le contrôleur valide les paramètres,
le service conserve les droits et le repository combine les filtres en SQL paramétré.

La recherche est une sous-chaîne du titre, insensible à la casse dans le périmètre
retenu, avec espaces périphériques ignorés. Les mots restent une expression entière.
La période et le titre se combinent par intersection. `%`, `_` et `\` sont du
texte, pas des jokers saisis par l'utilisateur. Le choix projet d'une limite de
100 caractères et du nom `title` est documenté dans `backend/API.md`.

EF-30 n'est implémentée qu'en partie volontairement : les filtres entreprise/localité
et le catalogue automatiquement borné à l'année en cours ne sont pas ajoutés par
cette tranche. EF-31, la sélection du candidat et la création du stage ne sont pas
déclarées réalisées par les seules pages de listes.

## Écrans et critères observables des parcours réalisés

| Écran / exigence | Champs et actions visibles | Résultat attendu et refus |
|---|---|---|
| Connexion de démonstration | Choix d'un utilisateur fictif, déconnexion / changement de profil | L'identité et le profil affichés changent ; les résultats de la session précédente ne doivent pas être réutilisés. Ce mode n'est pas une authentification de production |
| Offres, tranche EF-30 | Recherche par titre, période Toutes/P1/P2/Autre, tableau et états chargement/erreur/vide | Seules les offres correspondant aux filtres ET aux droits sont retournées. Effacer le titre restaure la liste de la période conservée |
| Dépôt, EF-32 / RG-03 | Action Candidater sur une offre publiée, message facultatif, envoi/annulation | Création IN_PROGRESS et confirmation ; le serveur refuse les offres non publiées, les doublons non retirés et les autres rôles |
| Mes candidatures, EF-33 | Offre, entreprise, année, période, quatre statuts français | Un étudiant ne consulte que ses propres candidatures. Aucune route ou action de détail de candidature n'est exposée |
| Retrait, EF-32 | Action Retirer seulement pour IN_PROGRESS | La candidature reste dans l'historique avec WITHDRAWN ; le serveur refuse un autre propriétaire ou un statut traité. Une recandidature après retrait est permise |

Cette table décrit l'application actuelle et ses critères de vérification. Elle ne
remplace ni la première version du CdC ni les décisions client à retrouver.

## Tests end-to-end et MCP

- `playwright.config.ts` à la racine configure Chromium et `./e2e`.
- `e2e/prepare-e2e-db.mjs` prépare uniquement la base E2E dédiée ; les tests
  utilisent un vrai backend et un vrai frontend et des sessions indépendantes.
- `npm run test:e2e` est une commande distincte de `npm run check`. Le workflow
  Windows existant ne lance pas automatiquement les E2E.
- `.mcp.json` configure un serveur Playwright HTTP local : il expose des outils
  à l'agent. Les scripts Playwright Test ne l'utilisent pas et n'en ont pas besoin.
- Les sorties jsdom, API, E2E, MCP et les observations personnelles sont des
  preuves différentes et sont nommées comme telles dans les bilans.
