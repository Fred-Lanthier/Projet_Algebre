# Directives du Projet : Laboratoire Algèbre Linéaire (Godot 4)

Ce projet est un laboratoire pédagogique interactif ("Serious Game") destiné aux étudiants en génie de Polytechnique Montréal pour le cours d'algèbre linéaire.

## Contexte Technologique
- **Moteur :** Godot 4.x (2D)
- **Langage principal :** GDScript (Typage statique fort obligatoire : `var x: Vector2 = ...`)
- **Environnement Python :** Python 3.10 (`.venv_algebre`) pour les scripts de validation ou de génération d'énoncés.

## Structure des Activités
1. **Activité 1 (Robot Voyageur) :** Changement de base et matrice de passage. L'étudiant doit calculer $x_{\text{local}} = R^T (x_{\text{monde}} - x_{\text{robot}})$ manuellement.
   - *Contrainte stricte :* Interdiction d'utiliser `to_local()` ou les fonctions de transformation intégrées de Godot dans le code étudiant.
2. **Activité 2 (Bras Articulé) :** Composition de matrices et non-commutativité ($A \times B \neq B \times A$). Les segments du bras ne doivent pas être enfants hiérarchiques dans l'arbre Godot pour forcer le calcul manuel des matrices globales.

## Normes de Code & Pédagogie
- **Langue :** Tout le code, les commentaires et l'interface utilisateur doivent être en français, avec une rigueur scientifique universitaire.
- **Squelette "À trous" :** Séparer clairement la logique de simulation du code que l'étudiant doit compléter (utiliser des balises `# TODO ÉTUDIANT`).
- **Feedback visuel :** Privilégier le dessin de vecteurs (`_draw()`) et des panneaux d'UI clairs affichant les matrices en temps réel plutôt que des plantages de script.

## Commandes Utiles
- Activation venv : `source .venv_algebre/bin/activate`
