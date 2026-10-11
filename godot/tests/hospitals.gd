extends Node

var failed := false
const TOWNS := ["city", "town2", "town3", "town4", "town5"]

func check(ok: bool, message: String) -> void:
	if not ok:
		failed = true
		push_error(message)

func _ready() -> void:
	get_tree().create_timer(900).timeout.connect(func() -> void:
		push_error("Hospital regression timed out")
		get_tree().quit(1))
	Game.settings.tips = 0
	Game.settings.anim = 0
	Game.auto_text = true
	Engine.time_scale = 6.0
	Game.new_game("병원검증")
	var world := World.new()
	add_child(world)
	world.set_process(false)
	world.busy = true
	check(not JSON.stringify(Data.D).contains("관측 캠프") and not JSON.stringify(Data.D).contains("캠프 의무원"), "Old hospital names remain in character records or dialogue")
	Game.g.heal = {"map":"lab", "x":5, "y":8}
	check(Game.recovery_point().map == "lab", "Before the first city, laboratory recovery must remain available")
	Game.g.towerRet = {"map":"lab", "x":5, "y":8, "dir":"up"}
	world.enter_map("towerLobby", Vector2i(5,8), "up", {"quiet":true})
	check(Game.recovery_point().map == "lab", "Early tower shortcut must not register a future town hospital")
	world.enter_map("lab", Vector2i(5,8), "up", {"quiet":true})
	for i in 5:
		Game.new_game("기존일지")
		Game.g.map = TOWNS[i]
		Game.g.heal = {"map":"lab", "x":5, "y":8}
		var old_save: Dictionary = Game.g.duplicate(true)
		Game.load_save(old_save)
		check(Game.recovery_point().map == "center%d" % (i+1), "Legacy town save did not migrate to hospital")
		world.enter_map(TOWNS[i], Vector2i(10,10), "down", {"quiet":true})
		Game.g.party = [Game.make_mon(10, 1)]
		Game.g.party[0].hp = 1
		var state := {"done":false, "result":""}
		lose_battle(world, state)
		while not is_instance_valid(Auto.active_battle): await get_tree().process_frame
		Auto.active_battle.hero_used = true
		while not state.done: await get_tree().process_frame
		check(state.result == "lose", "Defeat scenario did not lose")
		check(Game.g.map == "center%d" % (i+1), "Actual defeat did not return to the current town's hospital")
		check(world.P == Vector2i(6,4) and world.passable(world.P, "up") and world.npc_at(world.P) == null, "Hospital recovery cell is blocked")
		check(Game.g.party[0].hp == Game.max_hp(Game.g.party[0]), "Defeated party was not healed")
		check(world.m.name == "병원", "Hospital display name incorrect")
		await capture("hospital-%d" % (i+1))
		var hospital: String = Game.recovery_point().map
		world.enter_map("home", Vector2i(4,6), "up", {"quiet":true})
		Game.g.heal = {"map":"home", "x":4, "y":6}
		check(Game.recovery_point().map == hospital, "Returning home must not erase hospital registration")
		# 옛 크기의 관측소 맨 아래에서 저장했어도 새 방 입구로 복원한다.
		world.enter_map("gym%d" % (i+1), Vector2i(6,14), "up", {"quiet":true})
		check(world.W == 8 and world.H == 7 and world.P == Vector2i(3,5), "Shrunk station/save position migration incorrect")
		check(world.npcs.size() == 1 and world.npcs[0].id == "leader%d" % (i+1), "Station must contain only its officer")
		check(world.m.obj.is_empty() and world.m.items.is_empty() and world.m.trig.is_empty(), "Obsolete station objects remain")
		check(reachable(world, world.P, world.npcs[0].cell + Vector2i.DOWN), "Officer cannot be reached from the door")
		await capture("station-%d" % (i+1))
		Game.g.party = [Game.make_mon(19,100)]
		await world.ev.talk(world.npcs[0])
		check(int(Game.g.badges[i]) == 1, "Officer victory failed to register station certification")
		world.P = Vector2i(3,6)
		await world._on_step()
		check(Game.g.map == TOWNS[i], "Station exit warp broken")
		print("[hospitals] city ", i+1, " defeat, legacy save, officer certification, exit passed")
	Game.new_game("길의기존일지")
	Game.g.map = "route4"
	Game.load_save(Game.g.duplicate(true))
	check(Game.recovery_point().map == "center3", "Legacy route save has no regional hospital fallback")
	world.enter_map("town4", Vector2i(10,10), "down", {"quiet":true})
	world.enter_map("route4", Vector2i(10,10), "down", {"quiet":true})
	check(Game.recovery_point().map == "center4", "Travel must keep the most recently visited town hospital")
	Game.g.towerRet = {"map":"route4", "x":10, "y":10, "dir":"down"}
	world.enter_map("towerLobby", Vector2i(5,8), "up", {"quiet":true})
	check(Game.recovery_point().map == "center4", "Tower shortcut changed the visited town hospital")
	Msg.hide_box()
	world.queue_free()
	await get_tree().process_frame
	print("HOSPITALS_", "FAIL" if failed else "PASS")
	get_tree().quit(1 if failed else 0)

func lose_battle(world: World, state: Dictionary) -> void:
	state.result = await world.battle({"kind":"trainer", "name":"검증", "team":[[22,100]], "bg":"rock"})
	state.done = true

func reachable(world: World, from: Vector2i, to: Vector2i) -> bool:
	var queue := [from]
	var seen := {from:true}
	while not queue.is_empty():
		var p: Vector2i = queue.pop_front()
		if p == to: return true
		for d in World.DV:
			var q: Vector2i = p + World.DV[d]
			if not seen.has(q) and world.passable(q, d) and world.npc_at(q) == null:
				seen[q] = true
				queue.append(q)
	return false

func capture(label: String) -> void:
	if not "--capture" in OS.get_cmdline_user_args(): return
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://.godot/%s.png" % label)
