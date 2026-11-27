# Gesta — projet de départ

Application web de gestion des stages, développée à partir de ce dépôt pendant les séances
du cours. Le dépôt fonctionne dès l'installation, mais il est **volontairement incomplet** :
les fonctionnalités métier listées plus bas sont à développer.

- Frontend : React, TypeScript, Vite (`frontend/`)
- Backend : Node.js, Express, TypeScript (`backend/`)
- Base de données : SQLite, fichier local créé automatiquement (`backend/data/gesta.db`)

## Prérequis

- Node.js 22.14 ou plus récent, avec npm : Node 24 LTS recommandé ; Node 22 et 26
  conviennent aussi. Si une autre version est déjà installée, essayez d'abord : le projet
  vous préviendra clairement si une mise à jour est nécessaire.
- Git
- Recommandé : Visual Studio Code avec l'extension REST Client, pour les fichiers `backend/http/*.http`

Pour lancer l'application, aucun autre outil n'est nécessaire : ni Python, ni
Visual Studio, ni compilateur. En
installant Node.js sous Windows, **ne cochez pas** la case qui propose d'installer les
« outils pour les modules natifs » (Chocolatey, Python, Visual Studio Build Tools) : elle
est inutile pour ce projet et télécharge plusieurs gigaoctets.

## Démarrage

À la racine du dépôt :

```bash
npm ci
npm run setup
npm run dev
```

- `npm ci` installe exactement les versions enregistrées dans `package-lock.json`, sans le
  modifier. Utilisez `npm install <paquet>` seulement pour ajouter une dépendance.
- Le fichier `.npmrc` empêche les dépendances d'exécuter des scripts à l'installation
  (`ignore-scripts=true`). Sans lui, npm tenterait de compiler better-sqlite3, ce qui
  exigerait Python et Visual Studio, alors que le paquet contient déjà ses versions
  précompilées pour Windows, macOS et Linux.
- `npm run setup` crée `backend/.env` (avec une clé de signature aléatoire) puis la base de
  données avec les données de démonstration. Il suffit de le lancer une fois.
- `npm run dev` démarre l'API sur http://localhost:3000 et l'application sur
  **http://localhost:5173**.

Choisissez ensuite un utilisateur fictif sur l'écran de connexion (voir « Mode démo »).

## Commandes

Toutes les commandes se lancent à la racine.

| Commande | Rôle |
|---|---|
| `npm run dev` | Démarre le backend et le frontend |
| `npm run setup` | Crée `backend/.env` s'il n'existe pas, puis initialise la base |
| `npm run db:init` | Crée la base et applique les migrations ; insère les données de démo si elle est vide |
| `npm run db:reset` | Supprime la base et la recrée avec les données de démo (arrêter `npm run dev` avant) |
| `npm run lint` | Oxlint, sans erreur ni avertissement toléré |
| `npm run typecheck` | Vérification TypeScript |
| `npm test` | Tests automatisés (Vitest) |
| `npm run build` | Compilation du backend et du frontend |
| `npm run check` | Lint, typecheck, tests et build : à lancer avant chaque commit important |
| `npm run test:e2e` | Deux scénarios Playwright Test avec Chromium, vrais serveurs et base E2E dédiée ; lancement séparé de `check` |
| `npm run test:e2e -- --headed` | Même suite avec navigateur visible |
| `npm run test:e2e -- --list` | Liste les tests E2E sans lancer le navigateur |

## Documentation

| Document | Contenu |
|---|---|
| [docs/cdc_gesta_developpement.md](docs/cdc_gesta_developpement.md) | Cahier des charges métier de Gesta |
| [docs/architecture.md](docs/architecture.md) | Organisation du code et parcours existants |
| [docs/suivi-relecture.md](docs/suivi-relecture.md) | État des phases 1 à 6, vérifications récentes et limites de preuve |
| [docs/bilan-1.md](docs/bilan-1.md) | Semaine 1 : découverte et filtre par période |
| [docs/semaine-2.md](docs/semaine-2.md) | Semaine 2 : candidatures |
| [docs/semaine-3.md](docs/semaine-3.md) | Semaine 3 : audit du harnais et des guides |
| [docs/semaine-4.md](docs/semaine-4.md) | Semaine 4 : skills, TDD et recherche |
| [docs/semaine-5.md](docs/semaine-5.md) | Semaine 5 : MCP et tests E2E |
| [e2e/recherche-offres/scenarios.md](e2e/recherche-offres/scenarios.md) | États initiaux et résultats attendus des scénarios E2E |
| [docs/seed.md](docs/seed.md) | Données de démonstration et utilisateurs fictifs |
| [backend/API.md](backend/API.md) | Routes de l'API, réponses et erreurs |

## Choix techniques

Les outils ont été choisis pour rester simples et lisibles :

| Choix | Pourquoi |
|---|---|
| SQLite avec `better-sqlite3` et SQL écrit à la main | Aucun serveur de base à installer (binaires précompilés, rien à compiler) ; requêtes visibles dans les repositories, sans ORM à apprendre |
| Migrations en fichiers `.sql` | Le schéma se lit directement ; une évolution est un nouveau fichier |
| Validation par type guards écrits à la main | Pratique du cours, sans bibliothèque supplémentaire |
| React Router, CSS simple | Pas de bibliothèque d'interface : moins de code et de contexte à explorer |
| Oxlint | Linter rapide, configuré pour les règles essentielles de React et TypeScript (hooks, dépendances des effets, `any`) |
| npm workspaces | Une installation et des commandes communes, sans outil de monorepo |
| Vitest, Supertest, Testing Library | Les mêmes outils pour le backend et le frontend |

## Ce qui est déjà en place

- Connexion de démonstration, navigation adaptée au profil, déconnexion.
- **Entreprises** : liste et recherche par nom (`GET /companies`). Un administrateur voit
  toutes les entreprises ; les autres utilisateurs, seulement les entreprises actives.
- **Offres** : liste en lecture seule (`GET /offers`), avec filtre facultatif
  par période (P1, P2 ou Autre) et recherche facultative dans le titre (`title`),
  filtrée selon le profil :
  - l'administrateur voit toutes les offres ;
  - l'étudiant voit les offres publiées ;
  - le déposant voit les offres qu'il a déposées ;
  - un contact sans rôle de déposant n'y a pas accès (403).
- **Candidatures** : un étudiant peut candidater à une offre publiée, consulter
  ses candidatures et retirer celles qui sont en cours. La liste des offres relit
  les candidatures existantes et désactive un nouvel envoi tant qu'une candidature
  non retirée existe pour l'offre.
- Schéma complet de la base : entreprises, contacts et rôles, étudiants, administrateurs,
  années et périodes, offres, candidatures et stages.
- Identification et contrôle des droits côté serveur, tests automatisés.

## Ce qui n'est pas implémenté

Ces fonctionnalités du cahier des charges n'existent pas encore, ni dans l'API ni dans
l'interface :

- création d'une offre par un déposant, modification ou retrait ;
- filtres supplémentaires des offres (année, entreprise, localité, statut…) ;
  la recherche par titre et le filtre par période sont déjà présents ;
- validation, mise en attente, publication ou archivage d'une offre par un administrateur ;
- sélection d'un candidat et création du stage ;
- déclaration d'un stage par un étudiant et validation par un administrateur ;
- gestion des entreprises, des contacts et de leurs rôles, détection et fusion des doublons ;
- conventions, exports Excel, gestion des années académiques ;
- connexion réelle par lien envoyé par e-mail.

## Mode démo

La connexion réelle (lien à usage unique envoyé par e-mail) n'est pas implémentée. Elle est
remplacée par un **mode démo** : on choisit un utilisateur fictif, **sans mot de passe**.

- Ce n'est **pas** une authentification : n'importe qui peut se connecter sous n'importe
  quelle identité. Ce mode est réservé au développement local.
- Il est activé par `DEMO_AUTH_ENABLED=true` dans `backend/.env`. Le serveur refuse de
  démarrer si ce mode est activé avec `NODE_ENV=production`.
- Le jeton de session ne contient que l'identité. Les rôles et les entreprises de
  l'utilisateur sont relus en base à chaque requête : le frontend ne peut pas les modifier.
- Seuls les comptes actifs apparaissent ; un contact doit avoir au moins un rôle.

## Dépannage

**« JWT_SECRET absent ou trop court »** : lancez `npm run setup`.

**« Node … est trop ancien pour ce projet »** au démarrage : mettez Node à jour (Node 24 LTS,
ou au minimum 22.14). Pour un Node 22 déjà installé, il suffit d'installer la dernière
version 22 par-dessus.

**Avertissement `EBADENGINE` pendant `npm ci`** : sans conséquence si l'installation se
termine. Certaines dépendances déclarent ne pas soutenir officiellement votre version de
Node (par exemple 23 ou 25) ; le projet fonctionne quand même.

**Une nouvelle dépendance ne fonctionne pas après son installation** : à cause de
`ignore-scripts=true` (voir « Démarrage »), ses scripts d'installation n'ont pas été
exécutés. C'est rare ; sa documentation indique alors la commande à lancer à la main.

**« Cannot find native binding » ou « @esbuild/… could not be found »** : un bug connu de
npm ([npm/cli#4828](https://github.com/npm/cli/issues/4828)) retire parfois des binaires
natifs de `package-lock.json` lors d'un `npm install`.

- Si vous n'avez pas ajouté de dépendance, restaurez le lockfile de Git et réinstallez :

  ```bash
  git checkout -- package-lock.json
  npm ci
  ```

- Si vous venez d'ajouter une dépendance, conservez d'abord votre diff et
  vérifiez les entrées de plateforme du lockfile. Ne supprimez pas systématiquement
  `package-lock.json` ni `node_modules` : cela peut résoudre d'autres versions et
  masquer la modification responsable. Pour un ajout ordinaire, utilisez
  `npm install <paquet> -w backend` ou `-w frontend`, puis relisez le lockfile.

Après avoir ajouté une dépendance, vérifiez que `package-lock.json` contient toujours
`@esbuild/win32-x64` et `@rolldown/binding-win32-x64-msvc` : sinon, l'installation échouera
chez les membres du groupe qui travaillent sous Windows.

**`npm run db:reset` échoue sous Windows** : arrêtez d'abord `npm run dev`, qui garde la
base ouverte.

**Port 5173 ou 3000 déjà utilisé** : un autre `npm run dev` tourne sans doute déjà. Le port
de l'API se change avec `API_PORT` dans `backend/.env`.

## Suivi des séances

Après chaque séance, ajoutez dans `docs/` la conversation exportée avec l'agent
(`conversation-1.md`, `conversation-2.md`…). En fin de projet, ajoutez `docs/bilan.md`.

Le workflow `.github/workflows/check.yml` lance `npm run check` sous Windows
lors des pushes et pull requests. Consulter le résultat réel sur GitHub avant de
considérer les contrôles distants comme réussis.

## Vérifications navigateur et isolation des données

Pour les E2E, installer Chromium si nécessaire avec `npx playwright install chromium`,
puis lancer `npm run test:e2e`. Playwright démarre ses serveurs sur 3000 et 5173 ;
arrêtez votre propre serveur sur ces ports avant le lancement. Il ne réutilise pas
une instance dont la base ou la configuration pourrait être différente.
La préparation cible uniquement `backend/data/e2e.db`. Ne pas lancer
`npm run db:reset` sur la base de développement pour préparer ces tests.

La configuration Playwright MCP est dans `.mcp.json`, distincte de Playwright Test.
Le serveur MCP n'est pas nécessaire pour lancer les fichiers `.spec.ts`.
Les preuves, déclarations personnelles, totaux datés et étapes encore incomplètes
sont dans `docs/suivi-relecture.md` ; les anciens nombres de tests des bilans
restent des résultats historiques. Une réussite locale ne certifie pas la CI
ni un essai personnel dans le navigateur.
