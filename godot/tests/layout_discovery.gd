extends Node
var failed := false

class DiscoveryWorld extends World:
	var confirmations := 0
	func _wild() -> void:
		confirmations += 1

func check(ok: bool, message: String) -> void:
	if not ok:
		failed = true
		push_error(message)

func _ready() -> void:
	get_tree().create_timer(60).timeout.connect(func() -> void: get_tree().quit(1))
	Game.new_game("점검")
	Game.settings.tips = 0
	Game.auto_text = false
	var world := DiscoveryWorld.new()
	add_child(world)
	world.set_process(false)
	world.busy = true
	for screen in [Vector2i(720,1280), Vector2i(720,1560)]:
		get_window().size = screen
		get_window().content_scale_size = screen
		await get_tree().process_frame
		world.enter_map("lab", Vector2i(5,8), "up", {"quiet":true})
		Msg.place("field")
		var card: Control = world.ev.mon_card(10)
		var state := {"done":false,"answer":-1}
		start_ask(state)
		await wait_picker()
		var preview: Panel = card.find_children("*", "Panel", true, false)[0]
		var description: Label = card.find_children("WrappedDescription", "Label", true, false)[0]
		check(description.get_line_count() > 1, "Long creature description must wrap into multiple lines")
		check(description.size.x <= preview.size.x - 40, "Creature description exceeds card width")
		check(preview.get_global_rect().end.y + 8 <= Msg.name_tag.position.y, "Survey card overlaps speaker/choice panel")
		check_choices()
		check(Msg.box.get_rect().end.y + 12 <= TouchPad.reserved_top(Msg.vs()), "Choice panel overlaps touch controls")
		await capture("survey-" + str(screen.y))
		Msg._picker.get_child(1).pressed.emit()
		await get_tree().process_frame
		check(state.done and state.answer == 1, "Choice click must select the requested option")
		card.queue_free()
		await get_tree().process_frame
	var before_hp: Array = Game.g.party.map(func(mon: Dictionary) -> int: return int(mon.hp))
	var state := {"done":false}
	start_discovery(world, state)
	await wait_picker()
	check(world.confirmations == 0, "Discovery started combat before consent")
	Msg._picker.get_child(1).pressed.emit()
	await get_tree().process_frame
	check(state.done and world.confirmations == 0, "Declining discovery must not enter combat")
	check(before_hp == Game.g.party.map(func(mon: Dictionary) -> int: return int(mon.hp)), "Declining discovery changed party HP")
	state = {"done":false}
	start_discovery(world, state)
	await wait_picker()
	Msg._picker.get_child(0).pressed.emit()
	await get_tree().process_frame
	check(state.done and world.confirmations == 1, "Accepting discovery must enter combat exactly once")
	check(world._discovery_cooldown == 5, "Decline/accept must provide a walking cooldown")
	Auto.mode = "hunt"
	await world.discover()
	check(world.confirmations == 2, "Explicit auto hunt must accept discovered creatures")
	Auto.stop()
	world.enter_map("town", Vector2i(8,8), "down", {"quiet":true})
	var labels := world.ents.find_children("BuildingName", "Label", true, false)
	check(not labels.is_empty(), "Building names missing")
	for label in labels:
		check(not label.text.is_empty(), "Building name empty")
	await capture("building-names")
	Game.g.party = [Game.make_mon(10, 12)]
	var battle := Battle.new()
	add_child(battle)
	battle.w = world
	battle.o = {"kind":"wild","bg":"forest"}
	battle.wild = true
	battle.foe = [Game.make_mon(33,12)]
	battle.VS = Msg.vs()
	battle.SH = battle.VS.y - 520
	battle._build()
	battle.make_hud("p")
	battle.make_hud("e")
	Auto.active_battle = battle
	world.pad.visible = false
	world.menu_btn.visible = false
	Auto._process(0)
	var control: Button = Auto.buttons.battle
	check(control.position.y >= battle._btn_rect(3).end.y + 4, "Auto battle control overlaps action buttons")
	for hud in battle.huds.values():
		check(not control.get_rect().intersects(hud.root.get_rect()), "Auto battle control overlaps status card")
	Msg.place("battle")
	state = {"done":false,"answer":-1}
	start_ask(state)
	await wait_picker()
	check_choices()
	check(Msg.box.get_rect().end.y < control.position.y, "Battle choices overlap automation controls")
	await capture("battle-choice")
	Msg._picker.get_child(1).pressed.emit()
	await get_tree().process_frame
	Auto.active_battle = null
	battle.queue_free()
	world.queue_free()
	for player in Sound.get_children():
		if player is AudioStreamPlayer: player.stop()
	await get_tree().process_frame
	print("LAYOUT_DISCOVERY_", "FAIL" if failed else "PASS")
	get_tree().quit.call_deferred(1 if failed else 0)

func start_ask(state: Dictionary) -> void:
	state.answer = await Msg.ask("길을 살피는 정찰 동료: 짹짹이와 첫 의뢰를 시작할까?", ["동행 등록 · 이 조사 동료와 함께 첫 의뢰를 시작한다", "다른 기록 보기"], "한결 조사관")
	state.done = true

func start_discovery(world: DiscoveryWorld, state: Dictionary) -> void:
	await world.discover()
	state.done = true

func wait_picker() -> void:
	while Msg._picker == null:
		await get_tree().process_frame
	await get_tree().process_frame
	await get_tree().create_timer(0.25).timeout

func check_choices() -> void:
	for button in Msg._picker.get_children():
		if button is Button:
			var rect: Rect2 = button.get_global_rect()
			check(Msg.box.get_global_rect().encloses(rect), "Choice button outside dialogue panel")
			check(not rect.intersects(Msg.text.get_global_rect()), "Choice button overlaps dialogue text")

func capture(name: String) -> void:
	if DisplayServer.get_name() == "headless": return
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("user://layout-" + name + ".png")
