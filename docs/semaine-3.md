# Bilan — Semaine 3

## Périmètre et méthode

Cette semaine a porté sur l'audit du harnais agentique de Gesta, la traçabilité
des candidatures et le renforcement ciblé des tests. La correction du dépôt
des candidatures et le renommage du bilan précédent sont dans un commit
séparé des tests et du présent bilan.

Les éléments ci-dessous distinguent :

- les faits vérifiés par lecture du dépôt ou par exécution pendant cette séance ;
- les résultats rapportés dans des documents antérieurs ;
- les points qui restent à confirmer manuellement ou avec les supports de cours.

## 1. Inventaire des guides et senseurs

| Type | Guides (feedforward) | Senseurs (feedback) |
|---|---|---|
| Inférentiel | Instructions Copilot, cahier des charges et guides ci-dessous | |
| Computationnel | | Oxlint, TypeScript, Vitest et build ci-dessous |

Une revue IA ponctuelle a servi à relire le diff. Elle n'est pas configurée
comme contrôle récurrent du dépôt. Les scripts npm orchestrent les contrôles.
Les fichiers REST Client décrivent des requêtes à lancer manuellement.

### Guides inférentiels

| Mécanisme | Fichier ou outil | Exemple dans le dépôt | Vérification |
|---|---|---|---|
| Instructions Copilot | `.github/copilot-instructions.md` | `npm run check`, architecture en couches, autorisation côté backend, tests en SQLite mémoire | Fichier lu intégralement |
| Cahier des charges | `docs/cdc_gesta_developpement.md` | `RG-03`, `EF-32`, `EF-33` | Passages relus |
| Architecture | `docs/architecture.md` | `controllers -> services -> repositories -> SQLite`; `pages -> hooks -> services/utils -> models` | Fichier lu intégralement |
| README opératoire | `README.md` | commandes `lint`, `typecheck`, `test`, `build`, `check` | Sections prérequis, commandes et mode démo relues |
| Template de PR | `.github/pull_request_template.md` | cases `npm run check`, tests d'erreur, droits backend, migrations et navigateur | Fichier lu |
| Documentation API | `backend/API.md` | contrats `400`, `401`, `403`, `404`, `409` pour les candidatures | Sections candidatures relues |

### Senseurs computationnels

| Mécanisme | Fichier ou outil | Ce qu'il vérifie | Exemple | Vérification |
|---|---|---|---|---|
| Scripts npm | `package.json`, `backend/package.json`, `frontend/package.json` | lint, types, tests, build et contrôle global | `check = lint && typecheck && test && build` | Configurations lues ; `check` exécuté |
| Oxlint | `backend/.oxlintrc.json`, `frontend/.oxlintrc.json` | `any`, égalité stricte, hooks React, avertissements | `typescript/no-explicit-any: error`, `--deny-warnings` | Configurations lues ; lint exécuté |
| TypeScript | `backend/tsconfig.json`, `frontend/tsconfig.app.json` | strictness, variables inutilisées, imports et index non sûrs | `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` | Configurations lues ; typecheck exécuté |
| Vitest/Supertest | `backend/vitest.config.ts`, `backend/tests/` | API, droits, erreurs et règles métier sur SQLite mémoire | `GET /applications`, `POST /applications`, `DELETE /applications/:id` | Tests lus et exécutés |
| Vitest/Testing Library | `frontend/vite.config.ts`, `frontend/tests/` | affichage, appels API, statuts et erreurs | `ApplicationsPage.test.tsx`, `OffersPage.test.tsx` | Tests lus et exécutés |
| Build | scripts backend/frontend | compilation et copie des migrations | `tsc -p tsconfig.build.json`, `tsc -b`, `vite build` | Build exécuté avec `npm.cmd run check` |
| REST Client | `backend/http/applications.http`, `backend/http/offers.http` | scénarios HTTP manuels documentés | connexion, candidature, retrait, filtrage | Fichiers lus ; non exécutés cette semaine |

Aucun `AGENTS.md` ni workflow GitHub Actions n'a été trouvé. Le fichier
`.vscode/mcp.json` configure Playwright MCP, mais aucun essai navigateur n'a été
effectué pendant cette séance.

## 2. Traçabilité EF-32, EF-33 et RG-03

### Références métier

- **RG-03** : un étudiant ne peut candidater qu'à une offre `PUBLISHED`.
- **EF-32** : l'étudiant candidate à une offre publiée, avec message facultatif,
  et peut retirer sa candidature tant qu'elle n'est pas traitée.
- **EF-33** : l'étudiant voit ses candidatures avec les statuts « En cours »,
  « Retenue », « Non retenue » ou « Retirée ».

Ces formulations sont dans
[`docs/cdc_gesta_developpement.md`](./cdc_gesta_developpement.md). Les choix
complémentaires sont documentés dans
[`docs/semaine-2.md`](./semaine-2.md) :

- une seule candidature active par étudiant et par offre ;
- une nouvelle candidature est possible après retrait ;
- le retrait est logique (`WITHDRAWN`) ;
- seul `IN_PROGRESS` est retirable ;
- l'identité vient de la session.

### État avant les modifications

| Cas | Couverture avant |
|---|---|
| Dépôt avec message et `IN_PROGRESS` | Couvert côté API et interface |
| Dépôt sans message et `IN_PROGRESS` | Couvert côté API ; interface partielle car le corps exact n'était pas vérifié |
| Offre non publiée | Partiel : `409 OFFER_NOT_PUBLISHED` vérifié, absence de création non vérifiée |
| Rôles interdits au dépôt | Couvert côté API pour admin et contact |
| Retrait par le propriétaire | Couvert côté API et interface |
| Retrait d'une candidature traitée | Partiel : `409` vérifié, statut inchangé non relu |
| Retrait par un autre étudiant | Partiel : `403` vérifié, absence de modification non relue |
| Retrait par un contact | Partiel : admin testé, contact non testé |
| Doublon actif | Couvert via le service, mais pas par un test direct de l'index SQLite |
| Recandidature après retrait | Partiel : nouvelle candidature vérifiée, historique complet non vérifié |
| Liste personnelle | Couvert côté API |
| Isolation entre étudiants | Couvert côté API ; pas de test d'écran spécifique |
| Liste vide | Couvert côté API et interface |
| Quatre statuts retournés/affichés | Partiel : l'API ne vérifiait pas `SELECTED` dans une liste et l'interface ne vérifiait que `En cours` et `Retirée` |

### Tests ajoutés ou renforcés

Les changements sont limités à :

- [`backend/tests/applications.test.ts`](../backend/tests/applications.test.ts)
- [`backend/tests/db/constraints.test.ts`](../backend/tests/db/constraints.test.ts)
- [`frontend/tests/ApplicationsPage.test.tsx`](../frontend/tests/ApplicationsPage.test.tsx)
- [`frontend/tests/OffersPage.test.tsx`](../frontend/tests/OffersPage.test.tsx)

| Test | Assertions utiles | Défaut concret détecté par le test |
|---|---|---|
| Offre non publiée | `409`, code `OFFER_NOT_PUBLISHED`, puis liste vide pour l'étudiant | Une insertion malgré le refus ferait échouer la liste vide |
| Retrait traité ou déjà retiré | `409 APPLICATION_NOT_WITHDRAWABLE`, puis statut initial relu pour `SELECTED`, `REJECTED` et `WITHDRAWN` | Une mise à jour SQL incorrecte ferait changer le statut |
| Retrait par un autre étudiant | `403 FORBIDDEN`, puis relecture de la liste du propriétaire avec `IN_PROGRESS` et `WITHDRAWN` inchangés | Un retrait non autorisé qui modifierait la ligne serait détecté |
| Retrait par un contact | `403 FORBIDDEN` pour admin et contact | Une autorisation trop large du DELETE ferait échouer le test |
| Recandidature après retrait | ancienne ligne `WITHDRAWN` et nouvelle ligne `IN_PROGRESS` | Une suppression physique ou une réutilisation d'identifiant ferait échouer l'historique |
| Index de doublon actif | seconde insertion SQLite levant une erreur `UNIQUE` | La suppression ou la mauvaise définition de l'index partiel serait détectée |
| Dépôt frontend sans message | corps exact `{ offerId: 1, message: "" }` | Une modification involontaire du payload ferait échouer l'assertion |
| Statuts frontend | présence de `En cours`, `Retenue`, `Non retenue`, `Retirée` | Une traduction ou un rendu manquant serait détecté |
| Relecture après création | GET 200 après POST, même ID, même message et statut IN_PROGRESS | Une création retournée comme réussie mais non relisible ferait échouer le test |
| Changement de session | Ancienne ligne masquée dès le changement, nouvelle ligne affichée et nouveau jeton transmis | Un état conservé de la session précédente ou un ancien jeton ferait échouer le test |

Les défauts volontaires n'ont pas été introduits. Les tests ajoutés n'ont révélé
aucun défaut du code métier.

### Matrice de traçabilité après les modifications

Les noms de tests ci-dessous renvoient à [l'intégration API](../backend/tests/applications.test.ts),
aux [contraintes SQLite](../backend/tests/db/constraints.test.ts), aux [offres](../frontend/tests/OffersPage.test.tsx)
et à [la page des candidatures](../frontend/tests/ApplicationsPage.test.tsx).

| Exigence | Cas | Test exact et fichier | Assertions utiles | Couverture |
|---|---|---|---|---|
| EF-32 | Déposer avec message et relire la candidature | API, « crée une candidature avec un message pour un étudiant » | POST 201, message nettoyé et IN_PROGRESS, puis GET 200 avec le même identifiant, message et statut | Couverte côté API. Rechargement du navigateur non essayé |
| EF-32 | Déposer sans message | API, « crée une candidature sans message ». Offres, « permet l'envoi sans message et n'affiche pas l'action aux contacts » | POST 201, message null, IN_PROGRESS. Le formulaire envoie un message vide et affiche la confirmation simulée | Couverte côté API et formulaire |
| EF-32 / RG-03 | Refuser une offre non publiée | API, « refuse une offre qui n'est pas publiée conformément à RG-03 » | 409 OFFER_NOT_PUBLISHED et liste toujours vide | Couverte pour l'offre soumise utilisée |
| EF-32 | Refuser un administrateur et un contact | API, « refuse un administrateur et un contact » au dépôt, « refuse les rôles autres qu'étudiant » au retrait | 403 pour les deux profils. Au retrait, code FORBIDDEN également contrôlé | Refus couverts côté API |
| EF-32 | Retirer une candidature en cours | API, « retire la candidature en cours de l'étudiant connecté ». Page des candidatures, « retire une candidature en cours et conserve le statut affiché » | DELETE 200, même ID avec WITHDRAWN, puis GET avec ce statut. Dans la page, « Retirée » apparaît et le bouton disparaît | Couverte côté API et page simulée |
| EF-32 | Refuser une candidature traitée ou déjà retirée | API, « refuse le retrait d'une candidature %s » (retenue, non retenue, déjà retirée) | 409 APPLICATION_NOT_WITHDRAWABLE et statut initial relu | Couverte |
| EF-32 | Refuser le retrait d'une candidature étrangère | API, « refuse le retrait d'une candidature appartenant à un autre étudiant » | 403 FORBIDDEN, puis relecture sans changement pour le propriétaire | Couverte |
| Choix métier | Empêcher un doublon actif | API, « refuse une candidature active en doublon ». SQLite, « refuse deux candidatures actives pour le même étudiant et la même offre » | 409 APPLICATION_EXISTS et violation UNIQUE en insertion directe | Couverte |
| Choix métier | Recandidater après retrait et conserver l'historique | API, « autorise une nouvelle candidature après le retrait » dans le bloc DELETE | 200 au retrait, 201 avec un autre ID au dépôt, puis GET avec l'ancienne et la nouvelle ligne | Couverte |
| EF-33 | Consulter ses candidatures et leurs données | API, « retourne les candidatures de l'étudiant connecté avec les informations de l'offre » | 200, nombre de lignes, identifiants d'offres, métadonnées et statuts vérifiés | Couverte pour les données de test |
| EF-33 | Isoler deux étudiants | API, « isole les résultats entre deux étudiants ». Page des candidatures, « masque les candidatures précédentes au changement de session » | L'API renvoie des listes distinctes. La page masque l'ancienne ligne, charge la nouvelle et transmet le second jeton | Couverte côté API et au changement de jeton simulé |
| EF-33 | Afficher les quatre statuts | Page des candidatures, « affiche les informations de l'offre et les statuts français ». API, « refuse le retrait d'une candidature %s » et « retire la candidature en cours de l'étudiant connecté » | Les quatre libellés sont présents dans le rendu. Les GET relisent les statuts initiaux ou mis à jour | Couverte côté API et rendu simulé |
| EF-33 | Afficher une liste vide et refuser un accès hors session étudiante | API, « retourne une liste vide pour un étudiant sans candidature », « refuse la consultation au profil %s » et « refuse la consultation sans session ». Page des candidatures, « affiche un état vide » | Liste vide, 403 pour admin et contact, 401 sans session et message d'état vide | Couverte |
| Limite de saisie du projet | Refuser un message trop long | API, « refuse un message de plus de 2 000 caractères » | 400 INVALID_BODY à 2 001 caractères | Refus couvert. Cette longueur ne vient pas d'EF-32 |

Les tests du filtre par période, de la connexion de démonstration et des contraintes
de création de stage vérifient d'autres comportements du projet. Ils ne sont pas
comptés comme preuves directes d'EF-32 ou d'EF-33.

## 3. Exécutions, résultats et limites

### Commandes exécutées cette semaine

Contrôle global :

```text
npm.cmd run check
```

Résultats réels :

- Oxlint backend et frontend : réussi, sans avertissement ;
- TypeScript backend et frontend : réussi ;
- tests backend : 10 fichiers, 140 tests réussis ;
- tests frontend : 8 fichiers, 61 tests réussis ;
- total : 201 tests réussis ;
- build backend : réussi, y compris la copie des migrations ;
- build frontend : réussi avec Vite.

Le diff a été relu. `git -c core.whitespace=cr-at-eol diff --check` a
permis de contrôler les espaces ajoutés en tenant compte des fins de ligne Windows.

### Essais manuels

Aucun essai manuel n'a été réalisé pendant cette semaine.

Les essais suivants sont seulement **rapportés** par des documents antérieurs :

- dans [`docs/semaine-2.md`](./semaine-2.md), l'étudiant rapporte un dépôt avec
  message et la consultation d'un détail ;
- dans [`docs/verification-seance-6.md`](./verification-seance-6.md), une
  vérification navigateur antérieure rapporte des essais sur les profils,
  périodes et nombres d'offres.

Ces résultats historiques ne constituent pas une exécution de cette séance et ne
valident pas les cas ajoutés cette semaine.

### Limites restant à confirmer

- vérifier dans le navigateur le dépôt sans message ;
- vérifier visuellement les quatre libellés de statut ;
- vérifier le retrait puis le rechargement de la page ;
- vérifier l'isolation entre deux sessions réelles dans l'interface ;
- un changement de jeton est testé avec une API simulée. Une reconnexion réelle reste à vérifier dans le navigateur.

## 4. Audit des guides par rapport à Web 2

Les références ci-dessous viennent du cours **BINV2150A — Web 2**, dossier
`BINV2150A-slides`. Les numéros correspondent aux pages de `slides-export.pdf`
dans chaque dossier de séance. Les recommandations sont des résultats de l'audit.

| Attente Web 2 et source | Guide examiné et passage | Correspondance | Écart ou recommandation |
|---|---|---|---|
| Séparer données, état/actions et affichage. Séance 19, « Structure de l'application », p. 4, « Le modèle MVVM » | `.github/copilot-instructions.md`, Architecture, « Frontend flow follows the documented MVVM structure » | Oui | Garder un exemple complet page → hook → service, notamment pour les actions avec chargement et erreur |
| Regrouper les appels HTTP dans des services et vérifier la réponse HTTP. Séance 21, « Fetch », pp. 8 et 14 | Guide Copilot, Architecture, « Services call the API and validate JSON with hand-written type guards » | Partielle | La couche service est explicite. Préciser que le contrôle HTTP précède la validation JSON, en citant `readJson` |
| Documenter les endpoints, paramètres, corps et codes de retour. Séance 02, « Requêtes HTTP, Conventions REST et Documentation d'API », pp. 10 et 13–14 | Guide Copilot, Conventions, « Keep API documentation and REST Client examples in sync ». `backend/API.md`, sections candidatures | Oui | Continuer à documenter les erreurs en même temps que les routes |
| Séparer identité et permissions, vérifier les deux côté serveur. Séance 03, « Authentification par JWT », pp. 2 et 7. Séance 24, « Fetch avec JWT », p. 9 | Guide Copilot, Architecture et Conventions, `authenticate`, `authorize` et autorisation backend. `docs/architecture.md`, parcours backend | Oui | Donner l'exemple du retrait d'une candidature appartenant à un autre étudiant. La connexion de démonstration est un choix propre à Gesta |
| Utiliser la soumission du formulaire, bénéficier de la validation HTML et conserver la validation serveur. Séance 12, « Événements et formulaires », pp. 8 et 12 | Guide Copilot, Architecture, « Controllers own HTTP parsing, validation, status codes, and response formatting » | Partielle | La validation serveur est indiquée. Préciser les attentes des formulaires React, dont `onSubmit`, le retour d'erreur et un libellé associé |
| Faire passer les appels de l'interface par le proxy Vite `/api`. Séance 24, « Fetch avec JWT », p. 9 | Guide Copilot, Architecture, « Vite proxies /api/... to the backend » | Oui | Garder le proxy comme point de référence pour les nouveaux appels |

Aucune contradiction n'a été relevée dans les passages comparés. Les réglages
Vitest, Oxlint et SQLite mémoire sont documentés comme conventions de Gesta.
Ces références Web 2 ne suffisent pas à leur attribuer un statut d'exigence du cours.

## Principaux constats à présenter oralement

1. Le dépôt possède un véritable harnais : instructions Copilot, architecture,
   lint, TypeScript, tests backend/frontend, build et documentation API.
2. Avant renforcement, plusieurs cas EF-32/EF-33 étaient seulement partiels :
   absence d'écriture après refus, conservation des statuts après retrait,
   doublon au niveau base, historique après recandidature et statuts UI.
3. Les tests ajoutés couvrent ces cas sans modifier le métier ; les contrôles
   ciblés et le contrôle global sont tous passés.
4. Les tests couvrent l'isolation côté API et un changement de jeton simulé.
   Les parcours navigateur complets restent à vérifier.
5. Les guides suivent les supports Web 2 sur MVVM, l'API et les droits côté
   serveur. Ils peuvent mieux expliciter la gestion des réponses HTTP et des formulaires.
6. Le mode démo est explicitement réservé au développement et ne constitue pas
   une authentification réelle.
