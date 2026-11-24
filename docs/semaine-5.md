# Semaine 5 — MCP et tests end-to-end avec Playwright

Cette séance prépare uniquement les scénarios de recherche des offres EF-30.
Aucun test Playwright n'est créé. Le périmètre reste documentaire et ne modifie
ni le code applicatif ni la base de développement. Le cas 1 a été observé dans
un navigateur réel le 24 novembre 2026 ; le cas 2 reste à réaliser.

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
Résultat du cas 2 : **À réaliser**. Aucun essai, aucune observation navigateur
ni aucune validation personnelle ne sont inventés pour le cas 2.

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
mais elle ne prouve pas qu'il est chargé, accessible ou déjà utilisé dans une
session future.

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
au serveur HTTP configuré sur le port `8931` reste **À réaliser** jusqu'à
l'observation d'un appel de ce serveur réussi. En revanche, les quatre appels
d'outils Playwright ci-dessus sont des observations réelles de la session
navigateur.

Une éventuelle session MCP devra conserver des actions et des assertions
observables, mais ne doit jamais réinitialiser la base de développement.

## Playwright Test

Playwright Test désigne le framework de tests automatisés `@playwright/test`
avec fichiers de spécification, fixtures, configuration et exécution en ligne
de commande. Il est distinct du serveur MCP Playwright.

À ce stade :

- aucun dossier `tests/e2e` ou `e2e/*.spec.ts` n'est créé ;
- aucune dépendance `@playwright/test` ni commande Playwright n'est ajoutée ;
- aucune configuration Playwright Test n'est créée ;
- aucun navigateur n'est lancé.

Le document [scenarios.md](../e2e/recherche-offres/scenarios.md) constitue
l'entrée de travail future : il faudra valider explicitement les deux
scénarios avant toute génération de test.

## Vérification par défaut temporaire

Dans l'état actuel, une vérification locale globale reste temporairement
possible avec `npm run check`, mais elle ne remplace pas un essai navigateur.
Cette commande couvre les travaux lint, TypeScript, Vitest et builds du dépôt,
pas les interactions Playwright avec la vraie interface.

Pour les étapes Playwright ultérieures, le démarrage recommandé est le serveur
HTTP Playwright porté par le port `8931` et déclaré dans `.mcp.json`, sous
réserve que chaque cas utilise un contexte nouveau. Une suite Playwright Test
devra ensuite être distinguée clairement de cette vérification MCP.

Aucune vérification globale `npm run check` ni aucun appel au serveur HTTP
Playwright sur le port `8931` n'a été ajouté comme résultat automatisé pour
cette page. Ces résultats restent donc **À réaliser**.

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
- Le cas 2 n'a pas été exécuté.
- Aucun test end-to-end n'a été généré.
- Le serveur HTTP Playwright configuré sur le port `8931` n'a pas été lancé ni
  vérifié par un appel MCP réel dans cette documentation.
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
