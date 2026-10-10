class_name UI
extends RefCounted
## 공통 UI: 둥근 패널, 버튼 스타일, 글자

const INK := Color(0.13, 0.16, 0.2)
const PAPER := Color(0.99, 0.98, 0.94)


static func box(bg: Color, border: Color, radius := 18, bw := 4) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(bw)
	s.set_corner_radius_all(radius)
	s.shadow_color = Color(0, 0, 0, 0.25)
	s.shadow_size = 6
	s.shadow_offset = Vector2(0, 4)
	s.content_margin_left = 22
	s.content_margin_right = 22
	s.content_margin_top = 14
	s.content_margin_bottom = 14
	return s


static func panel(parent: Node, rect: Rect2, bg := PAPER, border := Color(0.27, 0.33, 0.42)) -> Panel:
	var p := Panel.new()
	p.position = rect.position
	p.size = rect.size
	p.add_theme_stylebox_override("panel", box(bg, border))
	parent.add_child(p)
	return p


static func label(parent: Node, text: String, pos: Vector2, size := 30, color := INK) -> Label:
	var l := Label.new()
	l.text = text
	l.position = pos
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	parent.add_child(l)
	return l


static func button(parent: Node, text: String, rect: Rect2, color: Color, size := 32) -> Button:
	var b := Button.new()
	b.text = text
	b.clip_text = true
	b.position = rect.position
	b.size = rect.size
	var fitted := size
	var font := ThemeDB.get_default_theme().get_font("font", "Label")
	for line in text.split("\n"):
		while fitted > 16 and font.get_string_size(line, HORIZONTAL_ALIGNMENT_LEFT, -1, fitted).x > rect.size.x - 48:
			fitted -= 1
	b.add_theme_font_size_override("font_size", fitted)
	b.add_theme_color_override("font_color", Color.WHITE)
	b.add_theme_color_override("font_hover_color", Color.WHITE)
	b.add_theme_color_override("font_pressed_color", Color(1, 1, 0.85))
	b.add_theme_color_override("font_focus_color", Color.WHITE)
	b.add_theme_color_override("font_disabled_color", Color(1, 1, 1, 0.45))
	b.add_theme_constant_override("outline_size", 6)
	b.add_theme_color_override("font_outline_color", color.darkened(0.55))
	b.add_theme_stylebox_override("normal", box(color, color.darkened(0.35)))
	b.add_theme_stylebox_override("hover", box(color.lightened(0.1), color.darkened(0.35)))
	b.add_theme_stylebox_override("pressed", box(color.darkened(0.12), color.darkened(0.45)))
	b.add_theme_stylebox_override("disabled", box(color.darkened(0.35).lerp(Color(0.5, 0.5, 0.5), 0.5), color.darkened(0.5)))
	var f := box(color.lightened(0.12), Color(1, 0.86, 0.3), 18, 7)
	b.add_theme_stylebox_override("focus", f)
	parent.add_child(b)
	# 누르면 살짝 눌리는 느낌
	b.button_down.connect(func() -> void: b.pivot_offset = b.size / 2; b.create_tween().tween_property(b, "scale", Vector2(0.95, 0.95), 0.06))
	b.button_up.connect(func() -> void: b.create_tween().tween_property(b, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT))
	return b


## Container-managed width and vertical scrolling keep long descriptions readable.
static func scroll_text(parent: Node, value: String, rect: Rect2, font_size := 28) -> ScrollContainer:
	var scroll := ScrollContainer.new()
	scroll.name = "DescriptionScroll"
	scroll.position = rect.position
	scroll.size = rect.size
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	parent.add_child(scroll)
	var label := Label.new()
	label.name = "WrappedDescription"
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", INK)
	label.text = value
	scroll.add_child(label)
	return scroll


## 기다리기 (게임 시간과 무관)
static func wait(node: Node, sec: float) -> void:
	await node.get_tree().create_timer(sec, true, false, true).timeout
