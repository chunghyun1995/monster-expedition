class_name Capsule
extends Node2D
## 포획캡슐 그림 (종류마다 윗면 색이 다름). 반지름 r 기준으로 그린다.

const TOP := {"ball": Color(0.9, 0.27, 0.32), "great": Color(0.6, 0.66, 0.78), "hyper": Color(0.95, 0.75, 0.2)}
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
	var k := r / 23.0
	draw_circle(Vector2(0, r * 0.95), r * 0.8, Color(0, 0, 0, 0.18))
	if open:
		draw_circle(Vector2(0, 4 * k), 23 * k, Color(0.15, 0.15, 0.2))
		draw_circle(Vector2(0, 4 * k), 20 * k, Color(0.97, 0.97, 0.95))
		_half(Vector2(0, -10 * k), k)
		return
	draw_circle(Vector2.ZERO, 26 * k, Color(0.15, 0.15, 0.2))
	draw_circle(Vector2.ZERO, 23 * k, Color(0.97, 0.97, 0.95))
	_half(Vector2.ZERO, k)
	draw_rect(Rect2(-24 * k, -3 * k, 48 * k, 6 * k), Color(0.15, 0.15, 0.2))
	draw_circle(Vector2.ZERO, 9 * k, Color(0.15, 0.15, 0.2))
	draw_circle(Vector2.ZERO, 6 * k, Color.WHITE)
	draw_circle(Vector2(-9, -12) * k, 5 * k, Color(1, 1, 1, 0.6))
	if dim:
		draw_circle(Vector2.ZERO, 26 * k, Color(0, 0, 0, 0.25))


func _half(at: Vector2, k: float) -> void:
	var top := PackedVector2Array()
	for i in 25:
		top.append(at + Vector2.from_angle(PI + PI * i / 24.0) * 23 * k)
	draw_colored_polygon(top, TOP.get(kind, TOP.ball))
