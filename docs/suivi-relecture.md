# Suivi de la relecture des phases 1 à 4

Complément du 17 novembre 2026 sur `feature/semaine-3-harnais`.
Ce document distingue les corrections actuelles des séances déjà rapportées.
Il ne reconstitue ni une conversation Copilot, ni des observations personnelles.

## Corrections apportées

| Sujet | Constat | Correction |
|---|---|---|
| Identité du déposant | Le test n'examinait que `201` et l'offre retournée | Relecture des listes avant/après : nouvelle ligne chez l'étudiant connecté, liste inchangée pour l'identité envoyée dans le corps |
| Offre non publiée | Une offre soumise était le seul témoin | Test paramétré pour `SUBMITTED`, `PENDING`, `ASSIGNED`, `ARCHIVED`, avec absence de candidature créée |
| État de candidature dans les offres | L'état local était perdu au retour sur la page | Lecture des candidatures existantes ; blocage des nouvelles candidatures non retirées, recandidature possible après retrait |
| Architecture frontend | La page portait directement l'envoi et ses états | Extraction dans `useOfferApplication`, gestion des erreurs et isolation des sessions |
| Guides | Statut HTTP, formulaires et preuves insuffisamment explicites | Instructions précisées et parcours du hook documenté |
| Senseurs récurrents | Vérifications uniquement locales | Workflow GitHub Actions sur Linux et Windows, basé sur `npm run check` |
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
La réussite locale ne permet pas de déclarer les deux environnements distants validés.

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
permet pas de certifier ici l'exhaustivité de l'export. Les sources Web 2 citées
dans l'audit ne sont pas incluses dans le dépôt ; leurs références sont conservées,
mais n'ont pas été revérifiées dans les supports lors de cette relecture.

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
