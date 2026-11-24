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

Le dépôt contient une configuration workspace dans
[.vscode/mcp.json](../.vscode/mcp.json). Elle déclare un serveur Playwright
lancé par `npx @playwright/mcp@latest`.

MCP fournit un canal standard pour exposer les capacités du serveur Playwright
à l'agent. Cette configuration établit la disponibilité déclarée du serveur,
mais elle ne prouve pas qu'il est chargé, accessible ou déjà utilisé dans une
session future. Aucun essai avec l'outil MCP n'a été effectué pour cette
documentation.

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

Pour les étapes Playwright ultérieures, le démarrage temporaire recommandé est
le serveur Playwright MCP déclaré dans `.vscode/mcp.json`, sous réserve que
chaque cas utilise un contexte nouveau. Une suite Playwright Test devra ensuite
être distinguée clairement de cette vérification MCP.

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
