## =============================================================================
##  bras_articule.gd  —  ACTIVITÉ 2 : LE BRAS ROBOTIQUE ARTICULÉ
## =============================================================================
##
##  Laboratoire d'algèbre linéaire — Polytechnique Montréal
##
##  MOTEUR DE SIMULATION (protégé). Le bras possède deux segments (épaule →
##  avant-bras). Conformément au cahier des charges, les segments ne sont PAS
##  des enfants hiérarchiques dans l'arbre de scène : leur pose globale est
##  RECALCULÉE par composition matricielle via `MathWorkspace.composer()`.
##
##  OBJECTIF PÉDAGOGIQUE : observer la NON-COMMUTATIVITÉ du produit matriciel.
##  Le commutateur de l'UI bascule l'ordre des facteurs :
##
##        • Ordre direct   : M = T_épaule · T_avant_bras   (cinématique correcte)
##        • Ordre inversé  : M = T_avant_bras · T_épaule    (orbite aberrante)
##
##  Le segment fantôme (ordre opposé) est dessiné en pointillés pour rendre
##  l'écart immédiatement visible.
## =============================================================================

extends Node2D

# --- Géométrie du bras --------------------------------------------------------
@export var longueur_epaule: float = 170.0
@export var longueur_avant_bras: float = 130.0
@export var position_base: Vector2 = Vector2(480.0, 380.0)

# --- État (piloté par les curseurs de l'UI) ----------------------------------
var angle_epaule: float = 0.5          # θ₁ (radians)
var angle_avant_bras: float = 0.7      # θ₂ (radians)
var ordre_inverse: bool = false        # commutateur A·B  vs  B·A

# --- Références UI -------------------------------------------------------------
@onready var _slider_epaule: HSlider = %SliderEpaule
@onready var _slider_avant_bras: HSlider = %SliderAvantBras
@onready var _toggle_ordre: CheckButton = %ToggleOrdre
@onready var _lbl_t1: Label = %LabelT1
@onready var _lbl_t2: Label = %LabelT2
@onready var _lbl_total: Label = %LabelMatriceTotale
@onready var _lbl_ordre: Label = %LabelOrdre
@onready var _lbl_effecteur: Label = %LabelEffecteur

# --- Palette ------------------------------------------------------------------
const COULEUR_EPAULE: Color = Color(0.30, 0.60, 0.95)
const COULEUR_AVANT_BRAS: Color = Color(0.40, 0.85, 0.55)
const COULEUR_FANTOME: Color = Color(0.95, 0.45, 0.45, 0.9)
const COULEUR_ARTICULATION: Color = Color.WHITE
const COULEUR_GRILLE: Color = Color(1, 1, 1, 0.06)


func _ready() -> void:
	# Branchement des contrôles → état de la simulation.
	_slider_epaule.value = rad_to_deg(angle_epaule)
	_slider_avant_bras.value = rad_to_deg(angle_avant_bras)
	_slider_epaule.value_changed.connect(_sur_slider_epaule)
	_slider_avant_bras.value_changed.connect(_sur_slider_avant_bras)
	_toggle_ordre.toggled.connect(_sur_toggle_ordre)
	_rafraichir()   # peuple le tableau de bord dès l'ouverture


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		get_tree().change_scene_to_file("res://scenes/menu_principal.tscn")


func _sur_slider_epaule(valeur_deg: float) -> void:
	angle_epaule = deg_to_rad(valeur_deg)
	_rafraichir()


func _sur_slider_avant_bras(valeur_deg: float) -> void:
	angle_avant_bras = deg_to_rad(valeur_deg)
	_rafraichir()


func _sur_toggle_ordre(actif: bool) -> void:
	ordre_inverse = actif
	_rafraichir()


func _rafraichir() -> void:
	queue_redraw()
	_mettre_a_jour_ui()


# -----------------------------------------------------------------------------
#  Cinématique  —  composition des transformations locales
# -----------------------------------------------------------------------------
## Retourne les transformations locales des deux segments.
func _transformations_locales() -> Array[Transform2D]:
	var t1: Transform2D = MathWorkspace.transformation_locale(angle_epaule, longueur_epaule)
	var t2: Transform2D = MathWorkspace.transformation_locale(angle_avant_bras, longueur_avant_bras)
	var resultat: Array[Transform2D] = [t1, t2]
	return resultat


## Compose la transformation globale du bout du bras selon l'ordre choisi.
func _matrice_totale(inverse: bool) -> Transform2D:
	var locales: Array[Transform2D] = _transformations_locales()
	if inverse:
		return MathWorkspace.composer(locales[1], locales[0])   # T2 · T1 (aberrant)
	return MathWorkspace.composer(locales[0], locales[1])       # T1 · T2 (correct)


# -----------------------------------------------------------------------------
#  RENDU
# -----------------------------------------------------------------------------
func _draw() -> void:
	_dessiner_grille()

	var locales: Array[Transform2D] = _transformations_locales()
	var t1: Transform2D = locales[0]

	# --- Pose géométriquement CORRECTE (ordre direct) ---
	# Articulation = bout de l'épaule (origine de T1, exprimée dans le repère base).
	var articulation: Vector2 = position_base + t1.origin
	var effecteur_direct: Vector2 = position_base + _matrice_totale(false).origin
	_dessiner_segment(position_base, articulation, COULEUR_EPAULE, 10.0)
	_dessiner_segment(articulation, effecteur_direct, COULEUR_AVANT_BRAS, 8.0)

	# --- Pose AberraNTE (ordre opposé), tracée en pointillés pour comparaison ---
	var effecteur_inverse: Vector2 = position_base + _matrice_totale(true).origin
	draw_dashed_line(position_base, effecteur_inverse, COULEUR_FANTOME, 2.0, 8.0)
	draw_arc(effecteur_inverse, 9.0, 0.0, TAU, 28, COULEUR_FANTOME, 2.0)

	# --- Articulations ---
	draw_circle(position_base, 9.0, COULEUR_ARTICULATION)
	draw_circle(articulation, 7.0, COULEUR_ARTICULATION)
	draw_circle(effecteur_direct, 7.0, COULEUR_AVANT_BRAS)

	# Met en évidence la pose effectivement sélectionnée par le commutateur.
	var effecteur_actif: Vector2 = effecteur_inverse if ordre_inverse else effecteur_direct
	draw_arc(effecteur_actif, 16.0, 0.0, TAU, 40, Color.WHITE, 2.0)


func _dessiner_segment(de: Vector2, vers: Vector2, couleur: Color, epaisseur: float) -> void:
	draw_line(de, vers, couleur, epaisseur)
	draw_circle(de, epaisseur * 0.6, couleur)


func _dessiner_grille() -> void:
	var taille: Vector2 = get_viewport_rect().size
	var pas: int = 64
	for x in range(0, int(taille.x), pas):
		draw_line(Vector2(x, 0), Vector2(x, taille.y), COULEUR_GRILLE, 1.0)
	for y in range(0, int(taille.y), pas):
		draw_line(Vector2(0, y), Vector2(taille.x, y), COULEUR_GRILLE, 1.0)


# -----------------------------------------------------------------------------
#  TABLEAU DE BORD
# -----------------------------------------------------------------------------
func _mettre_a_jour_ui() -> void:
	var locales: Array[Transform2D] = _transformations_locales()
	var totale: Transform2D = _matrice_totale(ordre_inverse)

	_lbl_t1.text = "T₁ (épaule)  θ₁ = %5.1f°\n%s" % [
		rad_to_deg(angle_epaule), MathWorkspace.formater_matrice(locales[0])
	]
	_lbl_t2.text = "T₂ (avant-bras)  θ₂ = %5.1f°\n%s" % [
		rad_to_deg(angle_avant_bras), MathWorkspace.formater_matrice(locales[1])
	]
	_lbl_total.text = "M_total\n%s" % MathWorkspace.formater_matrice(totale)
	_lbl_effecteur.text = "Effecteur (origine)\n%s" % MathWorkspace.formater_vecteur(totale.origin)

	if ordre_inverse:
		_lbl_ordre.text = "Ordre : T₂ · T₁  (INVERSÉ — pose aberrante)"
		_lbl_ordre.add_theme_color_override(&"font_color", COULEUR_FANTOME)
	else:
		_lbl_ordre.text = "Ordre : T₁ · T₂  (direct — cinématique correcte)"
		_lbl_ordre.add_theme_color_override(&"font_color", COULEUR_AVANT_BRAS)
