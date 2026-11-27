# Semaine 5 — MCP et tests end-to-end avec Playwright

Phase 6 du projet, séance 10 du cours. Bilan actualisé le 26 novembre 2026.
Les vérifications de l'agent, les déclarations personnelles et les éléments
historiques sans sortie conservée sont distingués. Les deux tests E2E utilisent
la vraie application et une base dédiée ; ils ne passent pas par MCP.

## Scénarios et choix

Les états initiaux, actions et résultats attendus sont décrits dans
[e2e/recherche-offres/scenarios.md](../e2e/recherche-offres/scenarios.md).

1. **Cas nominal** : Dmytro Kovalenko, profil étudiant, recherche `API` en P2.
   L'unique offre attendue est `API REST de facturation`, entreprise Orbis,
   année 2026-2027, période P2, statut « Publiée ».
2. **Cas limite** : même profil, dans une session indépendante, recherche
   `zzzz-inexistant-742` en P2. Aucun tableau d'offres n'est affiché et le
   message exact est « Aucune offre ne correspond à la recherche. ».

Le premier cas contrôle une recherche réussie sur des offres réellement présentes ;
le second vérifie l'état vide après une recherche, plutôt qu'une page jamais
chargée. Chaque test vérifie d'abord les quatre offres publiées du seed, puis
agit par l'interface. Le résultat exige aussi l'absence de chargement persistant
et d'erreur. Aucun test ne crée ni ne retire une candidature.

La base de développement `backend/data/gesta.db` ne doit pas être réinitialisée.
L'exploration manuelle utilise les données existantes ; les scripts E2E préparent
uniquement `backend/data/e2e.db`.

## MCP : rôle, configuration et traces disponibles

MCP donne à l'agent l'accès aux outils décrits par un serveur. Dans l'activité
demandée, VS Code héberge Copilot et son client MCP ; Playwright MCP expose la
navigation, la lecture de page, les clics et la saisie. Un serveur sur localhost
est **local même s'il utilise HTTP** : transport et lieu d'exécution sont deux
notions différentes. MCP ne remplace ni l'API métier ni une suite de tests.

La configuration racine [.mcp.json](../.mcp.json) utilise `mcpServers`, une entrée
Playwright HTTP vers `http://localhost:8931/mcp` et `tools: ["*"]`. L'ancienne
entrée stdio de `.vscode/mcp.json` a été retirée pour éviter un doublon ; les
formats `servers` et `mcpServers` ne sont pas mélangés.

Lancement demandé par le cours, dans un terminal séparé :

```powershell
npx -y @playwright/mcp@latest --isolated --port 8931 --host 127.0.0.1
```

`--isolated` évite de conserver le profil du navigateur entre les sessions.
Le serveur reste sur la boucle locale. Démarrer l'application séparément avec
`npm.cmd run dev`, sans réinitialiser sa base. Vérifier le serveur dans les
personnalisations MCP de la session Copilot et observer un vrai appel ; ouvrir
simplement l'URL `/mcp` dans un navigateur ne valide pas le protocole.
Arrêter le serveur MCP avec Ctrl+C après l'exploration. Il n'est pas nécessaire
pour `npm.cmd run test:e2e`.

### Observations historiques rapportées

| Date | Action et retour consignés | Portée de la preuve disponible |
|---|---|---|
| 24 novembre | `openBrowserPage` ouvre Gesta ; `readPage` retourne la connexion et Dmytro ; `clickElement` ouvre sa session et les offres ; `runPlaywrightCode` sélectionne P2 et saisit API, puis retourne une seule ligne API REST de facturation | Parcours navigateur complet rapporté dans le bilan antérieur. Ces noms génériques ne suffisent pas à certifier qu'ils proviennent du serveur HTTP Playwright configuré. L'export original de la session n'est pas fourni |
| 25 novembre | `playwright-browser_navigate` sur `http://localhost:5173` retourne l'URL de Gesta, son titre et un instantané | Un appel est attribué au serveur MCP Playwright dans le compte rendu. Il ouvre l'accueil mais ne rejoue pas le scénario de recherche complet. La présence actuelle de la configuration seule ne prouve pas cet appel |

Le scénario 1 a donc un résultat navigateur rapporté comme réussi. Il ne faut
pas assembler ces sessions différentes et annoncer qu'elles prouvent deux appels
du même serveur pendant le scénario demandé. **Il reste à conserver l'export
réel d'un scénario exécuté avec au moins deux appels MCP identifiés**, leurs
retours et le contrôle personnel du résultat. Si l'export ancien est introuvable,
refaire cette étape et la dater comme un nouvel essai.

Le scénario 2 n'a pas de compte rendu d'exploration MCP ; sa vérification
**automatisée** est en revanche effectuée ci-dessous. L'énoncé exige un scénario
exploré par MCP, pas nécessairement les deux.

## Playwright Test : configuration et reproductibilité

La configuration [playwright.config.ts](../playwright.config.ts) est à la racine :
`testDir: "./e2e"`, un projet Chromium, un worker et des contextes indépendants.
Le frontend est servi sur `http://127.0.0.1:5173`, le backend sur le port 3000,
et le proxy Vite utilise ce backend. Les serveurs existants ne sont pas réutilisés.

Le script [prepare-e2e-db.mjs](../e2e/prepare-e2e-db.mjs) prépare uniquement
`backend/data/e2e.db` : fichiers E2E supprimés puis migrations et seed appliqués.
Il ne cible pas la base de développement. Les deux tests restent en lecture
seule et ne dépendent pas de leur ordre. Les rapports, traces locales MCP et
fichiers de base ne sont pas versionnés.

Commandes, depuis la racine :

```powershell
npx playwright install chromium
npm.cmd run test:e2e
npm.cmd run test:e2e
npm.cmd run check
```

L'installation de Chromium n'est nécessaire que si le navigateur est absent.
Pour observer une exécution : `npm.cmd run test:e2e -- --headed`.
`--list` liste les tests sans exécuter le navigateur. `npm run check` lance
lint, types, tests API/composants et builds ; il ne lance pas les E2E.
La CI existante reste sous Windows et n'inclut pas les E2E : aucune réussite
E2E distante n'est déduite de la réussite locale.

### Assertions et revue des tests

Le fichier [recherche-offres.spec.ts](../e2e/recherche-offres/recherche-offres.spec.ts)
contient les deux scénarios numérotés. La revue du 25 novembre a ajouté la
vérification de l'état initial, des attentes sur les vraies réponses API 200
contenant le titre et la période, et des assertions limitées au contenu principal.
Aucun délai fixe ni mock ne remplace la vraie recherche.

- **Scénario 1** : connexion Dmytro, période et recherche conservées, compteur
  « 1 offre », une seule ligne de données, titre et métadonnées exactes ;
  les autres offres initiales, les états vides et les erreurs sont absents.
- **Scénario 2** : même préparation indépendante, texte absent, message vide
  exact, absence de tableau, de titres initiaux, d'erreur et de chargement.

Le bilan antérieur rapporte un problème d'adressage Vite et une assertion corrigés
lors du premier essai. La configuration finale lie Vite à `127.0.0.1`. Ces erreurs
de préparation ne sont pas présentées comme une preuve TDD EF-30. L'étudiant a
indiqué le 26 novembre que sa relecture des tests EF-30 avait eu lieu après le code.

### Exécutions de l'agent

| Date et commande | Résultat |
|---|---|
| 25 novembre : `npm.cmd run test:e2e -- --list` | Deux tests Chromium listés |
| 25 novembre : `npm.cmd run test:e2e`, première puis seconde exécution | 2/2 réussis en 6,5 s, puis 2/2 en 6,6 s |
| 25 novembre : `npm.cmd run check` | 148 tests backend et 74 frontend, lint, types et builds réussis |
| 26 novembre, revue globale : `npm.cmd run check` après renforcement des tests de recherche | 160 tests backend et 77 frontend, lint, types et builds réussis, soit 237 tests hors E2E |
| 26 novembre : premier contrôle E2E de la revue globale | Deux scénarios réussis en 11,6 s |
| 26 novembre : deux exécutions finales successives après restauration | 2/2 réussis en 10,0 s puis 2/2 en 6,6 s |

Les résultats de l'exécution finale après l'expérience de sensibilité sont
consignés dans [suivi-relecture.md](suivi-relecture.md). Les avertissements de
couleur `NO_COLOR`/`FORCE_COLOR` de l'environnement ne sont pas des échecs de test.

La configuration et la spécification ont aussi été vérifiées avec TypeScript :

```powershell
.\node_modules\.bin\tsc.cmd --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --types node --skipLibCheck playwright.config.ts e2e/recherche-offres/recherche-offres.spec.ts
```

Le SHA-256 de la base de développement a été relevé avant et après les essais
sans changement : `7760E76A69CDFF3F603E12D999C64D27001FEA86A8069F5696DC3CE65BAE181B`.
Ces vérifications ont été effectuées par l'agent, pas personnellement par l'étudiant.

## Sensibilité à un défaut temporaire

### Essai du 25 novembre rapporté

Le filtre SQL du titre a temporairement été remplacé, avec accord de l'étudiant,
par `AND (@titlePattern IS NULL OR 1 = 1)`, puis restauré. Le résultat rouge
historique a été rapporté sans sortie complète conservée. Le point d'arrêt exact
n'est donc pas attribué rétrospectivement à une ligne particulière.

### Nouvelle expérience vérifiée le 26 novembre

La revue globale a répété le même défaut, sans modifier les tests ni les droits
ou le filtre de période. Le scénario 1 a été exécuté avec `--retries=0` :

1. **Défaut présent** : code de sortie 1. L'attente de « 1 offre » échoue car
   la recherche n'élimine plus les autres offres publiées de P2. La sortie
   désigne `getByRole('main').getByText('1 offre', { exact: true })`, pas
   l'assertion ultérieure sur le nombre de lignes.
2. **Restauration** : les octets du fichier applicatif d'origine ont été rétablis
   dans un bloc `finally`, et l'égalité a été vérifiée avant la suite.
3. **Après restauration** : la même commande réussit, code de sortie 0.

La sortie réelle, avec les séquences de couleur retirées, est conservée dans
[la preuve de sensibilité](preuves/2026-11-26-sensibilite-e2e.txt). Elle provient
d'une nouvelle exécution de Codex et n'est ni l'ancien essai de l'étudiant ni
une conversation Copilot reconstituée. Les chemins de traces temporaires cités
par la sortie ne garantissent pas que ces archives soient encore présentes.
Le défaut n'est pas conservé dans le code.

Cette expérience montre la détection de ce défaut pour ces données ; elle ne
prouve ni la couverture totale de la recherche ni l'ordre historique du TDD.

## Comparaison des approches

1. **Que permet MCP dans la conversation ?** Le client découvre des outils
   navigateur et transmet leurs retours à l'agent, qui peut adapter son action.
   L'appel `playwright-browser_navigate` consigné le 25 novembre illustre
   l'ouverture d'une page et la réception d'un état exploitable.
2. **Que conservent les scripts ?** Des actions, données et assertions versionnées,
   réexécutables sans agent ni serveur MCP. Le compte rendu d'une exploration
   ne suffit pas à réexécuter exactement les mêmes vérifications.
3. **Quand choisir chaque approche ?** MCP convient à l'exploration d'un écran
   ou à l'investigation d'un échec ; Playwright Test convient à la régression
   répétable après un changement. Les deux sont complémentaires. Cette
   comparaison technique est une synthèse du bilan, pas une citation inventée
   d'une préférence personnelle de l'étudiant.

## Déclarations personnelles et éléments à compléter

Le 26 novembre, l'étudiant confirme avoir réalisé tous les essais personnels
évoqués, mais ne se souvient plus de tous les résultats. Cette déclaration ne
transforme pas chaque cas en succès documenté. Les sorties de tests de l'agent
ci-dessus restent distinctes. Les anciennes observations détaillées peuvent
être complétées si leurs traces sont retrouvées, ou rejouées avec une nouvelle date.

Les seuls exports de conversations actuellement versionnés sont ceux des
semaines antérieures : `conversation-1.md` et `conversation-2.md`. Ils ne prouvent
pas la session MCP ni le TDD EF-30. Les nouveaux exports authentiques restent
à retrouver ou à effectuer depuis les chats conservés dans VS Code.
La sortie de console de cette revue n'est pas un remplacement de ces exports.

Avant remise : conserver un scénario avec deux appels réels du serveur MCP,
réunir les exports disponibles, relire le diff et vérifier les résultats de la
PR Windows. La remise Moodle et l'état des PR distantes n'ont pas été contrôlés
ici. Aucun résultat personnel ni aucune trace ancienne n'est fabriqué.
