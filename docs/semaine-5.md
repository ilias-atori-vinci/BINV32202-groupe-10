# Semaine 5 — MCP et tests end-to-end avec Playwright

Cette séance porte sur les scénarios de recherche des offres EF-30, leur
exploration interactive et leur automatisation. Le cas 1 a été observé dans un
navigateur réel le 24 novembre 2026. Les deux tests Playwright Test ont ensuite
été relus, renforcés et exécutés deux fois par Codex le 25 novembre 2026, sur la
base E2E dédiée. Le code applicatif et la base de développement sont inchangés.
Ces exécutions ne sont pas des essais personnels de l'étudiant.

## Scénarios

Les scénarios détaillés sont disponibles dans
[e2e/recherche-offres/scenarios.md](../e2e/recherche-offres/scenarios.md).

1. **Cas nominal** : Dmytro Kovalenko recherche `API` avec P2. L'offre publiée
   `API REST de facturation` doit être la seule ligne visible.
2. **Cas limite** : avec le même étudiant et P2, une chaîne sans correspondance
   doit produire une liste sans ligne et afficher
   `Aucune offre ne correspond à la recherche.`

Les deux cas utilisent un contexte navigateur indépendant. La base locale doit
être conservée dans son état seedé ; `npm run db:reset` et toute modification
de la base sont exclus.

Résultat du cas 1 : **réussi lors de l'observation de l'agent**.
Résultat interactif du cas 2 : **À réaliser**. Son test automatisé a réussi
lors des deux exécutions du 25 novembre décrites ci-dessous. Aucune observation
personnelle ni exploration par MCP n'est inventée à partir de ce résultat.

## MCP

La configuration portable du dépôt est [.mcp.json](../.mcp.json). Elle utilise
le format racine `mcpServers` et déclare une entrée HTTP Playwright vers
`http://localhost:8931/mcp`, avec `tools: ["*"]`.

Migration depuis l'ancien format :

- L'ancienne entrée `.vscode/mcp.json` utilisait le format
  workspace `servers` avec un lancement stdio `npx @playwright/mcp@latest`.
- Cette entrée avait été conservée seule ; elle ne contenait aucun autre serveur
  à préserver.
- Elle a été retirée pour éviter que la même instance Playwright soit active à
  la fois en stdio et en HTTP.
- Le nouveau fichier racine utilise uniquement `mcpServers`; il ne mélange pas
  la clé `servers` de l'ancien format avec `mcpServers`.

MCP fournit un canal standard pour exposer les capacités du serveur Playwright
à l'agent. Cette configuration HTTP établit la disponibilité déclarée du serveur,
mais elle ne prouve pas à elle seule qu'il est chargé ou accessible. Une
connexion et un appel réel ont été vérifiés dans la session du 25 novembre
2026, comme décrit ci-dessous.

### Vérification de connexion MCP — 25 novembre 2026

**Observation de l'agent :**

- Serveur MCP utilisé : `Playwright`, configuré sur
  `http://localhost:8931/mcp`.
- `playwright-browser_navigate` — navigation demandée vers
  `http://localhost:5173` — résultat retourné : URL
  `http://localhost:5173/`, titre `Gesta`, avec un instantané de page signalé
  par l'outil.
- Résultat : la connexion au serveur MCP et cet appel Playwright ont réussi.
  La page d'accueil a été ouverte ; cette vérification n'a pas exécuté le
  parcours de recherche du scénario 1.

### Résultat réel du scénario MCP — 24 novembre 2026

**Observation de l'agent :**

- L'application Gesta a été ouverte sur `http://localhost:5173`.
- Les serveurs locaux ont été démarrés avec `npm.cmd run dev` puis arrêtés à
  la fin de l'essai ; aucune réinitialisation ni modification de la base n'a
  été effectuée.
- Dmytro Kovalenko a été sélectionné sur la page de connexion de démonstration.
- La navigation **Offres** a été ouverte.
- La période P2 a été sélectionnée.
- Le titre `API` a été saisi.
- Le tableau final retournait exactement une ligne :
  `API REST de facturation | Orbis | 2026-2027 | P2 | Publiée`.
- Aucun autre titre d'offre n'était visible, aucun chargement persistant ni
  message d'erreur n'était présenté.

Le scénario 1 est donc observé comme réussi dans cette session de navigateur.
Ce résultat ne couvre pas le scénario 2.

**Appels d'outils Playwright observés :**

1. `openBrowserPage` — action demandée : ouvrir
   `http://localhost:5173` dans un nouvel onglet — informations retournées :
   page Gesta ouverte, titre `Gesta`, URL locale visible.
2. `readPage` — action demandée : lire l'état de la page de connexion —
   informations retournées : titre `Connexion de démonstration` et bouton
   `Dmytro Kovalenko` visible.
3. `clickElement` — action demandée : connecter Dmytro Kovalenko, puis cliquer
   sur le lien `Offres` — informations retournées : l'utilisateur affiché est
   Dmytro Kovalenko, profil `Étudiant`, page `/offres` ouverte avec quatre
   offres publiées lors du contrôle initial.
4. `runPlaywrightCode` — action demandée : sélectionner P2, saisir `API`,
   attendre le chargement et lire les valeurs et le tableau — informations
   retournées : `period=P2`, `title=API`, `1 offre`, et une seule ligne
   `API REST de facturation`.

**Observation de l'étudiant :**

- Aucune validation personnelle, capture réalisée par l'étudiant ou observation
  indépendante n'est ajoutée à ce bilan. Aucun résultat personnel n'est donc
  présenté comme vérifié.

### Lancement manuel

Le serveur HTTP doit être lancé dans un terminal séparé, sans lancer ni
réinitialiser l'application ni sa base :

```powershell
npx @playwright/mcp@latest --port 8931 --host 127.0.0.1
```

Le processus doit rester actif pendant les essais. L'application Gesta peut
être démarrée séparément avec `npm run dev` si elle n'est pas déjà disponible,
sans exécuter `npm run db:reset`.

### Vérifications nécessaires

Avant une validation MCP, vérifier :

1. que le terminal du serveur affiche son écoute HTTP sur le port `8931` ;
2. que `http://localhost:8931/mcp` répond sans erreur de protocole ;
3. que l'entrée Playwright est chargée une seule fois après redémarrage ou
   rechargement du client MCP ;
4. que la liste des outils exposés comprend les outils Playwright nécessaires,
   puis qu'un outil réel répond ;
5. qu'un premier appel non destructif observe un navigateur réel, par exemple
   l'ouverture de `http://localhost:5173` ou une lecture de la page ;
6. qu'aucune modification de la base de développement n'est effectuée.

Une simple présence dans `.mcp.json`, l'absence de sortie d'erreur ou la
démarche de lancement ne constituent pas une preuve de connexion. La connexion
au serveur HTTP configuré sur le port `8931` et un appel non destructif sont
**vérifiés** par l'observation du 25 novembre 2026 ci-dessus. La liste complète
des outils exposés n'a pas été vérifiée dans cette observation. Les quatre
appels d'outils Playwright du scénario du 24 novembre restent les observations
de l'exécution complète de ce scénario, distinctes de la vérification de
connexion du 25 novembre.

Une éventuelle session MCP devra conserver des actions et des assertions
observables, mais ne doit jamais réinitialiser la base de développement.

## Playwright Test

Playwright Test désigne le framework de tests automatisés `@playwright/test`
avec fichiers de spécification, fixtures, configuration et exécution en ligne
de commande. Il est distinct du serveur MCP Playwright.

La configuration racine [playwright.config.ts](../playwright.config.ts)
conserve `testDir: "./e2e"` et un seul projet Chromium. Elle utilise
`http://127.0.0.1:5173` comme URL réelle du frontend. Playwright démarre
explicitement le backend sur le port `3000`, puis le frontend sur le port
`5173`; les serveurs existants ne sont pas réutilisés. Le proxy Vite cible
également `http://localhost:3000` grâce à `API_PORT=3000`.

Les tests utilisent une base SQLite dédiée
`backend/data/e2e.db`. Le script
[e2e/prepare-e2e-db.mjs](../e2e/prepare-e2e-db.mjs) supprime uniquement les
fichiers de cette base E2E, puis applique les migrations et le seed dans une
base vide. Il ne nomme jamais `backend/data/gesta.db` et ne lance pas
`npm run db:reset`. Chaque exécution prépare donc un état reproductible. Les
contextes Playwright isolent les sessions entre les tests.

Le lanceur [`package.json`](../package.json) fournit :

```text
npm run e2e:prepare
npm run test:e2e
```

Avant le premier lancement sur une nouvelle machine, Chromium peut être
installé avec :

```text
npx playwright install chromium
```

L'option `npm run test:e2e -- --list` vérifie seulement la configuration et
liste les tests sans navigateur. Les tests classiques s'exécutent avec
`npm.cmd run test:e2e`, sans serveur MCP.

### Revue des tests du prompt 5 — 25 novembre 2026

Le fichier [recherche-offres.spec.ts](../e2e/recherche-offres/recherche-offres.spec.ts)
contient deux tests, numérotés comme les scénarios. Les tests de Copilot avaient
déjà des assertions sur le tableau, ses métadonnées et le message vide. La revue
Codex a conservé ces contrôles et renforcé les points suivants :

- chaque test commence par une vraie connexion Dmytro dans un nouveau contexte ;
- avant la recherche, les quatre offres publiées attendues sont visibles,
  le titre recherché est vide et la période n'est pas filtrée. Une liste déjà
  vide ou un seed incorrect ne suffit donc pas à faire passer le scénario 2 ;
- les attentes réseau ciblent les vraies réponses GET des offres avec la
  période P2 et le titre saisi ; leurs statuts doivent être 200. Aucune réponse
  n'est simulée ou remplacée ;
- les assertions de rendu attendent l'état final sans temporisation fixe ;
- les lignes de données sont distinguées de l'en-tête du tableau, sans supposer
  que la deuxième ligne de toute la page représente nécessairement l'offre ;
- les assertions sont limitées au contenu principal. Le cas nominal exige une
  seule ligne, le titre et les métadonnées exactes, ainsi que l'absence des
  autres offres initialement visibles ; le cas limite exige le message exact,
  l'absence de tableau et l'absence de chargement ou d'erreur ;
- aucun test ne crée de candidature ni ne dépend d'une action du précédent.

Les traces locales `.playwright-mcp/` sont conservées sur la machine mais
ignorées par Git, comme les rapports et résultats Playwright déjà exclus.
La configuration existante qui démarre Vite sur `127.0.0.1` a été conservée.

### Exécutions réellement effectuées par Codex

| Commande | Résultat |
|---|---|
| `npm.cmd run test:e2e -- --list` | Deux tests Chromium trouvés dans le fichier de recherche |
| `npm.cmd run test:e2e` — première exécution | 2 tests réussis, 6,5 s |
| `npm.cmd run test:e2e` — seconde exécution successive | 2 tests réussis, 6,6 s |
| `npm.cmd run check` | Lint, TypeScript, 148 tests backend, 74 frontend et les deux builds réussis |
| Vérification TypeScript explicite de la configuration et du fichier E2E | Réussie avec la commande ci-dessous |

```powershell
.\node_modules\.bin\tsc.cmd --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --types node --skipLibCheck playwright.config.ts e2e/recherche-offres/recherche-offres.spec.ts
```

Les lancements Chromium ont été autorisés hors sandbox pour accéder au navigateur
et aux serveurs locaux. Les serveurs E2E sont démarrés par Playwright et ne
réutilisent pas une instance de développement existante. Les essais utilisent
la vraie application, sans MCP ni mock de l'API. `npm run check` reste distinct
des tests E2E et ne les lance pas automatiquement.

Le SHA-256 de `backend/data/gesta.db` a été comparé avant et après les exécutions :
il est inchangé (`7760E76A69CDFF3F603E12D999C64D27001FEA86A8069F5696DC3CE65BAE181B`).
Les modifications de données concernent uniquement la base E2E dédiée.

## Vérification par défaut temporaire

**À réaliser.** Aucun défaut n'a été introduit dans le code applicatif pendant
la revue du prompt 5. La réussite des tests ne remplace pas l'exercice demandé :
choisir un défaut minimal, observer l'échec du test à cause de ce défaut,
restaurer le code puis observer la réussite. Ne pas confondre cet exercice
avec une erreur de connexion, de configuration ou un échec d'installation.

Les sorties et observations devront être consignées à cette étape ; aucune
preuve rouge/vert n'est inventée ici. Le contrôle personnel de l'étudiant et
l'export des conversations réelles restent également distincts.

## Comparaison

- Les tests Vitest/Testing Library de [frontend/tests/OffersPage.test.tsx](../frontend/tests/OffersPage.test.tsx)
  vérifient déjà l'interface avec des réponses API simulées.
- Les tests Supertest de [backend/tests/offers.test.ts](../backend/tests/offers.test.ts)
  vérifient le contrat HTTP, notamment la combinaison titre/Période et la
  visibilité étudiante en base SQLite de test.
- Le cas 1 Playwright a couvert dans cette session le parcours complet :
  connexion de démonstration, navigation, champs contrôlés, requête au backend,
  rendu React et état visible.
- `npm run check` vérifie le dépôt globalement ; il ne démontre pas un parcours
  réel dans un navigateur.

## Limites

- Le cas 1 a été lancé et observé dans un navigateur réel par l'agent.
- Le cas 2 n'a pas été exploré interactivement par MCP ; son test automatisé
  a réussi lors des deux exécutions du 25 novembre.
- Les deux tests E2E sont présents et exécutés ; la vérification par défaut
  temporaire reste à réaliser.
- La connexion au serveur HTTP Playwright sur le port `8931` et l'ouverture de
  la page d'accueil par `playwright-browser_navigate` ont été vérifiées le
  25 novembre 2026 ; cette vérification ne constitue pas une nouvelle
  exécution complète du scénario 1.
- La base de développement n'a pas été réinitialisée ni modifiée.
- Les données du seed doivent être vérifiées au démarrage de chaque essai
  futur ; les titres et périodes peuvent être rendus invalides par une
  modification locale non prévue.
- Les sessions doivent rester indépendantes pour éviter qu'un token ou un
  filtre soit transmis d'un scénario à l'autre.
- Le chargement réel du serveur MCP, sa configuration effective et les
  résultats de session ne sont pas certifiés par cette documentation.
- Le contrôle personnel de l'étudiant reste distinct des validations
  automatisées et des observations de l'agent.
