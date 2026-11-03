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
