class_name World
extends Node2D
## 필드: 40개 지도(바깥·건물 안)를 같은 규칙으로 그리고, 이동·조사·문·연결·트레이너 시선·야생 몬스터를 처리한다.
## 이야기 이벤트는 events.gd 가 이 파일의 도우미(say, battle, walk_npc …)를 불러 진행한다.

const T := 64
const DV := {"up": Vector2i.UP, "down": Vector2i.DOWN, "left": Vector2i.LEFT, "right": Vector2i.RIGHT}
const OPP := {"up": "down", "down": "up", "left": "right", "right": "left"}
const WATER_SHADER := preload("res://shaders/water.gdshader")
const BLD := {"H": 6, "K": 7, "B": 8, "C": 9, "M": 10, "G": 11, "T": 12}
const STARTERS := [[4, 4, 1], [5, 4, 4], [6, 4, 7]]
const DEF_TEXT := {"S": ["책이 가득 꽂혀 있다."], "v": ["TV에서 재미있는 방송을 하고 있다."], "b": ["푹신해 보이는 침대다."],
	"p": ["잘 가꿔진 화분이다."], "r": ["커다란 바위다. 꿈쩍도 하지 않는다."], "~": ["맑은 물이 반짝이고 있다."], "h": ["회복 장치다."]}

var m: Dictionary
var rows: Array
var W := 0
var H := 0
var out := false
var ground: Node2D
var water: Node2D
var ents: Node2D
var player: Player
var P := Vector2i.ZERO
var npcs: Array = []
var item_nodes := {}
var grass := {}
var cam: Camera2D
var ui: CanvasLayer
var pad: TouchPad
var menu_btn: Button
var tint: CanvasModulate
var ev: Events
var busy := false
var moving := false
var battles := 0
var talking: NPC = null
var heal_balls: Array = []
var _foot := false
var _cam_y := 0.0
var _turn_at := 0.0
var _chain := false


func _ready() -> void:
	ev = Events.new(self)
	cam = Camera2D.new()
	cam.ignore_rotation = false
	add_child(cam)
	tint = CanvasModulate.new()
	add_child(tint)
	ui = CanvasLayer.new()
	ui.layer = 5
	add_child(ui)
	pad = TouchPad.new()
	ui.add_child(pad)
	var vs := get_viewport().get_visible_rect().size
	menu_btn = UI.button(ui, "≡ 메뉴", Rect2(vs.x - 196, 20, 176, 72), Color(0.86, 0.36, 0.42), 28)
	menu_btn.focus_mode = Control.FOCUS_NONE
	menu_btn.pressed.connect(open_menu)
	Msg.place("field")
	var g: Dictionary = Game.g
	enter_map(g.map, Vector2i(int(g.x), int(g.y)), g.dir, {"quiet": true})
	if Game.dev != "":
		var d := Game.dev
		Game.dev = ""
		await get_tree().process_frame
		await ev.dev(d)


# =====================================================================
# 지도 만들기
# =====================================================================
func enter_map(id: String, at: Vector2i, d: String, opts := {}) -> void:
	var prev: String = Game.g.map
	for n in [ground, water, ents]:
		if n:
			n.queue_free()
	npcs.clear()
	item_nodes.clear()
	grass.clear()
	heal_balls.clear()
	m = Data.map(id)
	rows = m.rows
	H = rows.size()
	W = rows[0].length()
	out = bool(m.get("out", 0))
	Game.g.map = id
	if str(m.get("music", "")) != "":
		Sound.music(str(m.music))
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
	ents = Node2D.new()
	ents.y_sort_enabled = true
	add_child(ents)
	for y in H:
		for x in W:
			_make_prop(x, y, tile(x, y))
	if out:
		_make_buildings()
	else:
		_make_tables()
	for it in m.items:
		if not Game.flag(str(it.flag)):
			var c := Capsule.make("great" if it.item == "great" else "ball", 15.0)
			c.position = Vector2(int(it.x) * T + T / 2.0, int(it.y) * T + T / 2.0 + 4)
			ents.add_child(c)
			item_nodes[Vector2i(int(it.x), int(it.y))] = c
	for n in m.npcs:
		var npc := NPC.new()
		ents.add_child(npc)
		npc.setup(n, ev.npc_look(n))
		npc.place(npc.cell)
		npcs.append(npc)
	refresh_npcs()
	player = Player.new()
	ents.add_child(player)
	P = at
	player.position = _pos(at)
	player.show_frame(d, "idle", true)
	Game.g.x = at.x
	Game.g.y = at.y
	Game.g.dir = d
	_cam_y = 0.0
	_update_cam(true)
	_day_tint()
	if not opts.get("quiet", false) and (prev != id and (Data.D.maps.get(prev, {}).get("name", "") != m.name or opts.get("sign", false))):
		banner(m.name)


func tile(x: int, y: int) -> String:
	if x < 0 or y < 0 or y >= H or x >= str(rows[y]).length():
		return ""
	return rows[y][x]


func _pos(c: Vector2i) -> Vector2:
	return Vector2(c.x * T + T / 2.0, c.y * T + T - 6)


func _ground_index(c: String) -> int:
	if out:
		if c == "=":
			return 1
		if c == "~" or c == "Q":
			return 3
		if c == ":":
			return 13
		if c == "%":
			return 14
		if c == "^" or c == "O":
			return 12
		return 13 if m.has("pal") and m.pal.has("ash") else 0
	if c == "w":
		return 11
	if c == "~":
		return 3
	if c == "%":
		return 14
	return 8 if m.get("floor", "") == "wood" else 9


func _floor_tint(t: int) -> Color:
	if t == 0:
		if m.has("pal") and m.pal.has("g"):
			return Color(m.pal.g).lerp(Color.WHITE, 0.35)
		return Color(0.86, 0.95, 0.8)
	if t == 11:
		return Color(m.get("wall", "#e8d8b8")).lerp(Color.WHITE, 0.25)
	if t == 9:
		match m.get("floor", ""):
			"tile":
				return Color(1.0, 0.97, 0.95)
			"pool":
				return Color(0.82, 0.92, 1.0)
			"sky":
				return Color(0.9, 0.96, 1.0)
			"lab":
				return Color(0.92, 0.94, 0.98)
	return Color.WHITE


func _draw_ground(node: Node2D, only_water: bool) -> void:
	var tex: Texture2D = Data.tex.terrain
	for y in H:
		for x in W:
			var c := tile(x, y)
			if c == "x":
				if not only_water:
					node.draw_rect(Rect2(x * T, y * T, T, T), Color(0.1, 0.13, 0.18))
				continue
			var t := _ground_index(c)
			if (t == 3) != only_water:
				continue
			var src: Rect2 = Data.cell("terrain", t).grow(-4)
			var fx := -1.0 if x & 1 else 1.0
			var fy := -1.0 if y & 1 else 1.0
			node.draw_set_transform(Vector2(x * T + T / 2.0, y * T + T / 2.0), 0, Vector2(fx, fy))
			node.draw_texture_rect_region(tex, Rect2(-T / 2.0 - 0.5, -T / 2.0 - 0.5, T + 1, T + 1), src, _floor_tint(t))
			node.draw_set_transform(Vector2(x * T, y * T))
			match c:
				"L":
					node.draw_rect(Rect2(0, T * 0.7, T, T * 0.3), Color(0.27, 0.47, 0.29))
					node.draw_rect(Rect2(0, T * 0.7, T, 4), Color(0.62, 0.78, 0.57))
				"w":
					if tile(x, y + 1) != "w":
						node.draw_rect(Rect2(0, T - 10, T, 10), Color(m.get("wall", "#e8d8b8")).darkened(0.35))
				"m":
					node.draw_rect(Rect2(4, 10, T - 8, T - 20), Color(0.78, 0.29, 0.23))
					node.draw_rect(Rect2(8, 14, T - 16, T - 28), Color(0.91, 0.42, 0.35))
				"c":
					node.draw_rect(Rect2(0, 0, T, T), Color(0.78, 0.29, 0.35, 0.85))
					node.draw_rect(Rect2(0, 0, T, 4), Color(0.91, 0.63, 0.25))
				"u":
					node.draw_rect(Rect2(4, 4, T - 8, T - 8), Color(0.38, 0.36, 0.44))
					for i in 4:
						node.draw_rect(Rect2(8, 8 + i * 14, T - 16, 7), Color(0.79, 0.77, 0.84))
				"^":
					node.draw_rect(Rect2(0, T - 8, T, 8), Color(0, 0, 0, 0.18))
			if c == "~" and only_water:
				# 물가: 위쪽 땅과 맞닿는 곳에 흰 물결
				var up := tile(x, y - 1)
				if up != "~" and up != "Q" and up != "":
					node.draw_rect(Rect2(0, 0, T, 6), Color(0.9, 0.97, 1.0, 0.75))
	node.draw_set_transform(Vector2.ZERO)


func _make_prop(x: int, y: int, c: String) -> void:
	var spec := {}
	if out:
		match c:
			"#":
				spec = {"i": 1 if (m.bg == "forest" and (x + y) % 2) or (x * 7 + y * 3) % 5 == 0 else 0, "h": 124.0, "sway": 0.7, "shadow": true, "dy": -2}
			",":
				spec = {"i": 2, "h": 58.0, "sway": 1.0, "dy": 7}
			"f":
				spec = {"i": 3, "h": 40.0, "sway": 1.6, "dy": -10}
			"r":
				spec = {"i": 4, "h": 56.0, "shadow": true, "dy": -6}
			"s":
				spec = {"i": 5, "h": 70.0, "shadow": true, "dy": -4}
			"F":
				spec = {"i": 13, "h": 56.0, "dy": -6}
			"E":
				spec = {"i": 23, "h": 120.0, "shadow": true, "dy": -4}
			"O":
				spec = {"i": 22, "h": 92.0, "dy": -2}
			"Q":
				spec = {"i": 14, "h": 60.0, "dy": -2, "flat": true}
	else:
		match c:
			"K":
				spec = {"i": 21, "h": 70.0, "dy": -2}
			"S":
				spec = {"i": 16, "h": 100.0, "dy": -2}
			"P", "v":
				spec = {"i": 15, "h": 80.0, "dy": -4}
			"h":
				spec = {"i": 21, "h": 70.0, "dy": -2}
			"b":
				spec = {"i": 18, "h": 72.0, "dy": -2}
			"p":
				spec = {"i": 19, "h": 76.0, "sway": 0.6, "dy": -4}
			"R":
				spec = {"i": 4, "h": 64.0, "shadow": true, "dy": -4}
			"Y":
				spec = {"i": 20, "h": 90.0, "shadow": true, "dy": -4}
	if spec.is_empty():
		return
	var p := Puppet.new()
	if spec.get("flat", false):
		ground.add_child(p)
		p.z_index = 1
	else:
		ents.add_child(p)
	p.setup_atlas("props", spec.i, spec.h, {"breath": 0.0, "sway": spec.get("sway", 0.0), "speed": 0.8 + randf() * 0.4},
		spec.get("shadow", false), Vector2i(4, 6))
	p.position = Vector2(x * T + T / 2.0 + (randf_range(-3, 3) if out else 0.0), y * T + T + spec.dy)
	if c == ",":
		grass[Vector2i(x, y)] = p


func _groups(codes: String, with_door: bool) -> Array:
	var seen := {}
	var list := []
	for y in H:
		for x in W:
			var c := tile(x, y)
			if c == "" or not codes.contains(c) or seen.has(Vector2i(x, y)):
				continue
			var stack := [Vector2i(x, y)]
			var cells := []
			while stack.size():
				var q: Vector2i = stack.pop_back()
				var qc := tile(q.x, q.y)
				if seen.has(q) or (qc != c and not (with_door and qc == "D")):
					continue
				seen[q] = true
				cells.append(q)
				for d in DV.values():
					stack.append(q + d)
			var mn := Vector2i(999, 999)
			var mx := Vector2i(-1, -1)
			for q in cells:
				mn = Vector2i(mini(mn.x, q.x), mini(mn.y, q.y))
				mx = Vector2i(maxi(mx.x, q.x), maxi(mx.y, q.y))
			list.append({"code": c, "pos": mn, "size": mx - mn + Vector2i.ONE})
	return list


func _make_buildings() -> void:
	for b in _groups("HKBCMGT", true):
		var w: float = b.size.x * T
		var h: float = b.size.y * T
		var root := Node2D.new()
		root.position = Vector2(b.pos.x * T + w / 2.0, (b.pos.y + b.size.y) * T - 2)
		ents.add_child(root)
		var sh := Sprite2D.new()
		sh.texture = Puppet._shadow()
		sh.scale = Vector2(w / 128.0 * 1.1, 0.4)
		sh.modulate = Color(0.05, 0.1, 0.08, 0.35)
		root.add_child(sh)
		var s := Sprite2D.new()
		s.texture = Data.tex.props
		s.region_enabled = true
		s.region_rect = Data.cell("props", BLD[b.code])
		s.centered = false
		s.scale = Vector2((w + 8) / 192.0, (h + 28) / 192.0)
		s.position = Vector2(-w / 2.0 - 4, -h - 26)
		root.add_child(s)


func _make_tables() -> void:
	for b in _groups("T", false):
		var s := Sprite2D.new()
		s.texture = Data.tex.props
		s.region_enabled = true
		s.region_rect = Data.tight("props", 17)
		s.centered = false
		var w: float = b.size.x * T
		var h: float = b.size.y * T
		s.scale = Vector2(w / s.region_rect.size.x, (h + 8) / s.region_rect.size.y)
		var root := Node2D.new()
		root.position = Vector2(b.pos.x * T, (b.pos.y + b.size.y) * T - 2)
		s.position = Vector2(0, -h - 6)
		root.add_child(s)
		ents.add_child(root)
		# Capsules belong to their table: draw above its surface, but retain
		# the table's Y-sort order so someone standing in front occludes both.
		if str(Game.g.map) == "lab":
			for starter in STARTERS:
				var cell := Vector2i(starter[0], starter[1])
				if not Rect2i(b.pos, b.size).has_point(cell):
					continue
				if Game.flag("starter") and (starter[2] == int(Game.g.starter) or starter[2] == int(Game.g.rival_starter)):
					continue
				var capsule := Capsule.make("ball", 13.0)
				capsule.name = "StarterCapsule%d" % starter[2]
				capsule.position = Vector2(cell.x * T + T / 2.0, cell.y * T + T * 0.13) - root.position
				root.add_child(capsule)


func _make_heal_balls(n: int) -> void:
	for b in heal_balls:
		b.queue_free()
	heal_balls.clear()
	for i in n:
		var c := Capsule.make("ball", 8.0)
		c.position = Vector2(4 * T + 18 + (i % 3) * 14, 2 * T + 24 + (i / 3) * 12)
		c.z_index = 3
		ground.add_child(c)
		heal_balls.append(c)


# =====================================================================
# 사람들
# =====================================================================
func npc_on(n: NPC) -> bool:
	return not n.gone and ev.cond(n) and not ev.npc_gone(n)


func refresh_npcs() -> void:
	for n in npcs:
		n.visible = npc_on(n)


func npc_at(c: Vector2i) -> NPC:
	for n in npcs:
		if n.visible and n.cell == c:
			return n
	return null


func npc_by_id(id: String) -> NPC:
	for n in npcs:
		if n.id == id:
			return n
	return null


func add_npc(d: Dictionary) -> NPC:
	var n := NPC.new()
	ents.add_child(n)
	d.tmp = true
	n.setup(d)
	n.place(n.cell)
	npcs.append(n)
	return n


func remove_npc(n: NPC) -> void:
	npcs.erase(n)
	n.queue_free()


func passable(c: Vector2i, d: String) -> bool:
	var t := tile(c.x, c.y)
	if t == "":
		return false
	if out:
		if t == "L":
			return d == "down"
		if t == "O":
			return Game.flag("legendQuest")
		return ".,=fQD:".contains(t)
	return ".cmu".contains(t)


func item_at(c: Vector2i) -> Dictionary:
	for it in m.items:
		if int(it.x) == c.x and int(it.y) == c.y and not Game.flag(str(it.flag)):
			return it
	return {}


func free_cell(c: Vector2i, d: String) -> bool:
	return passable(c, d) and npc_at(c) == null and item_at(c).is_empty()


# =====================================================================
# 매 프레임
# =====================================================================
func _process(delta: float) -> void:
	_update_cam(false)
	if busy or moving or Msg.is_open():
		return
	_wander(delta)
	var d := ""
	for k in ["up", "down", "left", "right"]:
		if Input.is_action_pressed("go_" + k):
			d = k
	if d == "":
		_chain = false
		return
	_try_move(d)


func _unhandled_input(e: InputEvent) -> void:
	if busy or moving or Msg.is_open():
		return
	if e.is_action_pressed("a_btn"):
		get_viewport().set_input_as_handled()
		interact()
	elif e.is_action_pressed("menu_btn"):
		get_viewport().set_input_as_handled()
		open_menu()


func _update_cam(instant: bool) -> void:
	if player == null:
		return
	var vs := get_viewport().get_visible_rect().size
	var view_h := vs.y - 300.0          # 아래 패드 위쪽을 화면의 중심 영역으로
	var target := player.position + Vector2(0, -T * 0.4)
	var cx := target.x
	var cy := target.y + (vs.y * 0.5 - view_h * 0.5)
	var mw := W * T
	var mh := H * T
	cx = mw / 2.0 if mw <= vs.x else clampf(cx, vs.x / 2.0, mw - vs.x / 2.0)
	if mh <= view_h:
		cy = mh / 2.0 + (vs.y * 0.5 - view_h * 0.5)
	else:
		cy = clampf(cy, vs.y / 2.0, mh - vs.y / 2.0 + 300.0)
	var want := Vector2(cx, cy)
	cam.position = want if instant else cam.position.lerp(want, 0.18)


func _day_tint() -> void:
	var h: int = Time.get_datetime_dict_from_system().hour
	var c := Color.WHITE
	if out:
		if h >= 20 or h < 4:
			c = Color(0.62, 0.66, 0.9)
		elif h >= 17:
			c = Color(1.0, 0.9, 0.82)
		elif h < 7:
			c = Color(1.0, 0.93, 0.9)
	tint.color = c


func _try_move(d: String) -> void:
	var now := Time.get_ticks_msec() / 1000.0
	if d != player.dir and not _chain:
		_turn_at = now
		player.turn(d)
		return
	if now - _turn_at < 0.09 and not _chain:
		return
	moving = true
	var v: Vector2i = DV[d]
	var to := P + v
	var c := tile(to.x, to.y)
	if c == "":
		var side: String = {"up": "n", "down": "s", "left": "w", "right": "e"}[d]
		var link: String = m.get("links", {}).get(side, "")
		if link != "":
			await _edge_warp(link, side)
		moving = false
		return
	if out and c == "L" and d == "down":
		var ly := to + v
		if passable(ly, "down") and npc_at(ly) == null and item_at(ly).is_empty():
			P = ly
			Sound.sfx("jump")
			await player.hop(_pos(P), d)
			Sound.sfx("land")
			moving = false
			await _on_step()
		else:
			moving = false
		return
	if not free_cell(to, d):
		_chain = false
		Sound.sfx("bump")
		var tw := create_tween()
		tw.tween_property(player.body, "position", Vector2(v) * 5.0, 0.06)
		tw.tween_property(player.body, "position", Vector2.ZERO, 0.12).set_trans(Tween.TRANS_BACK)
		await tw.finished
		moving = false
		return
	var running := Input.is_action_pressed("b_btn") and Game.flag("shoes")
	P = to
	_foot = not _foot
	if grass.has(to):
		_rustle(grass[to], 0.0)
	await player.step(_pos(to), d, 0.12 if running else 0.21, _foot, running)
	if grass.has(to):
		_rustle(grass[to], 0.08)
	moving = false
	_chain = true
	await _on_step()


func _rustle(p: Puppet, delay: float) -> void:
	if delay > 0:
		await get_tree().create_timer(delay).timeout
	p.p("wobble", 0.9)
	p.p("squash", 0.12)
	var tw := create_tween().set_parallel()
	p.tp(tw, "wobble", 0.0, 0.55)
	p.tp(tw, "squash", 0.0, 0.3).set_trans(Tween.TRANS_BACK)
	FX.burst(ents, p.position + Vector2(0, -26), Color(0.7, 0.95, 0.45), Color(0.3, 0.6, 0.25), 6, 160.0, Vector2(0, 380), 0.55, 0.7, 60.0)


func _on_step() -> void:
	Game.g.x = P.x
	Game.g.y = P.y
	Game.g.dir = player.dir
	Game.g.steps = int(Game.g.steps) + 1
	var key := "%d,%d" % [P.x, P.y]
	if m.warps.has(key):
		await do_warp(m.warps[key], tile(P.x, P.y) == "D")
		return
	if await check_trig():
		return
	var tr := _sight_check()
	if tr:
		await run_script(func() -> void: await _trainer_spot(tr))
		return
	if tile(P.x, P.y) == "," and not m.enc.is_empty() and not Game.alive().is_empty() and randf() < 0.11:
		await run_script(_wild)


func do_warp(w: Array, door: bool) -> void:
	busy = true
	pad.release_all()
	Sound.sfx("door" if door else "exit")
	if door:
		# 문 앞에서 한 걸음 들어가며 어두워짐
		create_tween().tween_property(player, "modulate:a", 0.4, 0.3)
	await Game.fade_to(1.0, 0.25)
	player.modulate.a = 1.0
	enter_map(str(w[0]), Vector2i(int(w[1]), int(w[2])), str(w[3]))
	await get_tree().create_timer(0.06).timeout
	await Game.fade_to(0.0, 0.25)
	busy = false
	await check_trig()


func _edge_warp(to: String, side: String) -> void:
	busy = true
	pad.release_all()
	var m2: Dictionary = Data.map(to)
	var h2: int = m2.rows.size()
	var w2: int = str(m2.rows[0]).length()
	var at := P
	match side:
		"n":
			at.y = h2 - 1
		"s":
			at.y = 0
		"e":
			at.x = 0
		"w":
			at.x = w2 - 1
	await Game.fade_to(1.0, 0.25)
	enter_map(to, at, player.dir)
	await Game.fade_to(0.0, 0.25)
	busy = false


func check_trig() -> bool:
	var trig: Array = m.get("trig", [])
	for i in trig.size():
		var t: Dictionary = trig[i]
		if P.x >= int(t.x) and P.x < int(t.x) + int(t.w) and P.y >= int(t.y) and P.y < int(t.y) + int(t.h):
			if t.cond and not ev.trig_cond(m.id, i):
				continue
			await run_script(func() -> void: await ev.trig_run(m.id, i))
			return true
	return false


func _sight_check() -> NPC:
	for n in npcs:
		if not n.visible:
			continue
		var live: bool = (n.info.has("trainer") and n.info.trainer != null and not Game.flag(n.id)) or (n.info.get("sight", false) and n.info.get("trainer") == null)
		if not live:
			continue
		var v: Vector2i = DV[n.dir]
		for i in range(1, 5):
			var c: Vector2i = n.cell + v * i
			if c == P:
				return n
			if not passable(c, n.dir) or npc_at(c) != null or not item_at(c).is_empty():
				break
	return null


func _trainer_spot(n: NPC) -> void:
	var tr = n.info.get("trainer")
	Sound.music(("rival" if tr.cls in ["lass", "girl"] else "trainer") if tr != null else "rival")
	await n.emote("!", 0.6)
	while absi(P.x - n.cell.x) + absi(P.y - n.cell.y) > 1:
		await n.walk_to(n.cell + DV[n.dir], n.dir, 0.24)
	await player.turn(OPP[n.dir])
	if n.info.get("sight", false) and n.info.get("trainer") == null:
		await ev.sight(n)
		return
	await trainer_talk(n)


func trainer_name(n: NPC) -> String:
	var tr: Dictionary = n.info.trainer
	return "%s %s" % [Data.D.tclass[tr.cls].n, tr.name]


func trainer_talk(n: NPC) -> void:
	var tr: Dictionary = n.info.trainer
	for l in tr.intro:
		n.nod()
		await say(l, trainer_name(n))
	var r := await battle({"kind": "trainer", "cls": tr.cls, "name": tr.name, "team": tr.team, "lose": tr.lose, "look": n.look, "bg": m.bg, "npc": n.id})
	if r == "win":
		Game.set_flag(n.id)


func _wild() -> void:
	var enc: Array = m.enc
	var tot := 0.0
	for e in enc:
		tot += float(e[3])
	var r := randf() * tot
	var pick: Array = enc[0]
	for e in enc:
		r -= float(e[3])
		if r < 0:
			pick = e
			break
	await battle({"kind": "wild", "team": [[int(pick[0]), int(pick[1]) + randi() % (int(pick[2]) - int(pick[1]) + 1)]], "bg": m.bg})


func _wander(delta: float) -> void:
	for n in npcs:
		if not n.visible or not n.info.get("wander", 0) or n.busy:
			continue
		n.wait_t -= delta
		if n.wait_t > 0:
			continue
		n.wait_t = randf_range(1.5, 4.5)
		var d: String = DV.keys().pick_random()
		var to: Vector2i = n.cell + DV[d]
		if absi(to.x - n.home.x) > 2 or absi(to.y - n.home.y) > 2 or not passable(to, d) or "DLm".contains(tile(to.x, to.y)) \
				or npc_at(to) != null or not item_at(to).is_empty() or to == P:
			n.face(d)
			continue
		n.walk_to(to, d, 0.4)


# =====================================================================
# 조사하기
# =====================================================================
func interact() -> void:
	var v: Vector2i = DV[player.dir]
	var f := P + v
	var c := tile(f.x, f.y)
	var n := npc_at(f)
	if n == null and c == "K":
		n = npc_at(f + v)
	if n:
		if n.busy:
			return
		await run_script(func() -> void: await _talk_npc(n))
		return
	var it := item_at(f)
	if not it.is_empty():
		await run_script(func() -> void:
			Game.set_flag(str(it.flag))
			if item_nodes.has(f):
				var node: Node2D = item_nodes[f]
				item_nodes.erase(f)
				var tw := node.create_tween()
				tw.tween_property(node, "position:y", node.position.y - 30, 0.15)
				tw.parallel().tween_property(node, "scale", Vector2(1.3, 1.3), 0.15)
				tw.tween_property(node, "modulate:a", 0.0, 0.15)
				tw.tween_callback(node.queue_free)
			await give_item(str(it.item), int(it.n)))
		return
	var key := "%d,%d" % [f.x, f.y]
	if m.obj.has(key):
		var ob = m.obj[key]
		await run_script(func() -> void:
			if ob is String and ob == "@fn":
				await ev.obj(m.id, key)
			else:
				await Msg.talk(ob))
		return
	if c == "s" and m.signs.has(key):
		var s: Array = m.signs[key]
		await run_script(func() -> void: await Msg.talk(s))
		return
	if c == "P":
		await run_script(func() -> void: await Menus.pc_menu(self))
		return
	if DEF_TEXT.has(c):
		await run_script(func() -> void: await Msg.talk(DEF_TEXT[c]))


func _talk_npc(n: NPC) -> void:
	var d0 := n.dir
	await n.face(OPP[player.dir])
	var b0 := battles
	var m0: String = m.id
	talking = n
	if ev.subst_of(n).size():
		await ev.subst_talk(n)
	elif n.info.get("trainer") != null and not Game.flag(n.id):
		await trainer_talk(n)
	elif n.info.get("trainer") != null:
		await Msg.talk(n.info.trainer.after, trainer_name(n))
	elif n.info.get("talk", false):
		await ev.talk(n)
	else:
		for l in n.info.get("text", []):
			n.nod()
			await say(str(l), str(n.info.get("name", "")))
	if battles == b0 and m.id == m0 and is_instance_valid(n) and npc_on(n):
		await ev.fight_choice(n)
	talking = null
	if is_instance_valid(n) and n.info.get("wander", 0):
		n.face(d0)


func run_script(f: Callable) -> void:
	busy = true
	pad.release_all()
	await f.call()
	Msg.hide_box()
	refresh_npcs()
	busy = false


# =====================================================================
# 이벤트 도우미
# =====================================================================
func say(t: String, who := "") -> void:
	await Msg.say(t, who)


func ask(t: String, opts: Array, who := "", start := 0) -> int:
	return await Msg.ask(t, opts, who, start)


func sleep(s: float) -> void:
	await get_tree().create_timer(s).timeout


func walk_npc(n: NPC, dirs: Array, dur := 0.26) -> void:
	for d in dirs:
		await n.walk_to(n.cell + DV[d], d, dur)


func walk_player(dirs: Array) -> void:
	for d in dirs:
		_foot = not _foot
		P = P + DV[d]
		await player.step(_pos(P), d, 0.23, _foot, false)
	Game.g.x = P.x
	Game.g.y = P.y


func emote(who, kind := "!") -> void:
	if who is NPC:
		await who.emote(kind)
	else:
		Sound.sfx("sel")
		await Emote.pop(player, kind, -player.height - 70, 0.5, player.body)


func give_item(id: String, n := 1) -> void:
	var it: Dictionary = Data.D.items[id]
	Game.g.bag[id] = int(Game.g.bag.get(id, 0)) + n
	sparkle_player()
	await Sound.jingle("key" if it.p == "key" else "item")
	var nm: String = Game.g.name
	await say("%s %s 손에 넣었다!" % [Game.josa(nm, "은"), ("%s %d개를" % [it.n, n]) if n > 1 else Game.josa(it.n, "을")])
	if it.p != "key":
		var pocket := ""
		for p in Data.D.pockets:
			if p[0] == it.p:
				pocket = p[1]
		await say("%s %s 가방의 %s 주머니에 넣었다." % [Game.josa(nm, "은"), Game.josa(it.n, "을"), pocket])


func sparkle_player() -> void:
	FX.burst(ents, player.position + Vector2(0, -60), Color(1, 1, 0.75), Color(1, 0.85, 0.3), 14, 180.0, Vector2(0, -60), 0.7, 0.8, 180.0)


func heal_party() -> void:
	Game.heal_party()


func fade(a: float, dur := 0.35) -> void:
	await Game.fade_to(a, dur)


func nickname_prompt(mon: Dictionary) -> void:
	var s: Dictionary = Game.sp(mon.sid)
	var r := await ask("%s에게 이름을 붙여 주시겠습니까?" % s.n, ["예", "아니오"])
	if r != 0:
		return
	var v := await Msg.name_input("%s의 이름은?" % s.n, "", 6, [], true)
	if v != "" and v != s.n:
		mon.nick = v


func banner(t: String) -> void:
	var vs := get_viewport().get_visible_rect().size
	var p := UI.panel(ui, Rect2(vs.x / 2 - 210, -90, 420, 80), Color(0.98, 0.96, 0.88))
	var l := UI.label(p, t, Vector2(0, 14), 32)
	l.size = Vector2(420, 50)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var tw := p.create_tween()
	tw.tween_property(p, "position:y", 110.0, 0.4).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(1.4)
	tw.tween_property(p, "position:y", -100.0, 0.3).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	tw.tween_callback(p.queue_free)


func heal_anim() -> void:
	for i in Game.g.party.size():
		_make_heal_balls(i + 1)
		var b: Node2D = heal_balls[i]
		Sound.sfx("click")
		b.scale = Vector2(0.2, 0.2)
		b.create_tween().tween_property(b, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK)
		await sleep(0.26)
	for k in 6:
		for b in heal_balls:
			b.modulate = Color(1.6, 1.6, 1.2) if k % 2 == 0 else Color.WHITE
		await sleep(0.14)
	_make_heal_balls(0)


# ---------------- 전투 ----------------
func battle(o: Dictionary) -> String:
	battles += 1
	if o.kind != "wild" and not o.has("npc") and talking and not talking.is_mon() and talking.id != "tw_guard":
		o.npc = talking.id
	if not o.has("bg"):
		o.bg = m.bg
	var was_busy := busy
	busy = true
	pad.release_all()
	pad.visible = false
	menu_btn.visible = false
	await _encounter_flash(o)
	var b := Battle.new()
	add_child(b)
	var r: String = await b.run(o, self)
	var leveled: Array = b.leveled
	b.queue_free()
	Msg.place("field")
	if r == "lose" and not o.get("no_lose", false):
		Game.heal_party()
		var hp: Dictionary = Game.g.heal
		enter_map(str(hp.map), Vector2i(int(hp.x), int(hp.y)), "up", {"quiet": true})
		await Game.fade_to(0.0, 0.4)
		pad.visible = true
		menu_btn.visible = true
		if hp.map == "home":
			if Game.flag("cap_mom"):
				await say("%s, 쓰러져서 실려 왔다며? 아줌마가 푹 쉬게 해 줬단다." % Game.josa(Game.g.name, "아"), "옆집 아주머니")
			else:
				await say("%s! 무사했구나... 푹 쉬었으니 이제 괜찮을 거야." % Game.g.name, "엄마")
		else:
			await say("기다리셨습니다! 맡겨 주신 몬스터는 모두 건강해졌어요.", "간호사")
		await say("몬스터들이 기운을 되찾았다! 무리하지 말고 다시 원정을 떠나자.")
		busy = was_busy
		return r
	if r == "lose":
		Game.heal_party()
	Sound.music(str(m.get("music", "")))
	refresh_npcs()
	await Game.fade_to(0.0, 0.3)
	pad.visible = true
	menu_btn.visible = true
	for mon in leveled:
		if Game.g.party.has(mon) and Game.sp(mon.sid).has("ev") and int(mon.lv) >= int(Game.sp(mon.sid).ev[0]) and mon.hp > 0:
			await Menus.evolve(mon)
	busy = was_busy
	return r


func _encounter_flash(o: Dictionary) -> void:
	var fl := ColorRect.new()
	fl.set_anchors_preset(Control.PRESET_FULL_RECT)
	fl.color = Color(1, 1, 1, 0)
	fl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(fl)
	var tw := create_tween()
	for i in 2:
		tw.tween_property(fl, "color:a", 0.85, 0.07)
		tw.tween_property(fl, "color:a", 0.0, 0.1)
	var big: bool = o.get("cls", "") in ["leader", "rival", "boss"]
	tw.parallel().tween_property(cam, "zoom", Vector2(1.35, 1.35), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.parallel().tween_property(cam, "rotation", 0.25 if o.kind == "wild" else -0.15, 0.35)
	await tw.finished
	if big:
		# 관장·라이벌: 이름 띠가 가로질러 지나간다
		var vs := get_viewport().get_visible_rect().size
		var band := ColorRect.new()
		band.color = Color(0.89, 0.34, 0.44)
		band.size = Vector2(vs.x, 110)
		band.position = Vector2(vs.x, vs.y * 0.45)
		ui.add_child(band)
		var title: String = {"leader": "관장 ", "rival": "라이벌 ", "boss": ""}.get(o.cls, "") + str(o.get("name", ""))
		var l := UI.label(band, title, Vector2(0, 26), 48, Color.WHITE)
		l.size.x = vs.x
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.add_theme_constant_override("outline_size", 10)
		l.add_theme_color_override("font_outline_color", Color(0.4, 0.1, 0.15))
		var bt := create_tween()
		bt.tween_property(band, "position:x", 0.0, 0.25).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_OUT)
		bt.tween_interval(0.7)
		await bt.finished
		band.queue_free()
	await Game.fade_to(1.0, 0.18)
	fl.queue_free()
	cam.zoom = Vector2.ONE
	cam.rotation = 0


# ---------------- 메뉴 ----------------
func open_menu() -> void:
	if busy or moving or Msg.is_open():
		return
	await run_script(func() -> void: await Menus.main_menu(self))


func credits(final: bool) -> void:
	await Menus.credits(self, final)
