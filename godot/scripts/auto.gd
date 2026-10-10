extends Node
## Production automation; never enables the developer's auto_text shortcut.
var world: World
var active_battle: Battle
var mode := ""
var last_dir := ""
var pending_dir := ""
var controls: CanvasLayer
var buttons := {}

func fight_enabled() -> bool:
	return int(Game.settings.get("autoBattle",0)) != 0 or mode != ""

func talk_enabled() -> bool:
	return mode != "" or (is_instance_valid(active_battle) and fight_enabled())

func bind_world(value: World) -> void:
	world = value
	stop()
	if controls:
		controls.queue_free()
	controls = CanvasLayer.new()
	controls.layer = 85
	add_child(controls)
	for key in ORDER:
		buttons[key] = _round_button(key)
	buttons.battle.pressed.connect(func() -> void:
		await Guides.show_once("battle")
		Game.settings.autoBattle = 0 if int(Game.settings.get("autoBattle",0)) else 1
		Game.save_settings())
	buttons.tower.pressed.connect(func() -> void: world.run_script(go_tower))
	buttons.hunt.pressed.connect(func() -> void:
		if mode == "hunt":
			stop()
		else:
			start_hunt())
	buttons.climb.pressed.connect(func() -> void: world.run_script(climb))
	buttons.stop.pressed.connect(stop)

## 웹 버전처럼 화면 오른쪽 위에 동그란 버튼을 세로 한 줄로 (메뉴 버튼 아래)
const ORDER := ["tower", "hunt", "battle", "climb", "stop"]
const ROUND := 84.0
const COLORS := {"tower": Color(0.62, 0.5, 0.9), "hunt": Color(0.36, 0.66, 0.36), "battle": Color(0.93, 0.62, 0.22),
	"climb": Color(0.45, 0.42, 0.78), "stop": Color(0.82, 0.32, 0.36)}
const ON_COLOR := Color(1.0, 0.8, 0.22)

func _round_button(key: String) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.size = Vector2(ROUND, ROUND)
	b.add_theme_font_size_override("font_size", 19)
	b.add_theme_constant_override("outline_size", 5)
	b.add_theme_constant_override("line_spacing", -4)
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(k, Color.WHITE)
	controls.add_child(b)
	_paint(b, COLORS[key])
	return b

func _paint(b: Button, col: Color) -> void:
	if b.get_meta("col", Color.BLACK) == col:
		return
	b.set_meta("col", col)
	b.add_theme_color_override("font_outline_color", col.darkened(0.6))
	for st in ["normal", "hover", "pressed", "focus"]:
		var box := UI.box(col.lightened(0.12) if st == "hover" else col.darkened(0.12) if st == "pressed" else col, Color(0.17, 0.18, 0.27), int(ROUND / 2), 4)
		box.set_content_margin_all(4)
		b.add_theme_stylebox_override(st, box)

func stop() -> void:
	mode = ""
	last_dir = ""
	pending_dir = ""

func _process(_delta: float) -> void:
	if not is_instance_valid(world):
		stop()
		if controls: controls.visible = false
		return
	var screen := get_viewport().get_visible_rect().size
	var battling := is_instance_valid(active_battle)
	# 걷는 중에도 버튼은 그대로 둔다. 대화·메뉴·이벤트 중에만 가린다
	var shown := not world.busy and not Msg.is_open()
	var free := shown and not world.moving
	var unlocked := Game.flag("pad")
	controls.visible = Guides.overlay == null
	var in_tower := str(Game.g.map) in ["towerLobby","towerFloor"]
	var vis := {
		"tower": shown and unlocked and not in_tower and mode == "",
		"hunt": shown and unlocked and not in_tower and (mode == "hunt" or not world.m.enc.is_empty()),
		"battle": battling or (shown and unlocked),
		"climb": shown and str(Game.g.map) == "towerFloor" and mode == "",
		"stop": mode != "" and (shown or battling),
	}
	var texts := {"tower": "탑", "hunt": "자동\n사냥", "climb": "자동\n등반", "stop": "자동\n중지",
		"battle": "자동\n진행중" if mode != "" else ("자동전투\nON" if fight_enabled() else "자동\n전투")}
	var y := 20.0 if battling else 108.0
	for key in ORDER:
		var b: Button = buttons[key]
		b.visible = vis[key]
		if not b.visible:
			continue
		b.text = texts[key]
		var on: bool = (key == "battle" and fight_enabled()) or (key == "hunt" and mode == "hunt")
		_paint(b, ON_COLOR if on else COLORS[key])
		b.size = Vector2(ROUND, ROUND)
		b.position = Vector2(screen.x - ROUND - 16, y)
		y += ROUND + 12
	if free and mode == "hunt":
		if party_ratio() < 0.35 or Game.alive().is_empty() or world.m.enc.is_empty():
			stop()
			world.run_script(func() -> void: await Msg.say("체력이나 사냥 장소를 확인해 주세요. 자동 사냥을 멈췄어요."))
			return
		var direction := pending_dir if pending_dir != "" else grass_step()
		if direction == "":
			stop()
			world.run_script(func() -> void: await Msg.say("이동할 수 있는 풀숲이 없어서 자동 사냥을 멈췄어요."))
		else:
			pending_dir = direction
			world._try_move(direction)
			if world.moving:
				last_dir = direction
				pending_dir = ""

func _input(event: InputEvent) -> void:
	if mode == "": return
	for action in ["go_up","go_down","go_left","go_right","b_btn","menu_btn"]:
		if event.is_action_pressed(action):
			stop()
			if is_instance_valid(active_battle):
				get_viewport().set_input_as_handled()
			return

func party_ratio() -> float:
	var hp := 0.0
	var maximum := 0.0
	for mon in Game.g.party:
		hp += maxf(0,mon.hp)
		maximum += Game.max_hp(mon)
	return hp / maximum if maximum > 0 else 0.0

func start_hunt() -> void:
	if world.busy or world.moving: return
	if world.m.enc.is_empty() or party_ratio() < 0.35:
		world.run_script(func() -> void: await Msg.say("야생 몬스터가 나오는 곳에서 동료를 회복시킨 뒤 사용해 주세요."))
		return
	world.run_script(func() -> void:
		await Guides.show_once("auto")
		mode = "hunt")

func grass_step() -> String:
	var start := world.P
	var queue: Array = [start]
	var visited := {start:""}
	var at := 0
	while at < queue.size() and at < 900:
		var cell: Vector2i = queue[at]
		at += 1
		if cell != start and world.tile(cell.x,cell.y) == ",":
			return str(visited[cell])
		var directions: Array = ["left","right","up","down"]
		if world.tile(start.x,start.y) == "," and last_dir != "":
			directions.erase(World.OPP[last_dir])
			directions.push_front(World.OPP[last_dir])
		for direction in directions:
			var next: Vector2i = cell + World.DV[direction]
			if visited.has(next) or not world.passable(next,direction) or world.npc_at(next) != null or not world.item_at(next).is_empty():
				continue
			# Never walk through warps, scripted triggers, ledges or map edges.
			if world.tile(next.x,next.y) in ["D","L","O","Q"] or world.m.warps.has("%d,%d" % [next.x,next.y]):
				continue
			var scripted := false
			var triggers: Array = world.m.get("trig", [])
			for i in triggers.size():
				var trigger: Dictionary = triggers[i]
				if Rect2i(int(trigger.x),int(trigger.y),int(trigger.w),int(trigger.h)).has_point(next) and (not trigger.cond or world.ev.trig_cond(world.m.id,i)):
					scripted = true
			if scripted: continue
			if cell == start and world.tile(start.x,start.y) == "," and world.tile(next.x,next.y) != ",":
				continue
			visited[next] = direction if cell == start else visited[cell]
			queue.append(next)
	return ""

func go_tower() -> void:
	await Guides.show_once("tower")
	if await Msg.ask("무한의 탑으로 이동할까요? 나올 때 지금 자리로 돌아와요.", ["이동한다","그만둔다"]) != 0:
		return
	Game.g.towerRet = {"map":Game.g.map,"x":world.P.x,"y":world.P.y,"dir":world.player.dir}
	await world.do_warp(["towerLobby",5,8,"up"],false)

func climb() -> void:
	await Guides.show_once("auto")
	if Game.alive().is_empty():
		await Msg.say("먼저 동료를 회복시켜 주세요.")
		return
	if str(Game.g.map) == "towerLobby":
		await world.ev.talk_tw_rec(null)
	if str(Game.g.map) != "towerFloor":
		return
	mode = "climb"
	while mode == "climb" and str(Game.g.map) == "towerFloor":
		var guardian := world.npc_by_id("tw_guard")
		if guardian and guardian.visible:
			await world.ev.talk_tw_guard(guardian)
		if mode != "climb" or str(Game.g.map) != "towerFloor" or int(world.ev.tower().cur) >= 100:
			break
		await get_tree().create_timer(0.35).timeout
		if mode == "climb":
			await world.ev.trig_towerFloor_0()
	stop()

func move_index(mon: Dictionary, foe: Dictionary):
	var usable: Array = []
	var attacks: Array = []
	for i in mon.moves.size():
		var slot: Dictionary = mon.moves[i]
		if int(slot.pp) <= 0: continue
		usable.append(i)
		var move: Dictionary = Data.move(slot.id)
		var effect := Data.eff(move.t,Game.sp(foe.sid).t) if not foe.is_empty() else 1.0
		if int(move.p) <= 0 or effect <= 0: continue
		var stab := 1.5 if Game.sp(mon.sid).t.has(move.t) else 1.0
		attacks.append({"index":i,"effect":effect,"score":float(move.p)*effect*stab*(float(move.a) if int(move.a) else 100.0)/100.0})
	if usable.is_empty(): return "struggle"
	if attacks.is_empty(): return usable[0]
	var effective := attacks.filter(func(a: Dictionary) -> bool: return a.effect > 1)
	var pool: Array = effective if not effective.is_empty() else attacks
	pool.sort_custom(func(a: Dictionary,b: Dictionary) -> bool: return a.score > b.score)
	return pool[0].index

func answer(text: String, options: Array):
	if not talk_enabled(): return null
	if "다음 몬스터" in text or "직접 맞서" in text or "포기하겠습니까" in text: return 0
	if "교체하겠습니까" in text or "배우게 하겠습니까" in text or "이름을 붙여" in text: return options.size()-1
	return null
