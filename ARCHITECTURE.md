# Guide d'architecture — Laboratoire d'algèbre linéaire (Godot 4)

Ce document décrit l'agencement des nœuds et la philosophie de conception du
projet, afin que les scripts fonctionnent **immédiatement** après ouverture
dans l'éditeur Godot 4.x.

## 1. Philosophie : séparation stricte des préoccupations

Le projet applique une séparation de type **MVC** adaptée au moteur Godot :

| Couche | Fichier | Rôle | L'étudiant y touche ? |
|--------|---------|------|:---:|
| **Modèle (math)** | `scripts/math_workspace.gd` | Pur calcul matriciel. Aucune dépendance aux nœuds. | ✅ **OUI** |
| **Contrôleur / Vue** | `scripts/robot_voyageur.gd` | Simulation + `_draw()` + retour visuel (Activité 1). | ❌ protégé |
| **Contrôleur / Vue** | `scripts/bras_articule.gd` | Simulation + `_draw()` + commutateur (Activité 2). | ❌ protégé |
| **Navigation** | `scripts/menu_principal.gd` | Aiguillage entre activités. | ❌ protégé |

> **Principe clé :** l'étudiant ne modifie **que** `math_workspace.gd`, aux
> emplacements balisés `# TODO ÉTUDIANT`. Une erreur de calcul ne plante jamais
> le moteur ; elle se traduit par un **écart visuel** (flèche/croix rouge).

## 2. Arborescence des fichiers

```
Projet_Algebre/
├── project.godot                  # Scène principale = menu_principal.tscn
├── icon.svg
├── scripts/
│   ├── math_workspace.gd          # class_name MathWorkspace (classe statique)
│   ├── robot_voyageur.gd
│   ├── bras_articule.gd
│   └── menu_principal.gd
└── scenes/
    ├── menu_principal.tscn
    ├── activite_1_robot.tscn
    └── activite_2_bras.tscn
```

`MathWorkspace` est exposée via `class_name` : **aucun Autoload n'est requis**.
On l'appelle directement, p. ex. `MathWorkspace.monde_vers_local(...)`. Les
fonctions sont `static`, donc sans état partagé — choix volontaire pour la
pureté pédagogique.

## 3. Arbre de scène recommandé

### 3.1 `menu_principal.tscn`

```
MenuPrincipal (Control)            ← menu_principal.gd
└── CentreVBox (VBoxContainer)
    ├── Titre / SousTitre (Label)
    ├── BoutonRobot   (Button)  %  ← nom unique
    ├── BoutonBras    (Button)  %
    └── BoutonQuitter (Button)  %
```

### 3.2 `activite_1_robot.tscn`

```
Activite1Robot (Node2D)            ← robot_voyageur.gd  (dessine tout via _draw)
└── UI (CanvasLayer)
    └── Tableau (PanelContainer, ancré à droite)
        └── Marge (MarginContainer)
            └── VBox (VBoxContainer)
                ├── Titre / Formule (Label)
                ├── LabelMatriceR    (Label) %  ← affiche R(θ)
                ├── LabelMatriceRT   (Label) %  ← affiche Rᵀ
                ├── LabelTranslation (Label) %  ← affiche d = x_monde − x_robot
                ├── LabelLocal       (Label) %  ← affiche x_local
                └── LabelErreur      (Label) %  ← validation (vert/rouge)
```

- Le robot, la cible, les axes locaux et les vecteurs sont **dessinés** dans
  `_draw()` du nœud racine ; il n'y a donc pas de `Sprite2D` à créer.
- Les `Label` de matrices utilisent une **police monospace** (`SystemFont`)
  pour aligner les colonnes — déjà configuré dans la scène.

> **Pourquoi un seul Node2D qui dessine tout ?** Pour l'Activité 1, le robot et
> la cible ne sont que des *positions* (`Vector2`) dans le repère monde. Les
> matérialiser comme nœuds enfants transformés reviendrait à laisser Godot faire
> le changement de base à la place de l'étudiant. On stocke donc les positions
> en clair et on les dessine manuellement.

### 3.3 `activite_2_bras.tscn`

```
Activite2Bras (Node2D)             ← bras_articule.gd  (dessine tout via _draw)
└── UI (CanvasLayer)
    └── Tableau (PanelContainer, ancré à droite)
        └── Marge (MarginContainer)
            └── VBox (VBoxContainer)
                ├── Titre / Formule (Label)
                ├── SliderEpaule       (HSlider)     %  θ₁ ∈ [−180°, 180°]
                ├── SliderAvantBras    (HSlider)     %  θ₂ ∈ [−180°, 180°]
                ├── ToggleOrdre        (CheckButton) %  A·B  ↔  B·A
                ├── LabelOrdre         (Label) %
                ├── LabelT1 / LabelT2  (Label) %  matrices locales
                ├── LabelMatriceTotale (Label) %  M_total
                └── LabelEffecteur     (Label) %  position du bout du bras
```

- **Contrainte du cahier des charges respectée :** les deux segments ne sont
  **pas** des nœuds enfants hiérarchiques. Leur pose est recalculée à chaque
  image par composition matricielle (`MathWorkspace.composer`), puis tracée.
- Le commutateur `ToggleOrdre` bascule entre `T₁·T₂` et `T₂·T₁` pour matérialiser
  la **non-commutativité** : la pose aberrante apparaît en pointillés rouges.

## 4. Le « nom unique » (`%`) plutôt que les `NodePath`

Chaque nœud d'UI piloté par script porte `unique_name_in_owner = true`
(préfixe `%` dans l'éditeur). Les scripts y accèdent par
`@onready var x := %NomUnique`. Avantage : on peut **réorganiser le panneau**
(ajouter une marge, un conteneur) sans casser les références.

## 5. Lancer le projet

1. Ouvrir le dossier dans Godot 4.x (`Importer` → `project.godot`).
2. Appuyer sur **F5** : le menu principal s'ouvre.
3. Activité 1 — commandes : `Flèches`/`WASD` déplacer, `Q`/`E` pivoter,
   `clic gauche` placer la cible, `R` réinitialiser, `Échap` retour menu.
4. Activité 2 — régler les curseurs et basculer le commutateur ; `Échap` menu.

## 6. Parcours pédagogique de l'étudiant

Ouvrir `scripts/math_workspace.gd` et compléter dans l'ordre :

1. `construire_rotation(theta)` — la matrice R(θ).
2. `transposer(M)` — la transposée (= inverse pour une rotation).
3. `monde_vers_local(...)` — assembler `x_local = Rᵀ·(x_monde − x_robot)`.
4. `transformation_locale(angle, longueur)` — rotation + translation d'un segment.
5. `composer(A, B)` — le produit matriciel, puis expérimenter `A·B` vs `B·A`.

> Le solveur fourni est **fonctionnel** (il sert de corrigé). Pour transformer
> ce projet en énoncé « à trous », il suffit de vider le corps des fonctions
> sous chaque balise `# TODO ÉTUDIANT` et d'y laisser un `return …` neutre.
