# Bilan — Semaine 2

## Choix de planification

La règle RG-03 du cahier des charges prévoit qu'un étudiant ne peut
candidater qu'à une offre au statut « Publiée ». Le serveur vérifie donc
toujours le statut `PUBLISHED` au moment du dépôt ; le frontend ne constitue
pas une protection suffisante.

Les choix métier appliqués sont les suivants :

- une seule candidature non retirée par étudiant et par offre ;
- une nouvelle candidature est autorisée après `WITHDRAWN` si l'offre est
  toujours `PUBLISHED` ;
- le retrait conserve la ligne et la passe à `WITHDRAWN` ;
- seul le statut `IN_PROGRESS` peut être retiré ;
- les codes `IN_PROGRESS`, `SELECTED`, `REJECTED` et `WITHDRAWN` sont conservés
  en base et traduits par le frontend en « En cours », « Retenue », « Non
  retenue » et « Retirée ».

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
et de statut sont réalisés côté serveur. La principale difficulté technique
a été de conserver le filtrage par session tout en permettant la
recandidature après retrait ; elle est traitée par une mise à jour
conditionnelle pour le retrait et un index unique partiel pour les
candidatures actives.

Limites restantes : le traitement des candidatures par un autre rôle, la
sélection et la création du stage ne sont pas implémentés. Les essais
manuels n'ont pas été documentés avec un résultat dans le compte rendu
fourni ; ils restent donc distincts des vérifications automatisées ci-dessous.

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

La liste ci-dessous constitue le protocole de validation. Aucun résultat
manuel n'a été communiqué dans le compte rendu fourni : la colonne « Résultat
observé » reste donc à « À vérifier » et ne signifie pas que le cas a réussi.

| Cas | Préconditions | Actions | Résultat attendu | Résultat observé |
|---|---|---|---|---|
| Candidature avec message | Étudiant connecté ; offre 1 `PUBLISHED` | Dans « Offres », cliquer « Candidater », saisir un message, envoyer | Candidature créée avec le message et « En cours » | À vérifier |
| Candidature sans message | Étudiant connecté ; offre 3 `PUBLISHED` | Cliquer « Candidater » et envoyer sans message | Candidature créée sans message et « En cours » | À vérifier |
| Persistance après rechargement | Candidature créée ou retirée | Actualiser « Mes candidatures » | La ligne et son statut sont conservés | À vérifier |
| Consultation et statuts | Candidatures de démonstration existantes | Consulter avec Lucas, Inès, Mateusz et Léa | Les libellés « En cours », « Retenue », « Non retenue » et « Retirée » sont affichés | À vérifier |
| Retrait en cours | Lucas, candidature 1 `IN_PROGRESS` | Cliquer « Retirer » | Statut « Retirée », ligne conservée, bouton absent | À vérifier |
| Refus du retrait traité | Mateusz ou Léa, candidature `SELECTED` ou `REJECTED` | Appeler `DELETE /applications/:id` | `409 APPLICATION_NOT_WITHDRAWABLE`, statut inchangé | À vérifier |
| Séparation entre étudiants | Lucas et Léa ont des candidatures | Comparer leurs pages « Mes candidatures » | Chaque étudiant ne voit que ses propres lignes | À vérifier |
| Refus d'un autre rôle | Compte `ADMIN` ou `CONTACT` | Appeler `GET`, `POST` ou `DELETE /applications` | `403 FORBIDDEN`, aucune modification | À vérifier |
| Offre non publiée | Étudiant connecté ; offre 2 `SUBMITTED` ou 4 `PENDING` | Appeler `POST /applications` avec l'offre concernée | `409 OFFER_NOT_PUBLISHED`, aucune création | À vérifier |
| Doublon | Candidature active existante sur l'offre 1 | Répéter `POST /applications` pour cette offre | `409 APPLICATION_EXISTS` | À vérifier |
| Nouvelle candidature après retrait | Ancienne candidature `WITHDRAWN`, offre encore publiée | Déposer une nouvelle candidature | Nouvelle ligne `IN_PROGRESS`, ancienne ligne conservée | À vérifier |

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

Commandes exécutées et résultats :

- `npm.cmd run check` : réussi ;
- `npm.cmd run lint` : réussi sans avertissement ;
- `npm.cmd run typecheck` : réussi ;
- `npm.cmd test` : 139 tests backend réussis et 60 tests frontend réussis ;
- `npm.cmd run build` : réussi pour le backend et le frontend ;
- `git diff --check` : réussi.

Exemple précis couvert automatiquement : une requête de retrait envoyée avec
le compte d'un autre étudiant ne modifie pas la candidature et reçoit une
réponse d'autorisation refusée ; le propriétaire peut retirer la candidature
seulement lorsqu'elle est `IN_PROGRESS`.

## Parcours complet d'une candidature

1. **Interface** — [OffersPage.tsx](../frontend/src/pages/OffersPage.tsx)
   affiche [OfferTable.tsx](../frontend/src/components/OfferTable.tsx).
   [ApplicationForm.tsx](../frontend/src/components/ApplicationForm.tsx)
   recueille le message facultatif.
2. **Requête** — [useApplications.ts](../frontend/src/hooks/useApplications.ts)
   appelle [applications.service.ts](../frontend/src/services/applications.service.ts),
   qui envoie `POST /applications` avec `offerId` et, si fourni, `message`.
3. **Contrôles serveur** —
   [applications.controller.ts](../backend/src/controllers/applications.controller.ts)
   valide le JSON, puis
   [applications.service.ts](../backend/src/services/applications.service.ts)
   vérifie la session, le rôle étudiant, l'offre publiée et l'absence de
   candidature active en doublon. L'identifiant étudiant n'est jamais fourni
   par le navigateur.
4. **Base** —
   [applications.repository.ts](../backend/src/repositories/applications.repository.ts)
   insère la ligne avec `IN_PROGRESS`. SQLite applique aussi l'index défini
   par [002_applications_active_unique.sql](../backend/src/db/migrations/002_applications_active_unique.sql).
5. **Réponse** — le repository retourne la ligne, le mapper
   [application.mapper.ts](../backend/src/mappers/application.mapper.ts) la
   convertit en DTO, puis le contrôleur renvoie `201`.
6. **Affichage** — le hook met à jour l'état de la page et
   [OffersPage.tsx](../frontend/src/pages/OffersPage.tsx) affiche la
   confirmation. La candidature est ensuite relue par `GET /applications`
   dans [ApplicationsPage.tsx](../frontend/src/pages/ApplicationsPage.tsx),
   avec les statuts traduits par [labels.ts](../frontend/src/utils/labels.ts).

Le retrait suit le même chemin avec `DELETE /applications/:id` : le serveur
vérifie la propriété et `IN_PROGRESS`, le repository effectue une mise à jour
conditionnelle vers `WITHDRAWN`, puis la page affiche « Retirée » et conserve
la ligne après rechargement.
