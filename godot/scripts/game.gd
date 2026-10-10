extends Node
## 게임 상태(리포트)와 몬스터 계산. 기존 웹 게임(mon.js·world.js·menus.js)과 같은 공식·같은 데이터 구조.
## g: 저장되는 모든 것 (이름·돈·파티·보관함·가방·깃발·도감·배지·회복 지점·위치 …)

const SAVE_PATH := "user://report.save"
const SETTINGS_PATH := "user://settings.cfg"
const RIVAL := "도윤"
const COUNTER := {1: 4, 4: 7, 7: 1, 17: 27}
const DIGK := "영일이삼사오육칠팔구"

var g: Dictionary = {}
var settings := {"text": 1, "anim": 1, "bgm": 3, "sfx": 1, "style": 0, "tips": 1, "autoBattle": 0}
var dev := ""
var auto_text := false      # 개발용: 대화를 자동으로 넘김

var _fade: ColorRect
var _fade_layer: CanvasLayer
var _rng_state := 1


func _ready() -> void:
	randomize()
	_keys("a_btn", [KEY_Z, KEY_ENTER, KEY_SPACE, KEY_KP_ENTER])
	_keys("b_btn", [KEY_X, KEY_BACKSPACE, KEY_ESCAPE])
	_keys("menu_btn", [KEY_C, KEY_M, KEY_TAB])
	_keys("run", [KEY_SHIFT, KEY_X])
	_keys("ui_accept", [KEY_Z])
	_keys("ui_cancel", [KEY_X])
	_keys("go_up", [KEY_UP, KEY_W])
	_keys("go_down", [KEY_DOWN, KEY_S])
	_keys("go_left", [KEY_LEFT, KEY_A])
	_keys("go_right", [KEY_RIGHT, KEY_D])
	_load_settings()
	_fade_layer = CanvasLayer.new()
	_fade_layer.layer = 100
	add_child(_fade_layer)
	_fade = ColorRect.new()
	_fade.color = Color(0.05, 0.06, 0.09, 0)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade_layer.add_child(_fade)
	new_game("하늘")


## 안드로이드 뒤로 가기 = B 버튼
func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_GO_BACK_REQUEST:
		var ev := InputEventAction.new()
		ev.action = "b_btn"
		ev.pressed = true
		Input.parse_input_event(ev)
		var up := InputEventAction.new()
		up.action = "b_btn"
		up.pressed = false
		Input.call_deferred("parse_input_event", up)


func _keys(action: String, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for k in keys:
		var e := InputEventKey.new()
		e.physical_keycode = k
		InputMap.action_add_event(action, e)


func _process(delta: float) -> void:
	if not g.is_empty():
		g.play_ms = float(g.get("play_ms", 0)) + delta * 1000.0


# ---------------- 새 게임 / 저장 ----------------
func new_game(name: String) -> void:
	g = {"v": 2, "name": name, "id": "%05d" % (randi() % 65536), "money": 3000, "party": [], "box": [], "bag": {},
		"map": "home", "x": 7, "y": 3, "dir": "down", "flags": {}, "seen": {}, "caught": {},
		"badges": [0, 0, 0, 0, 0], "heal": {"map": "home", "x": 4, "y": 6}, "steps": 0, "play_ms": 0.0,
		"start": Time.get_unix_time_from_system(), "starter": 0, "rival_starter": 4}


func save_game() -> bool:
	g.saved_at = Time.get_unix_time_from_system()
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		return false
	f.store_var(g)
	f.close()
	return true


func read_save() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return {}
	var v = f.get_var()
	return v if v is Dictionary else {}


func load_save(s: Dictionary) -> void:
	g = s
	for m in g.party + g.box:
		m.hp = mini(int(m.hp), max_hp(m))


func _load_settings() -> void:
	var c := ConfigFile.new()
	if c.load(SETTINGS_PATH) == OK:
		for k in settings:
			settings[k] = c.get_value("s", k, settings[k])


func save_settings() -> void:
	var c := ConfigFile.new()
	for k in settings:
		c.set_value("s", k, settings[k])
	c.save(SETTINGS_PATH)


# ---------------- 몬스터 ----------------
func sp(sid) -> Dictionary:
	return Data.species(int(sid))


func exp_for(lv: int) -> int:
	return 0 if lv <= 1 else lv * lv * lv


func calc(m: Dictionary) -> Array:
	var b: Array = sp(m.sid).b
	var lv: int = int(m.lv)
	var nat: Array = Data.D.natures[int(m.nat)]
	var iv: Array = m.iv
	var s := [int(floor((2 * b[0] + iv[0]) * lv / 100.0)) + lv + 10]
	for i in range(1, 6):
		var v := int(floor((2 * b[i] + iv[i]) * lv / 100.0)) + 5
		if int(nat[1]) == i and int(nat[2]) != i:
			v = int(floor(v * 1.1))
		if int(nat[2]) == i and int(nat[1]) != i:
			v = int(floor(v * 0.9))
		s.append(v)
	return s


func max_hp(m: Dictionary) -> int:
	return calc(m)[0]


func make_mon(sid: int, lv: int, opts := {}) -> Dictionary:
	var s: Dictionary = sp(sid)
	var known: Array = []
	for e in s.ls:
		if int(e[0]) <= lv:
			known.erase(e[1])
			known.append(e[1])
	var moves: Array = []
	for id in known.slice(maxi(0, known.size() - 4)):
		moves.append({"id": id, "pp": int(Data.move(id).pp)})
	var iv: Array = []
	for i in 6:
		iv.append(randi() % 32)
	var m := {"sid": sid, "lv": lv, "exp": exp_for(lv), "nick": "", "moves": moves, "iv": iv,
		"nat": randi() % Data.D.natures.size(), "shiny": opts.shiny if opts.has("shiny") else randi() % 256 == 0,
		"st": "", "slp": 0, "hp": 1, "met": opts.get("met", null), "ot": opts.get("ot", null)}
	m.hp = max_hp(m)
	return m


func heal_mon(m: Dictionary) -> void:
	m.hp = max_hp(m)
	m.st = ""
	m.slp = 0
	for x in m.moves:
		x.pp = int(Data.move(x.id).pp)


func heal_party() -> void:
	for m in g.party:
		heal_mon(m)


func add_mon(m: Dictionary) -> String:
	if g.party.size() < 6:
		g.party.append(m)
		return "party"
	m.box_at = Time.get_unix_time_from_system()
	g.box.append(m)
	return "box"


func name_of(m: Dictionary) -> String:
	return m.nick if str(m.get("nick", "")) != "" else sp(m.sid).n


func human_sid(look: String) -> int:
	return int(Data.D.human_sid.get(look, Data.D.human_sid.man))


func is_human(m: Dictionary) -> bool:
	return sp(m.sid).has("human")


func alive() -> Array:
	return g.party.filter(func(m: Dictionary) -> bool: return m.hp > 0)


func top_level() -> int:
	var t := 1
	for m in g.party:
		t = maxi(t, int(m.lv))
	return t


func rival_team(stage: int) -> Array:
	var r: int = int(g.rival_starter)
	if stage == 1:
		return [[r, 5]]
	if stage == 2:
		return [[10, 9], [15, 9], [r, 12]]
	if stage == 3:
		return [[11, 16], [17, 15], [21, 16], [r + 1, 19]]
	var mid: int = int(sp(r).ev[1]) if sp(r).has("ev") else r
	if stage == 4:
		return [[11, 25], [18, 24], [22, 25], [mid, 28]]
	var fin := r
	while sp(fin).has("ev"):
		fin = int(sp(fin).ev[1])
	return [[11, 39], [18, 38], [22, 39], [24, 38], [fin, 42]]


func flag(k: String) -> bool:
	return bool(g.flags.get(k, 0))


func set_flag(k: String, v = 1) -> void:
	g.flags[k] = v


func badge_count() -> int:
	var n := 0
	for b in g.badges:
		n += 1 if b else 0
	return n


# ---------------- 글자 ----------------
## 한국어 조사: 이/가, 은/는, 을/를, 과/와, 아/야, 로/으로, 이라/라 (숫자 받침 포함)
func josa(w, p: String) -> String:
	var s := str(w)
	if s.is_empty():
		return s
	var ch := s.right(1)
	if ch >= "0" and ch <= "9":
		ch = DIGK[int(ch)]
	var c := ch.unicode_at(0)
	var jong := 0
	if c >= 0xAC00 and c <= 0xD7A3:
		jong = (c - 0xAC00) % 28
	elif "lmnrLMNR".contains(ch):
		jong = 1
	match p:
		"로":
			return s + ("으로" if jong != 0 and jong != 8 else "로")
		"이라":
			return s + ("이라" if jong else "라")
		"이":
			return s + ("이" if jong else "가")
		"은":
			return s + ("은" if jong else "는")
		"을":
			return s + ("을" if jong else "를")
		"과":
			return s + ("과" if jong else "와")
		"아":
			return s + ("아" if jong else "야")
	return s


## @ = 주인공 이름, @아/@이/@은/@을/@과 = 이름 + 조사
func fmt_name(l: String) -> String:
	var re := RegEx.create_from_string("@(아|이|은|을|과)?")
	var out := ""
	var at := 0
	for m in re.search_all(l):
		out += l.substr(at, m.get_start() - at)
		out += josa(g.name, m.get_string(1)) if m.get_string(1) != "" else str(g.name)
		at = m.get_end()
	return out + l.substr(at)


func money(n) -> String:
	var s := str(int(n))
	var out := ""
	while s.length() > 3:
		out = "," + s.right(3) + out
		s = s.left(s.length() - 3)
	return s + out + "원"


func fmt_time(ms: float) -> String:
	var m := int(ms / 60000.0)
	return "%d:%02d" % [m / 60, m % 60]


## 기존 게임과 같은 xorshift 난수 (무한의 탑 팀 구성용)
func rng_seed(seed: int) -> void:
	_rng_state = (seed * 2654435761) & 0xFFFFFFFF
	if _rng_state == 0:
		_rng_state = 1


func rng_next() -> float:
	var s := _rng_state
	s ^= (s << 13) & 0xFFFFFFFF
	s ^= s >> 17
	s ^= (s << 5) & 0xFFFFFFFF
	_rng_state = s & 0xFFFFFFFF
	return float(_rng_state) / 4294967296.0


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
