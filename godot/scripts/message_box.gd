class_name MessageBox
extends Control
## 대화창: 한 글자씩 나오고, A(Z)·화면 터치로 넘긴다. 선택지도 띄운다.

signal advanced

var _panel: Panel
var _text: Label
var _name_tag: Label
var _arrow: Label
var _typing := false
var _tw: Tween
var _waiting := false
var auto_close := true


func _init() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func build(rect: Rect2) -> MessageBox:
	_panel = UI.panel(self, rect)
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_panel.gui_input.connect(_on_gui)
	_text = UI.label(_panel, "", Vector2(28, 22), 32)
	_text.size = Vector2(rect.size.x - 56, rect.size.y - 40)
	_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_text.add_theme_constant_override("line_spacing", 10)
	_name_tag = UI.label(self, "", rect.position + Vector2(24, -44), 26, Color.WHITE)
	var tag := StyleBoxFlat.new()
	tag.bg_color = Color(0.27, 0.42, 0.45)
	tag.set_corner_radius_all(12)
	tag.content_margin_left = 16
	tag.content_margin_right = 16
	tag.content_margin_top = 4
	tag.content_margin_bottom = 4
	_name_tag.add_theme_stylebox_override("normal", tag)
	_name_tag.visible = false
	_arrow = UI.label(_panel, "▼", Vector2(rect.size.x - 54, rect.size.y - 48), 26, Color(0.85, 0.35, 0.35))
	_arrow.visible = false
	visible = false
	return self


func say(text: String, who := "", wait_input := true) -> void:
	visible = true
	_name_tag.text = who
	_name_tag.visible = who != ""
	_text.text = text
	_text.visible_ratio = 0.0
	_arrow.visible = false
	_typing = true
	_tw = create_tween()
	_tw.tween_property(_text, "visible_ratio", 1.0, clampf(text.length() * 0.028, 0.15, 1.6))
	_tw.finished.connect(func() -> void: _typing = false)
	while _typing:
		await get_tree().process_frame
	if not wait_input:
		return
	_arrow.visible = true
	var at := _arrow.create_tween().set_loops()
	at.tween_property(_arrow, "position:y", _arrow.position.y + 8, 0.35).set_trans(Tween.TRANS_SINE)
	at.tween_property(_arrow, "position:y", _arrow.position.y, 0.35).set_trans(Tween.TRANS_SINE)
	_waiting = true
	await advanced
	at.kill()
	_arrow.visible = false
	if auto_close:
		visible = false


func hide_box() -> void:
	visible = false


## 선택지: 고른 번호를 돌려준다 (B는 마지막 항목)
func choose(text: String, options: Array, who := "") -> int:
	await say(text, who, false)
	var layer := Control.new()
	layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(layer)
	var picked := [-1]
	var w := 300.0
	var h := 82.0
	var x := _panel.position.x + _panel.size.x - w
	var y := _panel.position.y - (h + 12) * options.size() - 8
	var first: Button
	for i in options.size():
		var b := UI.button(layer, options[i], Rect2(x, y + i * (h + 12), w, h), Color(0.25, 0.5, 0.75) if i == 0 else Color(0.42, 0.45, 0.52), 30)
		b.pressed.connect(func() -> void: picked[0] = i)
		if i == 0:
			first = b
		b.modulate.a = 0
		b.create_tween().tween_property(b, "modulate:a", 1.0, 0.15).set_delay(i * 0.05)
	first.grab_focus()
	while picked[0] < 0:
		if Input.is_action_just_pressed("b_btn"):
			picked[0] = options.size() - 1
		await get_tree().process_frame
	layer.queue_free()
	visible = false
	return picked[0]


func _on_gui(e: InputEvent) -> void:
	if e is InputEventMouseButton and e.pressed:
		_advance()


func _unhandled_input(e: InputEvent) -> void:
	if visible and (e.is_action_pressed("a_btn") or e.is_action_pressed("b_btn")):
		_advance()
		get_viewport().set_input_as_handled()


func _advance() -> void:
	if _typing:
		if _tw:
			_tw.kill()
		_text.visible_ratio = 1.0
		_typing = false
		return
	if _waiting:
		_waiting = false
		advanced.emit()
