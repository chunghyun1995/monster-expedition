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
	for key in ["battle","tower","hunt","climb","stop"]:
		var b := UI.button(controls, "", Rect2(0,0,176,72), Color(0.28,0.46,0.53), 24)
		buttons[key] = b
	buttons.battle.pressed.connect(func() -> void:
		await Guides.show_once("battle")
		Game.settings.autoBattle = 0 if int(Game.settings.get("autoBattle",0)) else 1
		Game.save_settings())
	buttons.tower.pressed.connect(func() -> void: world.run_script(go_tower))
	buttons.hunt.pressed.connect(start_hunt)
	buttons.climb.pressed.connect(func() -> void: world.run_script(climb))
	buttons.stop.pressed.connect(stop)

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
	var free := not world.busy and not world.moving and not Msg.is_open()
	var unlocked := Game.flag("pad")
	controls.visible = Guides.overlay == null
	buttons.battle.visible = battling or (free and unlocked)
	buttons.battle.position = Vector2(screen.x-192,164) if battling else Vector2(16,20)
	buttons.battle.text = "자동전투\n" + ("켜짐" if fight_enabled() else "꺼짐")
	var in_tower := str(Game.g.map) in ["towerLobby","towerFloor"]
	buttons.tower.visible = free and unlocked and not in_tower and mode == ""
	buttons.hunt.visible = free and unlocked and not in_tower and mode == ""
	buttons.climb.visible = free and in_tower and mode == ""
	var width := (screen.x - 64) / 3.0
	for i in 3:
		var key: String = ["tower","hunt","climb"][i]
		buttons[key].position = Vector2(16+i*(width+16),120)
		buttons[key].size = Vector2(width,72)
	buttons.tower.text = "무한의 탑"
	buttons.hunt.text = "자동 사냥"
	buttons.climb.text = "자동 등반"
	buttons.stop.visible = mode != ""
	buttons.stop.text = "자동 중지"
	buttons.stop.position = Vector2(screen.x-192,248 if battling else 120)
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
