class_name Player
extends Node2D
## 주인공: 걷기 아틀라스(방향 4 × 정지/왼발/오른발/던지기)를 프레임 사이 크로스페이드로 이어 붙이고,
## 몸 통통 튀기·착지 눌림·달리기 기울기·먼지를 더한다.

const ROWS := {"down": 0, "up": 1, "left": 2, "right": 3}
const COLS := {"idle": 0, "a": 1, "b": 2, "throw": 3}

var dir := "down"
var height := 92.0
var body: Node2D
var shadow: Sprite2D
var _cur: Sprite2D
var _old: Sprite2D
var _scale := 1.0
var _foot := 0.0
var _frame := Vector2i(-1, -1)
var _fade_tw: Tween
var _sb := Vector2.ONE


func _init() -> void:
	shadow = Sprite2D.new()
	shadow.texture = Puppet._shadow()
	shadow.modulate = Color(0.05, 0.1, 0.08, 0.36)
	add_child(shadow)
	body = Node2D.new()
	add_child(body)
	_old = Sprite2D.new()
	_cur = Sprite2D.new()
	for s in [_old, _cur]:
		s.texture = Data.tex.walk
		s.region_enabled = true
		s.centered = false
		body.add_child(s)
	var idle: Rect2 = Data.tight("walk", 0)
	_scale = height / idle.size.y
	_foot = Data.cell("walk", 0).end.y - idle.end.y
	_sb = Vector2(idle.size.x * _scale / 128.0 * 1.15, idle.size.x * _scale / 128.0 * 0.34)
	shadow.scale = _sb
	show_frame("down", "idle", true)


func show_frame(d: String, col: String, instant := false) -> void:
	dir = d
	var f := Vector2i(COLS[col], ROWS[d])
	if f == _frame:
		return
	_frame = f
	var r: Rect2 = Data.cell("walk", f.y * 4 + f.x)
	_old.region_rect = _cur.region_rect
	_old.position = _cur.position
	_old.scale = _cur.scale
	_old.modulate.a = 0.0 if instant else 1.0
	_cur.region_rect = r
	_cur.scale = Vector2(_scale, _scale)
	_cur.position = Vector2(-r.size.x * _scale / 2.0, -(r.size.y - _foot) * _scale)
	if _fade_tw:
		_fade_tw.kill()
	if instant:
		_cur.modulate.a = 1.0
		return
	# 프레임을 툭 바꾸지 않고 70ms 동안 겹쳐서 넘긴다
	_cur.modulate.a = 0.35
	_fade_tw = create_tween().set_parallel()
	_fade_tw.tween_property(_cur, "modulate:a", 1.0, 0.07)
	_fade_tw.tween_property(_old, "modulate:a", 0.0, 0.09)


## 한 칸 이동. 이동 중 몸이 통통 튀고, 발이 닿을 때 살짝 눌린다.
func step(to: Vector2, d: String, dur: float, foot: bool, running: bool) -> void:
	show_frame(d, "a" if foot else "b")
	var from := position
	var tw := create_tween()
	var lean: float = 0.0
	if running:
		lean = {"left": -0.07, "right": 0.07}.get(d, 0.0)
	tw.tween_method(func(k: float) -> void:
		position = from.lerp(to, k)
		body.position.y = -absf(sin(k * PI)) * (7.0 if running else 4.5)
		body.rotation = lean * sin(k * PI)
		body.scale = Vector2(1.0 + 0.03 * sin(k * PI), 1.0 - 0.03 * sin(k * PI)), 0.0, 1.0, dur)
	await tw.finished
	if running:
		dust(Vector2.ZERO, 5)
	show_frame(d, "idle")
	body.scale = Vector2(1.04, 0.95)
	create_tween().tween_property(body, "scale", Vector2.ONE, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


## 제자리에서 방향만 바꿀 때: 몸을 살짝 비틀어 돌아선다
func turn(d: String) -> void:
	if d == dir:
		return
	var tw := create_tween()
	tw.tween_property(body, "scale:x", 0.82, 0.05)
	tw.tween_callback(func() -> void: show_frame(d, "idle", true))
	tw.tween_property(body, "scale:x", 1.0, 0.09).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	await tw.finished


## 턱(언덕)을 뛰어내림: 포물선 + 그림자 축소 + 착지 먼지
func hop(to: Vector2, d: String) -> void:
	show_frame(d, "a")
	var from := position
	body.scale = Vector2(1.08, 0.88)
	var tw := create_tween()
	tw.tween_property(body, "scale", Vector2(0.94, 1.08), 0.08)
	tw.tween_method(func(k: float) -> void:
		position = from.lerp(to, k)
		body.position.y = -sin(k * PI) * 46.0
		var s := 1.0 - sin(k * PI) * 0.4
		shadow.scale = _sb * s, 0.0, 1.0, 0.42)
	await tw.finished
	show_frame(d, "idle")
	body.position.y = 0
	shadow.scale = _sb
	dust(Vector2.ZERO, 12)
	body.scale = Vector2(1.14, 0.84)
	await create_tween().tween_property(body, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT).finished


## 캡슐 던지는 자세
func throw_pose() -> void:
	show_frame(dir, "throw")
	body.rotation = -0.05
	await create_tween().tween_property(body, "rotation", 0.0, 0.25).set_trans(Tween.TRANS_BACK).finished
	show_frame(dir, "idle")


func dust(at: Vector2, n: int) -> void:
	var p := FX.burst(get_parent(), position + at, Color(0.93, 0.88, 0.74, 0.8), Color(0.8, 0.74, 0.6), n, 90.0, Vector2(0, -30), 0.45, 0.9, 70.0, Vector2.UP)
	p.z_index = -1
