extends Node2D
## 필드: 새싹마을 ↔ 1번 도로. 칸 단위 이동, 흔들리는 나무·풀숲, 일렁이는 물, 걸어 다니는 마을 사람,
## 시선이 마주치면 다가오는 트레이너, 풀숲 야생 몬스터.

const T := 64
const WALK := "..,=fLD"
const WATER_SHADER := preload("res://shaders/water.gdshader")
const ENC_RATE := 0.12

var m: Dictionary
var rows: Array
var W := 0
var H := 0
var world: Node2D
var ground: Node2D
var water: Node2D
var player: Player
var cell := Vector2i.ZERO
var npcs: Array = []
var grass := {}
var cam: Camera2D
var ui: CanvasLayer
var msg: MessageBox
var pad: TouchPad
var title_lbl: Label
var busy := false
var moving := false
var _foot := false
var _wander_t := 0.0


func _ready() -> void:
	cam = Camera2D.new()
	cam.position_smoothing_enabled = true
	cam.position_smoothing_speed = 9.0
	cam.ignore_rotation = false
	add_child(cam)
	ui = CanvasLayer.new()
	ui.layer = 5
	add_child(ui)
	pad = TouchPad.new()
	ui.add_child(pad)
	msg = MessageBox.new()
	ui.add_child(msg)
	var vs := get_viewport().get_visible_rect().size
	msg.build(Rect2(20, vs.y - 560, vs.x - 40, 200))
	title_lbl = UI.label(ui, "", Vector2(20, 24), 30, Color.WHITE)
	title_lbl.add_theme_constant_override("outline_size", 8)
	title_lbl.add_theme_color_override("font_outline_color", Color(0.1, 0.12, 0.16))
	var menu := UI.button(ui, "모션 보기", Rect2(vs.x - 200, 20, 180, 70), Color(0.42, 0.45, 0.6), 26)
	menu.focus_mode = Control.FOCUS_NONE
	menu.pressed.connect(func() -> void:
		if not busy:
			busy = true
			pad.release_all()
			Game.change_scene("res://scenes/gallery.tscn"))
	load_map(Game.map_id, Game.spawn, Game.facing)
	if Game.dev == "battle":
		Game.dev = ""
		_battle({"kind": "wild", "team": [Game.make_mon(17, 5)]})
	elif Game.dev == "person":
		Game.dev = ""
		_person_battle(npcs[0], "아저씨")


# ---------------- 맵 만들기 ----------------
func load_map(id: String, at: Vector2i, d: String) -> void:
	if world:
		world.queue_free()
	if ground:
		ground.queue_free()
	if water:
		water.queue_free()
	npcs.clear()
	grass.clear()
	m = Data.map(id)
	rows = m.rows
	H = rows.size()
	W = rows[0].length()
	Game.map_id = id
	ground = Node2D.new()
	ground.z_index = -10
	ground.draw.connect(_draw_ground.bind(ground, false))
	add_child(ground)
	water = Node2D.new()
	water.z_index = -9
	var wm := ShaderMaterial.new()
	wm.shader = WATER_SHADER
	water.material = wm
	water.draw.connect(_draw_ground.bind(water, true))
	add_child(water)
	world = Node2D.new()
	world.y_sort_enabled = true
	add_child(world)
	for y in H:
		for x in W:
			_make_prop(x, y, tile(x, y))
	_make_buildings()
	for n in m.npcs:
		if Game.flags.get("caught_" + n.id, false):
			continue
		var npc := NPC.new()
		world.add_child(npc)
		npc.setup(n)
		npc.position = Vector2(npc.cell.x * T + T / 2.0, npc.cell.y * T + T - 6)
		npcs.append(npc)
	player = Player.new()
	world.add_child(player)
	cell = at
	player.position = _pos(at)
	player.show_frame(d, "idle", true)
	cam.limit_left = 0
	cam.limit_top = -T
	cam.limit_right = W * T
	cam.limit_bottom = H * T
	cam.position = player.position + Vector2(0, 160)
	cam.reset_smoothing()
	title_lbl.text = m.name


func tile(x: int, y: int) -> String:
	if x < 0 or y < 0 or y >= H or x >= rows[y].length():
		return ""
	return rows[y][x]


func _pos(c: Vector2i) -> Vector2:
	return Vector2(c.x * T + T / 2.0, c.y * T + T - 6)


func _draw_ground(node: Node2D, only_water: bool) -> void:
	var tex: Texture2D = Data.tex.terrain
	for y in H:
		for x in W:
			var c := tile(x, y)
			var is_w := c == "~"
			if is_w != only_water:
				continue
			var t := 3 if is_w else (1 if c == "=" else 0)
			var src: Rect2 = Data.cell("terrain", t).grow(-4)
			# 칸마다 뒤집어 반복 무늬를 숨긴다
			var fx := -1.0 if x & 1 else 1.0
			var fy := -1.0 if y & 1 else 1.0
			node.draw_set_transform(Vector2(x * T + T / 2.0, y * T + T / 2.0), 0, Vector2(fx, fy))
			node.draw_texture_rect_region(tex, Rect2(-T / 2.0 - 0.5, -T / 2.0 - 0.5, T + 1, T + 1), src,
				Color(0.86, 0.95, 0.8) if t == 0 else Color.WHITE)
			if c == "L":
				node.draw_set_transform(Vector2(x * T, y * T))
				node.draw_rect(Rect2(0, T * 0.7, T, T * 0.3), Color(0.27, 0.47, 0.29))
				node.draw_rect(Rect2(0, T * 0.7, T, 4), Color(0.62, 0.78, 0.57))
	node.draw_set_transform(Vector2.ZERO)


func _make_prop(x: int, y: int, c: String) -> void:
	var spec := {}
	match c:
		"#":
			spec = {"i": 1 if (x * 7 + y * 3) % 5 == 0 else 0, "h": 124.0, "sway": 0.7, "shadow": true, "dy": -2}
		",":
			spec = {"i": 2, "h": 58.0, "sway": 1.0, "dy": 7}
		"f":
			spec = {"i": 3, "h": 40.0, "sway": 1.6, "dy": -10}
		"r":
			spec = {"i": 4, "h": 56.0, "shadow": true, "dy": -6}
		"s":
			spec = {"i": 5, "h": 70.0, "shadow": true, "dy": -4}
	if spec.is_empty():
		return
	var p := Puppet.new()
	world.add_child(p)
	p.setup_atlas("props", spec.i, spec.h, {"breath": 0.0, "sway": spec.get("sway", 0.0), "speed": 0.8 + randf() * 0.4},
		spec.get("shadow", false), Vector2i(4, 6))
	p.position = Vector2(x * T + T / 2.0 + randf_range(-3, 3), y * T + T + spec.dy)
	if c == ",":
		grass[Vector2i(x, y)] = p


func _make_buildings() -> void:
	var seen := {}
	for y in H:
		for x in W:
			var c := tile(x, y)
			if not "HKBCMGT".contains(c) or c == "" or seen.has(Vector2i(x, y)):
				continue
			var stack := [Vector2i(x, y)]
			var cells := []
			while stack.size():
				var q: Vector2i = stack.pop_back()
				var qc := tile(q.x, q.y)
				if seen.has(q) or (qc != c and qc != "D"):
					continue
				seen[q] = true
				cells.append(q)
				for d in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
					stack.append(q + d)
			var mn := Vector2i(999, 999)
			var mx := Vector2i(-1, -1)
			for q in cells:
				mn = Vector2i(mini(mn.x, q.x), mini(mn.y, q.y))
				mx = Vector2i(maxi(mx.x, q.x), maxi(mx.y, q.y))
			var w := (mx.x - mn.x + 1) * T
			var h := (mx.y - mn.y + 1) * T
			var root := Node2D.new()
			root.position = Vector2(mn.x * T + w / 2.0, (mx.y + 1) * T - 2)
			world.add_child(root)
			var sh := Sprite2D.new()
			sh.texture = Puppet._shadow()
			sh.scale = Vector2(w / 128.0 * 1.1, 0.4)
			sh.modulate = Color(0.05, 0.1, 0.08, 0.35)
			root.add_child(sh)
			var s := Sprite2D.new()
			s.texture = Data.tex.props
			s.region_enabled = true
			s.region_rect = Data.cell("props", {"H": 6, "K": 7, "B": 8, "C": 9, "M": 10, "G": 11, "T": 12}[c])
			s.centered = false
			s.scale = Vector2((w + 8) / 192.0, (h + 28) / 192.0)
			s.position = Vector2(-w / 2.0 - 4, -h - 26)
			root.add_child(s)


# ---------------- 이동 ----------------
func _process(delta: float) -> void:
	_wander(delta)
	if player:
		cam.position = player.position + Vector2(0, 160)
	if busy or moving or msg.visible:
		return
	if Input.is_action_just_pressed("a_btn"):
		_interact()
		return
	var d := ""
	for k in ["up", "down", "left", "right"]:
		if Input.is_action_pressed("go_" + k):
			d = k
	if d != "":
		_try_move(d)


func _try_move(d: String) -> void:
	moving = true
	var v: Vector2i = {"up": Vector2i.UP, "down": Vector2i.DOWN, "left": Vector2i.LEFT, "right": Vector2i.RIGHT}[d]
	if player.dir != d and not Input.is_action_pressed("run"):
		var was_still := true
		await player.turn(d)
		# 잠깐 눌렀으면 방향만 바꾸고 멈춘다
		await get_tree().create_timer(0.06).timeout
		if was_still and not Input.is_action_pressed("go_" + d):
			moving = false
			return
	var to := cell + v
	var c := tile(to.x, to.y)
	# 맵 끝: 이어진 맵으로
	if c == "":
		moving = false
		await _edge(d, to)
		return
	if c == "L" and d == "down" and _free(to + v):
		cell = to + v
		await player.hop(_pos(cell), d)
		moving = false
		return
	if c == "D":
		await player.turn(d)
		moving = false
		busy = true
		await msg.say("문이 잠겨 있다. (Godot 미리보기에서는 건물 안을 아직 만들지 않았어요)")
		busy = false
		return
	if not _free(to):
		await player.turn(d)
		# 막혔을 때 몸이 살짝 부딪히는 반동
		var tw := create_tween()
		tw.tween_property(player.body, "position", Vector2(v) * 5.0, 0.06)
		tw.tween_property(player.body, "position", Vector2.ZERO, 0.12).set_trans(Tween.TRANS_BACK)
		await tw.finished
		moving = false
		return
	var running := Input.is_action_pressed("run") or Input.is_key_pressed(KEY_SHIFT)
	cell = to
	_foot = not _foot
	if grass.has(to):
		_rustle(grass[to], 0.0)
	await player.step(_pos(to), d, 0.13 if running else 0.21, _foot, running)
	if grass.has(to):
		_rustle(grass[to], 0.12)
	moving = false
	Game.steps += 1
	if await _check_trainers():
		return
	if c == "," and randf() < ENC_RATE:
		await _wild()


func _free(c: Vector2i) -> bool:
	var t := tile(c.x, c.y)
	if t == "" or not WALK.contains(t) or t == "L" or t == "D":
		return false
	for n in npcs:
		if n.cell == c:
			return false
	return true


## 풀숲을 지나가면 풀이 출렁이고 잎이 튄다
func _rustle(p: Puppet, delay: float) -> void:
	if delay > 0:
		await get_tree().create_timer(delay).timeout
	p.p("wobble", 0.9)
	p.p("squash", 0.12)
	var tw := create_tween().set_parallel()
	p.tp(tw, "wobble", 0.0, 0.55)
	p.tp(tw, "squash", 0.0, 0.3).set_trans(Tween.TRANS_BACK)
	FX.burst(world, p.position + Vector2(0, -26), Color(0.7, 0.95, 0.45), Color(0.3, 0.6, 0.25), 6, 160.0, Vector2(0, 380), 0.55, 0.7, 60.0)


func _edge(d: String, to: Vector2i) -> void:
	var key: String = {"up": "n", "down": "s", "left": "w", "right": "e"}[d]
	var next: String = m.links.get(key, "")
	if next == "" or not Data.D.maps.has(next):
		busy = true
		await msg.say("이 앞은 아직 갈 수 없어요. (Godot 미리보기는 새싹마을과 1번 도로까지)")
		busy = false
		return
	busy = true
	await Game.fade_to(1.0, 0.3)
	var nm: Dictionary = Data.map(next)
	var nh: int = nm.rows.size()
	var at := Vector2i(to.x, nh - 1) if d == "up" else Vector2i(to.x, 0)
	load_map(next, at, d)
	await get_tree().process_frame
	await Game.fade_to(0.0, 0.3)
	_banner(m.name)
	busy = false


## 지역 이름 표지판이 위에서 내려왔다 올라간다
func _banner(text: String) -> void:
	var p := UI.panel(ui, Rect2(160, -90, 400, 80), Color(0.98, 0.96, 0.88))
	var l := UI.label(p, text, Vector2(0, 14), 32)
	l.size = Vector2(400, 50)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var tw := p.create_tween()
	tw.tween_property(p, "position:y", 110.0, 0.4).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(1.4)
	tw.tween_property(p, "position:y", -100.0, 0.3).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	tw.tween_callback(p.queue_free)


# ---------------- 사람들 ----------------
func _wander(delta: float) -> void:
	_wander_t -= delta
	if _wander_t > 0 or busy:
		return
	_wander_t = randf_range(0.7, 1.6)
	if npcs.is_empty():
		return
	var n: NPC = npcs.pick_random()
	if n.busy or not n.info.get("wander", 0) or n.info.has("trainer"):
		return
	var d: String = ["up", "down", "left", "right"].pick_random()
	var v: Vector2i = {"up": Vector2i.UP, "down": Vector2i.DOWN, "left": Vector2i.LEFT, "right": Vector2i.RIGHT}[d]
	var to: Vector2i = n.cell + v
	if randf() < 0.4 or (to - n.home).length() > 1.5 or not _free(to) or to == cell or tile(to.x, to.y) == ",":
		n.face(d)
		return
	n.walk_to(to, d, T)


func _npc_at(c: Vector2i) -> NPC:
	for n in npcs:
		if n.cell == c:
			return n
	return null


func _dir_vec(d: String) -> Vector2i:
	return {"up": Vector2i.UP, "down": Vector2i.DOWN, "left": Vector2i.LEFT, "right": Vector2i.RIGHT}[d]


func _opposite(d: String) -> String:
	return {"up": "down", "down": "up", "left": "right", "right": "left"}[d]


func _interact() -> void:
	var front := cell + _dir_vec(player.dir)
	var n := _npc_at(front)
	busy = true
	if n:
		while n.busy:
			await get_tree().process_frame
		await n.face(_opposite(player.dir))
		await _talk(n)
	else:
		var key := "%d,%d" % [front.x, front.y]
		if m.signs.has(key):
			var s: Array = m.signs[key]
			await msg.say("[%s]\n%s" % [s[0], s[1]])
	busy = false


func _talk(n: NPC) -> void:
	var who: String = n.info.get("name", "")
	if n.info.has("trainer"):
		var tr: Dictionary = n.info.trainer
		who = Data.D.tclass[tr.cls].n + " " + tr.name
		if Game.flags.get("beat_" + n.info.id, false):
			for line in tr.after:
				n.nod()
				await msg.say(line, who)
			return
		await _trainer_battle(n)
		return
	for line in n.info.text:
		n.nod()
		await msg.say(line, who)
	var pick := await msg.choose("어떻게 할까?", ["싸우자", "대화를 그만한다"])
	if pick == 0:
		await _person_battle(n, who)


func _human_sid(look: String) -> int:
	for k in Data.D.species:
		if Data.D.species[k].get("human", "") == look:
			return int(k)
	return 112


func _person_battle(n: NPC, who: String) -> void:
	n.nod()
	await msg.say("뭐? 나랑 싸우자고? ...좋아, 덤벼 봐!", who)
	var sid := _human_sid(n.info.look)
	var r: String = await _battle({"kind": "person", "team": [Game.make_mon(sid, 6)], "name": who, "look": n.info.look})
	if r == "caught":
		Game.flags["caught_" + n.info.id] = true
		npcs.erase(n)
		n.queue_free()
	elif r == "win":
		await msg.say("아이고, 내가 졌다! 너 제법이구나.", who)


## 트레이너 시선: 앞쪽 4칸 안에 주인공이 있으면 "!" 하고 다가온다
func _check_trainers() -> bool:
	for n in npcs:
		if not n.info.has("trainer") or Game.flags.get("beat_" + n.info.id, false):
			continue
		var v := _dir_vec(n.dir)
		var c: Vector2i = n.cell
		for i in 4:
			c += v
			if c == cell:
				busy = true
				pad.release_all()
				await n.exclaim()
				while n.cell + v != cell:
					await n.walk_to(n.cell + v, n.dir, T, 0.26)
				await player.turn(_opposite(n.dir))
				await _trainer_battle(n)
				busy = false
				return true
			if not _free(c):
				break
	return false


func _trainer_battle(n: NPC) -> void:
	var tr: Dictionary = n.info.trainer
	var who: String = Data.D.tclass[tr.cls].n + " " + tr.name
	for line in tr.intro:
		n.nod()
		await msg.say(line, who)
	var team: Array = []
	for e in tr.team:
		team.append(Game.make_mon(int(e[0]), int(e[1])))
	var r: String = await _battle({"kind": "trainer", "team": team, "name": who, "look": n.info.look, "lose": tr.lose})
	if r == "win":
		Game.flags["beat_" + n.info.id] = true


func _wild() -> void:
	busy = true
	pad.release_all()
	var enc: Array = m.enc
	var total := 0
	for e in enc:
		total += int(e[3])
	var r := randi() % maxi(1, total)
	var pick: Array = enc[0]
	for e in enc:
		r -= int(e[3])
		if r < 0:
			pick = e
			break
	var lv := randi_range(int(pick[1]), int(pick[2]))
	await _battle({"kind": "wild", "team": [Game.make_mon(int(pick[0]), lv)]})
	busy = false


func _battle(opts: Dictionary) -> String:
	busy = true
	pad.release_all()
	pad.visible = false
	await _encounter_flash()
	var b := Battle.new()
	add_child(b)
	var r: String = await b.run(opts)
	b.queue_free()
	await Game.fade_to(0.0, 0.3)
	pad.visible = true
	if r == "lose":
		Game.heal_all()
		await Game.fade_to(1.0, 0.2)
		load_map("town", Vector2i(4, 13), "down")
		await Game.fade_to(0.0, 0.4)
		await msg.say("눈앞이 캄캄해졌다... 집에서 푹 쉬고 나니 몬스터들이 기운을 되찾았다.")
	busy = false
	return r


## 전투 들어가기 전: 화면이 두 번 번쩍이고 소용돌이치며 어두워진다
func _encounter_flash() -> void:
	var fl := ColorRect.new()
	fl.set_anchors_preset(Control.PRESET_FULL_RECT)
	fl.color = Color(1, 1, 1, 0)
	fl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(fl)
	var tw := create_tween()
	for i in 2:
		tw.tween_property(fl, "color:a", 0.85, 0.07)
		tw.tween_property(fl, "color:a", 0.0, 0.1)
	tw.parallel().tween_property(cam, "zoom", Vector2(1.35, 1.35), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.parallel().tween_property(cam, "rotation", 0.25, 0.35)
	await tw.finished
	await Game.fade_to(1.0, 0.18)
	fl.queue_free()
	cam.zoom = Vector2.ONE
	cam.rotation = 0
