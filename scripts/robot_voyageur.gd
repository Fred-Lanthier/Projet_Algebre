## =============================================================================
##  robot_voyageur.gd  —  ACTIVITÉ 1 : LE DÉFI DU ROBOT VOYAGEUR
## =============================================================================
##
##  Laboratoire d'algèbre linéaire — Polytechnique Montréal
##
##  MOTEUR DE SIMULATION (protégé). Ce script ne contient AUCUNE des formules
##  à compléter : il se contente d'appeler `MathWorkspace.monde_vers_local()`
##  puis de matérialiser le résultat à l'écran. Toute la pédagogie repose sur
##  le RETOUR VISUEL : la cible « reconstruite » à partir des coordonnées
##  locales calculées par l'étudiant doit se superposer à la cible réelle.
##
##    • Cible RÉELLE (attendue)      → cercle VERT
##    • Cible RECONSTRUITE (calcul)  → croix  ROUGE
##
##  Si les deux coïncident, le changement de base est correct.
##
##  COMMANDES
##    • Flèches / WASD ........ déplacer le robot
##    • Q / E ................. pivoter le robot
##    • Clic gauche ........... repositionner la cible
##    • R ..................... réinitialiser
## =============================================================================

extends Node2D

# --- Paramètres de simulation -------------------------------------------------
@export var vitesse_deplacement: float = 220.0   # pixels / s
@export var vitesse_rotation: float = 2.2         # radians / s
@export var longueur_axes: float = 90.0           # longueur visuelle des axes locaux
@export var tolerance_pixels: float = 2.0         # seuil de validation du calcul

# --- État du robot (repère MONDE) --------------------------------------------
var position_robot: Vector2 = Vector2(400.0, 320.0)
var angle_robot: float = 0.0                       # orientation θ (radians)
var position_cible: Vector2 = Vector2(720.0, 180.0)

# --- Références UI (nœuds à nom unique dans la scène) -------------------------
@onready var _lbl_matrice_r: Label = %LabelMatriceR
@onready var _lbl_matrice_rt: Label = %LabelMatriceRT
@onready var _lbl_translation: Label = %LabelTranslation
@onready var _lbl_local: Label = %LabelLocal
@onready var _lbl_erreur: Label = %LabelErreur

# --- Palette « ingénierie » ---------------------------------------------------
const COULEUR_AXE_X: Color = Color(0.95, 0.35, 0.35)   # axe local e₁' (rouge)
const COULEUR_AXE_Y: Color = Color(0.40, 0.85, 0.45)   # axe local e₂' (vert)
const COULEUR_LIEN: Color = Color(0.95, 0.85, 0.35)    # vecteur robot→cible (jaune)
const COULEUR_ATTENDU: Color = Color(0.30, 0.90, 0.45) # cible réelle (vert)
const COULEUR_CALCULE: Color = Color(0.95, 0.30, 0.30) # cible reconstruite (rouge)
const COULEUR_GRILLE: Color = Color(1, 1, 1, 0.06)


func _process(delta: float) -> void:
	_gerer_entrees(delta)
	queue_redraw()
	_mettre_a_jour_ui()


# -----------------------------------------------------------------------------
#  Entrées clavier / souris  (pilotage du robot et de la cible)
# -----------------------------------------------------------------------------
func _gerer_entrees(delta: float) -> void:
	var direction: Vector2 = Vector2(
		Input.get_axis(&"ui_left", &"ui_right"),
		Input.get_axis(&"ui_up", &"ui_down"),
	)
	if Input.is_key_pressed(KEY_D): direction.x += 1.0
	if Input.is_key_pressed(KEY_A): direction.x -= 1.0
	if Input.is_key_pressed(KEY_S): direction.y += 1.0
	if Input.is_key_pressed(KEY_W): direction.y -= 1.0
	position_robot += direction.limit_length(1.0) * vitesse_deplacement * delta

	var rotation_input: float = 0.0
	if Input.is_key_pressed(KEY_E): rotation_input += 1.0
	if Input.is_key_pressed(KEY_Q): rotation_input -= 1.0
	angle_robot += rotation_input * vitesse_rotation * delta


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			position_cible = get_global_mouse_position()
	elif event is InputEventKey and event.pressed:
		if event.keycode == KEY_R:
			_reinitialiser()
		elif event.keycode == KEY_ESCAPE:
			get_tree().change_scene_to_file("res://scenes/menu_principal.tscn")


func _reinitialiser() -> void:
	position_robot = Vector2(400.0, 320.0)
	angle_robot = 0.0
	position_cible = Vector2(720.0, 180.0)


# -----------------------------------------------------------------------------
#  RENDU  —  axes locaux, vecteurs et retour visuel d'erreur
# -----------------------------------------------------------------------------
func _draw() -> void:
	_dessiner_grille()

	# Repère LOCAL du robot : colonnes de R(θ) = axes e₁' et e₂'.
	var R: Transform2D = MathWorkspace.construire_rotation(angle_robot)
	draw_line(position_robot, position_robot + R.x * longueur_axes, COULEUR_AXE_X, 3.0)
	draw_line(position_robot, position_robot + R.y * longueur_axes, COULEUR_AXE_Y, 3.0)
	_dessiner_pointe(position_robot + R.x * longueur_axes, R.x, COULEUR_AXE_X)
	_dessiner_pointe(position_robot + R.y * longueur_axes, R.y, COULEUR_AXE_Y)

	# Corps du robot.
	draw_circle(position_robot, 12.0, Color(0.20, 0.55, 0.95))
	draw_arc(position_robot, 12.0, 0.0, TAU, 32, Color.WHITE, 1.5)

	# Vecteur monde robot → cible (la donnée brute du problème).
	draw_line(position_robot, position_cible, COULEUR_LIEN, 1.5)

	# ---- Calcul de l'ÉTUDIANT (peut être faux ⇒ feedback visuel) ----
	var local_etudiant: Vector2 = MathWorkspace.monde_vers_local(
		position_cible, position_robot, angle_robot
	)
	# Reconstruction monde de ce calcul : x_monde ≈ x_robot + R · x_local.
	var cible_reconstruite: Vector2 = position_robot + MathWorkspace.produit_mat_vec(R, local_etudiant)

	# Cible réelle (attendue) en VERT.
	draw_arc(position_cible, 16.0, 0.0, TAU, 40, COULEUR_ATTENDU, 3.0)
	draw_circle(position_cible, 4.0, COULEUR_ATTENDU)

	# Cible reconstruite (calcul étudiant) en ROUGE : croix + cercle.
	_dessiner_croix(cible_reconstruite, 12.0, COULEUR_CALCULE, 3.0)
	if position_cible.distance_to(cible_reconstruite) > tolerance_pixels:
		# Trait d'écart entre attendu et calculé : amplitude de l'erreur.
		draw_dashed_line(position_cible, cible_reconstruite, COULEUR_CALCULE, 1.5, 6.0)


func _dessiner_grille() -> void:
	var taille: Vector2 = get_viewport_rect().size
	var pas: int = 64
	for x in range(0, int(taille.x), pas):
		draw_line(Vector2(x, 0), Vector2(x, taille.y), COULEUR_GRILLE, 1.0)
	for y in range(0, int(taille.y), pas):
		draw_line(Vector2(0, y), Vector2(taille.x, y), COULEUR_GRILLE, 1.0)


## Dessine une petite pointe de flèche au bout d'un axe.
func _dessiner_pointe(sommet: Vector2, direction: Vector2, couleur: Color) -> void:
	var d: Vector2 = direction.normalized()
	var n: Vector2 = d.orthogonal()
	var a: Vector2 = sommet - d * 12.0 + n * 6.0
	var b: Vector2 = sommet - d * 12.0 - n * 6.0
	draw_colored_polygon(PackedVector2Array([sommet, a, b]), couleur)


func _dessiner_croix(centre: Vector2, rayon: float, couleur: Color, epaisseur: float) -> void:
	draw_line(centre + Vector2(-rayon, -rayon), centre + Vector2(rayon, rayon), couleur, epaisseur)
	draw_line(centre + Vector2(-rayon, rayon), centre + Vector2(rayon, -rayon), couleur, epaisseur)


# -----------------------------------------------------------------------------
#  TABLEAU DE BORD  —  affichage des matrices et vecteurs en temps réel
# -----------------------------------------------------------------------------
func _mettre_a_jour_ui() -> void:
	var R: Transform2D = MathWorkspace.construire_rotation(angle_robot)
	var R_t: Transform2D = MathWorkspace.transposer(R)
	var d: Vector2 = position_cible - position_robot
	var local_etudiant: Vector2 = MathWorkspace.monde_vers_local(
		position_cible, position_robot, angle_robot
	)

	_lbl_matrice_r.text = "R(θ)   θ = %6.1f°\n%s" % [
		rad_to_deg(angle_robot), MathWorkspace.formater_matrice(R)
	]
	_lbl_matrice_rt.text = "Rᵀ = R⁻¹\n%s" % MathWorkspace.formater_matrice(R_t)
	_lbl_translation.text = "d = x_monde − x_robot\n%s" % MathWorkspace.formater_vecteur(d)
	_lbl_local.text = "x_local = Rᵀ·d\n%s" % MathWorkspace.formater_vecteur(local_etudiant)

	# Référence de vérification INDÉPENDANTE du code étudiant : on s'autorise
	# ici (et SEULEMENT ici, côté moteur) l'inverse affine de Godot.
	var xf_robot: Transform2D = Transform2D(angle_robot, position_robot)
	var local_reference: Vector2 = xf_robot.affine_inverse() * position_cible
	var erreur: float = local_reference.distance_to(local_etudiant)

	if erreur <= tolerance_pixels:
		_lbl_erreur.text = "✔  Changement de base CORRECT (écart %.3f px)" % erreur
		_lbl_erreur.add_theme_color_override(&"font_color", COULEUR_ATTENDU)
	else:
		_lbl_erreur.text = "✘  Écart de %.1f px — vérifiez Rᵀ et la translation" % erreur
		_lbl_erreur.add_theme_color_override(&"font_color", COULEUR_CALCULE)
