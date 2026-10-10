class_name NPC
extends Node2D
## 마을 사람: 앞/뒤 그림 한 장씩을 메시 변형으로 걷게 한다.
## 옆을 볼 때는 앞모습을 좌우로 뒤집고, 돌아설 때는 종이 인형처럼 납작해졌다가 펴진다.

var info: Dictionary
var cell := Vector2i.ZERO
var home := Vector2i.ZERO
var dir := "down"
var front: Puppet
var back: Puppet
var busy := false
var height := 90.0


func setup(d: Dictionary) -> NPC:
	info = d
	cell = Vector2i(int(d.x), int(d.y))
	home = cell
	front = Puppet.new()
	add_child(front)
	front.setup_person(d.look, false, height)
	back = Puppet.new()
	add_child(back)
	back.setup_person(d.look, true, height)
	_apply_dir(str(d.get("dir", "down")))
	return self


func cur() -> Puppet:
	return back if dir == "up" else front


func _apply_dir(d: String) -> void:
	dir = d
	front.visible = d != "up"
	back.visible = d == "up"
	var sx := -1.0 if d == "left" else 1.0
	front.body.scale.x = sx
	front.p("lean", 0.0)


## 돌아서기: 가로로 접혔다가 새 방향으로 펴짐
func face(d: String) -> void:
	if d == dir:
		return
	var p := cur()
	var tw := create_tween()
	tw.tween_property(p.body, "scale:x", 0.08 * signf(p.body.scale.x), 0.07).set_trans(Tween.TRANS_SINE)
	await tw.finished
	p.body.scale.x = 1.0
	_apply_dir(d)
	var q := cur()
	var target := q.body.scale.x
	q.body.scale.x = 0.08 * signf(target)
	await create_tween().tween_property(q.body, "scale:x", target, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT).finished


## 한 칸 걷기: 다리 번갈아 들기 + 통통 + 진행 방향으로 기울기
func walk_to(c: Vector2i, d: String, tile: int, dur := 0.32) -> void:
	busy = true
	await face(d)
	cell = c
	var p := cur()
	var from := position
	var to := Vector2(c.x * tile + tile / 2.0, c.y * tile + tile - 6)
	var lean: float = {"left": -0.03, "right": 0.03}.get(d, 0.0)
	var tw := create_tween()
	tw.tween_method(func(k: float) -> void:
		position = from.lerp(to, k)
		p.p("walk", sin(k * PI) * 0.9 + 0.1)
		p.p("walk_phase", k * TAU + (PI if int(c.x + c.y) % 2 else 0.0))
		p.p("lean", lean * sin(k * PI))
		p.lift = absf(sin(k * TAU)) * 3.0, 0.0, 1.0, dur)
	await tw.finished
	p.p("walk", 0.0)
	p.p("lean", 0.0)
	p.lift = 0.0
	busy = false


## 머리 위에 "!" 말풍선이 튀어오름
func exclaim() -> void:
	var l := Label.new()
	l.text = "!"
	l.add_theme_font_size_override("font_size", 44)
	l.add_theme_color_override("font_color", Color(0.85, 0.2, 0.2))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color.WHITE
	sb.set_corner_radius_all(14)
	sb.set_border_width_all(4)
	sb.border_color = Color(0.2, 0.2, 0.25)
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	l.add_theme_stylebox_override("normal", sb)
	l.position = Vector2(-22, -height - 74)
	l.size = Vector2(44, 60)
	l.pivot_offset = Vector2(22, 60)
	l.scale = Vector2(0.1, 0.1)
	l.z_index = 50
	add_child(l)
	var p := cur()
	var tw := create_tween()
	tw.tween_property(l, "scale", Vector2(1.25, 1.25), 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_method(func(k: float) -> void: p.lift = sin(k * PI) * 14.0, 0.0, 1.0, 0.22)
	tw.tween_property(l, "scale", Vector2.ONE, 0.1)
	tw.tween_interval(0.45)
	tw.tween_property(l, "modulate:a", 0.0, 0.15)
	tw.tween_callback(l.queue_free)
	await tw.finished


## 말할 때 고개를 살짝 끄덕임
func nod() -> void:
	var p := cur()
	var tw := create_tween()
	p.tp(tw, "bend", 0.05, 0.12)
	p.tp(tw, "bend", 0.0, 0.2)
