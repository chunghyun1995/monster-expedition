extends Node
var failed := false

func check(value: bool, message: String) -> void:
	if not value:
		failed = true
		push_error(message)

func _ready() -> void:
	get_tree().create_timer(240).timeout.connect(func() -> void: get_tree().quit(1))
	Game.auto_text = true
	Game.settings.tips = 0
	Game.settings.anim = 0
	for choice in 3:
		await onboarding(choice)
	print("NEW_SURVEY_", "FAIL" if failed else "PASS")
	for node in Sound.get_children():
		if node is AudioStreamPlayer: node.stop()
	await get_tree().process_frame
	get_tree().quit(1 if failed else 0)

func onboarding(choice: int) -> void:
	Game.new_game("새조사")
	var world := World.new()
	add_child(world)
	world.set_process(false)
	world.busy = true
	world.enter_map("lab", Vector2i(5, 8), "up", {"quiet":true})
	await world.ev.trig_lab_0()
	await world.ev.pick_starter(choice)
	check(Game.g.starter == [10,19,23][choice] and Game.g.rival_starter == 15, "Survey partner allocation/counterpick regression")
	check(Game.flag("starter") and Game.flag("rivalLeft") and Game.flag("dex") and Game.flag("pad"), "First survey onboarding did not complete")
	check(Game.g.party.size() >= 1 and Game.alive().size() >= 1, "First survey battle left party unavailable")
	check(int(Game.g.bag.get("ball", 0)) == 5, "First survey equipment missing")
	check(str(Game.g.map) == "lab", "First survey unexpectedly returned to original home opening")
	check(Game.g.heal.map == "lab", "Survey recovery point must remain at the briefing station")
	print("[new-survey] partner ", choice, " onboarding completed")
	Msg.hide_box()
	world.queue_free()
	await get_tree().process_frame
