class_name NPC
extends Node2D
## 필드의 사람·몬스터: 앞/뒤 그림 한 장씩을 메시 변형으로 걷게 한다.
## 옆을 볼 때는 앞모습을 좌우로 뒤집고, 돌아설 때는 종이 인형처럼 납작해졌다가 펴진다.

var info: Dictionary
var id := ""
var cell := Vector2i.ZERO
var home := Vector2i.ZERO
var dir := "down"
var look := ""
var front: Puppet
var back: Puppet
var busy := false
var gone := false      # 이벤트로 사라짐(이 맵에 있는 동안)
var tmp := false         # 이벤트로 잠깐 나타난 사람
var wait_t := 1.0
var height := 90.0
var tile := 64


func setup(d: Dictionary, look_override := "") -> NPC:
	info = d
	id = str(d.get("id", ""))
	cell = Vector2i(int(d.x), int(d.y))
	home = cell
	tmp = d.get("tmp", false)
	wait_t = randf_range(1.0, 3.0)
	look = look_override if look_override != "" else str(d.get("look", "man"))
	front = Puppet.new()
	add_child(front)
	if d.has("mon") and d.mon != null:
		front.setup_mon(int(d.mon), false, 130.0)
		back = front
	else:
		front.setup_person(look, false, height)
		back = Puppet.new()
		add_child(back)
		back.setup_person(look, true, height)
	_apply_dir(str(d.get("dir", "down")))
	return self


func is_mon() -> bool:
	return info.has("mon") and info.mon != null


func cur() -> Puppet:
	return back if dir == "up" else front


func _apply_dir(d: String) -> void:
	dir = d
	if back == front:
		front.body.scale.x = -1.0 if d == "left" else 1.0
		return
	front.visible = d != "up"
	back.visible = d == "up"
	front.body.scale.x = -1.0 if d == "left" else 1.0
	front.p("lean", 0.0)


func place(c: Vector2i) -> void:
	cell = c
	position = Vector2(c.x * tile + tile / 2.0, c.y * tile + tile - 6)


## 돌아서기: 가로로 접혔다가 새 방향으로 펴짐
func face(d: String, instant := false) -> void:
	if d == dir:
		return
	if instant or back == front:
		_apply_dir(d)
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
func walk_to(c: Vector2i, d: String, dur := 0.32) -> void:
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


## 머리 위 말풍선: "!", "?", "…", "♪"
func emote(kind := "!", hold := 0.5) -> void:
	Sound.sfx("sel")
	await Emote.pop(self, kind, -cur().size.y - 70, hold, cur())


## 말할 때 고개를 살짝 끄덕임
func nod() -> void:
	var p := cur()
	var tw := create_tween()
	p.tp(tw, "bend", 0.05, 0.12)
	p.tp(tw, "bend", 0.0, 0.2)


## 인사(허리 숙이기)
func bow() -> void:
	var p := cur()
	var tw := create_tween()
	p.tp(tw, "bend", 0.16, 0.18)
	tw.tween_interval(0.25)
	p.tp(tw, "bend", 0.0, 0.25)
	await tw.finished
