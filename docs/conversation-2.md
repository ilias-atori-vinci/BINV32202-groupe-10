Je vais d’abord cartographier le cahier des charges, l’architecture et les flux existants, puis vérifier l’état du dépôt et les tests sans modifier aucun fichier. Je me concentrerai ensuite sur les surfaces réellement nécessaires aux trois étapes demandées.

Le cahier des charges confirme déjà RG-03 : « Un étudiant ne peut candidater qu’à une offre au statut “Publiée” ». Je vérifie maintenant sa position exacte dans la matrice, le schéma déjà préparé pour les candidatures, puis les conventions concrètes des offres, de l’authentification et des tests afin que le plan soit traçable fichier par fichier.

État actuel du dépôt
Le dépôt est un monorepo npm avec :

un backend Express/TypeScript ;
un frontend React/Vite/TypeScript ;
une base SQLite avec migrations SQL ;
des tests backend Vitest/Supertest et frontend Vitest/Testing Library.
L’architecture suivie est :

Références principales :

architecture.md
API.md
cdc_gesta_developpement.md
Schéma de données existant
La table applications existe déjà dans la migration initiale 001_initial.sql, avec :

offer_id ;
student_id ;
message facultatif ;
status : IN_PROGRESS, SELECTED, REJECTED ou WITHDRAWN ;
applied_at.
Les offres possèdent déjà les statuts PUBLISHED et ASSIGNED. Les candidatures de démonstration sont également présentes dans offersData.ts :

Lucas et Inès : candidatures en cours ;
Mateusz : candidature retenue ;
Léa : candidature non retenue ;
Inès : candidature retirée ;
Youssef : candidature en cours.
Il n’existe toutefois actuellement :

aucun repository/service/controller dédié aux candidatures ;
aucune route API de candidature ;
aucun modèle ou mapper de candidature ;
aucune interface frontend pour candidater ou consulter ses candidatures ;
aucune contrainte d’unicité en base sur le couple étudiant/offre.
Authentification et rôles
L’utilisateur est authentifié par le middleware authenticate.ts. Le jeton contient seulement kind et id, puis l’utilisateur est relu en base à chaque requête.

Le rôle pertinent ici est STUDENT. Les règles d’accès sont centralisées dans permissions.ts.

L’assemblage des routes se fait dans app.ts. La liste actuelle des offres est fournie par :

offers.controller.ts ;
offers.service.ts ;
offers.repository.ts.
Côté frontend, les offres sont affichées par OffersPage.tsx et OfferTable.tsx, avec le chargement dans useOffers.ts et offers.service.ts.

RG-03 et ses conséquences
RG-03 est bien présente dans le cahier des charges, section 6 :

« Un étudiant ne peut candidater qu’à une offre au statut “Publiée”. »

Elle est également reprise par EF-32 et la décision client D-07.

Conséquences :

Le frontend ne doit afficher l’action « Candidater » que pour une offre publiée, mais cela ne constitue pas une protection suffisante.
Le backend doit vérifier que l’utilisateur est bien un étudiant.
Le backend doit vérifier que l’offre existe et possède encore le statut PUBLISHED au moment de la candidature.
Une candidature directe vers une offre SUBMITTED, PENDING, ASSIGNED ou ARCHIVED doit être refusée.
Le contrôle doit être fait côté serveur, même si l’offre était visible quelques instants auparavant.
Une offre déjà attribuée ne doit plus accepter de nouvelle candidature.
Le message doit être facultatif et validé côté serveur.
Le cahier des charges ne précise pas explicitement le comportement des doublons ou d’une nouvelle candidature après retrait.

Plan proposé

1. Candidater
   Fichiers concernés et rôle
   Backend :

app.ts : enregistrer le nouveau routeur/service.
Nouveau applications.controller.ts : route HTTP, validation du corps et statuts HTTP.
Nouveau applications.service.ts : règles métier.
Nouveau applications.repository.ts : requêtes SQL.
Nouveau application.ts : types des statuts, DBO et DTO.
Nouveau application.mapper.ts : conversion DBO/domaine/DTO.
API.md : documenter la route.
Nouveau fichier sous backend/http : exemple REST Client.
001*initial.sql : ne pas modifier.
Une migration 002*...sql serait nécessaire uniquement pour ajouter une contrainte d’intégrité décidée pour les doublons.

Frontend :

OffersPage.tsx : intégrer l’action pour les étudiants.
OfferTable.tsx : afficher le bouton « Candidater » pour les offres publiées.
Nouveau composant éventuel ApplicationForm : saisie du message facultatif.
Nouveau applications.service.ts : appel POST et validation de la réponse.
Nouveau application.ts : types frontend.
guards.ts : type guard de candidature.
labels.ts : libellés français des statuts.
Modifications prévues
Ajouter une route de type POST /applications.
Envoyer au minimum { offerId, message? }.
Retourner la candidature créée avec le statut IN_PROGRESS.
Afficher le message de confirmation et empêcher une double soumission dans l’interface.
Rafraîchir ou mettre à jour l’état local après succès.
Ne pas afficher l’action pour un administrateur ou un contact.
Contrôles côté serveur
Session obligatoire.
Utilisateur de type STUDENT.
Étudiant actif.
offerId entier positif.
Message absent, nul ou texte non vide ; longueur maximale à définir et appliquer.
Offre existante.
Offre au statut strictement PUBLISHED, conformément à RG-03.
Vérification du doublon selon la décision métier retenue.
Erreurs JSON normalisées via errorHandler.ts.
Tests pertinents
Nouveau applications.test.ts :
candidature valide avec message ;
candidature valide sans message ;
absence de session ;
refus d’un administrateur ou d’un contact ;
offre inexistante ;
refus pour offre non publiée ;
refus pour offre attribuée ou archivée ;
validation des champs ;
comportement des doublons.
Compléter éventuellement constraints.test.ts si une contrainte SQL est ajoutée.
Compléter OffersPage.test.tsx :
bouton présent uniquement pour l’étudiant et les offres publiées ;
envoi du message ;
succès et erreur serveur ;
prévention de double soumission.
Vérifications manuelles
Avec Lucas ou Dmytro :

ouvrir la liste des offres ;
vérifier que seules les offres publiées sont visibles ;
cliquer sur « Candidater » ;
saisir ou non un message ;
vérifier la confirmation ;
essayer ensuite une requête directe sur une offre non publiée avec REST Client et vérifier le refus serveur. 2. Consulter ses candidatures
Fichiers concernés et rôle
Backend :

app.ts : brancher la route.
applications.controller.ts : route de lecture.
applications.service.ts : filtrage par étudiant.
applications.repository.ts : jointures avec les offres et entreprises.
application.mapper.ts : DTO public.
API.md : documenter GET /applications.
Frontend :

Nouveau ApplicationsPage.tsx : page de consultation.
Nouveau useApplications.ts : chargement et gestion de session expirée.
Nouveau ApplicationsTable.tsx : affichage réutilisable.
App.tsx : route protégée pour les étudiants.
NavBar.tsx : lien « Mes candidatures ».
labels.ts : statuts En cours, Retenue, Non retenue, Retirée.
guards.ts : validation de la réponse API.
Modifications prévues
Ajouter une route GET /applications.
Retourner uniquement les candidatures de l’étudiant connecté.
Inclure les informations utiles de l’offre : titre, entreprise, année, période, date et statut.
Afficher les statuts avec les libellés imposés par EF-33.
Afficher un état vide pour un étudiant sans candidature.
Ne pas exposer le message ou les données d’un autre étudiant si ce n’est pas nécessaire à cette fonctionnalité.
Prévoir l’action « Retirer » pour les candidatures encore en cours ; son implémentation est détaillée à l’étape 3.
Contrôles côté serveur
Session obligatoire.
Utilisateur de type STUDENT.
Filtre obligatoire par student_id issu de la session, jamais par un identifiant fourni par le frontend.
Un étudiant ne doit pas pouvoir consulter les candidatures d’un autre étudiant.
Les statuts renvoyés doivent correspondre aux valeurs autorisées du schéma.
Les offres supprimées ou archivées doivent rester correctement représentées si leur candidature existe encore.
Tests pertinents
Nouveau applications.test.ts :
Lucas voit ses deux candidatures ;
Inès voit sa candidature en cours et sa candidature retirée ;
Mateusz voit SELECTED ;
Léa voit REJECTED ;
un étudiant ne voit jamais les candidatures d’un autre ;
administrateur/contact refusés si l’API est strictement étudiante ;
absence de session.
Nouveau ApplicationsPage.test.tsx :
libellés français ;
affichage des quatre statuts ;
état vide ;
erreur API ;
déconnexion sur 401 ;
navigation depuis la barre principale.
Compléter NavBar.test.tsx et App.test.tsx.
Vérifications manuelles
Se connecter successivement avec :

Lucas : vérifier les candidatures en cours ;
Inès : vérifier En cours et Retirée ;
Mateusz : vérifier Retenue ;
Léa : vérifier Non retenue ;
Dmytro ou Louis : vérifier l’état vide.
Vérifier également qu’un contact ou un administrateur ne voit pas le lien étudiant et ne peut pas appeler l’API avec succès.

3. Retirer une candidature
   Fichiers concernés et rôle
   Backend :

applications.controller.ts : route DELETE.
applications.service.ts : vérification de propriété et de statut.
applications.repository.ts : mise à jour atomique vers WITHDRAWN.
API.md : documenter la suppression logique, qui ne doit pas supprimer la ligne en base.
Nouveau ou mise à jour du fichier REST Client correspondant.
Frontend :

ApplicationsPage.tsx : bouton de retrait uniquement pour IN_PROGRESS.
applications.service.ts : appel DELETE.
useApplications.ts : mise à jour après retrait.
Éventuel composant de confirmation si l’interface le justifie.
ApplicationsPage.test.tsx : tests du retrait.
Modifications prévues
Ajouter DELETE /applications/:id.
Effectuer un retrait logique : conserver la candidature et passer son statut à WITHDRAWN.
Afficher ensuite « Retirée ».
Ne jamais supprimer physiquement l’historique.
Désactiver l’action pour les statuts SELECTED, REJECTED et WITHDRAWN.
Contrôles côté serveur
Session obligatoire.
Utilisateur de type STUDENT.
La candidature doit appartenir à l’étudiant connecté.
La candidature doit encore être IN_PROGRESS.
Une candidature déjà traitée (SELECTED ou REJECTED) ne peut pas être retirée.
Une candidature déjà retirée ne doit pas être retirée une seconde fois.
La mise à jour SQL doit inclure le statut attendu, par exemple WHERE id = ? AND student_id = ? AND status = 'IN_PROGRESS', afin d’éviter une course entre lecture et modification.
Retourner une erreur explicite si aucun enregistrement n’a été modifié.
Tests pertinents
Backend dans applications.test.ts :

retrait réussi par le propriétaire ;
impossibilité de retirer une candidature d’un autre étudiant ;
impossibilité de retirer une candidature SELECTED ;
impossibilité de retirer une candidature REJECTED ;
impossibilité de retirer une candidature déjà WITHDRAWN ;
absence de session ;
rôle non étudiant ;
vérification que la ligne existe toujours avec le statut WITHDRAWN.
Frontend dans ApplicationsPage.test.tsx :

bouton uniquement pour En cours ;
confirmation et appel DELETE ;
affichage immédiat ou après rechargement du statut Retirée ;
gestion des erreurs 400/403/404/401 ;
prévention des clics multiples.
Vérifications manuelles
Avec Inès :

ouvrir ses candidatures ;
retirer sa candidature en cours ;
vérifier que son statut devient « Retirée » ;
vérifier que la candidature reste visible après actualisation ;
tenter de retirer la candidature déjà retirée.
Avec Mateusz ou Léa :

vérifier qu’aucun bouton de retrait n’est proposé ;
vérifier qu’un appel direct au backend est refusé.
Décisions métier à prendre
Ces points ne sont pas tranchés explicitement par EF-32, EF-33 ou RG-03.

Doublon étudiant/offre
Le cahier des charges ne dit pas si un étudiant peut créer plusieurs lignes de candidature pour la même offre.

Proposition : une seule candidature active par couple (student_id, offer_id).

Deux implémentations possibles :

Règle applicative uniquement
Le service refuse une candidature si une ligne existante est IN_PROGRESS, SELECTED ou REJECTED.
Avantage : possibilité de conserver plusieurs retraits historiques.
Inconvénient : la base ne garantit pas seule l’intégrité en cas de concurrence.

Contrainte SQL
Ajouter une migration, par exemple 002_applications_constraints.sql, avec une unicité partielle sur les candidatures non retirées.
Avantage : protection forte au niveau base.
Inconvénient : la stratégie doit être définie précisément si une nouvelle candidature après retrait est autorisée.

Nouvelle candidature après retrait
Le cahier des charges autorise le retrait tant que la candidature n’est pas traitée, mais ne précise pas si l’étudiant peut ensuite candidater à nouveau à la même offre.

Proposition recommandée : autoriser une nouvelle candidature après WITHDRAWN, uniquement si l’offre est toujours PUBLISHED.

Conséquences :

les candidatures retirées restent dans l’historique ;
une nouvelle ligne IN_PROGRESS est créée ;
il ne peut jamais y avoir simultanément deux candidatures actives pour le même étudiant et la même offre ;
une candidature SELECTED ou REJECTED bloque toute nouvelle candidature sur cette offre.
Alternative plus stricte : interdire définitivement toute nouvelle candidature après retrait. Cette règle serait plus simple, mais elle n’est pas exigée par le cahier des charges.

Longueur du message
EF-32 rend le message facultatif, mais ne donne pas sa longueur maximale.

Proposition : définir une limite explicite commune frontend/backend, par exemple 2 000 caractères, avec refus serveur au-delà.

Accès administrateur aux candidatures
EF-34, la sélection d’un candidat et EF-30/EF-31 sont explicitement hors périmètre de cette semaine. Je propose donc que la première version expose uniquement les candidatures de l’étudiant connecté, sans écran administrateur.

La structure devra toutefois rester compatible avec une future consultation administrateur et avec RG-04.

Aucun fichier n’a été modifié et aucun test n’a été exécuté.

11:13 AM
1m 50s
•
Auto (gpt-5.6-luna) • 2.7 credits
