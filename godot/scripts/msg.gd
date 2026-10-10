extends CanvasLayer
## 화면 위 공용 UI: 대화창(한 글자씩), 선택지, 목록, 수량 고르기, 이름 입력, 알림.
## 필드·전투·메뉴 어디서나 await Msg.say("…") / await Msg.ask("…", ["예","아니오"]) 로 쓴다.

signal _advanced

const SPEED := [0.05, 0.028, 0.012]

var box: Panel
var text: Label
var name_tag: Label
var arrow: Label
var _typing := false
var _waiting := false
var _tw: Tween
var _arrow_tw: Tween
var _rect := Rect2()
var _mode := "field"
var _picker: Control      # 선택지·목록이 떠 있을 때
var _pick = null
var _auto_seen := {}


## 자동 점검용: 같은 질문(숫자 무시)이 3번 넘게 나오면 true
func _auto_seen_too_much(t: String) -> bool:
	var k := RegEx.create_from_string("[0-9,]+").sub(t, "#", true)
	_auto_seen[k] = int(_auto_seen.get(k, 0)) + 1
	return _auto_seen[k] > 3


func _ready() -> void:
	layer = 60
	box = UI.panel(self, Rect2(16, 900, 688, 210))
	box.mouse_filter = Control.MOUSE_FILTER_STOP
	box.gui_input.connect(func(e: InputEvent) -> void:
		if e is InputEventMouseButton and e.pressed:
			_advance())
	text = UI.label(box, "", Vector2(28, 22), 32)
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text.add_theme_constant_override("line_spacing", 10)
	name_tag = UI.label(self, "", Vector2.ZERO, 26, Color.WHITE)
	var tag := StyleBoxFlat.new()
	tag.bg_color = Color(0.27, 0.42, 0.45)
	tag.set_corner_radius_all(12)
	tag.content_margin_left = 16
	tag.content_margin_right = 16
	tag.content_margin_top = 4
	tag.content_margin_bottom = 4
	name_tag.add_theme_stylebox_override("normal", tag)
	arrow = UI.label(box, "▼", Vector2.ZERO, 26, Color(0.85, 0.35, 0.35))
	hide_box()
	place("field")
	get_viewport().size_changed.connect(func() -> void: place(_mode))


func vs() -> Vector2:
	return get_viewport().get_visible_rect().size


## 대화창 위치: field(아래), battle(전투 아래 칸), center
func place(mode: String) -> void:
	_mode = mode
	var s := vs()
	match mode:
		"battle":
			_rect = Rect2(16, s.y - 520 + 18, s.x - 32, 180)
		"center":
			_rect = Rect2(16, s.y * 0.5 - 100, s.x - 32, 200)
		_:
			_rect = Rect2(16, s.y - 250, s.x - 32, 220)
	box.position = _rect.position
	box.size = _rect.size
	text.size = Vector2(_rect.size.x - 56, _rect.size.y - 40)
	name_tag.position = _rect.position + Vector2(24, -44)
	arrow.position = Vector2(_rect.size.x - 54, _rect.size.y - 46)


func hide_box() -> void:
	box.visible = false
	name_tag.visible = false
	arrow.visible = false


func is_open() -> bool:
	return box.visible or _picker != null


## 말하기. opts: keep(창 유지) · auto(초: 입력 없이 넘김)
func say(t: String, who := "", opts := {}) -> void:
	box.visible = true
	name_tag.text = who
	name_tag.visible = who != ""
	text.text = t
	text.visible_ratio = 0.0
	arrow.visible = false
	_typing = true
	if _tw:
		_tw.kill()
	_tw = create_tween()
	var per: float = SPEED[clampi(int(Game.settings.text), 0, 2)]
	_tw.tween_property(text, "visible_ratio", 1.0, clampf(t.length() * per, 0.08, 2.2))
	_tw.finished.connect(func() -> void: _typing = false)
	while _typing:
		await get_tree().process_frame
	if opts.has("auto") or Game.auto_text:
		await get_tree().create_timer(0.05 if Game.auto_text else float(opts.auto)).timeout
	elif not opts.get("nowait", false):
		arrow.visible = true
		if _arrow_tw:
			_arrow_tw.kill()
		_arrow_tw = arrow.create_tween().set_loops()
		var y0 := arrow.position.y
		_arrow_tw.tween_property(arrow, "position:y", y0 + 8, 0.35).set_trans(Tween.TRANS_SINE)
		_arrow_tw.tween_property(arrow, "position:y", y0, 0.35).set_trans(Tween.TRANS_SINE)
		_waiting = true
		await _advanced
		_arrow_tw.kill()
		arrow.position.y = y0
		arrow.visible = false
	if not opts.get("keep", false):
		hide_box()


func talk(lines: Array, who := "") -> void:
	for l in lines:
		await say(Game.fmt_name(str(l)), who)


func _unhandled_input(e: InputEvent) -> void:
	if box.visible and _picker == null and (e.is_action_pressed("a_btn") or e.is_action_pressed("b_btn")):
		_advance()
		get_viewport().set_input_as_handled()


func _advance() -> void:
	if _typing:
		if _tw:
			_tw.kill()
		text.visible_ratio = 1.0
		_typing = false
		return
	if _waiting:
		_waiting = false
		_advanced.emit()


# ---------------- 선택지 ----------------
## 질문 + 버튼. B는 마지막 항목(cancel_idx)
func ask(t: String, options: Array, who := "", start := 0, cancel_idx := -2) -> int:
	await say(t, who, {"keep": true, "nowait": true})
	if Game.auto_text:
		await get_tree().create_timer(0.05).timeout
		hide_box()
		# 자동 점검: 같은 질문이 되풀이되면 마지막(그만두기)을 골라 무한 반복을 막는다
		return options.size() - 1 if _auto_seen_too_much(t) else start
	var cancel := options.size() - 1 if cancel_idx == -2 else cancel_idx
	var layer := Control.new()
	layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(layer)
	_picker = layer
	_pick = null
	var w := 340.0
	var h := 84.0
	var x := _rect.position.x + _rect.size.x - w
	var y := _rect.position.y - (h + 12) * options.size() - 8
	var btns: Array = []
	for i in options.size():
		var b := UI.button(layer, options[i], Rect2(x, y + i * (h + 12), w, h), Color(0.25, 0.5, 0.75) if i == start else Color(0.42, 0.45, 0.52), 30)
		b.pressed.connect(func() -> void: _pick = i)
		b.modulate.a = 0
		b.create_tween().tween_property(b, "modulate:a", 1.0, 0.15).set_delay(i * 0.04)
		btns.append(b)
	_link_focus(btns, true)
	btns[start].grab_focus()
	while _pick == null:
		if cancel >= 0 and Input.is_action_just_pressed("b_btn"):
			_pick = cancel
		await get_tree().process_frame
	layer.queue_free()
	_picker = null
	hide_box()
	return int(_pick)


func _link_focus(btns: Array, vertical: bool) -> void:
	for i in btns.size():
		var b: Button = btns[i]
		var prev: Button = btns[(i - 1 + btns.size()) % btns.size()]
		var next: Button = btns[(i + 1) % btns.size()]
		if vertical:
			b.focus_neighbor_top = b.get_path_to(prev)
			b.focus_neighbor_bottom = b.get_path_to(next)
		else:
			b.focus_neighbor_left = b.get_path_to(prev)
			b.focus_neighbor_right = b.get_path_to(next)


# ---------------- 목록 ----------------
## 항목: {text, right, icon(Texture2D 또는 [atlas, index]), disabled, color}
## opts: title, start, cancel(true), on_move(Callable(i)), top(높이 비율 0~1: 위쪽 미리보기 칸), buttons([[글자, 값]]), keys(Callable(key,i) -> 값 또는 null)
func list(items: Array, opts := {}) -> int:
	if Game.auto_text:
		await get_tree().process_frame
		if _auto_seen_too_much("list:" + str(opts.get("title", ""))):
			return -1
		for i in items.size():
			if not items[i].get("disabled", false) and i >= int(opts.get("start", 0)):
				return i
		return -1
	var s := vs()
	var layer := Control.new()
	layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(layer)
	_picker = layer
	_pick = null
	var top: float = s.y * float(opts.get("top", 0.42))
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.1, 0.16, 0.55)
	bg.size = s
	layer.add_child(bg)
	var preview := Control.new()
	preview.size = Vector2(s.x, top)
	layer.add_child(preview)
	layer.set_meta("preview", preview)
	var panel := UI.panel(layer, Rect2(12, top + 8, s.x - 24, s.y - top - 120), Color(0.97, 0.97, 0.95), Color(0.3, 0.36, 0.48))
	if opts.has("title"):
		var tl := UI.label(layer, opts.title, Vector2(28, top - 40), 30, Color.WHITE)
		tl.add_theme_constant_override("outline_size", 8)
		tl.add_theme_color_override("font_outline_color", Color(0.1, 0.12, 0.2))
	var sc := ScrollContainer.new()
	sc.position = Vector2(10, 10)
	sc.size = panel.size - Vector2(20, 20)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	panel.add_child(sc)
	var vb := VBoxContainer.new()
	vb.custom_minimum_size.x = sc.size.x - 8
	vb.add_theme_constant_override("separation", 6)
	sc.add_child(vb)
	var btns: Array = []
	for i in items.size():
		var it: Dictionary = items[i]
		var b := Button.new()
		b.custom_minimum_size = Vector2(sc.size.x - 8, 76)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.text = "      " + str(it.get("text", "")) if it.has("icon") else str(it.get("text", ""))
		b.add_theme_font_size_override("font_size", 30)
		var col: Color = it.get("color", Color(0.93, 0.94, 0.97))
		b.add_theme_stylebox_override("normal", UI.box(col, col.darkened(0.25), 12, 3))
		b.add_theme_stylebox_override("hover", UI.box(col.lightened(0.3), col.darkened(0.3), 12, 3))
		b.add_theme_stylebox_override("pressed", UI.box(col.darkened(0.1), col.darkened(0.4), 12, 3))
		b.add_theme_stylebox_override("focus", UI.box(Color(1, 0.95, 0.75), Color(0.95, 0.7, 0.2), 12, 5))
		b.add_theme_stylebox_override("disabled", UI.box(col.darkened(0.15), col.darkened(0.3), 12, 3))
		for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
			b.add_theme_color_override(k, UI.INK)
		b.add_theme_color_override("font_disabled_color", Color(0.5, 0.52, 0.58))
		b.disabled = it.get("disabled", false)
		if it.has("icon"):
			var ic := TextureRect.new()
			ic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			ic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			ic.size = Vector2(64, 64)
			ic.position = Vector2(10, 6)
			ic.texture = icon_tex(it.icon)
			ic.mouse_filter = Control.MOUSE_FILTER_IGNORE
			b.add_child(ic)
		if it.has("right"):
			var r := UI.label(b, str(it.right), Vector2(0, 18), 26, Color(0.3, 0.33, 0.42))
			r.size = Vector2(b.custom_minimum_size.x - 20, 40)
			r.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
			r.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.pressed.connect(func() -> void: _pick = i)
		b.focus_entered.connect(func() -> void:
			if opts.has("on_move"):
				opts.on_move.call(i)
			sc.ensure_control_visible(b))
		vb.add_child(b)
		btns.append(b)
	# 아래 버튼들 (닫기 등)
	var extra: Array = opts.get("buttons", [["닫기", -1]] if opts.get("cancel", true) else [])
	var bw := (s.x - 24 - 12 * (extra.size() - 1)) / maxf(1, extra.size())
	for j in extra.size():
		var e: Array = extra[j]
		var b := UI.button(layer, e[0], Rect2(12 + j * (bw + 12), s.y - 100, bw, 84), e[2] if e.size() > 2 else Color(0.38, 0.4, 0.48), 30)
		var v = e[1]
		b.pressed.connect(func() -> void: _pick = v)
	if btns.size():
		_link_focus(btns, true)
		var st: int = clampi(int(opts.get("start", 0)), 0, btns.size() - 1)
		var first: Button = btns[st]
		if first.disabled:
			for b in btns:
				if not b.disabled:
					first = b
					break
		first.grab_focus()
		if opts.has("on_move"):
			opts.on_move.call(btns.find(first))
	while _pick == null:
		if opts.get("cancel", true) and Input.is_action_just_pressed("b_btn"):
			_pick = -1
		elif opts.has("keys"):
			for k in ["ui_left", "ui_right"]:
				if Input.is_action_just_pressed(k):
					var f := get_viewport().gui_get_focus_owner()
					var r = opts.keys.call(k, btns.find(f))
					if r != null:
						_pick = r
		await get_tree().process_frame
	layer.queue_free()
	_picker = null
	return int(_pick)


## 목록 위쪽 미리보기 칸 (list의 on_move 안에서 채운다)
func preview() -> Control:
	if _picker and _picker.has_meta("preview"):
		var p: Control = _picker.get_meta("preview")
		for c in p.get_children():
			c.queue_free()
		return p
	return null


func icon_tex(icon) -> Texture2D:
	if icon is Texture2D:
		return icon
	if icon is Array:
		var at := AtlasTexture.new()
		at.atlas = Data.tex[icon[0]]
		at.region = Data.tight(icon[0], int(icon[1]))
		return at
	return null


# ---------------- 버튼 판 ----------------
## buttons: [{text, rect, color, disabled}] → 고른 번호 (B = cancel)
func buttons(list_: Array, cancel := -1, start := 0) -> int:
	if Game.auto_text:
		await get_tree().process_frame
		return cancel if cancel >= 0 else start
	var layer := Control.new()
	layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(layer)
	_picker = layer
	_pick = null
	var btns: Array = []
	for i in list_.size():
		var e: Dictionary = list_[i]
		var b := UI.button(layer, e.text, e.rect, e.get("color", Color(0.38, 0.45, 0.6)), e.get("size", 32))
		b.disabled = e.get("disabled", false)
		b.pressed.connect(func() -> void: _pick = i)
		btns.append(b)
	_link_focus(btns, true)
	if btns.size():
		var f: Button = btns[clampi(start, 0, btns.size() - 1)]
		if f.disabled:
			for b in btns:
				if not b.disabled:
					f = b
					break
		f.grab_focus()
	while _pick == null:
		if cancel != -2 and Input.is_action_just_pressed("b_btn"):
			_pick = cancel
		await get_tree().process_frame
	layer.queue_free()
	_picker = null
	return int(_pick)


# ---------------- 수량 ----------------
func number(max_n: int, price: int, title: String) -> int:
	if Game.auto_text:
		await get_tree().process_frame
		return 1
	var s := vs()
	var layer := Control.new()
	layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(layer)
	_picker = layer
	_pick = null
	var n := [1]
	var p := UI.panel(layer, Rect2(60, s.y * 0.5 - 200, s.x - 120, 320))
	UI.label(p, title, Vector2(30, 20), 32)
	var lbl := UI.label(p, "", Vector2(30, 90), 56)
	var sub := UI.label(p, "", Vector2(30, 170), 28, Color(0.3, 0.35, 0.45))
	var upd := func() -> void:
		lbl.text = "× %d" % n[0]
		sub.text = "합계 %s" % Game.money(n[0] * price) if price > 0 else ""
	upd.call()
	var mk := func(t: String, r: Rect2, d: int) -> void:
		var b := UI.button(layer, t, r, Color(0.35, 0.5, 0.75), 36)
		b.pressed.connect(func() -> void:
			n[0] = clampi(n[0] + d, 1, max_n)
			upd.call())
	mk.call("▲", Rect2(s.x - 280, s.y * 0.5 - 170, 90, 80), 1)
	mk.call("▼", Rect2(s.x - 280, s.y * 0.5 - 70, 90, 80), -1)
	mk.call("+10", Rect2(s.x - 180, s.y * 0.5 - 170, 90, 80), 10)
	mk.call("-10", Rect2(s.x - 180, s.y * 0.5 - 70, 90, 80), -10)
	var ok := UI.button(layer, "결정", Rect2(60, s.y * 0.5 + 140, (s.x - 140) / 2, 90), Color(0.3, 0.6, 0.4), 34)
	ok.pressed.connect(func() -> void: _pick = n[0])
	var cc := UI.button(layer, "취소", Rect2(80 + (s.x - 140) / 2, s.y * 0.5 + 140, (s.x - 140) / 2, 90), Color(0.4, 0.42, 0.5), 34)
	cc.pressed.connect(func() -> void: _pick = 0)
	ok.grab_focus()
	while _pick == null:
		if Input.is_action_just_pressed("ui_up"):
			n[0] = mini(max_n, n[0] + 1)
			upd.call()
		elif Input.is_action_just_pressed("ui_down"):
			n[0] = maxi(1, n[0] - 1)
			upd.call()
		elif Input.is_action_just_pressed("b_btn"):
			_pick = 0
		await get_tree().process_frame
	layer.queue_free()
	_picker = null
	return int(_pick)


# ---------------- 이름 입력 ----------------
func name_input(title: String, def := "", max_len := 6, sug := [], allow_empty := false) -> String:
	if Game.auto_text:
		return def if def != "" else (sug[0] if sug.size() else "하늘")
	var s := vs()
	var layer := Control.new()
	layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(layer)
	_picker = layer
	_pick = null
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.1, 0.16, 0.7)
	bg.size = s
	layer.add_child(bg)
	var p := UI.panel(layer, Rect2(30, 160, s.x - 60, 560))
	UI.label(p, title, Vector2(30, 24), 34)
	var le := LineEdit.new()
	le.position = Vector2(30, 90)
	le.size = Vector2(p.size.x - 60, 90)
	le.max_length = max_len
	le.text = def
	le.placeholder_text = "최대 %d자" % max_len
	le.add_theme_font_size_override("font_size", 40)
	p.add_child(le)
	for i in sug.size():
		var b := UI.button(p, sug[i], Rect2(30 + (i % 4) * ((p.size.x - 60) / 4.0), 210 + (i / 4) * 90, (p.size.x - 60) / 4.0 - 10, 76), Color(0.45, 0.55, 0.7), 28)
		b.pressed.connect(func() -> void: le.text = sug[i])
	var ok := UI.button(p, "결정", Rect2(30, 440, p.size.x - 60, 90), Color(0.3, 0.6, 0.4), 34)
	ok.pressed.connect(func() -> void:
		if le.text.strip_edges() != "" or allow_empty:
			_pick = le.text.strip_edges())
	le.text_submitted.connect(func(_t: String) -> void: ok.pressed.emit())
	le.grab_focus()
	while _pick == null:
		if Input.is_action_just_pressed("ui_text_submit") and (le.text.strip_edges() != "" or allow_empty):
			_pick = le.text.strip_edges()
		await get_tree().process_frame
	layer.queue_free()
	_picker = null
	return str(_pick)


# ---------------- 알림 ----------------
func toast(t: String) -> void:
	var s := vs()
	var l := UI.label(self, t, Vector2(0, 120), 28, Color.WHITE)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.1, 0.12, 0.18, 0.85)
	sb.set_corner_radius_all(16)
	sb.content_margin_left = 20
	sb.content_margin_right = 20
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	l.add_theme_stylebox_override("normal", sb)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.size = Vector2(s.x - 80, 0)
	l.position.x = 40
	l.modulate.a = 0
	var tw := l.create_tween()
	tw.tween_property(l, "modulate:a", 1.0, 0.15)
	tw.tween_interval(1.6)
	tw.tween_property(l, "modulate:a", 0.0, 0.3)
	tw.tween_callback(l.queue_free)
