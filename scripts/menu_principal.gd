## =============================================================================
##  menu_principal.gd  —  Aiguillage entre les deux activités du laboratoire.
## =============================================================================
extends Control

const SCENE_ROBOT: String = "res://scenes/activite_1_robot.tscn"
const SCENE_BRAS: String = "res://scenes/activite_2_bras.tscn"


func _ready() -> void:
	%BoutonRobot.pressed.connect(_ouvrir_robot)
	%BoutonBras.pressed.connect(_ouvrir_bras)
	%BoutonQuitter.pressed.connect(_quitter)


func _ouvrir_robot() -> void:
	get_tree().change_scene_to_file(SCENE_ROBOT)


func _ouvrir_bras() -> void:
	get_tree().change_scene_to_file(SCENE_BRAS)


func _quitter() -> void:
	get_tree().quit()
