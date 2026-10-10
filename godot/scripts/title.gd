extends Node2D
## 타이틀: 배경 위에서 몬스터들이 저마다의 움직임으로 숨 쉬고, 주인공이 걸어 들어온다.

func _ready() -> void:
	var vs := get_viewport().get_visible_rect().size
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
	var logo := UI.label(self, "몬스터 원정대", Vector2(0, 150), 76, Color(1, 0.97, 0.88))
	logo.size.x = vs.x
	logo.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	logo.add_theme_constant_override("outline_size", 18)
	logo.add_theme_color_override("font_outline_color", Color(0.18, 0.2, 0.3))
	logo.pivot_offset = Vector2(vs.x / 2, 50)
	var lt := logo.create_tween().set_loops()
	lt.tween_property(logo, "rotation", 0.02, 1.4).set_trans(Tween.TRANS_SINE)
	lt.tween_property(logo, "rotation", -0.02, 1.4).set_trans(Tween.TRANS_SINE)
	var sub := UI.label(self, "Godot 4 모션 미리보기", Vector2(0, 250), 30, Color(1, 1, 1, 0.9))
	sub.size.x = vs.x
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sub.add_theme_constant_override("outline_size", 8)
	sub.add_theme_color_override("font_outline_color", Color(0.18, 0.2, 0.3))
	var y := vs.y * 0.58
	for e in [[14, 150, y - 120, 150.0], [1, vs.x - 150, y - 40, 150.0], [7, vs.x * 0.5 + 40, y + 60, 170.0], [30, vs.x * 0.5 - 170, y - 230, 130.0]]:
		var p := Puppet.new()
		add_child(p)
		p.setup_mon(e[0], false, e[3])
		p.position = Vector2(e[1], e[2])
	var hero := Puppet.new()
	add_child(hero)
	hero.setup_person("player", false, 210.0)
	hero.position = Vector2(-120, y + 40)
	var tw := create_tween()
	tw.tween_method(func(k: float) -> void:
		hero.position.x = lerpf(-120, vs.x * 0.27, k)
		hero.p("walk", 1.0 - k * k)
		hero.p("walk_phase", k * 16.0), 0.0, 1.0, 1.6).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	var start := UI.button(self, "모험 시작", Rect2(vs.x / 2 - 220, vs.y - 330, 440, 110), Color(0.86, 0.36, 0.42), 40)
	start.pressed.connect(func() -> void: Game.change_scene("res://scenes/field.tscn"))
	var gal := UI.button(self, "모션 보기", Rect2(vs.x / 2 - 220, vs.y - 200, 440, 96), Color(0.36, 0.48, 0.72), 34)
	gal.pressed.connect(func() -> void: Game.change_scene("res://scenes/gallery.tscn"))
	start.grab_focus()
	# 개발용 바로가기: 실행 인자(-- field) 또는 웹 주소 #field
	var arg := ""
	if OS.get_cmdline_user_args().size():
		arg = OS.get_cmdline_user_args()[0]
	elif OS.has_feature("web"):
		arg = str(JavaScriptBridge.eval("location.hash.slice(1)"))
	if arg != "":
		Game.dev = arg
		await get_tree().process_frame
		if arg == "gallery":
			Game.change_scene("res://scenes/gallery.tscn")
		elif arg in ["field", "battle", "trainer", "person", "route"]:
			if arg != "field":
				Game.map_id = "route1"
				Game.spawn = Vector2i(10, 14)
				if arg == "trainer":
					Game.spawn = Vector2i(10, 12)
					Game.facing = "down"
			Game.change_scene("res://scenes/field.tscn")
