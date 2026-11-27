# Suivi des phases 1 à 6 et des vérifications

Historique initial du 17 novembre 2026 sur `feature/semaine-3-harnais`, puis
revue globale du 26 novembre sur `feature/semaine-5-mcp-playwright-e2e`.
Les sections initiales ci-dessous décrivent la revue du 17 novembre. L'état
courant, les déclarations personnelles et les contrôles récents sont dans
l'actualisation du 26 novembre en fin de document. Aucun dialogue ancien n'est
reconstitué et les anciens totaux de tests sont conservés comme historiques.

## Corrections apportées

| Sujet | Constat | Correction |
|---|---|---|
| Identité du déposant | Le test n'examinait que `201` et l'offre retournée | Relecture des listes avant/après : nouvelle ligne chez l'étudiant connecté, liste inchangée pour l'identité envoyée dans le corps |
| Offre non publiée | Une offre soumise était le seul témoin | Test paramétré pour `SUBMITTED`, `PENDING`, `ASSIGNED`, `ARCHIVED`, avec absence de candidature créée |
| État de candidature dans les offres | L'état local était perdu au retour sur la page | Lecture des candidatures existantes ; blocage des nouvelles candidatures non retirées, recandidature possible après retrait |
| Architecture frontend | La page portait directement l'envoi et ses états | Extraction dans `useOfferApplication`, gestion des erreurs et isolation des sessions |
| Guides | Statut HTTP, formulaires et preuves insuffisamment explicites | Instructions précisées et parcours du hook documenté |
| Senseurs récurrents | Vérifications uniquement locales | Workflow GitHub Actions sous Windows, basé sur `npm run check` |
| Bilan de semaine 1 | Essais personnels imprécis | Limite explicitée, distinction avec les observations de Codex, méthode de relecture proposée |
| Bilan de semaine 2 | Mention d'un détail de candidature absent de l'interface | Mention retirée des preuves ; pas d'écran ajouté hors du périmètre demandé |
| Cahier des charges | D-11 ambiguë et liens vers des fichiers absents | Reformulation conforme à RG-01 et inventaire explicite des sources à retrouver |

## Vérifications de cette relecture

Les résultats finaux des commandes sont consignés dans le complément de
[semaine-3.md](semaine-3.md). Les tests frontend simulent l'API : ils ne sont
pas des essais navigateur et ne prouvent pas une reconnexion réelle.

Les tests sur le retour à la liste couvrent un démontage/remontage du composant
avec relecture de l'API. La persistance côté serveur est contrôlée séparément par
les tests d'intégration, avec des bases en mémoire isolées.

La CI est ajoutée mais n'a pas été exécutée sur GitHub pendant cette relecture.
La réussite locale ne permet pas de déclarer l'environnement distant Windows validé.

## Phase 1 : éléments à retrouver, sans fabrication rétroactive

Le CdC de développement disponible n'établit pas à lui seul votre démarche
personnelle de rédaction et de critique. Les pièces suivantes restent à retrouver
dans les archives du binôme ou dans les remises existantes :

- première version de votre CdC et version corrigée ;
- conversations réelles de rédaction et de relecture ;
- tableaux interview → CdC et CdC → interview, avec références et extraits vérifiés ;
- contrôle des colonnes/anomalies des trois exports et des cardinalités ;
- journal de vos corrections, constats écartés et questions au client.

Le fichier `conversation-2.md` existant est conservé tel quel : son contenu ne
permet pas de certifier ici l'exhaustivité de l'export. Les sources Web 2 citées dans l'audit ne sont pas incluses dans le dépôt et
n'avaient pas été revérifiées pendant la revue du 17 novembre. Elles ont depuis
été retrouvées dans les cours locaux et les pages ont été relues le 26 novembre ;
voir [semaine-3.md](semaine-3.md).

## Améliorations du CdC à valider avec le client

Ces propositions ne changent pas silencieusement le document de référence :

- compléter les principaux parcours avec champs, actions et erreurs des écrans ;
- associer à chaque exigence un critère de réception observable ;
- préciser les navigateurs et dimensions d'écran visés par ENF-01 ;
- transformer ENF-08 en scénarios d'évolution identifiés, plutôt qu'en garantie
  générale difficile à vérifier ;
- confirmer les hypothèses H avec le client avant d'en faire des décisions.

## Vérifications humaines restant à faire

Le protocole de [semaine-2.md](semaine-2.md) reste à réaliser pour les cas non
observés : dépôt sans message, rechargement, retrait, quatre statuts et séparation
entre deux sessions réelles. Les essais d'un agent doivent être attribués à l'agent,
et ceux de l'étudiant à l'étudiant, avec compte, action et résultat observé.

La remise Moodle et l'état des PR distantes ne sont pas vérifiés ici.
La recherche par titre, les skills TDD et le hook optionnel appartiennent à la
phase suivante ; aucun de ces éléments n'est implémenté dans ce complément.

## État par phase après la revue globale du 26 novembre 2026

| Phase du cours / bilan de développement | État vérifié et améliorations actuelles | Ce qui reste incomplet ou incertain |
|---|---|---|
| Phase 1 : cahier des charges | CdC de développement structuré en acteurs, EF/RG/ENF/MIG, décisions et hypothèses ; parcours et critères observables complétés dans l'architecture | La V1 personnelle, le journal critique, les deux matrices et les conversations de phase 1 ne sont pas retrouvés. Le CdC de développement et les bilans ne leur sont pas substitués |
| Phase 2 / semaine 1 : filtre | API et interface présentes ; visibilité et périodes couvertes ; bilan personnel actualisé | Essais déclarés faits, mais profils exacts et résultats individuels en partie oubliés. Les observations de Codex ne deviennent pas celles de l'étudiant |
| Phase 3 / semaine 2 : candidatures | Dépôt, consultation, retrait et refus serveur couverts ; bilan distingue code actuel et résultats historiques | Essais déclarés faits mais résultats détaillés non conservés ; aucune page de détail n'est annoncée à tort |
| Phase 4 / semaine 3 : harnais | Inventaire et traçabilité conservés ; pages Web 2 effectivement retrouvées et relues ; état actuel des guides comparé aux attentes | La relecture des sources est celle de l'agent. L'état d'une CI distante ne peut pas être déduit d'un succès local |
| Phase 5 / semaine 4 : skills et recherche | Skills installés, recherche EF-30 présente, cache Python exclu, 12 cas API et 3 cas frontend ajoutés/renforcés dans cette revue ; réponses personnelles intégrées | L'étudiant confirme une relecture des tests seulement après le code : la pause TDD avant implémentation n'a pas été respectée. Les exports originaux ne sont pas fournis. Tool Guardian est rapporté comme ayant finalement bloqué la suppression, sans commande ni trace mémorisée |
| Phase 6 / semaine 5 : MCP et E2E | Deux scénarios et scripts ; tests reproductibles, preuve réelle d'un défaut détecté puis du vert après restauration ; comparaison des approches complétée | Une seule action est explicitement attribuée au serveur MCP dans les traces rapportées ; l'export d'un scénario avec au moins deux appels réels identifiés reste nécessaire. Les conversations de semaine 5 ne sont pas dans le dépôt |

Il ne s'agit pas d'une note ni d'une certification de remise : les manques de
preuve sont distingués des défauts de code et des options du cours. L'intitulé
« ADR » du dossier de phase 6 ne rend pas obligatoire un livrable ADR absent de
l'énoncé fourni. Les fonctionnalités hors tranche EF-30/EF-32/EF-33 ne sont pas
ajoutées pour masquer des limites documentaires.

## Déclarations personnelles du 26 novembre 2026

Réponses recueillies dans le chat Codex, sans être présentées comme un export
Copilot ou un journal écrit au moment des anciennes séances :

- **Essais** : l'étudiant indique avoir réalisé tous les essais évoqués pour les
  semaines 1, 2, 4 et 5. À la question des résultats, il précise ne plus se souvenir
  de tous les résultats. Les tableaux ne sont donc pas cochés automatiquement en
  réussite ; les comptes proposés ne sont pas réattribués comme comptes utilisés.
- **TDD EF-30** : il indique avoir relu et validé les tests seulement après le code.
  Cette précision remplace les anciennes formulations laissant croire à une
  validation personnelle avant implémentation. Le code reste conservé ; on ne
  réécrit ni les commits ni les anciens dialogues pour simuler un cycle TDD.
- **Tool Guardian** : après un premier essai où la suppression avait réussi,
  il confirme avoir ouvert un nouveau chat et avoir ensuite observé une
  suppression bloquée par le hook. La commande, les noms d'outils et les traces
  ne sont plus mémorisés. C'est une observation personnelle rapportée, distincte
  des simulations du script par l'agent.
- **Archives** : il pense les avoir conservées dans les bilans. La recherche locale
  retrouve les comptes rendus et deux exports anciens, mais pas les pièces de
  phase 1 ni les conversations réelles des semaines 4/5. Une description dans un
  bilan n'est pas l'export de la conversation décrite.

Les résultats personnels détaillés peuvent être complétés en retrouvant les
traces, ou en rejouant les cas avec une nouvelle date. Aucun résultat manquant
n'est transformé en échec certain ni en succès certain.

## Contrôles de l'agent pendant cette revue

- Backend ciblé : `npm.cmd run test -w backend -- tests/offers.test.ts` :
  **38 tests réussis**. Les nouveaux cas protègent la frontière 100/101, les
  caractères littéraux de LIKE, les droits avec recherche, le titre uniquement,
  les expressions entières et l'intersection avec la période.
- Frontend ciblé : `npm.cmd run test -w frontend -- tests/OffersPage.test.tsx` :
  **27 tests réussis**. Les ajouts vérifient la combinaison/effacement des filtres,
  le retour depuis l'état vide et une ancienne réponse de recherche reçue en retard.
- Global : `npm.cmd run check` : lint et TypeScript réussis, **160 tests backend**
  et **77 frontend**, soit **237 tests**, puis les deux builds réussis.
- E2E avant l'expérience de sensibilité : deux scénarios réussis avec Chromium.
- Sensibilité : le scénario 1 échoue avec le seul filtre SQL du titre désactivé,
  puis réussit après restauration exacte. La sortie réelle est dans
  [preuves/2026-11-26-sensibilite-e2e.txt](preuves/2026-11-26-sensibilite-e2e.txt).
  L'expérience est nouvelle et ne reconstitue pas la sortie ancienne de l'étudiant.
- Deux exécutions E2E finales successives après restauration : **2/2 réussis
  en 10,0 s**, puis **2/2 en 6,6 s**. Les 2 E2E sont comptés séparément des
  237 tests de `check`.
- Le SHA-256 de la base de développement est identique avant/après toute la revue :
  `7760E76A69CDFF3F603E12D999C64D27001FEA86A8069F5696DC3CE65BAE181B`.
- Contrôle des liens locaux : 135 cibles de navigation vérifiées dans
  les bilans, le README et les instructions, sans cible absente ni ancre de ligne
  hors du fichier. Les exemples des conversations anciennes n'ont pas été réécrits.
- `git -c core.whitespace=cr-at-eol diff --check` : réussi.
- Vérification TypeScript explicite de `playwright.config.ts` et de la spécification
  E2E (`tsc --noEmit`, NodeNext, `--types node`) : réussie.
- `git diff -- backend/src frontend/src` : aucune modification applicative
  persistante après restauration. Les seuls changements exécutables conservés
  sont les compléments de tests dans leurs dossiers de tests.

Aucune correction métier n'a été nécessaire pour les nouveaux tests. Le seul
changement temporaire de code applicatif est le défaut pédagogique restauré ;
il n'est pas conservé dans le diff. La CI reste sur Windows. La base de
développement est comparée avant/après et les tests E2E utilisent leur base dédiée.

## Éléments à fournir ou à refaire avant une remise complètement étayée

1. Retrouver votre V1 de CdC, vos constats de critique et les matrices de phase 1,
   ou déclarer clairement leur absence. Les ressources de cours disponibles
   (interview et exemples) ne prouvent pas la production personnelle du binôme.
2. Exporter les conversations authentiques encore disponibles dans VS Code pour
   les semaines manquantes ; ne pas renommer les anciens exports pour les faire
   passer pour les nouvelles séances.
3. Conserver au moins deux appels du serveur Playwright MCP pendant un même
   scénario, leurs retours et l'observation du résultat. Une nouvelle session
   peut fournir cette preuve actuelle si l'ancienne conversation est perdue.
4. Rejouer les essais dont on veut certifier le résultat personnel exact et qui
   n'ont plus de résultat mémorisé. La déclaration de réalisation reste enregistrée.
5. Vérifier les PR réellement fusionnées, leurs contrôles et la remise Moodle.
   Ces actions distantes ne sont pas annoncées comme faites par cette revue locale.
