extends Node
var failed := false

func check(ok: bool, message: String) -> void:
	if not ok:
		failed = true
		push_error(message)

func _ready() -> void:
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
	for direction in ["down","up","left","right"]:
		await world.player.step(world.player.position + Vector2(8,0), direction, 0.05, true, false)
		check(is_zero_approx(float(world.player.cur().g("walk"))), "Walk animation did not stop")
		await world.player.throw_pose()
		check(is_zero_approx(float(world.player.cur().g("arm_throw"))), "Throw animation did not reset")
	await world.player.hop(world.player.position + Vector2(8,0), "down")
	check(world.player.body.position == Vector2.ZERO, "Hop did not restore foot anchor")
	world.enter_map("home", Vector2i(7,3), "down", {"quiet":true})
	await Msg.say("일어났구나, 별아! 한결 박사님이 연구소로 와 달라고 하셨단다.", "엄마", {"nowait":true, "keep":true})
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
	Game.g.starter = 1
	Game.g.rival_starter = 4
	world.enter_map("lab", Vector2i(5,8), "up", {"quiet":true})
	await get_tree().process_frame
	check(world.ents.find_children("StarterCapsule*", "", true, false).size() == 1, "Selected and rival starters should disappear on re-entry")
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
