# Bilan — Semaine 2

## Choix de planification

La règle RG-03 du cahier des charges prévoit qu'un étudiant ne peut
candidater qu'à une offre au statut « Publiée ». Le serveur vérifie donc
toujours le statut `PUBLISHED` au moment du dépôt ; le frontend ne constitue
pas une protection suffisante.

Les choix métier appliqués et leur justification sont les suivants :

- **Une seule candidature non retirée par étudiant et par offre.** Cela évite
  les envois en double et conserve une situation claire pour chaque couple
  étudiant/offre. L'index unique partiel applique cette règle, y compris pour les statuts
  retenu et non retenu. Le serveur renvoie une erreur métier si l'insertion
  est ignorée à cause de cet index.
- **Une nouvelle candidature après retrait est autorisée**, si l'offre est
  toujours publiée. Le retrait permet ainsi à l'étudiant de changer d'avis
  sans bloquer définitivement une nouvelle démarche.
- **Le retrait est logique : la ligne devient `WITHDRAWN`.** Conserver
  l'enregistrement permet de montrer le statut « Retirée » et de garder
  l'historique, plutôt que de faire disparaître la candidature.
- **Seule une candidature `IN_PROGRESS` peut être retirée.** Une décision
  déjà prise ne peut donc pas être annulée par l'étudiant. Une candidature
  déjà retirée ne peut pas être retirée une seconde fois.
- **Les codes existants sont conservés.** `IN_PROGRESS`, `SELECTED`,
  `REJECTED` et `WITHDRAWN` sont traduits dans l'interface par « En cours »,
  « Retenue », « Non retenue » et « Retirée ». Cela respecte le schéma et
  les conventions du projet sans ajouter de statuts redondants.
- **Le serveur utilise l'identité de la session.** L'étudiant ne peut pas
  choisir une autre identité dans la requête. Le filtrage des listes et le
  contrôle de propriété au retrait protègent les candidatures des autres.
- **L'architecture existante est réutilisée.** Les contrôleurs valident
  les requêtes HTTP, les services portent les règles métier et les
  repositories exécutent le SQL. Le frontend réutilise la liste des offres,
  la navigation et les composants existants pour limiter le code ajouté.

Le cahier des charges impose RG-03, EF-32 et EF-33, mais ne précise pas les
doublons ni la recandidature après retrait : ces deux règles sont des choix
de planification. La sélection d'un candidat, EF-30, EF-31 et la création du
stage restent hors périmètre.

## Résultat, difficultés et limites

Les trois parcours prévus sont implémentés :

1. dépôt d'une candidature avec message facultatif ;
2. consultation des candidatures de l'étudiant connecté ;
3. retrait logique d'une candidature en cours.

Les contrôles d'identité, de rôle, d'offre publiée, de doublon, de propriété
et de statut sont réalisés côté serveur. Un point technique à prendre en compte est la coexistence du refus des
doublons et de la recandidature après retrait. L'index unique partiel
exclut les candidatures `WITHDRAWN`, tandis que la mise à jour de retrait
vérifie encore le propriétaire et le statut dans la requête SQL.
Lors de mes essais après le lancement de `npm run dev`, je n'ai pas
immédiatement repéré où les nouvelles fonctionnalités avaient été ajoutées
dans l'interface. Ma difficulté a donc été de trouver les actions de
candidature et de consultation. Le dépôt se fait depuis « Offres » avec
le bouton « Candidater » ; la consultation est accessible par
« Mes candidatures » avec un compte étudiant. Lors de l'envoi avec un
message, j'ai obtenu une confirmation. J'ai également cliqué sur une
candidature pour en voir le détail. Ces observations sont mes résultats
manuels rapportés ; elles ne valident pas les autres cas du protocole.

Limites restantes : le traitement des candidatures par un autre rôle, la
sélection et la création du stage restent hors périmètre. Les essais
manuels rapportés portent sur l'envoi avec message et la consultation
d'un détail. La persistance après rechargement, le retrait et les autres
cas du protocole ne sont pas déclarés validés manuellement.

## Fichiers modifiés et rôle

### Backend et base de données

- [002_applications_active_unique.sql](../backend/src/db/migrations/002_applications_active_unique.sql) :
  garantit l'unicité d'une candidature non retirée par étudiant et par offre
  sans supprimer l'historique.
- [application.ts](../backend/src/models/application.ts) et
  [application.mapper.ts](../backend/src/mappers/application.mapper.ts) :
  types métier et conversion vers les réponses API.
- [applications.repository.ts](../backend/src/repositories/applications.repository.ts) :
  requêtes SQLite de création, consultation filtrée et retrait conditionnel.
- [applications.service.ts](../backend/src/services/applications.service.ts) :
  règles métier et contrôles de rôle, publication, doublon, propriété et
  statut.
- [applications.controller.ts](../backend/src/controllers/applications.controller.ts) :
  validation HTTP et exposition des routes `GET`, `POST` et `DELETE`.
- [app.ts](../backend/src/app.ts) : branchement des routes et dépendances.
- [API.md](../backend/API.md) et
  [applications.http](../backend/http/applications.http) :
  documentation et exemples REST, avec les erreurs du `POST` replacées dans
  sa section.
- [applications.test.ts](../backend/tests/applications.test.ts) et
  [migrations.test.ts](../backend/tests/db/migrations.test.ts) :
  tests d'intégration des parcours et de la migration.

### Frontend

- [application.ts](../frontend/src/models/application.ts),
  [applications.service.ts](../frontend/src/services/applications.service.ts)
  et [guards.ts](../frontend/src/utils/guards.ts) : modèle, appels API et
  validation des réponses.
- [useApplications.ts](../frontend/src/hooks/useApplications.ts) :
  chargement, retrait et mise à jour de l'état affiché.
- [ApplicationForm.tsx](../frontend/src/components/ApplicationForm.tsx) :
  formulaire avec message facultatif.
- [OfferTable.tsx](../frontend/src/components/OfferTable.tsx) et
  [OffersPage.tsx](../frontend/src/pages/OffersPage.tsx) : action de dépôt
  depuis la liste des offres.
- [ApplicationTable.tsx](../frontend/src/components/ApplicationTable.tsx) et
  [ApplicationsPage.tsx](../frontend/src/pages/ApplicationsPage.tsx) :
  liste, statuts, état vide et action de retrait.
- [App.tsx](../frontend/src/App.tsx),
  [NavBar.tsx](../frontend/src/components/NavBar.tsx),
  [labels.ts](../frontend/src/utils/labels.ts) et
  [index.css](../frontend/src/index.css) : navigation, libellés et affichage.
- [OffersPage.test.tsx](../frontend/tests/OffersPage.test.tsx),
  [ApplicationsPage.test.tsx](../frontend/tests/ApplicationsPage.test.tsx) et
  [NavBar.test.tsx](../frontend/tests/NavBar.test.tsx) : tests de formulaire,
  consultation, retrait, erreurs et navigation.

## Essais manuels

Après avoir lancé l'application avec `npm run dev`, j'ai candidaté à une
offre avec un message et obtenu une confirmation. J'ai ensuite cliqué sur
une candidature pour en voir le détail. Ces résultats correspondent à mes
observations rapportées, sans vérification supplémentaire par Codex dans
le navigateur. Le compte, l'offre et le contenu exact du détail n'ont pas
été précisés. Les comptes et offres du tableau constituent un protocole
proposé, pas l'identification certaine des données utilisées. Les autres
cas restent à vérifier manuellement.

| Cas                                   | Préconditions                                          | Actions                                                             | Résultat attendu                                                                     | Résultat observé                                                                     |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Candidature avec message              | Étudiant connecté ; offre 1 `PUBLISHED`                | Dans « Offres », cliquer « Candidater », saisir un message, envoyer | Candidature créée avec le message et « En cours »                                    | Confirmation d’envoi observée ; statut et contenu enregistré non vérifiés séparément |
| Candidature sans message              | Étudiant connecté ; offre 3 `PUBLISHED`                | Cliquer « Candidater » et envoyer sans message                      | Candidature créée sans message et « En cours »                                       | À vérifier                                                                           |
| Persistance après rechargement        | Candidature créée ou retirée                           | Actualiser « Mes candidatures »                                     | La ligne et son statut sont conservés                                                | À vérifier                                                                           |
| Ouverture du détail d’une candidature | Compte et candidature non précisés                     | Cliquer sur une candidature pour voir son détail                    | Détail consultable                                                                   | Consultation du détail rapportée par l’étudiant ; contenu exact non précisé          |
| Consultation et statuts               | Candidatures de démonstration existantes               | Consulter avec Lucas, Inès, Mateusz et Léa                          | Les libellés « En cours », « Retenue », « Non retenue » et « Retirée » sont affichés | À vérifier                                                                           |
| Retrait en cours                      | Lucas, candidature 1 `IN_PROGRESS`                     | Cliquer « Retirer »                                                 | Statut « Retirée », ligne conservée, bouton absent                                   | À vérifier                                                                           |
| Refus du retrait traité               | Mateusz ou Léa, candidature `SELECTED` ou `REJECTED`   | Appeler `DELETE /applications/:id`                                  | `409 APPLICATION_NOT_WITHDRAWABLE`, statut inchangé                                  | À vérifier                                                                           |
| Séparation entre étudiants            | Lucas et Léa ont des candidatures                      | Comparer leurs pages « Mes candidatures »                           | Chaque étudiant ne voit que ses propres lignes                                       | À vérifier                                                                           |
| Refus d'un autre rôle                 | Compte `ADMIN` ou `CONTACT`                            | Appeler `GET`, `POST` ou `DELETE /applications`                     | `403 FORBIDDEN`, aucune modification                                                 | À vérifier                                                                           |
| Offre non publiée                     | Étudiant connecté ; offre 2 `SUBMITTED` ou 4 `PENDING` | Appeler `POST /applications` avec l'offre concernée                 | `409 OFFER_NOT_PUBLISHED`, aucune création                                           | À vérifier                                                                           |
| Doublon                               | Candidature active existante sur l'offre 1             | Répéter `POST /applications` pour cette offre                       | `409 APPLICATION_EXISTS`                                                             | À vérifier                                                                           |
| Nouvelle candidature après retrait    | Ancienne candidature `WITHDRAWN`, offre encore publiée | Déposer une nouvelle candidature                                    | Nouvelle ligne `IN_PROGRESS`, ancienne ligne conservée                               | À vérifier                                                                           |

Comptes de démonstration utiles : Lucas Dupont (étudiant 1), Inès Haddad
(étudiante 2), Mateusz Kowalski (étudiant 3), Léa Mertens (étudiante 4),
Dmytro Kovalenko (étudiant 8), Louis Claes (étudiant 9), Anne Leclercq
(administratrice 1) et Marc Lejeune (contact 2). Les cas API peuvent être
rejoués avec [applications.http](../backend/http/applications.http). Les
fixtures et les tests correspondants se trouvent dans
[applications.test.ts](../backend/tests/applications.test.ts).

## Qualité du code et vérifications automatisées

Les contrôles serveur ne dépendent pas du bouton frontend : l'identité
étudiante vient de la session, les résultats de `GET` sont filtrés par
`student_id`, et le retrait exige simultanément le propriétaire et le statut
`IN_PROGRESS`. Les erreurs du `POST /applications` ont aussi été replacées
dans la bonne section de [API.md](../backend/API.md).

Tests ajoutés ou complétés : création avec et sans message, RG-03, doublons,
isolation entre étudiants, état vide, statuts traités, propriété du retrait,
recandidature après retrait, migration et affichage frontend.

Commandes exécutées et résultats lors de la vérification de l'état final
par Codex (les sous-commandes sont enchaînées par `check`) :

- `npm.cmd run check` : réussi ;
- `npm.cmd run lint` : réussi sans avertissement ;
- `npm.cmd run typecheck` : réussi ;
- `npm.cmd test` : 139 tests backend réussis et 60 tests frontend réussis ;
- `npm.cmd run build` : réussi pour le backend et le frontend ;
- `git diff --check` : le bilan précédent le mentionnait comme réussi,
  mais cette réussite n'est pas confirmée ici. Le contrôle réalisé lors du
  découpage des commits signalait des fins de ligne CRLF comme espaces finaux.

Exemple précis couvert automatiquement : une requête de retrait envoyée avec
le compte d'un autre étudiant ne modifie pas la candidature et reçoit une
réponse d'autorisation refusée ; le propriétaire peut retirer la candidature
seulement lorsqu'elle est `IN_PROGRESS`.

## Parcours complet d'une candidature

1. **Interface** — [OffersPage.tsx](../frontend/src/pages/OffersPage.tsx)
   affiche [OfferTable.tsx](../frontend/src/components/OfferTable.tsx).
   [ApplicationForm.tsx](../frontend/src/components/ApplicationForm.tsx)
   recueille le message facultatif.
2. **Requête** — le gestionnaire `handleApply` de
   [OffersPage.tsx](../frontend/src/pages/OffersPage.tsx) appelle directement
   `createApplication` dans [applications.service.ts](../frontend/src/services/applications.service.ts),
   qui envoie `POST /applications` avec `offerId` et, si fourni, `message`.
3. **Contrôles serveur** —
   [applications.controller.ts](../backend/src/controllers/applications.controller.ts)
   valide le JSON, puis
   [applications.service.ts](../backend/src/services/applications.service.ts)
   vérifie le rôle étudiant et la publication de l'offre. Le serveur traduit
   un conflit d'unicité en refus de doublon. L'identifiant étudiant utilisé est celui de la session ; un éventuel
   `studentId` fourni dans le corps est ignoré.
4. **Base** —
   [applications.repository.ts](../backend/src/repositories/applications.repository.ts)
   insère la ligne avec `IN_PROGRESS`. SQLite applique aussi l'index défini
   par [002_applications_active_unique.sql](../backend/src/db/migrations/002_applications_active_unique.sql).
5. **Réponse** — le repository retourne la ligne, le mapper
   [application.mapper.ts](../backend/src/mappers/application.mapper.ts) la
   convertit en DTO, puis le contrôleur renvoie `201`.
6. **Affichage** — `OffersPage.tsx` met à jour son état local et affiche la
   confirmation. La candidature est ensuite relue par `GET /applications`
   dans [ApplicationsPage.tsx](../frontend/src/pages/ApplicationsPage.tsx),
   avec les statuts traduits par [labels.ts](../frontend/src/utils/labels.ts).

Le retrait suit le même chemin avec `DELETE /applications/:id` : le serveur
vérifie la propriété et `IN_PROGRESS`, le repository effectue une mise à jour
conditionnelle vers `WITHDRAWN`, puis la page affiche « Retirée » et conserve
la ligne après rechargement.

generer en partie apres avoir repondu a des qst a chatgpt et l'autre partie en demandant a copilote de le completer directe
