extends Node
## 게임 상태(파티·가방)와 장면 전환. 몬스터 계산은 기존 웹 게임(mon.js)과 같은 공식.

signal battle_finished(result: String)

var party: Array = []
var bag := {"ball": 6, "great": 2, "potion": 3}
var player_name := "하늘"
var flags := {}
var map_id := "town"
var spawn := Vector2i(4, 13)
var facing := "up"
var steps := 0
var dev := ""

var _fade: ColorRect
var _fade_layer: CanvasLayer


func _ready() -> void:
	randomize()
	_keys("a_btn", [KEY_Z, KEY_ENTER, KEY_SPACE, KEY_KP_ENTER])
	_keys("b_btn", [KEY_X, KEY_BACKSPACE, KEY_ESCAPE])
	_keys("run", [KEY_SHIFT, KEY_X])
	_keys("ui_accept", [KEY_Z])
	_keys("ui_cancel", [KEY_X])
	_keys("go_up", [KEY_UP, KEY_W])
	_keys("go_down", [KEY_DOWN, KEY_S])
	_keys("go_left", [KEY_LEFT, KEY_A])
	_keys("go_right", [KEY_RIGHT, KEY_D])
	reset()
	_fade_layer = CanvasLayer.new()
	_fade_layer.layer = 100
	add_child(_fade_layer)
	_fade = ColorRect.new()
	_fade.color = Color(0.05, 0.06, 0.09, 0)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade_layer.add_child(_fade)


func reset() -> void:
	party = [make_mon(1, 8)]
	bag = {"ball": 6, "great": 2, "potion": 3}
	map_id = "town"
	spawn = Vector2i(4, 13)
	facing = "up"


func _keys(action: String, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for k in keys:
		var e := InputEventKey.new()
		e.physical_keycode = k
		InputMap.action_add_event(action, e)


# ---------------- 몬스터 ----------------
func exp_for(lv: int) -> int:
	return 0 if lv <= 1 else lv * lv * lv


func calc(m: Dictionary) -> Array:
	var b: Array = Data.species(m.sid).b
	var lv: int = m.lv
	var nat: Array = Data.D.natures[m.nat]
	var s := [int(floor((2 * b[0] + m.iv[0]) * lv / 100.0)) + lv + 10]
	for i in range(1, 6):
		var v := int(floor((2 * b[i] + m.iv[i]) * lv / 100.0)) + 5
		if int(nat[1]) == i and int(nat[2]) != i:
			v = int(floor(v * 1.1))
		if int(nat[2]) == i and int(nat[1]) != i:
			v = int(floor(v * 0.9))
		s.append(v)
	return s


func max_hp(m: Dictionary) -> int:
	return calc(m)[0]


func make_mon(sid: int, lv: int, opts := {}) -> Dictionary:
	var sp: Dictionary = Data.species(sid)
	var known: Array = []
	for e in sp.ls:
		if int(e[0]) <= lv:
			known.erase(e[1])
			known.append(e[1])
	var moves: Array = []
	for id in known.slice(maxi(0, known.size() - 4)):
		moves.append({"id": id, "pp": int(Data.move(id).pp)})
	var iv: Array = []
	for i in 6:
		iv.append(randi() % 32)
	var m := {"sid": sid, "lv": lv, "exp": exp_for(lv), "nick": opts.get("nick", ""), "moves": moves, "iv": iv,
		"nat": randi() % Data.D.natures.size(), "shiny": opts.get("shiny", randi() % 256 == 0), "st": "", "hp": 1}
	m.hp = max_hp(m)
	return m


func name_of(m: Dictionary) -> String:
	return m.nick if str(m.get("nick", "")) != "" else Data.species(m.sid).n


func heal_all() -> void:
	for m in party:
		m.hp = max_hp(m)
		m.st = ""
		for x in m.moves:
			x.pp = int(Data.move(x.id).pp)


## 한국어 조사: 이/가, 은/는, 을/를, 과/와, 아/야, 로/으로
func josa(w: String, p: String) -> String:
	if w.is_empty():
		return w
	var ch := w.unicode_at(w.length() - 1)
	var jong := 0
	if ch >= 0xAC00 and ch <= 0xD7A3:
		jong = (ch - 0xAC00) % 28
	elif "lmnrLMNR".contains(w.right(1)):
		jong = 1
	match p:
		"로":
			return w + ("으로" if jong != 0 and jong != 8 else "로")
		"이":
			return w + ("이" if jong else "가")
		"은":
			return w + ("은" if jong else "는")
		"을":
			return w + ("을" if jong else "를")
		"과":
			return w + ("과" if jong else "와")
		"아":
			return w + ("아" if jong else "야")
	return w


# ---------------- 화면 전환 ----------------
func fade_to(a: float, dur := 0.35) -> void:
	var tw := create_tween()
	tw.tween_property(_fade, "color:a", a, dur).set_trans(Tween.TRANS_SINE)
	await tw.finished


func change_scene(path: String) -> void:
	await fade_to(1.0)
	get_tree().change_scene_to_file(path)
	await get_tree().process_frame
	await get_tree().process_frame
	await fade_to(0.0)
