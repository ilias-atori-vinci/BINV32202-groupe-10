# Bilan de départ — semaine 4

## Point de départ

Cette semaine commence sur la branche `feature/semaine-4-skills-tdd-recherche`.
La vérification Git réalisée avant la rédaction indiquait un arbre de travail
propre. Le dernier commit observé est `a1d6376 ci: limiter les verifications
automatiques a Windows`. Aucun commit ni push n'est effectué pour ce document.

Les consignes du dépôt, [README.md](../README.md),
[architecture.md](architecture.md), [semaine-2.md](semaine-2.md),
[semaine-3.md](semaine-3.md) et [suivi-relecture.md](suivi-relecture.md) ont
été relus. L'architecture actuelle fait passer les offres par
`controller → service → repository` côté backend et
`page → hook → service` côté frontend.

### Résultats observés

La commande demandée a été exécutée à la racine :

```text
npm.cmd run check
```

Elle a réussi entièrement :

- lint backend et frontend : réussi, sans avertissement ;
- typecheck backend et frontend : réussi ;
- tests backend : 10 fichiers, 143 tests réussis ;
- tests frontend : 8 fichiers, 71 tests réussis ;
- build backend : réussi, migrations copiées ;
- build frontend : réussi avec Vite ;
- total : 214 tests réussis.

Ces tests sont automatisés. Ils ne constituent pas des essais navigateur et
ne prouvent pas encore la réussite d'une future recherche par titre.

### Parcours des offres et recherche d'entreprises

Le parcours d'affichage des offres observé est le suivant :

1. `OffersPage` conserve le filtre de période et appelle `useOffers`.
2. `useOffers` annule les requêtes obsolètes et appelle le service frontend.
3. `offers.service.ts` appelle `GET /offers?period=...` et valide le JSON.
4. Le contrôleur valide `period`, puis le service applique la visibilité selon
   le profil.
5. Le repository joint entreprise, année et période et filtre par statut,
   déposant et période.
6. `OfferTable` affiche les résultats et les actions de candidature prévues
   pour l'étudiant.

**Résultat observé :** il n'existe actuellement pas de paramètre de recherche
par titre dans `GET /offers`, ni de champ de recherche par titre dans
`OffersPage`. Le filtre disponible est celui de la période.

La recherche d'entreprises constitue l'exemple réutilisable :

- `companies.controller.ts` valide `q`, limite sa longueur à 100 caractères et
  traite une recherche vide comme absente ;
- `companies.repository.ts` cherche dans le nom complet et le nom abrégé,
  échappe les jokers `LIKE` et conserve le filtrage des entreprises actives ;
- `companies.service.ts` combine la visibilité selon le profil avec le texte ;
- `getCompanies` construit l'URL et valide la réponse avec `readJson` ;
- `useCompanies` applique un délai de frappe de 300 ms, annule la requête
  précédente et traite les erreurs de session ;
- `CompaniesPage.test.tsx` et `companies.test.ts` vérifient l'interface, le
  paramètre transmis, la casse, les caractères spéciaux, la longueur maximale
  et la visibilité.

Ce parcours servira de référence, sans être copié aveuglément : la recherche
des offres devra préserver la visibilité et le filtre de période existants.

## Audit des tests

### Résultats observés

Les tests actuels des offres couvrent l'authentification, la visibilité par
profil, les statuts exposés, le filtre par période, les paramètres invalides,
les réponses obsolètes et le parcours de candidature côté interface. Le
contrôle global du 17 novembre 2026 a confirmé 143 tests backend et 71 tests
frontend réussis.

La recherche par titre n'est pas couverte, puisqu'elle n'est pas implémentée.
Les tests d'entreprises fournissent toutefois les assertions utiles pour
rechercher dans un texte, limiter la saisie et protéger les jokers SQL.

### Travail prévu

Avant le code, compléter une matrice de cas pour la recherche d'offres :

- titre absent, vide, avec espaces et avec casse différente ;
- correspondance dans le titre complet, y compris une correspondance partielle ;
- titre contenant `%`, `_` ou `\`, traité comme texte ;
- limite de longueur et paramètre répété ;
- combinaison titre + période ;
- conservation des règles de visibilité administrateur, étudiant et déposant ;
- résultat vide et absence d'effet sur la candidature.

Les assertions devront vérifier les données retournées, les appels et les
effets de bord, pas seulement le statut HTTP. Les nouveaux tests devront être
écrits avant ou avec l'implémentation, puis le contrôle global sera relancé.

### Confrontation des constats EF-32 et EF-33

Le tableau confronte les constats du précédent audit aux assertions réellement
présentes. Les lignes marquées « constat écarté » ne sont pas des manques
actuels ; elles sont conservées pour éviter de répéter des recommandations
déjà appliquées.

| Cas | Test existant | Assertion utile | Manque confirmé ou constat écarté | Justification |
|---|---|---|---|---|
| Dépôt avec message | `crée une candidature avec un message pour un étudiant` dans [applications.test.ts:163](../backend/tests/applications.test.ts:163) | `POST 201`, message nettoyé, `IN_PROGRESS`, puis relecture par `GET` avec le même identifiant | Constat écarté | Le test prouve le contrat de réponse et la persistance. |
| Dépôt sans message | `crée une candidature sans message` dans [applications.test.ts:189](../backend/tests/applications.test.ts:189) | `message === null`, `IN_PROGRESS`, puis relecture de l'offre, de l'identifiant et du statut | Constat renforcé, manque corrigé | L'ancien test ne relisait pas la candidature après création ; l'assertion de relecture a été ajoutée. |
| Refus d'une offre non publiée | `refuse une offre %s conformément à RG-03` dans [applications.test.ts:210](../backend/tests/applications.test.ts:210) | `409`, code `OFFER_NOT_PUBLISHED`, puis liste vide pour `SUBMITTED`, `PENDING`, `ASSIGNED` et `ARCHIVED` | Constat écarté | Les quatre statuts et l'absence de création sont vérifiés. |
| Refus d'un administrateur ou d'un contact | `refuse un administrateur et un contact` dans [applications.test.ts:246](../backend/tests/applications.test.ts:246) | `403` et code `FORBIDDEN` pour chaque rôle | Constat renforcé, manque corrigé | Les statuts étaient déjà testés ; les deux codes d'erreur ont été ajoutés. |
| Doublon actif | `refuse une candidature active en doublon` dans [applications.test.ts:228](../backend/tests/applications.test.ts:228) et `refuse deux candidatures actives pour le même étudiant et la même offre` dans [constraints.test.ts:172](../backend/tests/db/constraints.test.ts:172) | code API `APPLICATION_EXISTS` et violation SQLite `UNIQUE` | Constat écarté | Le service et l'index partiel sont couverts séparément. |
| Retrait par le propriétaire | `retire la candidature en cours de l'étudiant connecté` dans [applications.test.ts:28](../backend/tests/applications.test.ts:28) et `retire une candidature en cours et conserve le statut affiché` dans [ApplicationsPage.test.tsx:112](../frontend/tests/ApplicationsPage.test.tsx:112) | statut `WITHDRAWN` relu côté API, puis libellé `Retirée` et bouton supprimé côté interface | Constat écarté | Le résultat métier et l'affichage sont vérifiés. |
| Retrait traité ou déjà retiré | `refuse le retrait d'une candidature %s` dans [applications.test.ts:53](../backend/tests/applications.test.ts:53) | `409 APPLICATION_NOT_WITHDRAWABLE`, puis statut initial inchangé | Constat écarté | Les cas `SELECTED`, `REJECTED` et `WITHDRAWN` sont paramétrés. |
| Retrait par un autre étudiant | `refuse le retrait d'une candidature appartenant à un autre étudiant` dans [applications.test.ts:40](../backend/tests/applications.test.ts:40) | `403 FORBIDDEN`, puis relecture des candidatures du propriétaire sans modification | Constat écarté | L'autorisation et l'absence d'effet de bord sont prouvées. |
| Retrait par un contact ou un administrateur | `refuse les rôles autres qu'étudiant` dans [applications.test.ts:69](../backend/tests/applications.test.ts:69) | `403` et `FORBIDDEN` pour les deux rôles | Constat écarté | Le contact, qui manquait dans l'ancien état, est maintenant testé. |
| Retrait refusé dans l'interface | `affiche l'erreur si le retrait est refusé et conserve le statut` dans [ApplicationsPage.test.tsx:139](../frontend/tests/ApplicationsPage.test.tsx:139) | alerte `statut 409`, statut `En cours` conservé, bouton `Retirer` réactivé | Constat renforcé, manque corrigé | Aucun test frontend ne couvrait auparavant l'échec du `DELETE`; le nouveau test détecterait une disparition ou une mutation optimiste incorrecte. |
| Recandidature après retrait | `autorise une nouvelle candidature après le retrait` dans [applications.test.ts:79](../backend/tests/applications.test.ts:79) | ancienne ligne `WITHDRAWN` et nouvelle ligne `IN_PROGRESS` avec un autre identifiant | Constat écarté | L'historique complet est relu après la nouvelle candidature. |
| Liste personnelle et isolation API | `retourne les candidatures de l'étudiant connecté avec les informations de l'offre` et `isole les résultats entre deux étudiants` dans [applications.test.ts:101](../backend/tests/applications.test.ts:101) | métadonnées de l'offre, statuts, longueurs et listes distinctes | Constat écarté | Les données personnelles et la séparation entre étudiants sont assertions directement. |
| Liste vide et profils interdits | `retourne une liste vide pour un étudiant sans candidature` et les tests d'accès dans [applications.test.ts:138](../backend/tests/applications.test.ts:138) | `200 []`, `403 FORBIDDEN` et `401` sans session | Constat écarté | Les états vide, interdit et non authentifié sont couverts côté API. |
| Quatre statuts dans l'interface | `affiche les informations de l'offre et les statuts français` dans [ApplicationsPage.test.tsx:54](../frontend/tests/ApplicationsPage.test.tsx:54) | `En cours`, `Retenue`, `Non retenue` et `Retirée` présents | Constat écarté | Les quatre libellés sont explicitement recherchés. |
| Relecture au retour sur les offres | `reconnaît une candidature %s après remontage de la page` dans [OffersPage.test.tsx:288](../frontend/tests/OffersPage.test.tsx:288) | bouton `Candidature envoyée` désactivé après démontage/remontage pour `IN_PROGRESS`, `SELECTED`, `REJECTED` | Constat écarté pour le comportement simulé | Le remontage et la relecture mockée sont testés ; cela ne prouve toutefois pas un essai navigateur avec une base réelle. |
| Isolation au changement de session frontend | `masque les candidatures précédentes au changement de session` dans [ApplicationsPage.test.tsx:68](../frontend/tests/ApplicationsPage.test.tsx:68) et `ignore l'historique de l'ancienne session reçu en retard` dans [OffersPage.test.tsx:380](../frontend/tests/OffersPage.test.tsx:380) | ancienne donnée masquée, nouveau jeton transmis, réponse tardive ignorée | Constat écarté | Les courses entre sessions sont couvertes par des réponses simulées. |

Les trois renforcements ont été exécutés avant le contrôle global. Aucun défaut
du code applicatif n'a été révélé : les tests ciblés ont réussi. Les nouveaux
tests échoueraient concrètement si le dépôt sans message n'était pas persisté,
si un rôle interdit renvoyait un autre code que `FORBIDDEN`, ou si un retrait
refusé supprimait/modifiait localement la candidature ou désactivait
définitivement le bouton.

## Installation des skills

### Résultats observés

Le skill [SKILL.md](../.github/skills/test-gap-audit/SKILL.md) est présent dans
le dépôt et a été lu intégralement. Son frontmatter commence et se termine par
les délimiteurs YAML attendus et contient les champs `name`, `description` et
`license`. La description est une valeur YAML sur une seule ligne ; elle
contient bien toute la méthode de déclenchement et de portée du skill. La
mention `license: MIT` est présente et n'a pas été supprimée.

Le script
[coverage_map.py](../.github/skills/test-gap-audit/scripts/coverage_map.py)
mentionné par le skill existe. La vérification syntaxique Python a réussi sans
produire de fichier :

```text
python -B -m py_compile .github\skills\test-gap-audit\scripts\coverage_map.py
exit=0
```

Le skill mentionne aussi `docs-sync-audit` dans sa section « Related Skills ».
La vérification du dépôt ne trouve pas de dossier
`.github/skills/docs-sync-audit/`. Cette ressource locale est donc signalée
comme manquante ; aucun remplacement n'a été inventé ou installé. L'URL
externe `https://github.com/specialone0007/review-skills` est conservée dans
le skill et n'a pas été traitée comme une installation locale.

Le dépôt contient par ailleurs les instructions Copilot dans
[.github/copilot-instructions.md](../.github/copilot-instructions.md) et la
configuration Playwright dans [.vscode/mcp.json](../.vscode/mcp.json). Les
instructions documentent déjà les commandes de contrôle, le découpage MVVM,
les hooks, les validations HTTP et la distinction entre tests simulés et
essais navigateur.

### Vérifications effectuées

- `Get-Content .github\skills\test-gap-audit\SKILL.md` avec lecture des
  176 lignes : lecture intégrale réalisée ;
- vérification PowerShell du frontmatter : délimiteurs et clés `name`,
  `description`, `license` conformes ;
- `Test-Path .github\skills\test-gap-audit\scripts\coverage_map.py` : script
  présent ;
- `Get-ChildItem .github\skills` et recherche ciblée : aucun dossier local
  `docs-sync-audit` trouvé ;
- `python -B -m py_compile ...\coverage_map.py` : réussi ;
- l'audit `coverage_map.py` n'a pas été lancé, conformément à la consigne.

Le skill et son dossier restent non suivis par Git dans l'état observé ; cette
vérification n'a créé ni commit ni push.

### Travail prévu

Identifier puis installer uniquement les skills nécessaires au travail
demandé, en vérifiant leur portée et leur mode d'activation avant de les
utiliser. La configuration ne devra pas remplacer les contrôles du dépôt ni
introduire une dépendance inutile. Toute installation effective et son
résultat seront consignés séparément ; cette section ne constitue pas une
preuve d'installation.

## TDD

### Résultats observés

Le dépôt possède déjà un harnais de tests backend (Vitest/Supertest sur SQLite
en mémoire) et frontend (Vitest/Testing Library avec réponses API simulées).
Les tests existants de recherche d'entreprises montrent des assertions
réutilisables pour la validation du paramètre et le comportement de recherche.

Aucun cycle TDD spécifique à la recherche par titre n'a encore été réalisé.

### Travail prévu

Appliquer un cycle court :

1. écrire les tests rouges du contrat de recherche et de ses combinaisons ;
2. implémenter le minimum dans contrôleur, service, repository, service
   frontend, hook et page ;
3. refactorer sans perdre la visibilité, l'annulation ou la validation ;
4. relancer les tests ciblés, puis `npm.cmd run check`.

Les résultats devront distinguer les tests réellement exécutés des scénarios
simplement prévus.

## Essais navigateur

### Résultats observés

`npm.cmd run check` n'a exécuté aucun navigateur. Les tests frontend actuels
utilisent jsdom et des mocks d'API ; ils ne valident donc ni le lancement
simultané de l'API et de Vite, ni une recherche réelle dans l'interface.
Aucun nouvel essai navigateur n'est déclaré dans ce point de départ.

### Travail prévu

Après implémentation, démarrer l'application avec `npm.cmd run dev`, se
connecter avec au moins un administrateur et un étudiant, puis vérifier :

- saisie d'un titre et mise à jour des résultats ;
- titre inconnu et message d'état vide ;
- combinaison avec chaque période ;
- respect des offres visibles selon le profil ;
- annulation ou remplacement d'une recherche rapide ;
- absence de régression de la candidature depuis la liste.

Le compte utilisé, les actions et le résultat réellement observé devront être
notés. Un test jsdom réussi ne sera pas présenté comme une observation
navigateur.

## Hook optionnel

### Travail prévu

Évaluer un hook optionnel dédié à la recherche par titre seulement si le
parcours gagne réellement en lisibilité. Il pourrait regrouper la valeur
saisie, le délai, l'annulation, le chargement et l'erreur, sur le modèle de
`useCompanies`, mais `useOffers` doit rester responsable du chargement des
offres et de l'isolation des sessions.

### Limite actuelle

Aucun hook optionnel n'est installé, créé ou validé dans ce point de départ.
Il ne faudra pas ajouter une abstraction uniquement pour satisfaire le thème
de la semaine.

## Limites

- La recherche par titre reste à concevoir et à implémenter ; aucune
  fonctionnalité applicative n'est ajoutée par ce document.
- Les résultats de `npm.cmd run check` sont locaux ; aucune réussite de la CI
  distante n'est déduite.
- Les tests frontend simulent l'API et ne remplacent pas les essais dans un
  navigateur réel.
- Les essais personnels rapportés dans les bilans précédents restent
  distincts des observations réalisées cette semaine.
- Les choix encore ouverts (syntaxe exacte du paramètre, longueur maximale,
  comportement de la casse et emplacement du champ) devront être fixés par
  des tests et par les conventions existantes avant le développement.
