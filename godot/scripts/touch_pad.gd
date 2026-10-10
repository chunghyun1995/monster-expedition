class_name TouchPad
extends Control
## 화면 십자 패드와 A/B 버튼. 여러 손가락을 따로 추적해 입력 동작(go_*, a_btn, b_btn)을 눌러 준다.

const DIRS := ["go_right", "go_down", "go_left", "go_up"]
var _pad_center := Vector2.ZERO
var _pad_r := 110.0
var _btns := {}           # action → [center, radius]
var _touch := {}          # index → action
var _knob := Vector2.ZERO


func _init() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _process(_d: float) -> void:
	var s := size
	_pad_center = Vector2(150, s.y - 170)
	_btns = {"a_btn": [Vector2(s.x - 110, s.y - 210), 64.0], "b_btn": [Vector2(s.x - 240, s.y - 120), 54.0]}
	queue_redraw()


func _draw() -> void:
	var held := _touch.values()
	draw_circle(_pad_center, _pad_r, Color(0, 0, 0, 0.18))
	draw_arc(_pad_center, _pad_r, 0, TAU, 48, Color(1, 1, 1, 0.35), 4.0, true)
	for i in 4:
		var a := i * PI / 2
		var on := held.has(DIRS[i])
		var c := _pad_center + Vector2.from_angle(a) * _pad_r * 0.62
		var tri := PackedVector2Array([c + Vector2.from_angle(a) * 22, c + Vector2.from_angle(a + 2.3) * 18, c + Vector2.from_angle(a - 2.3) * 18])
		draw_colored_polygon(tri, Color(1, 1, 1, 0.9 if on else 0.5))
	draw_circle(_pad_center + _knob, 38, Color(1, 1, 1, 0.28))
	for k in _btns:
		var b: Array = _btns[k]
		var on := held.has(k)
		var col := Color(0.88, 0.34, 0.42) if k == "a_btn" else Color(0.35, 0.45, 0.62)
		draw_circle(b[0] + Vector2(0, 5), b[1], Color(0, 0, 0, 0.25))
		draw_circle(b[0] + Vector2(0, 3 if on else 0), b[1], col.darkened(0.2) if on else Color(col, 0.85))
		draw_string(get_theme_default_font(), b[0] + Vector2(-14, 14 + (3 if on else 0)), "A" if k == "a_btn" else "B", HORIZONTAL_ALIGNMENT_LEFT, -1, 40, Color.WHITE)


func _input(e: InputEvent) -> void:
	if not is_visible_in_tree():
		return
	var idx := -2
	var pos := Vector2.ZERO
	var pressed := false
	var moved := false
	if e is InputEventScreenTouch:
		idx = e.index
		pos = e.position
		pressed = e.pressed
	elif e is InputEventScreenDrag:
		idx = e.index
		pos = e.position
		moved = true
	elif e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT and not e.device == InputEvent.DEVICE_ID_EMULATION:
		idx = -1
		pos = e.position
		pressed = e.pressed
	elif e is InputEventMouseMotion and _touch.has(-1) and not e.device == InputEvent.DEVICE_ID_EMULATION:
		idx = -1
		pos = e.position
		moved = true
	else:
		return
	pos = get_global_transform_with_canvas().affine_inverse() * pos
	if moved:
		if _touch.has(idx) and str(_touch[idx]).begins_with("go_"):
			_assign(idx, _dir_action(pos))
			get_viewport().set_input_as_handled()
		return
	if pressed:
		var act := _hit(pos)
		if act != "":
			_assign(idx, act)
			get_viewport().set_input_as_handled()
	elif _touch.has(idx):
		_assign(idx, "")
		get_viewport().set_input_as_handled()


func _hit(pos: Vector2) -> String:
	if pos.distance_to(_pad_center) < _pad_r * 1.25:
		return _dir_action(pos)
	for k in _btns:
		if pos.distance_to(_btns[k][0]) < _btns[k][1] * 1.3:
			return k
	return ""


func _dir_action(pos: Vector2) -> String:
	var v := pos - _pad_center
	_knob = v.limit_length(_pad_r * 0.5)
	if v.length() < 14:
		return "go_none"
	var i := int(round(v.angle() / (PI / 2))) % 4
	return DIRS[(i + 4) % 4]


func _assign(idx: int, act: String) -> void:
	var old: String = _touch.get(idx, "")
	if old == act:
		return
	if old != "" and old != "go_none":
		Input.action_release(old)
	if act == "":
		_touch.erase(idx)
		if not _touch.values().any(func(x: String) -> bool: return x.begins_with("go_")):
			_knob = Vector2.ZERO
		return
	_touch[idx] = act
	if act != "go_none":
		Input.action_press(act)
		var ev := InputEventAction.new()
		ev.action = act
		ev.pressed = true
		Input.parse_input_event(ev)


func release_all() -> void:
	for idx in _touch.keys():
		_assign(idx, "")
