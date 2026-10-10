class_name Player
extends Node2D
## 주인공: NPC와 같은 앞/뒤 chibi 아틀라스에 관절 메시 변형을 적용하고,
## 몸 통통 튀기·착지 눌림·달리기 기울기·먼지를 더한다.

var dir := "down"
var height := 90.0
var body: Node2D
var shadow: Sprite2D
var front: Puppet
var back: Puppet
var _sb := Vector2.ONE


func _init() -> void:
	shadow = Sprite2D.new()
	shadow.texture = Puppet._shadow()
	shadow.modulate = Color(0.05, 0.1, 0.08, 0.36)
	add_child(shadow)
	body = Node2D.new()
	add_child(body)
	# Reuse the original chibi character used by NPCs and the battle intro.
	# The old walk atlas had a different head/body ratio, even at equal height.
	front = Puppet.new()
	back = Puppet.new()
	for p in [front, back]:
		body.add_child(p)
		p.setup_person("player", p == back, height)
		p.shadow.visible = false
	_sb = Vector2(front.size.x / 128.0 * 1.15, front.size.x / 128.0 * 0.34)
	shadow.scale = _sb
	show_frame("down", "idle", true)


func cur() -> Puppet:
	return back if dir == "up" else front


func show_frame(d: String, col: String, _instant := false) -> void:
	dir = d
	front.visible = d != "up"
	back.visible = d == "up"
	front.body.scale.x = -1.0 if d == "left" else 1.0
	for p in [front, back]:
		p.p("walk", 0.0 if col == "idle" or col == "throw" else 1.0)
		p.p("walk_phase", PI * 0.5 if col == "a" else PI * 1.5)
		p.p("arm_throw", 1.0 if col == "throw" else 0.0)


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
		cur().p("walk_phase", k * PI + (0.0 if foot else PI))
		cur().p("walk", sin(k * PI))
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
	dir = d
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
