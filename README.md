# Laboratoire d'algèbre linéaire — Godot 4

Serious Game pédagogique pour le cours d'algèbre linéaire en génie
(Polytechnique Montréal). Deux activités interactives :

1. **Le Robot Voyageur** — changement de base : `x_local = Rᵀ·(x_monde − x_robot)`.
2. **Le Bras Articulé** — composition de transformations et non-commutativité (`A·B ≠ B·A`).

## Démarrage

1. Ouvrir `project.godot` dans **Godot 4.x**.
2. Appuyer sur **F5** (la scène principale est le menu).

## Pour l'étudiant

Tout le travail se fait dans `scripts/math_workspace.gd`, aux emplacements
balisés `# TODO ÉTUDIANT`. Les erreurs de calcul produisent un **retour visuel**
(croix/flèche rouge), jamais un plantage.

Voir [`ARCHITECTURE.md`](ARCHITECTURE.md) pour l'agencement complet des scènes.
