# Semaine 5 — MCP et tests end-to-end avec Playwright

Cette séance prépare uniquement les scénarios de recherche des offres EF-30.
Aucun test Playwright n'est créé et aucun navigateur n'est piloté. Le périmètre
reste documentaire et ne modifie ni le code applicatif ni la base de
développement.

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

Résultats : **À réaliser**. Aucun essai, aucune observation navigateur et
aucun résultat personnel ne sont inventés.

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
session future. Aucun serveur n'a été lancé ni aucun appel d'outil observé pour
cette documentation.

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
est **À réaliser** jusqu'à l'observation d'un véritable appel d'outil MCP
réussi.

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

Aucune de ces options n'a été exécutée pour écrire cette page. Le résultat
est donc **À réaliser**.

## Comparaison

- Les tests Vitest/Testing Library de [frontend/tests/OffersPage.test.tsx](../frontend/tests/OffersPage.test.tsx)
  vérifient déjà l'interface avec des réponses API simulées.
- Les tests Supertest de [backend/tests/offers.test.ts](../backend/tests/offers.test.ts)
  vérifient le contrat HTTP, notamment la combinaison titre/Période et la
  visibilité étudiante en base SQLite de test.
- Les scénarios Playwright proposés couvriront le parcours complet :
  connexion de démonstration, navigation, champs contrôlés, requête au backend,
  rendu React et état visible.
- `npm run check` vérifie le dépôt globalement ; il ne démontre pas un parcours
  réel dans un navigateur.

## Limites

- Aucun navigateur réel n'a été lancé.
- Aucun test end-to-end n'a été généré.
- Aucun essai n'a été consigné comme réussi.
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
