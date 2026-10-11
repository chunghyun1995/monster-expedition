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
	# 첫 동료는 새 게임 시작(마을)에서 고르고, 연구소에서는 점검 대결과 장비만 받는다
	world.enter_map("town", Vector2i(4, 13), "down", {"quiet":true})
	await world.ev.give_starter([10,19,23][choice])
	check(Game.flag("starter") and not Game.flag("rival1"), "Starter must be chosen before the laboratory briefing")
	world.enter_map("lab", Vector2i(5, 8), "up", {"quiet":true})
	await world.ev.trig_lab_0()
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
