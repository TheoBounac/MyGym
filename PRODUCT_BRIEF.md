# MyGym - Memoire du projet

## Objectif
Créer une application mobile de sport et de salle de sport avec Expo / React Native.

## Vision
MyGym doit aider l'utilisateur à organiser ses séances, suivre les exercices prévus ou réalisés, consulter son historique et visualiser ses statistiques personnelles.

La priorité actuelle est de construire le backbone fonctionnel de l'application. L'aspect visuel détaillé viendra après.

Le planning ne doit plus utiliser de données de test préremplies. Les exercices ajoutés doivent être sauvegardés localement sur l'appareil.

## Fonctionnalités prévues
- Navigation par menu en bas avec quatre onglets :
  - Planning
  - Exercices
  - Nutrition
  - Amis
- Calendrier hebdomadaire des séances.
- Ajout d'un exercice dans un jour précis.
- Sauvegarde locale des exercices du planning.
- Semaines distinctes : un exercice ajouté sur une semaine ne doit pas apparaître sur une autre semaine.
- Consultation du détail d'un exercice planifié :
  - poids
  - nombre de séries
  - nombre de répétitions
- Liste globale des exercices.
- Historique des jours où un exercice a été fait ou enregistré.
- Statistiques personnelles :
  - poids
  - taille
  - autres données personnelles à définir
- Courbe du poids au cours du temps.

## Structure des pages

### Planning
La page Planning représente le calendrier des séances en cours.

Elle doit afficher la semaine sous forme de liste verticale, avec lundi en haut et dimanche en bas.

Chaque jour contient des blocs carrés représentant les exercices prévus. Dans chaque bloc, seul le nom de l'exercice est affiché.

En haut de la page, garder de l'espace pour :
- une flèche vers la gauche pour revenir à la semaine précédente
- une flèche vers la droite pour aller à la semaine suivante
- un bouton pour ajouter un exercice à un jour

L'utilisateur peut sélectionner un jour. Le jour sélectionné doit être encadré par un liseré orange. Quand l'utilisateur sélectionne un autre jour, le liseré orange se déplace sur ce nouveau jour.

Dans le design actuel, ce liseré de sélection est orange intermédiaire entre mat et vif, très épais, rendu en overlay pour ne pas faire bouger la case jour, et centré sur le bord de la case.

Le bouton d'ajout d'exercice doit ouvrir un menu avec les blocs/liste d'exercices. Quand l'utilisateur choisit un exercice, l'application lui demande :
- poids
- nombre de séries
- nombre de répétitions

Après validation, l'exercice est ajouté dans le jour sélectionné.

Les semaines doivent être distinctes. Chaque exercice du planning est lié à une date précise, et les flèches de navigation doivent afficher les exercices de la semaine correspondante uniquement.

L'affichage de la date dans chaque jour du planning doit utiliser le format `03 Jun` plutôt que `03/06`.

Le texte sous le titre `Planning` ne doit pas afficher une plage de dates. Il doit afficher le mois puis le mot `Semaine` avec le numéro de semaine dans le mois, par exemple `Juin Semaine 1` pour la première semaine de juin ou `Avril Semaine 3` pour la troisième semaine d'avril.

Le planning doit fonctionner par cycles fixes de quatre semaines par mois : `Semaine 1`, `Semaine 2`, `Semaine 3`, `Semaine 4`, puis retour à `Semaine 1` du mois suivant. Ne jamais afficher `Semaine 5` et ne pas afficher deux `Semaine 4` de suite pour le même mois. Certaines semaines peuvent afficher des jours du mois précédent ou suivant.

Les exercices du planning doivent être sauvegardés dans le stockage local du téléphone. Pour le backbone actuel, utiliser `AsyncStorage` comme base locale.

Quand l'utilisateur appuie sur un exercice dans le calendrier, il doit voir :
- le poids
- les séries
- les répétitions

Depuis cette fiche d'exercice planifié, l'utilisateur doit pouvoir :
- modifier le poids, les séries et les répétitions
- supprimer l'exercice du planning avec une confirmation dans la fiche

Pour le backbone actuel, les blocs d'exercice se déplacent avec deux boutons dans la fiche du bloc :
- Gauche
- Droite

Le déplacement doit rester limité au jour du bloc.

Quand l'utilisateur clique une fois sur un bloc du planning, afficher d'abord une petite fenêtre rapide flottante par-dessus le planning :
- un bloc du planning n'est ouvrable que si son jour est déjà sélectionné ; si l'utilisateur touche un bloc d'un autre jour, cela sélectionne seulement ce jour et il faut retoucher le bloc pour l'ouvrir
- dans ce premier cas, le bloc ne doit pas afficher d'effet visuel de clic
- elle ne doit pas s'insérer dans la liste des jours
- elle ne doit pas décaler les jours
- elle doit se positionner de façon à ne pas cacher le jour concerné
- sa position doit être calculée par rapport au jour affiché, plutôt qu'insérée dans la liste
- sa position doit utiliser la ligne visible du jour mesurée à l'écran comme référence : presque collée sous le jour touché, sauf pour dimanche où elle apparaît presque collée au-dessus
- quand un bloc est touché, son jour devient automatiquement le jour sélectionné avec le liseré orange
- utiliser un overlay absolu dans la page plutôt qu'un modal natif pour que la position corresponde au planning
- elle doit se fermer sans animation parasite
- elle doit être compacte et fine
- elle doit avoir exactement la même largeur visuelle qu'un bloc de jour du planning en utilisant la largeur mesurée du jour
- elle doit être légèrement plus haute qu'un bloc de jour pour espacer les boutons de la ligne d'informations
- ses trois lignes internes doivent être espacées verticalement de façon uniforme
- le nom de l'exercice est en haut à gauche
- le jour est en haut à droite, par exemple `Vendredi`
- une flèche gauche pour déplacer le bloc
- une flèche droite pour déplacer le bloc
- un bouton `Modifier`
- dans la rangée d'actions, placer la flèche gauche à gauche, le bouton `Modifier` au centre, et la flèche droite à droite ; la distribution doit être 25% flèche gauche, 50% `Modifier`, 25% flèche droite
- sous la rangée d'actions, afficher en ligne les informations `Series`, `Poids` et `Reps` en texte assez grand, centrées avec un espacement modéré

Le bouton `Modifier` ouvre ensuite une fenêtre plus grande avec les champs de modification, `Enregistrer`, `Supprimer` et `Fermer`. Cette grande fenêtre ne doit pas afficher les flèches gauche/droite.

### Exercices
La page Exercices affiche tous les blocs d'exercices.

Quand l'utilisateur appuie sur un exercice, il doit voir la liste des jours où cet exercice a été enregistré dans le calendrier, avec pour chaque entrée :
- poids
- séries
- répétitions

Cette page doit lire l'historique depuis le même stockage local que le planning.

### Nutrition
La page Nutrition remplace l'ancienne page Stats.

Elle doit afficher en premier un planning de plats reprenant la logique générale du planning :
- navigation par semaines distinctes
- jours de lundi à dimanche
- sélection d'un jour avec liseré orange
- bouton pour ajouter un plat au jour sélectionné
- blocs de plats dans les jours
- un bloc de plat n'est ouvrable que si son jour est déjà sélectionné ; toucher un bloc d'un autre jour sélectionne seulement ce jour
- dans ce premier cas, le bloc de plat ne doit pas afficher d'effet visuel de clic
- sauvegarde locale des plats ajoutés

Les plats remplacent les exercices dans cette page. Pour le backbone actuel, utiliser des plats de test avec calories et protéines.

Sous le planning de plats, afficher une grande courbe du poids au cours du temps.

La page ne doit pas afficher les cartes "Poids actuel" et "Taille" dans le backbone actuel.
La page ne doit plus afficher le bloc "A venir".

Pour les données de test de poids :
- 1er février 2026 : 48 kg
- 1er mars 2026 : 50 kg
- 1er mai 2026 : 52 kg
- 1er juin 2026 : 54 kg
- l'échelle de la courbe doit aller de 40 à 70 kg pour mieux visualiser les variations
- la courbe de poids doit être affichée avec des points reliés, pas avec des histogrammes
- chaque indication de poids doit être placée près du point correspondant
- les dates de la courbe doivent utiliser le format `01 Jun`
- les points de début et de fin ne doivent pas être collés aux bords du cadre

### Amis
La page Amis est un onglet prévu pour plus tard.

Pour l'instant, elle peut être vide ou afficher seulement "Bientot".

## Design souhaité
- Application moderne, sportive et professionnelle.
- Direction visuelle actuelle : thème sombre violet/orange doux, avec un violet principal plus clair que `#6650F2`.
- Fond principal violet lavande sombre, surfaces violet adouci, actions principales orange `#FB7A25`, éléments actifs orange, accents secondaires violet clair.
- Sur la page Planning, le fond derrière les blocs de jour doit être un violet très clair inspiré du violet des blocs, tandis que le header `Planning`, les blocs jour et la barre d'onglets gardent leurs couleurs violet/orange.
- Les entêtes des pages principales doivent rester très compacts en hauteur, avec le texte centré verticalement et horizontalement.
- Navigation simple.
- Priorité aux actions utiles plutôt qu'aux pages décoratives.
- Interface adaptée à une utilisation répétée à la salle.

## Stack technique
- Expo
- React Native
- TypeScript
- Expo Router

## Notes de travail
- Utiliser ce fichier comme mémoire principale du projet.
- Mettre à jour ce document quand une décision importante est prise.
- Avant de modifier du code Expo, lire la documentation versionnée demandée dans `AGENTS.md`.
