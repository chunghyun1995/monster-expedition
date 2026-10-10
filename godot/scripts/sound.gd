extends Node
## 소리 (autoload Sound). 웹 게임 src/audio.js의 칩튠 BGM·효과음·팡파르·울음소리를
## tools/render-audio.cjs로 미리 녹음한 OGG를 재생한다. 음량 비율은 웹 게임과 같다.
##   Sound.music("town")  Sound.sfx("hit")  await Sound.jingle("badge")  await Sound.cry(sid)

const DIR := "res://assets/audio/"
const BGM_LEVELS := [0.0, 0.028, 0.045, 0.065, 0.09, 0.12]   # 웹 게임 SET.bgm 0~5
const BOOST := 1.2        # 휴대폰 스피커용으로 웹 게임보다 조금 크게 (BGM·효과음 비율은 그대로)

## 기술별 효과음 (웹 게임 battle.js 기술 연출에서 나는 소리)
const MOVE_SFX := {
	"punch": ["hit"], "kick": ["throw", "super"], "bluster": ["statdn"], "megapunch": ["super"],
	"tackle": ["throw", "hit"], "scratch": ["hit"], "growl": ["bad"], "tailwag": ["sparkle"],
	"harden": ["statup"], "quick": ["wind", "hit"], "headbutt": ["throw", "super"], "focus": ["statup"],
	"sing": ["sleep"], "takedown": ["run", "super"], "struggle": ["hit"], "ember": ["burn"],
	"flamewheel": ["burn", "super"], "willo": ["sparkle"], "firefang": ["hit", "burn"],
	"flameburst": ["burn", "super"], "bubble": ["splash"], "watergun": ["splash"], "withdraw": ["statup"],
	"aquatail": ["splash"], "wave": ["splash"], "vine": ["leaf", "hit"], "absorb": ["absorb"],
	"leaf": ["leaf", "hit"], "sleeppowder": ["sparkle"], "growth": ["statup"], "petal": ["wind"],
	"thundershock": ["bolt"], "spark": ["bolt", "hit"], "thunderwave": ["bolt"], "thunder": ["bolt"],
	"rockthrow": ["throw", "rock"], "rocktomb": ["rock"], "rockslide": ["rock", "rock"], "defcurl": ["rock"],
	"mudslap": ["splash"], "dig": ["shake"], "bulldoze": ["shake"], "gust": ["wind"], "wing": ["wind", "hit"],
	"aerial": ["wind", "super"], "stringshot": ["sparkle"], "bite": ["hit"], "silver": ["wind"],
	"leechsting": ["throw", "hit"], "poisonsting": ["throw", "poison"], "acid": ["poison"],
	"toxspore": ["poison"],
}
const TYPE_SFX := {"electric": "bolt", "rock": "rock", "ground": "shake", "flying": "wind", "grass": "leaf",
	"poison": "poison", "fire": "burn", "water": "splash"}

var meta: Dictionary = {}
var cur := ""             # 지금 BGM
var want := ""            # 팡파르가 끝나면 돌아갈 BGM
var jingling := false
var _bgm: AudioStreamPlayer
var _jin: AudioStreamPlayer
var _sfx: Array[AudioStreamPlayer] = []
var _cry: AudioStreamPlayer
var _cache := {}
var _bg_paused := false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	var f := FileAccess.open("res://data/audio.json", FileAccess.READ)
	if f:
		meta = JSON.parse_string(f.get_as_text())
	_bgm = _player()
	_jin = _player()
	_cry = _player()
	for i in 8:
		_sfx.append(_player())
	apply_volume()


func _player() -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	add_child(p)
	return p


func _load(rel: String) -> AudioStream:
	if _cache.has(rel):
		return _cache[rel]
	var path := DIR + rel + ".ogg"
	var s: AudioStream = load(path) if ResourceLoader.exists(path) else null
	_cache[rel] = s
	return s


## 설정 음량 반영: BGM 0~5단계, 효과음 켜기/끄기
func apply_volume() -> void:
	if meta.is_empty():
		return
	var lv: float = BGM_LEVELS[clampi(int(Game.settings.get("bgm", 3)), 0, 5)]
	var bv := lv / float(meta.bgm_gain) / float(meta.bgm_scale) * BOOST
	var sv := (1.0 / float(meta.sfx_scale) * BOOST) if int(Game.settings.get("sfx", 1)) else 0.0
	for p in [_bgm, _jin]:
		p.volume_db = linear_to_db(maxf(bv, 0.00001))
	for p in _sfx + [_cry]:
		p.volume_db = linear_to_db(maxf(sv, 0.00001))
	if lv <= 0.0:
		_bgm.stop()
	elif cur != "" and not _bgm.playing and not jingling:
		_start(cur)


# ---------------- BGM ----------------
func music(name: String, force := false) -> void:
	want = name
	if name == cur and not force and (_bgm.playing or jingling):
		return
	cur = name
	_bgm.stop()
	if name == "" or jingling:
		return
	_start(name)


func _start(name: String) -> void:
	if int(Game.settings.get("bgm", 3)) <= 0:
		return
	var s := _load("bgm/" + name)
	if s == null:
		return
	if s is AudioStreamOggVorbis:
		(s as AudioStreamOggVorbis).loop = bool(meta.bgm.get(name, {}).get("loop", true))
	_bgm.stream = s
	_bgm.play()


func stop_music(keep_want := false) -> void:
	_bgm.stop()
	cur = ""
	if not keep_want:
		want = ""


## 짧은 팡파르: BGM을 잠시 멈추고 연주한 뒤, 하던 곡을 처음부터 다시 (웹 게임과 같음)
func jingle(name: String) -> void:
	var s := _load("jingle/" + name)
	var resume := cur if cur != "" else want
	if s == null or Game.auto_text:
		return
	_bgm.stop()
	cur = ""
	jingling = true
	_jin.stream = s
	_jin.play()
	await get_tree().create_timer(float(meta.jingle.get(name, 1.0)) + 0.1).timeout
	jingling = false
	var to := want if want != "" else resume
	if to != "":
		cur = ""
		music(to)


# ---------------- 효과음 ----------------
func sfx(name: String, pitch := 1.0) -> void:
	if name == "" or int(Game.settings.get("sfx", 1)) == 0:
		return
	var s := _load("sfx/" + name)
	if s == null:
		return
	if name == "exp":
		pitch = randf_range(1.0, 1.4)
	var p: AudioStreamPlayer = _sfx[0]
	for q in _sfx:
		if not q.playing:
			p = q
			break
	_sfx.erase(p)
	_sfx.append(p)      # 가장 오래 전에 쓴 것부터 다시 쓴다
	p.stream = s
	p.pitch_scale = pitch
	p.play()


## 기술 효과음 (motion 연출 타이밍에 맞춰 순서대로)
func move_sfx(id: String, type := "") -> Array:
	if MOVE_SFX.has(id):
		return MOVE_SFX[id]
	return [TYPE_SFX.get(type, "hit")]


## 울음소리. 사람은 울음 대신 짧은 효과음. faint면 낮고 길게 (웹 게임: 음높이 0.7배, 길이 1.4배)
func cry(sid, faint := false) -> void:
	var sp: Dictionary = Data.species(int(sid))
	if sp.has("human"):
		if not faint:
			sfx("sel")
		return
	if int(Game.settings.get("sfx", 1)) == 0:
		return
	var s := _load("cry/%d" % int(sid))
	if s == null:
		return
	_cry.stream = s
	_cry.pitch_scale = 0.7 if faint else 1.0
	_cry.play()
	if not Game.auto_text:
		await get_tree().create_timer(float(meta.cry.get(str(int(sid)), 0.5)) / _cry.pitch_scale).timeout


# ---------------- 앱이 뒤로 가면 멈춤 ----------------
func _notification(what: int) -> void:
	var out := what == NOTIFICATION_APPLICATION_PAUSED or (OS.has_feature("web") and what == NOTIFICATION_APPLICATION_FOCUS_OUT)
	var back := what == NOTIFICATION_APPLICATION_RESUMED or (OS.has_feature("web") and what == NOTIFICATION_APPLICATION_FOCUS_IN)
	if out and not _bg_paused:
		_bg_paused = true
		AudioServer.set_bus_mute(0, true)
	elif back and _bg_paused:
		_bg_paused = false
		AudioServer.set_bus_mute(0, false)
