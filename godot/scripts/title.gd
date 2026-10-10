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
	var logo := UI.label(self, "몬스터 원정대", Vector2(0, 130), 76, Color(1, 0.97, 0.88))
	logo.size.x = vs.x
	logo.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	logo.add_theme_constant_override("outline_size", 18)
	logo.add_theme_color_override("font_outline_color", Color(0.18, 0.2, 0.3))
	logo.pivot_offset = Vector2(vs.x / 2, 50)
	var lt := logo.create_tween().set_loops()
	lt.tween_property(logo, "rotation", 0.02, 1.4).set_trans(Tween.TRANS_SINE)
	lt.tween_property(logo, "rotation", -0.02, 1.4).set_trans(Tween.TRANS_SINE)
	var sub := UI.label(self, "MONSTER EXPEDITION", Vector2(0, 230), 28, Color(1, 1, 1, 0.9))
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
			{"text": ("이어하기\n%s · 배지 %d · 도감 %d · %s" % [sv.name, _badges(sv), sv.caught.size(), Game.fmt_time(float(sv.get("play_ms", 0)))]) if not sv.is_empty() else "이어하기\n리포트 없음",
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
	var info := "%s · 배지 %d · 도감 %d · %s" % [result.name, _badges(result), result.caught.size(), Game.fmt_time(float(result.play_ms))]
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


## 오프닝: 박사의 인사 → 몬스터 등장 → 이름 짓기 → 주인공이 작아지며 모험 시작
func _intro() -> void:
	var vs := get_viewport().get_visible_rect().size
	await Game.fade_to(1.0, 0.5)
	for c in get_children():
		c.queue_free()
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.1, 0.2)
	bg.size = vs
	add_child(bg)
	var stars := Node2D.new()
	stars.draw.connect(func() -> void:
		for i in 40:
			stars.draw_circle(Vector2(fmod(i * 173.0, vs.x), fmod(i * 97.0, vs.y * 0.6)), 2.0 if i % 5 else 3.0, Color(1, 1, 1, 0.5)))
	add_child(stars)
	var floor_ := Sprite2D.new()
	floor_.texture = Puppet._shadow()
	floor_.position = Vector2(vs.x / 2, vs.y * 0.6)
	floor_.scale = Vector2(5.0, 1.0)
	floor_.modulate = Color(1, 1, 1, 0.1)
	add_child(floor_)
	var prof := Puppet.new()
	add_child(prof)
	prof.setup_person("prof", false, 360.0)
	prof.position = Vector2(vs.x / 2, vs.y * 0.6)
	Sound.music("intro")
	await Game.fade_to(0.0, 0.5)
	var o := "한결 박사"
	await Msg.say("안녕! 몬스터의 세계에 온 걸 환영한단다!", o)
	await Msg.say("나는 한결. 사람들은 나를 몬스터 박사라고 부르지.", o)
	create_tween().tween_property(prof, "position:x", vs.x * 0.3, 0.4).set_trans(Tween.TRANS_SINE)
	var mon := Puppet.new()
	add_child(mon)
	mon.setup_mon(10, false, 200.0)
	mon.position = Vector2(vs.x * 0.72, vs.y * 0.6)
	mon.scale = Vector2(0.1, 0.1)
	mon.p("flash", 1.0)
	Sound.sfx("open")
	Sound.cry(10)
	FX.burst(self, mon.position + Vector2(0, -100), Color(1, 1, 1), Color(1, 0.85, 0.3), 24, 300.0, Vector2.ZERO, 0.6, 1.2, 180.0)
	var tw := create_tween()
	tw.tween_property(mon, "scale", Vector2.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.parallel()
	mon.tp(tw, "flash", 0.0, 0.5)
	await tw.finished
	await Msg.say("이 세계에는 \"몬스터\"라고 불리는 신비한 생물들이 살고 있단다.", o)
	await Msg.say("사람들은 몬스터와 함께 생활하고, 때로는 힘을 합쳐 승부를 겨루기도 하지.", o)
	await Msg.say("나는 몬스터를 연구하면서 이 지방의 몬스터 도감을 만들고 있단다.", o)
	var t2 := create_tween().set_parallel()
	t2.tween_property(prof, "modulate:a", 0.0, 0.4)
	t2.tween_property(mon, "modulate:a", 0.0, 0.4)
	await t2.finished
	var hero := Puppet.new()
	add_child(hero)
	hero.setup_person("player", false, 380.0)
	hero.position = Vector2(vs.x / 2, vs.y * 0.6)
	hero.modulate.a = 0
	await create_tween().tween_property(hero, "modulate:a", 1.0, 0.4).finished
	await Msg.say("그럼 이제 너에 대해 알려 주겠니? 이름이 무엇이니?", o)
	var name := await Msg.name_input("당신의 이름을 알려 주세요", "", 6, ["하늘", "태양", "바다", "별이", "민준", "서연", "지호", "유나"])
	Game.new_game(name)
	await Msg.say("%s! 정말 좋은 이름이구나!" % name, o)
	await Msg.say("%s, 너만의 몬스터 원정이 이제 막 시작되려 하고 있단다." % name, o)
	await Msg.say("꿈과 모험, 그리고 몬스터가 가득한 세계로! 자, 출발하자!", o)
	var shrink := create_tween()
	shrink.tween_property(hero, "scale", Vector2(0.15, 0.15), 0.9).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	await shrink.finished
	Game.dev = "intro_mom"
	Game.change_scene("res://scenes/world.tscn")


## 개발용: w:지도:x:y[:명령]  (새 테스트 게임으로 바로 시작)
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
