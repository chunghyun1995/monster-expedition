extends Node2D
## 타이틀: 배경 위에서 몬스터들이 저마다의 움직임으로 숨 쉬고, 주인공이 걸어 들어온다.
## 이어하기 / 처음부터(오프닝) / 설정 / 웹 게임 저장 코드로 불러오기

var _busy := false


func _ready() -> void:
	var vs := get_viewport().get_visible_rect().size
	Msg.place("field")
	Sound.music("title")
	var bg := TextureRect.new()
	var at := AtlasTexture.new()
	at.atlas = Data.tex.scenes
	at.region = Data.cell("scenes", 0)
	bg.texture = at
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	bg.size = vs
	add_child(bg)
	var shade := ColorRect.new()
	shade.color = Color(0.05, 0.07, 0.1, 0.25)
	shade.size = vs
	add_child(shade)
	var logo := UI.label(self, "벨로리아 생태기록", Vector2(0, 130), 56, Color(1, 0.97, 0.88))
	logo.size.x = vs.x
	logo.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	logo.add_theme_constant_override("outline_size", 18)
	logo.add_theme_color_override("font_outline_color", Color(0.18, 0.2, 0.3))
	logo.pivot_offset = Vector2(vs.x / 2, 50)
	var lt := logo.create_tween().set_loops()
	lt.tween_property(logo, "rotation", 0.02, 1.4).set_trans(Tween.TRANS_SINE)
	lt.tween_property(logo, "rotation", -0.02, 1.4).set_trans(Tween.TRANS_SINE)
	var sub := UI.label(self, "VELORIA FIELDNOTES", Vector2(0, 230), 28, Color(1, 1, 1, 0.9))
	sub.size.x = vs.x
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sub.add_theme_constant_override("outline_size", 8)
	sub.add_theme_color_override("font_outline_color", Color(0.18, 0.2, 0.3))
	var y := vs.y * 0.5
	for e in [[14, 150, y - 140, 150.0], [1, vs.x - 150, y - 60, 150.0], [7, vs.x * 0.5 + 40, y + 30, 170.0], [30, vs.x * 0.5 - 170, y - 250, 130.0]]:
		var p := Puppet.new()
		add_child(p)
		p.setup_mon(e[0], false, e[3])
		p.position = Vector2(e[1], e[2])
	var hero := Puppet.new()
	add_child(hero)
	hero.setup_person("player", false, 210.0)
	hero.position = Vector2(-120, y + 10)
	var tw := create_tween()
	tw.tween_method(func(k: float) -> void:
		hero.position.x = lerpf(-120, vs.x * 0.27, k)
		hero.p("walk", 1.0 - k * k)
		hero.p("walk_phase", k * 16.0), 0.0, 1.0, 1.6).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	# 개발용 바로가기: 실행 인자(-- w:city:10:10:battle) 또는 웹 주소 #w:city:10:10
	var arg := ""
	if OS.get_cmdline_user_args().size():
		arg = OS.get_cmdline_user_args()[0]
	elif OS.has_feature("web"):
		arg = str(JavaScriptBridge.eval("decodeURIComponent(location.hash.slice(1))"))
	if arg != "":
		await get_tree().process_frame
		_dev(arg)
		return
	_menu()


func _menu() -> void:
	var vs := get_viewport().get_visible_rect().size
	var sv := Game.read_save()
	while true:
		var btns: Array = [
			{"text": ("이어하기\n%s · 관측 인증 %d · 생태기록 %d · %s" % [sv.name, _badges(sv), sv.caught.size(), Game.fmt_time(float(sv.get("play_ms", 0)))]) if not sv.is_empty() else "이어하기\n리포트 없음",
				"rect": Rect2(60, vs.y - 520, vs.x - 120, 130), "color": Color(0.3, 0.5, 0.8), "disabled": sv.is_empty(), "size": 30},
			{"text": "처음부터 시작", "rect": Rect2(60, vs.y - 375, vs.x - 120, 100), "color": Color(0.86, 0.36, 0.42), "size": 34},
			{"text": "설정", "rect": Rect2(60, vs.y - 260, vs.x - 120, 90), "color": Color(0.42, 0.45, 0.52), "size": 30},
			{"text": "웹 게임 저장 코드로 불러오기", "rect": Rect2(60, vs.y - 155, vs.x - 120, 80), "color": Color(0.3, 0.55, 0.5), "size": 28}]
		var i := await Msg.buttons(btns, -2, 0 if not sv.is_empty() else 1)
		if i == 3:
			if await _import_code(sv):
				return
			sv = Game.read_save()
			continue
		if i == 2:
			await Menus.options_menu()
			continue
		if i == 1 and not sv.is_empty():
			var c := await Msg.ask("기존 리포트가 있습니다. 처음부터 시작하면 리포트를 저장할 때 덮어쓰게 됩니다. 괜찮습니까?", ["처음부터 시작", "돌아가기"], "", 1)
			if c != 0:
				continue
		if i == 0:
			Game.load_save(sv)
			Game.change_scene("res://scenes/world.tscn")
			return
		await _intro()
		return


## 웹 게임(브라우저·WebView 앱)에서 만든 저장 코드(ME3-…)나 불러오기 링크를 붙여 넣어 리포트로 가져온다
func _import_code(sv: Dictionary) -> bool:
	var vs := get_viewport().get_visible_rect().size
	var layer := CanvasLayer.new()
	layer.layer = 55
	add_child(layer)
	var bg := ColorRect.new()
	bg.color = Color(0.06, 0.08, 0.14, 0.85)
	bg.size = vs
	layer.add_child(bg)
	var p := UI.panel(layer, Rect2(24, 90, vs.x - 48, 690))
	var title := UI.label(p, "웹 게임 저장 코드로 불러오기", Vector2(24, 20), 32)
	title.size.x = p.size.x - 48
	var help := UI.label(p, "웹 게임의 [리포트 → 기록하고 저장 코드 만들기]에서 복사한 코드(ME3-…)나 링크를 붙여 넣으세요.", Vector2(24, 70), 24, Color(0.3, 0.33, 0.42))
	help.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	help.custom_minimum_size = Vector2(p.size.x - 48, 80)
	help.size = Vector2(p.size.x - 48, 80)
	var te := TextEdit.new()
	te.position = Vector2(24, 160)
	te.size = Vector2(p.size.x - 48, 300)
	te.placeholder_text = "ME3-XXXX-..."
	te.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	te.add_theme_font_size_override("font_size", 22)
	te.add_theme_stylebox_override("normal", UI.box(Color(1, 1, 1), Color(0.55, 0.6, 0.7), 10, 3))
	te.add_theme_stylebox_override("focus", UI.box(Color(1, 1, 1), Color(0.3, 0.55, 0.5), 10, 3))
	te.add_theme_color_override("font_color", UI.INK)
	te.add_theme_color_override("font_placeholder_color", Color(0.6, 0.62, 0.68))
	te.add_theme_color_override("caret_color", UI.INK)
	p.add_child(te)
	var err := UI.label(p, "", Vector2(24, 470), 24, Color(0.8, 0.25, 0.3))
	err.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	err.custom_minimum_size = Vector2(p.size.x - 48, 60)
	err.size = Vector2(p.size.x - 48, 60)
	var bw := (p.size.x - 48 - 24) / 3.0
	var pick := [null]
	var paste := UI.button(p, "붙여넣기", Rect2(24, 560, bw, 90), Color(0.45, 0.5, 0.65), 28)
	paste.pressed.connect(func() -> void:
		te.text = DisplayServer.clipboard_get()
		Sound.sfx("cur"))
	var ok := UI.button(p, "불러오기", Rect2(36 + bw, 560, bw, 90), Color(0.3, 0.6, 0.4), 28)
	ok.pressed.connect(func() -> void: pick[0] = "ok")
	var cc := UI.button(p, "취소", Rect2(48 + bw * 2, 560, bw, 90), Color(0.4, 0.42, 0.5), 28)
	cc.pressed.connect(func() -> void: pick[0] = "cancel")
	te.grab_focus()
	var result := {}
	while true:
		pick[0] = null
		while pick[0] == null:
			if Input.is_action_just_pressed("ui_cancel") and not te.has_focus():
				pick[0] = "cancel"
			await get_tree().process_frame
		if pick[0] == "cancel":
			Sound.sfx("back")
			break
		var r := SaveCode.read(te.text)
		if not r.ok:
			Sound.sfx("bad")
			err.text = str(r.err)
			continue
		result = r.g
		Sound.sfx("sel")
		break
	layer.queue_free()
	if result.is_empty():
		return false
	var info := "%s · 관측 인증 %d · 생태기록 %d · %s" % [result.name, _badges(result), result.caught.size(), Game.fmt_time(float(result.play_ms))]
	var q := "%s\n이 모험을 불러올까요?" % info
	if not sv.is_empty():
		q = "%s\n이 기기의 리포트(%s)는 코드의 내용으로 바뀌어요. 불러올까요?" % [info, sv.name]
	if await Msg.ask(q, ["불러오기", "그만두기"], "", 0) != 0:
		return false
	Game.load_save(result)
	Game.save_game()
	await Msg.say("%s의 모험을 불러왔다!" % result.name)
	Game.change_scene("res://scenes/world.tscn")
	return true


func _badges(sv: Dictionary) -> int:
	var n := 0
	for b in sv.get("badges", []):
		n += 1 if b else 0
	return n


## 현장통신 의뢰 접수: 폭풍 피해 기록 → 서명 → 통신소 브리핑
func _intro() -> void:
	var vs := get_viewport().get_visible_rect().size
	await Game.fade_to(1.0, 0.35)
	for c in get_children():
		c.queue_free()
	var bg := ColorRect.new()
	bg.color = Color("#16383d")
	bg.size = vs
	add_child(bg)
	var card := UI.panel(self, Rect2(36, 110, vs.x - 72, vs.y * 0.46), Color("#f0ead6"), Color("#b69055"))
	var heading := UI.label(card, "벨로리아 현장통신", Vector2(28, 24), 38)
	heading.size.x = card.size.x - 56
	heading.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var log := UI.label(card, "새벽 폭풍으로 관측망이 끊겼습니다.\n다섯 지역의 센서를 다시 연결하고\n야생 생물의 변화 기록을 회수해 주세요.", Vector2(28, 100), 28)
	log.size = Vector2(card.size.x - 56, 170)
	log.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	# Original incident map: five linked monitoring nodes, no professor demonstration.
	var chart := Node2D.new()
	chart.position = Vector2(card.size.x * 0.5, card.size.y - 100)
	chart.draw.connect(func() -> void:
		for i in range(5):
			var at := Vector2((i - 2) * 80, sin(i * 1.1) * 28)
			if i > 0:
				chart.draw_line(Vector2((i - 3) * 80, sin((i - 1) * 1.1) * 28), at, Color("#a7b1a1"), 4, true)
			chart.draw_circle(at, 12, Color("#b66b45")))
	card.add_child(chart)
	Sound.music("intro")
	await Game.fade_to(0.0, 0.35)
	await Msg.say("원정 접수처에 새 의뢰가 도착했습니다. 폭풍 뒤의 숲은 이전 기록과 달라졌습니다.", "현장통신")
	var name := await Msg.name_input("현장 기록에 서명할 이름", "", 6, ["하늘", "태양", "바다", "별이", "민준", "서연", "지호", "유나"])
	Game.new_game(name)
	Game.g.map = "lab"
	Game.g.x = 5
	Game.g.y = 8
	Game.g.dir = "up"
	Game.g.heal = {"map": "lab", "x": 5, "y": 8}
	await Msg.say("%s 원정가의 접수가 완료됐습니다. 현장통신소에서 조사 동료와 장비를 확인해 주세요." % name, "현장통신")
	await Game.fade_to(1.0, 0.35)
	Game.dev = "field_briefing"
	Game.change_scene("res://scenes/world.tscn")


func _dev(arg: String) -> void:
	var p := arg.split(":")
	if p[0] == "notips":     # 스토어 스크린샷용: 첫 사용 안내 끄기
		Game.settings.tips = 0
		p = p.slice(1)
	if p[0] == "auto":
		Game.auto_text = true
		p = p.slice(1)
	if p.size() < 1 or p[0] != "w":
		_menu()
		return
	Game.new_game("하늘" if Game.settings.tips == 0 else "테스트")
	Game.g.party = [Game.make_mon(1, 14), Game.make_mon(4, 12), Game.make_mon(7, 12)]
	for k in ["starter", "dex", "pad", "shoes", "labIntro", "rival1", "rivalLeft"]:
		Game.set_flag(k)
	Game.g.starter = 1
	Game.g.rival_starter = 4
	Game.g.bag = {"ball": 10, "great": 5, "potion": 5, "super": 3, "lvup": 3}
	Game.g.map = p[1] if p.size() > 1 else "town"
	Game.g.x = int(p[2]) if p.size() > 2 else 10
	Game.g.y = int(p[3]) if p.size() > 3 else 10
	Game.g.dir = "down"
	Game.dev = ":".join(p.slice(4)) if p.size() > 4 else ""
	Game.change_scene("res://scenes/world.tscn")
