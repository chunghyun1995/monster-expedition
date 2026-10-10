class_name Capsule
extends Node2D
## Original faceted resonance lantern. No spherical red/white halves or button seam.
const COLORS := {"ball": Color("#40c7bb"), "great": Color("#9d88e5"), "hyper": Color("#edc25c")}
var kind := "ball"
var r := 23.0
var open := false
var dim := false

static func make(kind_ := "ball", radius := 23.0) -> Capsule:
	var c := Capsule.new()
	c.kind = kind_
	c.r = radius
	return c

func _draw() -> void:
	var color: Color = COLORS.get(kind, COLORS.ball)
	var edge := Color("#243c49")
	var brass := Color("#bd9354")
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE * r / 23.0)
	draw_circle(Vector2(0, 23), 16, Color(0, 0, 0, 0.18))
	var hull := PackedVector2Array([Vector2(0,-27), Vector2(17,-15), Vector2(19,13), Vector2(0,26), Vector2(-19,13), Vector2(-17,-15)])
	draw_colored_polygon(hull, edge)
	if open:
		draw_circle(Vector2(0,-5), 20, Color(color, 0.25))
		draw_colored_polygon(PackedVector2Array([Vector2(0,-23),Vector2(8,-7),Vector2(0,14),Vector2(-8,-7)]), color.lightened(0.65))
		_panel(-1, color, brass, true)
		_panel(1, color, brass, true)
	else:
		_panel(-1, color, brass, false)
		_panel(1, color, brass, false)
		# Vertical luminous vein and leaf emblem, rather than an equatorial band.
		draw_line(Vector2(0,-20), Vector2(0,18), brass, 3, true)
		draw_colored_polygon(PackedVector2Array([Vector2(0,-10),Vector2(7,-3),Vector2(0,8),Vector2(-5,1)]), Color("#e6ffd9"))
		draw_line(Vector2(-9,-11), Vector2(-10,8), Color(1,1,1,0.5), 2, true)
	draw_colored_polygon(PackedVector2Array([Vector2(0,-27),Vector2(6,-23),Vector2(0,-19),Vector2(-6,-23)]), brass)
	if dim:
		draw_colored_polygon(hull, Color(0,0,0,0.3))
	draw_set_transform(Vector2.ZERO)

func _panel(side: float, color: Color, brass: Color, unfolded: bool) -> void:
	var shift := Vector2(side * 12, -5) if unfolded else Vector2.ZERO
	var panel := PackedVector2Array([Vector2(0,-23),Vector2(side*14,-13),Vector2(side*16,11),Vector2(0,22)])
	for i in panel.size():
		panel[i] += shift
	draw_colored_polygon(panel, color.lightened(0.13) if side < 0 else color.darkened(0.25))
	panel.append(panel[0])
	draw_polyline(panel, brass, 2.0, true)
