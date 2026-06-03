## =============================================================================
##  math_workspace.gd  —  ZONE DE CALCUL DE L'ÉTUDIANT
## =============================================================================
##
##  Laboratoire d'algèbre linéaire — Polytechnique Montréal
##
##  Cette classe statique est le SEUL fichier que l'étudiant doit modifier.
##  Elle ne touche à aucun nœud visuel : c'est un atelier de pur calcul
##  matriciel. Les scripts de simulation (robot_voyageur.gd, bras_articule.gd)
##  appellent ces fonctions et se chargent eux-mêmes de l'affichage et du
##  retour visuel. Cette séparation stricte (logique mathématique ↔ rendu)
##  garantit qu'une erreur de calcul produit un FEEDBACK VISUEL, jamais un
##  plantage du moteur.
##
##  CONVENTION DE REPRÉSENTATION DES MATRICES 2×2
##  ---------------------------------------------
##  On exploite le type natif `Transform2D` de Godot comme simple CONTENEUR
##  de matrice augmentée. Un `Transform2D` stocke deux vecteurs colonnes de
##  base (`.x`, `.y`) et un vecteur de translation (`.origin`) :
##
##            ┌                ┐
##            │  x.x   y.x  │  origin.x │
##      T  =  │  x.y   y.y  │  origin.y │
##            └                ┘
##                 ↑      ↑         ↑
##              col. 1  col. 2  translation
##
##  Autrement dit, pour une matrice    M = ⎡ a  b ⎤
##                                          ⎣ c  d ⎦
##  on a :  M.x = Vector2(a, c)   (1re colonne)
##          M.y = Vector2(b, d)   (2e  colonne)
##
##  IMPORTANT : on n'utilise JAMAIS les raccourcis « magiques » de Godot
##  (`to_local`, `basis_xform_inv`, `affine_inverse`, …). Tout produit
##  matriciel est écrit explicitement afin que l'algèbre reste visible.
## =============================================================================

class_name MathWorkspace
extends RefCounted


# =============================================================================
#  OUTILS DE BASE  —  fournis, NE PAS modifier
# =============================================================================

## Produit matrice 2×2 × vecteur :  v' = M · v
## Écrit explicitement comme combinaison linéaire des colonnes de M.
## (Équivalent manuel et transparent de `Transform2D.basis_xform`.)
static func produit_mat_vec(M: Transform2D, v: Vector2) -> Vector2:
	# v' = v.x · (1re colonne) + v.y · (2e colonne)
	return M.x * v.x + M.y * v.y


## Formate une matrice 2×2 pour l'affichage dans l'UI (texte monospace).
static func formater_matrice(M: Transform2D) -> String:
	return "⎡ %7.3f  %7.3f ⎤\n⎣ %7.3f  %7.3f ⎦" % [
		M.x.x, M.y.x,
		M.x.y, M.y.y,
	]


## Formate un vecteur colonne pour l'affichage.
static func formater_vecteur(v: Vector2) -> String:
	return "⎡ %8.2f ⎤\n⎣ %8.2f ⎦" % [v.x, v.y]


# =============================================================================
#  ACTIVITÉ 1  —  LE ROBOT VOYAGEUR  (changement de base)
# =============================================================================
#
#  Le robot connaît sa position « monde » et son orientation θ. Il veut
#  exprimer la position de la cible DANS SON PROPRE REPÈRE, c.-à-d. répondre
#  à la question : « la cible est-elle devant moi, à ma gauche, … ? »
#
#  La formule à implémenter est :
#
#         x_local = Rᵀ · ( x_monde − x_robot )
#
#  où R est la matrice de rotation associée à l'orientation θ du robot.
#  Comme R est orthogonale, son inverse est sa transposée : R⁻¹ = Rᵀ.
# =============================================================================

## Construit la matrice de rotation R(θ) d'angle `theta` (en radians).
##
##        R(θ) = ⎡ cos θ   −sin θ ⎤
##               ⎣ sin θ    cos θ ⎦
##
## Rappel : les colonnes de R sont les images des vecteurs de base
## canoniques e₁=(1,0) et e₂=(0,1) après rotation.
static func construire_rotation(theta: float) -> Transform2D:
	# ----------------------------------------------------------------------
	# TODO ÉTUDIANT (Activité 1.a) :
	#   Construire et retourner la matrice de rotation R(θ).
	#   Astuce : col.1 = (cos θ, sin θ)   ;   col.2 = (−sin θ, cos θ)
	#   Le 3e argument (translation) reste Vector2.ZERO.
	# ----------------------------------------------------------------------
	var c: float = cos(theta)
	var s: float = sin(theta)
	return Transform2D(Vector2(c, s), Vector2(-s, c), Vector2.ZERO)


## Transpose une matrice 2×2 (échange les éléments hors-diagonale).
##
##        Mᵀ : (Mᵀ)ᵢⱼ = Mⱼᵢ
##
## En représentation « colonnes », transposer revient à transformer les
## lignes de M en colonnes de Mᵀ.
static func transposer(M: Transform2D) -> Transform2D:
	# ----------------------------------------------------------------------
	# TODO ÉTUDIANT (Activité 1.b) :
	#   Retourner la transposée de M.
	#   M.x = (a, c), M.y = (b, d)  →  Mᵀ.x = (a, b), Mᵀ.y = (c, d)
	# ----------------------------------------------------------------------
	var col1: Vector2 = Vector2(M.x.x, M.y.x)   # 1re ligne de M → 1re colonne de Mᵀ
	var col2: Vector2 = Vector2(M.x.y, M.y.y)   # 2e  ligne de M → 2e  colonne de Mᵀ
	return Transform2D(col1, col2, Vector2.ZERO)


## Convertit une position exprimée dans le repère MONDE vers le repère
## LOCAL du robot, en appliquant :  x_local = Rᵀ · (x_monde − x_robot).
##
## @param x_monde      Position de la cible dans le repère monde.
## @param x_robot      Position du robot dans le repère monde.
## @param theta_robot  Orientation du robot (radians).
## @return             Coordonnées de la cible dans le repère local du robot.
static func monde_vers_local(x_monde: Vector2, x_robot: Vector2, theta_robot: float) -> Vector2:
	# ----------------------------------------------------------------------
	# TODO ÉTUDIANT (Activité 1.c) :
	#   1. Calculer le vecteur translation  d = x_monde − x_robot.
	#   2. Construire R(θ) puis sa transposée Rᵀ.
	#   3. Retourner le produit  Rᵀ · d  (utiliser produit_mat_vec).
	#   Interdiction d'utiliser to_local() ou basis_xform_inv() !
	# ----------------------------------------------------------------------
	var d: Vector2 = x_monde - x_robot
	var R: Transform2D = construire_rotation(theta_robot)
	var R_t: Transform2D = transposer(R)
	return produit_mat_vec(R_t, d)


# =============================================================================
#  ACTIVITÉ 2  —  LE BRAS ARTICULÉ  (composition, non-commutativité)
# =============================================================================
#
#  Un bras à deux segments. Chaque articulation possède une transformation
#  LOCALE = rotation (angle de l'articulation) suivie d'une translation
#  (longueur du segment, le long de l'axe x local). La pose globale du
#  bout du bras s'obtient par COMPOSITION des transformations :
#
#         M_total = M_épaule · M_avant_bras
#
#  Le produit matriciel n'est PAS commutatif : inverser l'ordre des facteurs
#  produit une pose géométriquement différente (segment « aberrant »).
# =============================================================================

## Construit la transformation locale d'un segment : rotation d'angle
## `angle` puis translation de `longueur` le long de l'axe x local.
##
##        T = ⎡ cos θ   −sin θ │  L·cos θ ⎤
##            ⎣ sin θ    cos θ │  L·sin θ ⎦
##
## La translation `origin` correspond à la position du BOUT du segment
## exprimée dans le repère de l'articulation parente.
static func transformation_locale(angle: float, longueur: float) -> Transform2D:
	# ----------------------------------------------------------------------
	# TODO ÉTUDIANT (Activité 2.a) :
	#   1. Construire la rotation R = construire_rotation(angle).
	#   2. Le bout du segment est, dans le repère parent, l'image du point
	#      (longueur, 0) par R. Calculer R · (longueur, 0) et l'affecter
	#      à la translation de T (R.origin).
	# ----------------------------------------------------------------------
	var T: Transform2D = construire_rotation(angle)
	T.origin = produit_mat_vec(T, Vector2(longueur, 0.0))
	return T


## Compose (multiplie) deux transformations : retourne A · B.
##
## L'opérateur `*` de `Transform2D` réalise EXACTEMENT le produit matriciel
## des matrices augmentées 3×3 sous-jacentes — c'est l'objet d'étude de
## l'activité. On l'expose ici pour que l'étudiant manipule explicitement
## l'ordre des facteurs.
static func composer(A: Transform2D, B: Transform2D) -> Transform2D:
	# ----------------------------------------------------------------------
	# TODO ÉTUDIANT (Activité 2.b) :
	#   Retourner le produit matriciel A · B.
	#   Puis, dans l'UI, comparer A·B et B·A pour CONSTATER que l'ordre
	#   change le résultat (non-commutativité).
	# ----------------------------------------------------------------------
	return A * B
