extends Node
var failed := false

func check(ok: bool, message: String) -> void:
	if not ok:
		failed = true
		push_error(message)

func _ready() -> void:
	get_tree().create_timer(180).timeout.connect(func() -> void:
		push_error("Regression timed out")
		get_tree().quit(1))
	await get_tree().process_frame
	Game.new_game("별")
	var world := World.new()
	add_child(world)
	world.set_process(false)
	world.busy = true
	for screen in [Vector2i(720,1280), Vector2i(720,1560)]:
		get_window().size = screen
		get_window().content_scale_size = screen
		await get_tree().process_frame
		Msg.place("field")
		check(Msg.box.get_rect().end.y + 12 <= TouchPad.reserved_top(Msg.vs()), "Dialogue overlaps virtual control touch targets")
		check(Msg.name_tag.position.y >= 0, "Speaker tag outside viewport")
	world.enter_map("lab", Vector2i(5,10), "up", {"quiet":true})
	await get_tree().process_frame
	var capsules := world.ents.find_children("StarterCapsule*", "", true, false)
	check(capsules.size() == 3, "Three starter capsules must be on laboratory table")
	for c in capsules:
		check(c.get_parent().get_parent() == world.ents, "Starter capsule must inherit table Y-sort")
		check(c.z_index == 0 and c.is_visible_in_tree(), "Starter capsule hidden or detached")
		check(c.get_parent().get_child(0) is Sprite2D, "Capsule must draw after table sprite")
	check(world.player.front.size.y == 90 and world.player.back.size.y == 90, "Player proportions must use NPC chibi atlas")
	print("[regression] field layout, laboratory equipment and proportions")
	for direction in ["down","up","left","right"]:
		await world.player.step(world.player.position + Vector2(8,0), direction, 0.05, true, false)
		check(is_zero_approx(float(world.player.cur().g("walk"))), "Walk animation did not stop")
		await world.player.throw_pose()
		check(is_zero_approx(float(world.player.cur().g("arm_throw"))), "Throw animation did not reset")
	await world.player.hop(world.player.position + Vector2(8,0), "down")
	check(world.player.body.position == Vector2.ZERO, "Hop did not restore foot anchor")
	world.enter_map("home", Vector2i(7,3), "down", {"quiet":true})
	await Msg.say("별아! 한결 조사관이 다음 현장 기록을 기다리고 있단다.", "엄마", {"nowait":true, "keep":true})
	await capture("dialogue")
	Msg._waiting = true
	world.pad._assign(98, "a_btn")
	Input.flush_buffered_events()
	await get_tree().process_frame
	check(not Msg._waiting, "Virtual A must advance dialogue")
	world.pad._assign(98, "")
	Msg.hide_box()
	world.enter_map("lab", Vector2i(5,8), "up", {"quiet":true})
	await capture("lab")
	Game.g.flags["starter"] = true
	Game.g.starter = 10
	Game.g.rival_starter = 15
	world.enter_map("lab", Vector2i(5,8), "up", {"quiet":true})
	await get_tree().process_frame
	check(world.ents.find_children("StarterCapsule*", "", true, false).size() == 2, "Only selected survey partner should disappear on re-entry")
	world.enter_map("town", Vector2i(8,8), "down", {"quiet":true})
	await capture("proportions")
	Menus.license_notice()
	await get_tree().process_frame
	await capture("licenses")
	var notices := Menus.get_child(Menus.get_child_count() - 1)
	var close := notices.find_children("*", "Button", true, false)
	check(close.size() == 1, "License viewer close button missing")
	if not close.is_empty():
		close[0].pressed.emit()
	await get_tree().process_frame
	for filename in ["Android-NOTICE.txt", "Apache-2.0.txt", "JSpecify-LICENSE.txt", "Kotlin-LICENSE.txt", "Coroutines-LICENSE.txt"]:
		check(FileAccess.get_file_as_string("res://licenses/" + filename).length() > 100, "Bundled licence missing: " + filename)
	await test_resonance(world)
	await test_restored_features(world)
	print("GODOT_REGRESSION_", "FAIL" if failed else "PASS")
	for node in Sound.get_children():
		if node is AudioStreamPlayer:
			node.stop()
	world.queue_free()
	await get_tree().process_frame
	await get_tree().create_timer(0.1).timeout
	get_tree().quit(1 if failed else 0)

func capture(label: String) -> void:
	if not "--capture" in OS.get_cmdline_user_args():
		return
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	var err := get_viewport().get_texture().get_image().save_png("res://.godot/regression-%s.png" % label)
	check(err == OK, "Could not save screenshot")

func test_resonance(world: World) -> void:
	var previous_party: Array = Game.g.party
	world.pad.visible = false
	world.menu_btn.visible = false
	Game.g.party = [Game.make_mon(10, 12)]
	var battle := Battle.new()
	add_child(battle)
	battle.w = world
	battle.o = {"kind":"wild", "bg":"forest"}
	battle.wild = true
	battle.foe = [Game.make_mon(33, 12)]
	battle.VS = Msg.vs()
	battle.SH = battle.VS.y - 520.0
	battle.ME_POS = Vector2(battle.VS.x * 0.26, battle.SH * 0.84)
	battle.FOE_POS = Vector2(battle.VS.x * 0.74, battle.SH * 0.84)
	battle._build()
	battle.fp = battle._new_mon_pup(battle.fm(), false, battle.FOE_POS)
	battle.pp = battle._new_mon_pup(battle.pm(), false, battle.ME_POS)
	battle.make_hud("e")
	battle.make_hud("p")
	Msg.place("battle")
	await get_tree().create_timer(0.4).timeout
	await capture("battle-new-layout")
	for grade in [0, 3]:
		var cap := await battle._capsule_throw(battle.fp, "ball", grade)
		check(battle.fp.visible and battle.fp.scale == Vector2.ONE, "Resonance must leave creature visible at full scale")
		check(battle.stage.find_children("*", "ProgressBar", true, false).is_empty(), "Resonance meter not cleaned up")
		if is_instance_valid(cap): cap.queue_free()
	check(battle.resonance_probability(1, 100, 100, 1.5, 1.0) > battle.resonance_probability(100, 100, 100, 1.0, 1.0), "Resonance calm/gear effect missing")
	battle.queue_free()
	Game.g.party = previous_party
	Msg.place("field")
	world.pad.visible = true
	world.menu_btn.visible = true
	await get_tree().process_frame
	print("[regression] resonance success/failure, visible creature and licence payload")

func test_restored_features(world: World) -> void:
	var previous_seen := Guides.seen.duplicate(true)
	var previous_tips: int = Game.settings.tips
	Game.settings.tips = 1
	Guides.seen.clear()
	Guides.show_once("bag")
	await get_tree().process_frame
	await get_tree().process_frame
	check(Guides.overlay != null, "First-use tooltip missing")
	await capture("tooltip")
	var event := InputEventAction.new()
	event.action = "a_btn"
	event.pressed = true
	Guides._input(event)
	await get_tree().process_frame
	await get_tree().process_frame
	check(Guides.seen.has("bag") and not Guides.should_show("bag"), "Tooltip must be shown once")
	var config := ConfigFile.new()
	config.load(Guides.PATH)
	check(config.get_value("guides","seen",{}).has("bag"), "Tooltip history not persisted")
	Guides.reset_all()
	check(Guides.should_show("bag"), "Tooltip reset failed")
	Game.settings.tips = 0
	check(not Guides.should_show("bag"), "Tooltip disable failed")
	Game.settings.tips = 1
	for id in Guides.TEXT: Guides.seen[id] = true

	var mom := 0
	for key in Data.D.species:
		if str(Data.D.species[key].get("human","")) == "mom": mom = int(key)
	check(mom > 0, "Mother species missing")
	var mon := Game.make_mon(mom,10)
	var old_party: Array = Game.g.party
	Game.g.party = [mon]
	var canvas := CanvasLayer.new()
	canvas.layer = 61
	add_child(canvas)
	var root := Control.new()
	canvas.add_child(root)
	var ctx := {"root":root,"lst":[mon],"cur":0,"page":0,"done":false}
	for screen in [Vector2i(540,1170),Vector2i(720,1280),Vector2i(720,1560)]:
		get_window().size = screen
		get_window().content_scale_size = screen
		await get_tree().process_frame
		Menus._sum_render(ctx)
		await get_tree().process_frame
		await get_tree().process_frame
		var labels := root.find_children("WrappedDescription","Label",true,false)
		check(labels.size() == 1, "Summary bounded description missing")
		if not labels.is_empty():
			check(labels[0].size.x <= labels[0].get_parent().size.x, "Summary text overflows horizontally")
		for button in root.find_children("*","Button",true,false):
			check(button.position.x >= 0 and button.get_rect().end.x <= screen.x, "Summary button outside viewport")
		await capture("summary-%d" % screen.x)
	canvas.queue_free()
	await get_tree().process_frame
	for item in ["ball","dex"]:
		var rows := [{"text":Data.D.items[item].n}]
		Msg.list(rows,{"title":"가방 · 중요한 물건 · 3,186원","buttons":[["◀",-10],["중요한 물건",-12],["▶",-11],["닫기",-1]],"button_weights":[1.0,3.0,1.0,1.4],"on_move":func(_i: int) -> void: Menus._item_preview(item)})
		await get_tree().process_frame
		await get_tree().process_frame
		var labels: Array = Msg._picker.get_meta("preview").find_children("WrappedDescription","Label",true,false)
		check(not labels.is_empty(), "Item description missing")
		if not labels.is_empty():
			check(labels[0].size.x <= labels[0].get_parent().size.x, "Item text overflows horizontally")
		for button in Msg._picker.get_children():
			if button is Button:
				check(button.get_rect().end.x <= Msg.vs().x, "Bag footer button outside viewport")
		await capture("bag-"+item)
		Msg._pick = -1
		await get_tree().process_frame
		await get_tree().process_frame

	# Production auto chooses usable effective moves and falls back when PP is exhausted.
	var fighter := Game.make_mon(1,10)
	var foe := Game.make_mon(7,10)
	fighter.moves = [{"id":"tackle","pp":10},{"id":"ember","pp":10}]
	check(Auto.move_index(fighter,foe) == 1, "Auto battle should prefer effective fire attack")
	fighter.moves[1].pp = 0
	check(Auto.move_index(fighter,foe) == 0, "Auto battle used exhausted PP")
	fighter.moves[0].pp = 0
	check(Auto.move_index(fighter,foe) == "struggle", "Auto battle exhaustion fallback missing")
	Auto.mode = "climb"
	check(Auto.answer("교체하겠습니까?",["예","아니오"]) == 1, "Auto must preserve existing party")
	check(Auto.answer("몬스터를 합성할까요?",["예","아니오"]) == null, "Auto must not approve destructive unknown choices")
	Auto.stop()
	check(not Auto.talk_enabled(), "Stopping auto must restore manual dialogue")
	check(not Game.auto_text, "Production automation must not enable development bypass")
	Game.g.party = [Game.make_mon(1,20)]
	Game.set_flag("pad")
	world.enter_map("route1",Vector2i(5,5),"down",{"quiet":true})
	world.busy = true
	var direction := Auto.grass_step()
	check(direction != "", "Auto hunt could not find reachable grass")
	if direction != "":
		check(world.passable(world.P+World.DV[direction],direction), "Auto hunt path blocked")
	Game.g.party[0].hp = 0
	check(Auto.party_ratio() < 0.35, "Auto hunt low-health threshold missing")
	world.enter_map("home",Vector2i(7,3),"down",{"quiet":true})
	# Exercise the real tower entry and return warp rather than a developer shortcut.
	Auto.go_tower()
	await get_tree().process_frame
	await get_tree().process_frame
	while Msg._picker == null: await get_tree().process_frame
	Msg._pick = 0
	await get_tree().create_timer(0.9).timeout
	check(str(Game.g.map) == "towerLobby", "Tower quick entry failed")
	check(Game.g.towerRet.map == "home", "Tower return position not recorded")
	var banner: Panel = world.ui.get_node_or_null("LocationBanner")
	check(banner != null, "Tower location banner missing")
	if banner != null:
		check(not banner.get_rect().intersects(Auto.buttons.climb.get_rect()), "Location banner overlaps auto-climb control")
	await capture("tower-lobby")
	world.busy = true
	world.set_process(false)
	world.P = Vector2i(5,9)
	await world._on_step()
	check(str(Game.g.map) == "home" and world.P == Vector2i(7,3), "Tower exit did not restore entry position")
	world.busy = true
	Game.g.party = [Game.make_mon(1,20)]
	Game.settings.autoBattle = 1
	var previous_anim: int = Game.settings.anim
	Game.settings.anim = 0
	var result := await world.battle({"kind":"wild","team":[[7,1]],"bg":"meadow"})
	check(result == "win" and not Game.auto_text, "Production auto battle failed")
	Game.g.party = [Game.make_mon(1,40)]
	await world.ev.tower_enter(1)
	world.busy = true
	var climb_state := {"done":false}
	start_climb_test(climb_state)
	var deadline := Time.get_ticks_msec() + 45000
	while int(world.ev.tower().cur) < 2 and Time.get_ticks_msec() < deadline:
		await get_tree().process_frame
	Auto.stop()
	deadline = Time.get_ticks_msec() + 5000
	while not climb_state.done and Time.get_ticks_msec() < deadline:
		await get_tree().process_frame
	check(climb_state.done and int(world.ev.tower().cur) == 2 and int(world.ev.tower().best) >= 1, "Auto climb did not fight and advance or stop correctly")
	Game.g.party = [Game.make_mon(1,1)]
	await world.ev.tower_enter(100)
	world.busy = true
	climb_state = {"done":false}
	start_climb_test(climb_state)
	deadline = Time.get_ticks_msec() + 45000
	while not climb_state.done and Time.get_ticks_msec() < deadline:
		await get_tree().process_frame
	check(climb_state.done and str(Game.g.map) == "towerLobby" and Auto.mode == "", "Defeated auto climber must return to lobby without waiting for input")
	Game.settings.autoBattle = 0
	Game.settings.anim = previous_anim
	world.enter_map("home",Vector2i(7,3),"down",{"quiet":true})
	world.busy = false
	await get_tree().process_frame
	await capture("automation-controls")
	world.busy = true
	var team := world.ev.tower_team(100)
	check(team.size() == 6 and int(team[0][1]) == 100, "Tower top-floor roster missing")
	Game.g.party = old_party
	Guides.seen = previous_seen
	Guides._store()
	Game.settings.tips = previous_tips

func start_climb_test(state: Dictionary) -> void:
	await Auto.climb()
	state.done = true
