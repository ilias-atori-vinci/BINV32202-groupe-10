# Scénarios end-to-end — recherche des offres

Ces scénarios utilisent les données de démonstration du seed et ne doivent pas
modifier la base de développement. Ne pas exécuter `npm run db:reset`, même pour
préparer les essais. Chaque cas doit être exécuté dans un contexte navigateur
nouveau et indépendant, avec des cookies, le stockage local et la session
initiaux propres.

## 1. Cas nominal — recherche « API » avec P2

### Profil

- Étudiant : **Dmytro Kovalenko**.
- Son compte demo est actif et son identifiant seed est `STUDENT.DMYTRO_KOVALENKO`
  (`8`). Il n'a aucune candidature dans les données de démonstration.

### Données nécessaires

- Offre publiée attendue : **API REST de facturation**.
- Entreprise : Orbis.
- Année académique : 2026-2027.
- Période : P2.
- Statut : publié.
- Les autres offres publiées du seed en P2 doivent rester disponibles dans
  l'état initial : Application React de gestion de flotte, Tableau de bord de
  qualité des données et Assistant conversationnel interne.

### État initial

- Ouvrir une nouvelle session navigateur privée ou un nouveau contexte
  Playwright.
- Aucun token Gesta ni utilisateur ne doit être conservé dans le stockage local.
- Aucun état de filtre ne doit être préchargé.
- Vérifier que la base de développement contient le seed sans avoir exécuté une
  réinitialisation ; ne créer, retirer ou modifier aucune candidature.
- Ouvrir `http://localhost:5173`.

### Actions exactes

1. Sur la page « Connexion de démonstration », cliquer sur le bouton
   **Dmytro Kovalenko**.
2. Attendre l'ouverture de la session.
3. Cliquer sur le lien de navigation **Offres**.
4. Attendre l'affichage de la liste « Offres de stage ».
5. Sélectionner **P2** dans le champ associé au libellé **Période**.
6. Saisir exactement `API` dans le champ associé au libellé
   **Rechercher par titre**.
7. Attendre la fin de la requête et du chargement.

### Assertions observables

- La session affiche Dmytro Kovalenko comme étudiant.
- Le titre de page est **Offres de stage**.
- Le champ Période vaut `P2`.
- Le champ Rechercher par titre vaut `API`.
- Le tableau contient exactement une ligne d'offre.
- Cette ligne contient exactement le titre **API REST de facturation**.
- La ligne indique Orbis, l'année 2026-2027, P2 et le statut français
  **Publiée**.
- Aucun autre titre d'offre n'est affiché.
- Notamment, les titres Application React de gestion de flotte, Refonte du
  portail client, Tableau de bord de qualité des données, Automatisation des
  tests de bout en bout, Migration d'une application vers le cloud, Assistant
  conversationnel interne, Outil de planification des consultants, Module de
  rapports PDF et Numérisation d'archives papier sont absents.
- L'état ne présente ni chargement persistant ni message d'erreur.

## 2. Cas limite — texte sans correspondance

### Profil

- Étudiant : **Dmytro Kovalenko**.
- Son compte demo est actif et son identifiant seed est `STUDENT.DMYTRO_KOVALENKO`
  (`8`). Il n'a aucune candidature dans les données de démonstration.

### Données nécessaires

- Aucun titre d'offre ne doit correspondre au texte exact
  `zzzz-inexistant-742`.
- Période de contrôle : P2.
- Le filtre doit être testé sur l'ensemble des offres publiées visibles pour
  Dmytro.
- Ne préparer aucune ligne ni aucune candidature supplémentaire.

### État initial

- Ouvrir une nouvelle session navigateur privée ou un nouveau contexte
  Playwright distinct de celui du cas nominal.
- Aucun token Gesta, cookie de session, utilisateur ou filtre ne doit être
  conservé depuis le cas précédent.
- Vérifier que la base de développement reste dans son état seedé sans exécuter
  `npm run db:reset` ni modifier les données.
- Ouvrir `http://localhost:5173`.

### Actions exactes

1. Sur la page « Connexion de démonstration », cliquer sur le bouton
   **Dmytro Kovalenko**.
2. Attendre l'ouverture de la session.
3. Cliquer sur le lien de navigation **Offres**.
4. Attendre l'affichage de la liste « Offres de stage ».
5. Sélectionner **P2** dans le champ associé au libellé **Période**.
6. Saisir exactement `zzzz-inexistant-742` dans le champ associé au libellé
   **Rechercher par titre**.
7. Attendre la fin de la requête et du chargement.

### Assertions observables

- La session affiche Dmytro Kovalenko comme étudiant.
- Le titre de page est **Offres de stage**.
- Le champ Période vaut `P2`.
- Le champ Rechercher par titre vaut `zzzz-inexistant-742`.
- Aucun élément de ligne d'offre n'est affiché dans le tableau.
- Aucun titre d'offre du seed n'est visible.
- Le message exact suivant est visible :
  **Aucune offre ne correspond à la recherche.**
- Aucun autre état vide, tel que « Aucune offre à afficher. », ne doit
  apparaître.
- L'état ne présente ni chargement persistant ni message d'erreur.
