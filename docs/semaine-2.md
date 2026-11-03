# Préparation — Semaine 2

## Choix de planification

Les choix suivants sont retenus pour préparer l'implémentation des
candidatures. Ils ne constituent pas encore une fonctionnalité réalisée.

### Compatibilité avec le cahier des charges

RG-03 prévoit qu'un étudiant ne peut candidater qu'à une offre au statut
« Publiée ». Cette règle est compatible avec les choix ci-dessous et devra
être contrôlée côté serveur au moment de chaque création de candidature :

- une offre `PUBLISHED` peut recevoir une candidature ;
- une offre `SUBMITTED`, `PENDING`, `ASSIGNED` ou `ARCHIVED` doit être refusée ;
- le bouton affiché dans le frontend ne remplace pas ce contrôle serveur.

EF-32 prévoit un message facultatif et autorise le retrait tant que la
candidature n'a pas été traitée. EF-33 prévoit la conservation et
l'affichage des statuts « En cours », « Retenue », « Non retenue » et
« Retirée ».

### Décisions métier retenues

- Un étudiant ne peut avoir qu'une candidature non retirée pour une même
  offre. Une candidature `IN_PROGRESS`, `SELECTED` ou `REJECTED` empêche
  donc la création d'une autre candidature pour ce couple étudiant/offre.
- Une nouvelle candidature est autorisée après un retrait, à condition que
  l'offre soit toujours `PUBLISHED`.
- Le retrait est logique : la candidature est conservée en base et son
  statut devient `WITHDRAWN` (« Retirée »).
- Seule une candidature `IN_PROGRESS` peut être retirée. Une candidature
  `SELECTED` ou `REJECTED` est considérée comme traitée et ne peut plus être
  retirée ; une candidature déjà `WITHDRAWN` ne peut pas être retirée une
  seconde fois.
- Les codes techniques déjà présents dans le schéma sont conservés :
  `IN_PROGRESS`, `SELECTED`, `REJECTED` et `WITHDRAWN`. Le frontend les
  traduira respectivement par « En cours », « Retenue », « Non retenue » et
  « Retirée ».

### Distinction entre exigences et propositions

Les exigences explicites sont RG-03, EF-32, EF-33 et la conservation des
statuts déjà définis dans la base. Le cahier des charges ne précise pas le
traitement des doublons ni la possibilité de recandidater après un retrait :
ces deux points sont donc des choix de planification pour cette
implémentation.

RG-01 signifie qu'une offre est destinée à un seul étudiant retenu ; elle
n'interdit pas à plusieurs étudiants de candidater à cette offre avant la
sélection. La sélection, le passage à `ASSIGNED`, la création du stage et le
passage des autres candidatures à `REJECTED` restent hors périmètre de cette
semaine.

## État de préparation

Le plan décrit les modifications backend, frontend, base de données,
documentation et tests à réaliser en trois étapes :

1. Candidater.
2. Consulter ses candidatures.
3. Retirer une candidature.

Aucune fonctionnalité n'est déclarée comme réalisée et aucun test n'est
déclaré comme réussi à ce stade.

## Tableau de validation EF-32, EF-33 et RG-03

Les résultats observés sont volontairement laissés à « À vérifier » pour être
complétés pendant la séance de validation. Les données de démonstration sont
réinitialisées uniquement par `npm run db:reset`, à éviter pendant une série
d'essais où la persistance doit être vérifiée.
Dans l'état actuel du compte rendu, aucun essai réel ni anomalie n'a été
communiqué ; aucune ligne n'est donc déclarée réussie et aucun correctif
supplémentaire n'est justifié.

| Cas | Préconditions | Actions | Résultat attendu | Résultat observé |
|---|---|---|---|---|
| Candidature avec message | Étudiant connecté ; offre `PUBLISHED` ; par exemple Dmytro Kovalenko (`STUDENT`, id 8) et l'offre 1 | Dans « Offres », cliquer « Candidater », saisir un message, puis « Envoyer ma candidature » | Confirmation ; candidature créée avec le message et le statut « En cours » | À vérifier |
| Candidature sans message | Étudiant connecté ; offre `PUBLISHED` ; par exemple Louis Claes (`STUDENT`, id 9) et l'offre 3 | Cliquer « Candidater » puis envoyer sans remplir le message | Confirmation ; candidature créée avec un message vide/null et le statut « En cours » | À vérifier |
| Persistance après rechargement | Une candidature vient d'être créée ou retirée | Actualiser la page « Mes candidatures » | La candidature et son statut sont relus depuis la base et restent affichés | À vérifier |
| Consultation et affichage des statuts | Comptes de démonstration contenant les quatre statuts | Ouvrir « Mes candidatures » avec Inès Haddad (id 2), Mateusz Kowalski (id 3), Léa Mertens (id 4) et Lucas Dupont (id 1) | Les libellés affichés sont respectivement « En cours », « Retenue », « Non retenue » et « Retirée » selon les candidatures présentes | À vérifier |
| Retrait d'une candidature en cours | Lucas Dupont connecté ; candidature 1 en `IN_PROGRESS` | Dans « Mes candidatures », cliquer « Retirer » | Le bouton disparaît, le statut devient « Retirée », la ligne reste visible | À vérifier |
| Refus du retrait d'une candidature traitée | Mateusz ou Léa connecté ; candidature `SELECTED` ou `REJECTED` | Tenter le retrait via l'API `DELETE /applications/:id` | Réponse `409 APPLICATION_NOT_WITHDRAWABLE` ; le statut reste inchangé | À vérifier |
| Séparation des candidatures entre deux étudiants | Lucas et Léa disposent de candidatures différentes | Ouvrir « Mes candidatures » avec Lucas, se déconnecter, puis ouvrir la même page avec Léa | Chaque compte ne voit que ses propres candidatures | À vérifier |
| Refus pour un rôle autre qu'étudiant | Jeton d'Anne Leclercq (`ADMIN`, id 1) ou de Marc Lejeune (`CONTACT`, id 2) | Appeler `GET /applications`, `POST /applications` ou `DELETE /applications/:id` avec ce jeton | Réponse `403 FORBIDDEN` ; aucune candidature n'est lue, créée ou modifiée | À vérifier |
| Refus sur une offre non publiée | Étudiant connecté ; offre 2 `SUBMITTED` ou offre 4 `PENDING` | Appeler `POST /applications` avec `{ "offerId": 2 }` ou `{ "offerId": 4 }` | Réponse `409 OFFER_NOT_PUBLISHED` conformément à RG-03 ; aucune ligne créée | À vérifier |
| Doublon | Lucas possède déjà une candidature non retirée sur l'offre 1 | Depuis l'interface ou via `POST /applications`, candidater à nouveau à l'offre 1 | Réponse `409 APPLICATION_EXISTS` ; une seule candidature non retirée est conservée | À vérifier |
| Nouvelle candidature après retrait | Lucas a retiré sa candidature 1 ; l'offre 1 est toujours `PUBLISHED` | Soumettre une nouvelle candidature pour l'offre 1 | Nouvelle candidature `IN_PROGRESS` acceptée ; ancienne ligne conservée avec « Retirée » | À vérifier |

### Comptes et procédures manuelles

Les identifiants sont ceux du mode démo local :

| Compte | Connexion | Usage |
|---|---|---|
| Lucas Dupont | `STUDENT`, id `1` | candidature en cours sur l'offre 1 ; séparation et retrait |
| Inès Haddad | `STUDENT`, id `2` | candidature en cours et candidature retirée |
| Mateusz Kowalski | `STUDENT`, id `3` | candidature retenue ; retrait traité |
| Léa Mertens | `STUDENT`, id `4` | candidature non retenue ; retrait traité |
| Dmytro Kovalenko | `STUDENT`, id `8` | dépôt avec message et cas d'étudiant sans candidature après réinitialisation adaptée |
| Louis Claes | `STUDENT`, id `9` | dépôt sans message |
| Anne Leclercq | `ADMIN`, id `1` | vérification du refus de rôle |
| Marc Lejeune | `CONTACT`, id `2` | vérification du refus de rôle |

Pour les essais via l'interface :

1. Lancer `npm run dev`, ouvrir `http://localhost:5173` et choisir un compte
   dans la connexion de démonstration.
2. Pour EF-32, ouvrir « Offres », choisir une offre publiée, cliquer
   « Candidater », puis envoyer avec ou sans message.
3. Ouvrir « Mes candidatures » et actualiser la page pour vérifier la
   persistance.
4. Pour EF-33, répéter la consultation avec Lucas, Inès, Mateusz et Léa.
5. Pour le retrait, utiliser Lucas sur sa candidature en cours, cliquer
   « Retirer », puis actualiser la page.
6. Pour la séparation, noter les lignes visibles avec Lucas, se déconnecter,
   se connecter avec Léa et comparer les listes.

Pour les cas non accessibles ou non sûrs dans l'interface, utiliser
[applications.http](../backend/http/applications.http) avec REST Client ou
les tests existants dans
[applications.test.ts](../backend/tests/applications.test.ts) :

- `POST /applications` avec l'offre 2 ou 4 vérifie RG-03 ;
- répéter `POST /applications` sur l'offre 1 vérifie le doublon ;
- `DELETE /applications/3`, `/4` ou `/5` vérifie les statuts traités ou déjà
  retiré ;
- `DELETE /applications/2` avec le jeton de Lucas vérifie la propriété ;
- les tests `POST`, `GET` et `DELETE` de
  [applications.test.ts](../backend/tests/applications.test.ts) couvrent aussi
  les rôles, l'isolation et la recandidature après retrait.
