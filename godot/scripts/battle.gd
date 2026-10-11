class_name Battle
extends CanvasLayer
## 전투: 기존 battle.js 의 규칙(데미지·명중·상태 이상·능력 변화·AI·도망·교체·경험치·상금·포획·빼앗기·화난 원정가·
## 사람과 맨손 승부·최후의 수단)을 그대로 옮기고, 메시 변형 퍼펫으로 동작을 새로 만들었다.

const HERO_ACT := [{"n": "돌 던지기", "acc": 92, "lo": 0.16, "hi": 0.24, "d": "안정적"}, {"n": "몸통 박치기", "acc": 72, "lo": 0.28, "hi": 0.4, "d": "위력 높음"}]
const FOE_ACT := [{"n": "주먹 날리기", "acc": 95, "lo": 0.14, "hi": 0.21}, {"n": "날아차기", "acc": 75, "lo": 0.25, "hi": 0.36}]
const BG_INDEX := {"grass": 0, "forest": 1, "city": 2, "rock": 3, "water": 4, "lab": 5}

var w: World
var o: Dictionary
var wild := false
var foe: Array = []
var fi := 0
var pi := 0
var st := {"p": [0, 0, 0, 0, 0, 0], "e": [0, 0, 0, 0, 0, 0]}
var flinch := {}
var moved := {}
var part: Array = []
var runs := 0
var leveled: Array = []
var used_item := false
var result := ""
var hero = null
var hero_used := false
var foe_hero = null
var stolen: Array = []
var captured = null
var gold := 0

var VS := Vector2(720, 1280)
var SH := 760.0
var FOE_POS := Vector2(500, 330)
var ME_POS := Vector2(205, 720)
var stage: Node2D
var hud: Control
var menu: Control
var fp: Puppet
var pp: Puppet
var tr: Puppet
var me: Puppet
var huds := {}


func fm() -> Dictionary:
	return foe[fi] if fi >= 0 and fi < foe.size() else {}


func pm() -> Dictionary:
	return Game.g.party[pi]


func side_mon(s: String) -> Dictionary:
	return pm() if s == "p" else fm()


func other(s: String) -> String:
	return "e" if s == "p" else "p"


func pup(s: String) -> Puppet:
	return pp if s == "p" else fp


func N(m: Dictionary) -> String:
	return Game.name_of(m)


func J(s, p: String) -> String:
	return Game.josa(s, p)


func tn() -> String:
	if o.get("cls", "") != "" and Data.D.tclass.has(o.cls):
		return "%s %s" % [Data.D.tclass[o.cls].n, o.name]
	return str(o.get("name", ""))


func bname(s: String) -> String:
	if s == "e":
		return ("야생 " if wild else "상대 ") + N(fm())
	return N(pm())


func look_of() -> String:
	if o.get("look", "") != "":
		return o.look
	if o.get("cls", "") != "" and Data.D.tclass.has(o.cls) and Data.D.tclass[o.cls].has("look"):
		return Data.D.tclass[o.cls].look
	return "man"


func bsay(t: String, wait := false) -> void:
	if wait:
		await Msg.say(t, "", {"keep": true})
	else:
		await Msg.say(t, "", {"keep": true, "auto": 0.45 + t.length() * 0.016})


func anim() -> bool:
	return int(Game.settings.anim) == 1


# =====================================================================
# 시작
# =====================================================================
func run(opts: Dictionary, world: World) -> String:
	o = opts
	w = world
	Auto.active_battle = self
	tree_exiting.connect(func() -> void: Auto.active_battle = null)
	wild = o.kind == "wild"
	for e in o.get("team", []):
		foe.append(Game.make_mon(int(e[0]), int(e[1]), {} if wild else {"shiny": false}))
	pi = maxi(0, Game.g.party.find(Game.alive()[0]) if Game.alive().size() else 0)
	if wild:
		fm().met = {"map": w.m.name, "lv": int(fm().lv)}
	VS = get_viewport().get_visible_rect().size
	SH = VS.y - 520.0
	FOE_POS = Vector2(VS.x * 0.74, SH * 0.84)
	ME_POS = Vector2(VS.x * 0.26, SH * 0.84)
	layer = 10
	_build()
	Sound.music(str(o.get("music", "wild" if wild else "rival" if o.kind == "npc" else {"leader": "leader", "rival": "rival"}.get(str(o.get("cls", "")), "trainer"))))
	Msg.place("battle")
	await Game.fade_to(0.0, 0.25)
	if wild:
		await _intro_wild()
	elif o.kind == "npc":
		await _npc_hero_start()
	else:
		await _intro_trainer()
	await send_player()
	var res = null
	while res == null:
		if Game.auto_text:
			print("[battle] turn fi=", fi, " pi=", pi, " fhp=", fm().get("hp", -1), " php=", pm().hp, " hero=", hero != null, " foe_hero=", foe_hero != null)
		if hero != null:
			res = await hero_turn()
		elif foe_hero != null:
			res = await foe_hero_turn()
		else:
			res = await do_turn(await choose_action())
	return await end_battle(str(res))


var _lowhp_t := 0.0


## 내 몬스터 체력이 20% 이하면 삐삐 경고음 (웹 게임과 같은 1.1초 간격)
func _process(delta: float) -> void:
	_lowhp_t += delta
	if _lowhp_t < 1.1:
		return
	_lowhp_t = 0.0
	if hero == null and pp != null and pp.visible and not pm().is_empty() and pm().hp > 0 and pm().hp <= Game.max_hp(pm()) * 0.2:
		Sound.sfx("lowhp")


func _build() -> void:
	var bg_root := Control.new()
	bg_root.clip_contents = true
	bg_root.size = Vector2(VS.x, SH)
	add_child(bg_root)
	var bg := TextureRect.new()
	var at := AtlasTexture.new()
	at.atlas = Data.tex.scenes
	at.region = Data.cell("scenes", BG_INDEX.get(o.get("bg", "grass"), 0))
	bg.texture = at
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	bg.size = Vector2(VS.x, SH)
	bg_root.add_child(bg)
	bg.pivot_offset = bg.size / 2
	bg.scale = Vector2(1.12, 1.12)
	bg.create_tween().tween_property(bg, "scale", Vector2.ONE, 1.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	for pos in [FOE_POS, ME_POS]:
		var pl := Sprite2D.new()
		pl.texture = Puppet._shadow()
		pl.position = pos + Vector2(0, 4)
		pl.scale = Vector2(2.4, 0.6) if pos == FOE_POS else Vector2(3.0, 0.75)
		pl.modulate = Color(0.1, 0.15, 0.1, 0.22)
		bg_root.add_child(pl)
	var bottom := ColorRect.new()
	bottom.color = Color(0.16, 0.19, 0.26)
	bottom.position = Vector2(0, SH)
	bottom.size = Vector2(VS.x, VS.y - SH)
	add_child(bottom)
	stage = Node2D.new()
	add_child(stage)
	hud = Control.new()
	hud.set_anchors_preset(Control.PRESET_FULL_RECT)
	hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(hud)
	menu = Control.new()
	menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	menu.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(menu)


# ---------------- HUD ----------------
func make_hud(side: String) -> void:
	if huds.has(side):
		huds[side].root.queue_free()
	var bw := (VS.x - 60.0) / 2.0
	var rect := Rect2(VS.x - bw - 20, 24, bw, 150) if side == "e" else Rect2(20, 24, bw, 150)
	var root := UI.panel(hud, rect, Color(0.94, 0.97, 0.94, 0.97), Color("#426b69"))
	var nm := UI.label(root, "", Vector2(16, 10), 26)
	nm.size.x = bw - 118
	nm.clip_text = true
	var lv := UI.label(root, "", Vector2(bw - 100, 12), 24, Color(0.3, 0.33, 0.4))
	var bar_bg := ColorRect.new()
	bar_bg.color = Color(0.25, 0.27, 0.3)
	bar_bg.position = Vector2(80, 64)
	bar_bg.size = Vector2(bw - 104, 18)
	root.add_child(bar_bg)
	UI.label(root, "체력", Vector2(16, 54), 20, Color(0.85, 0.55, 0.2))
	var bar := ColorRect.new()
	bar.position = Vector2(3, 3)
	bar_bg.add_child(bar)
	var hp_txt: Label = null
	var exp_bar: ColorRect = null
	var exp_bg: ColorRect = null
	if side == "p":
		hp_txt = UI.label(root, "", Vector2(80, 88), 26)
		exp_bg = ColorRect.new()
		exp_bg.color = Color(0.25, 0.27, 0.3)
		exp_bg.position = Vector2(bw - 16, 58)
		exp_bg.size = Vector2(8, 72)
		root.add_child(exp_bg)
		exp_bar = ColorRect.new()
		exp_bar.color = Color("#d8aa56")
		exp_bar.size = Vector2(4, 0)
		exp_bar.position = Vector2(2, 70)
		UI.label(root, "성장", Vector2(bw - 60, 130), 16, Color("#79603b"))
		exp_bg.add_child(exp_bar)
	huds[side] = {"root": root, "nm": nm, "lv": lv, "bar": bar, "bw": bw - 110, "hp": hp_txt, "exp": exp_bar, "exp_bg": exp_bg, "rect": rect}
	upd_hud(side)
	root.position.x = -bw - 30 if side == "e" else VS.x + 30
	root.create_tween().tween_property(root, "position:x", rect.position.x, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func hide_hud(side: String) -> void:
	if huds.has(side):
		var r: Control = huds[side].root
		r.create_tween().tween_property(r, "position:x", -450.0 if side == "e" else VS.x + 30, 0.25)


func upd_hud(side: String, hp = null) -> void:
	if not huds.has(side):
		return
	var h: Dictionary = huds[side]
	var v: float
	var mx: float
	if side == "e" and foe_hero != null:
		h.nm.text = str(o.name)
		h.lv.text = "사람" if o.kind == "npc" else "원정가"
		v = float(foe_hero.hp if hp == null else hp)
		mx = float(foe_hero.max)
	elif side == "p" and hero != null:
		h.nm.text = str(Game.g.name)
		h.lv.text = "원정가"
		v = float(hero.hp if hp == null else hp)
		mx = float(hero.max)
		if h.exp_bg:
			h.exp_bg.visible = false
	else:
		var m := side_mon(side)
		if m.is_empty():
			return
		var caught_mark := " ◆" if side == "e" and wild and Game.g.caught.has(int(m.sid)) else ""
		h.nm.text = N(m) + (" ★" if m.get("shiny", false) else "") + caught_mark
		var stt: String = m.get("st", "")
		h.lv.text = ("%s " % Data.D.status[stt].n if stt != "" else "") + "Lv%d" % int(m.lv)
		v = float(m.hp if hp == null else hp)
		mx = float(Game.max_hp(m))
		if h.exp_bg:
			h.exp_bg.visible = true
	var k := clampf(v / mx, 0, 1)
	h.bar.size = Vector2(h.bw * k, 12)
	h.bar.color = Color("#3baba2") if k > 0.5 else Color("#d7a255") if k > 0.2 else Color("#c96d68")
	if h.hp:
		h.hp.text = "%d / %d" % [maxi(0, ceili(v)), int(mx)]


func set_exp(instant := false) -> void:
	if not huds.has("p") or huds.p.exp == null or hero != null:
		return
	var m := pm()
	var lo := Game.exp_for(int(m.lv))
	var hi := Game.exp_for(int(m.lv) + 1)
	var k := 1.0 if int(m.lv) >= 100 else clampf(float(int(m.exp) - lo) / maxf(1, hi - lo), 0, 1)
	var draw_growth := func(value: float) -> void:
		huds.p.exp.size = Vector2(4, 68.0 * value)
		huds.p.exp.position = Vector2(2, 70.0 - 68.0 * value)
	if instant:
		draw_growth.call(k)
	else:
		var tw := create_tween()
		tw.tween_method(draw_growth, huds.p.exp.size.y / 68.0, k, 0.6)
		await tw.finished


func anim_hp(side: String, m: Dictionary, to: float) -> void:
	var from: float = float(m.hp)
	var mx := float(Game.max_hp(m))
	var t := clampf(round(to), 0, mx)
	m.hp = int(t)
	if from == t:
		upd_hud(side)
		return
	var tw := create_tween()
	tw.tween_method(func(v: float) -> void: upd_hud(side, v), from, t, minf(1.0, 0.3 + absf(from - t) / mx * 0.8)).set_trans(Tween.TRANS_SINE)
	await tw.finished
	upd_hud(side)


# =====================================================================
# 등장
# =====================================================================
func _new_mon_pup(m: Dictionary, back: bool, pos: Vector2) -> Puppet:
	var p := Puppet.new()
	stage.add_child(p)
	var s: Dictionary = Game.sp(m.sid)
	var h := 245.0 if back else 215.0
	h *= clampf(0.75 + float(s.get("h", 1.0)) * 0.25, 0.8, 1.25)
	p.setup_mon(int(m.sid), back, h)
	if p.size.x > 300.0:     # 옆으로 긴 몬스터(바위거북 등)가 화면 밖으로 나가지 않게
		p.setup_mon(int(m.sid), back, h * 300.0 / p.size.x)
	p.position = pos
	if m.get("shiny", false):
		p.mesh.modulate = Color(1.0, 0.92, 0.75)
	return p


func _person(look: String, back: bool, h: float, pos: Vector2) -> Puppet:
	var p := Puppet.new()
	stage.add_child(p)
	p.setup_person(look, back, h)
	p.position = pos
	return p


func _intro_wild() -> void:
	var f := fm()
	Game.g.seen[int(f.sid)] = 1
	fp = _new_mon_pup(f, false, FOE_POS)
	fp.p("dark", 1.0)
	fp.scale = Vector2(0.2, 0.2)
	FX.burst(stage, FOE_POS + Vector2(0, -20), Color(0.6, 0.9, 0.4), Color(0.3, 0.6, 0.25), 20, 320.0, Vector2(0, 700), 0.8, 1.0, 70.0)
	var tw := create_tween()
	tw.tween_property(fp, "scale", Vector2(1.1, 1.1), 0.28).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(fp, "scale", Vector2.ONE, 0.12)
	fp.tp(tw, "dark", 0.0, 0.4)
	await tw.finished
	await _cry(fp)
	if f.get("shiny", false):
		await _shiny_fx(fp)
	make_hud("e")
	await bsay("앗! 야생 %s 나타났다!" % J(N(f), "이"))


func _intro_trainer() -> void:
	tr = _person(look_of(), false, 250.0, FOE_POS + Vector2(VS.x * 0.5, 0))
	await _walk_in(tr, FOE_POS, 0.8)
	await bsay("%s 승부를 걸어왔다!" % J(tn(), "이"), true)
	await send_foe()


func send_foe() -> void:
	var f := fm()
	Game.g.seen[int(f.sid)] = 1
	st.e = [0, 0, 0, 0, 0, 0]
	part = [pm()] if pp != null and pm().hp > 0 else []
	if tr == null:
		tr = _person(look_of(), false, 250.0, FOE_POS + Vector2(VS.x * 0.4, 0))
	tr.visible = true
	tr.position = FOE_POS + Vector2(VS.x * 0.4, 0)
	await _walk_in(tr, FOE_POS + Vector2(110, 0), 0.35)
	bsay("%s %s 내보냈다!" % [J(tn(), "은"), J(N(f), "을")])
	Sound.sfx("throw")
	await _throw_pose(tr, -1)
	if fp:
		fp.queue_free()
	fp = _new_mon_pup(f, false, FOE_POS)
	fp.visible = false
	var leave := create_tween()
	leave.tween_property(tr, "position:x", VS.x + 200, 0.4).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	await _capsule_open(FOE_POS + Vector2(110, -200), FOE_POS, fp)
	tr.visible = false
	make_hud("e")
	await get_tree().create_timer(0.3).timeout


func send_player() -> void:
	var p := pm()
	st.p = [0, 0, 0, 0, 0, 0]
	if not part.has(p):
		part.append(p)
	bsay("%s, 함께 현장을 살피자." % N(p))
	if me == null:
		me = _person("player", true, 330.0, ME_POS + Vector2(-VS.x * 0.6, 40))
	me.visible = true
	me.position = ME_POS + Vector2(-VS.x * 0.6, 40)
	await _walk_in(me, ME_POS + Vector2(-20, 40), 0.45)
	Sound.sfx("throw")
	await _throw_pose(me, 1)
	if pp:
		pp.queue_free()
	pp = _new_mon_pup(p, false, ME_POS)
	pp.visible = false
	var out := create_tween()
	out.tween_property(me, "position:x", -260.0, 0.45).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	await _capsule_open(ME_POS + Vector2(-60, -260), ME_POS, pp)
	make_hud("p")
	set_exp(true)
	await get_tree().create_timer(0.25).timeout


func recall(side: String) -> void:
	var p := pup(side)
	if p == null:
		return
	Sound.sfx("exit")
	var tw := create_tween()
	tw.tween_property(p, "modulate:a", 0.0, 0.3)
	tw.parallel().tween_property(p, "position:x", p.position.x + (-80.0 if side == "p" else 80.0), 0.3)
	await tw.finished
	p.visible = false
	hide_hud(side)


func _foe_hero_setup(lv: int) -> void:
	var mx := 30 + lv * 4
	foe_hero = {"lv": lv, "max": mx, "hp": mx, "healed": false}
	fi = -1
	st.e = [0, 0, 0, 0, 0, 0]
	if fp:
		fp.visible = false


func _npc_hero_start() -> void:
	_foe_hero_setup(int(o.get("lv", 5)))
	tr = _person(look_of(), false, 300.0, FOE_POS + Vector2(VS.x * 0.5, 0))
	await _walk_in(tr, FOE_POS, 0.8)
	make_hud("e")
	await bsay("%s의 대결이 시작됐다!" % J(tn(), "과"), true)


func _foe_hero_start() -> void:
	var top := 1
	for m in foe:
		top = maxi(top, int(m.lv))
	_foe_hero_setup(top + 2)
	Sound.music("rival")
	Sound.sfx("run")
	if tr == null:
		tr = _person(look_of(), false, 300.0, FOE_POS)
	tr.visible = true
	tr.position = FOE_POS + Vector2(VS.x * 0.5, 0)
	await _walk_in(tr, FOE_POS, 0.4)
	await _angry(tr)
	await Msg.say("이게 무슨 짓이야! 내 몬스터를 돌려줘!", tn(), {"keep": true})
	make_hud("e")
	await bsay("화가 난 %s 직접 덤벼들었다!" % J(tn(), "이"), true)


func _angry(p: Puppet) -> void:
	p.p("glow_color", Color(1, 0.3, 0.2))
	var tw := create_tween()
	p.tp(tw, "glow", 0.8, 0.15)
	for i in 3:
		tw.tween_method(func(k: float) -> void: p.lift = sin(k * PI) * 18.0, 0.0, 1.0, 0.16)
	p.tp(tw, "glow", 0.0, 0.3)
	FX.burst(stage, p.center() + Vector2(40, -80), Color(1, 0.4, 0.3), Color(0.8, 0.1, 0.1), 10, 200.0, Vector2(0, -200), 0.5, 1.0, 40.0)
	await tw.finished


func hero_start() -> bool:
	hero_used = true
	var r := await Msg.ask("%s의 몬스터가 모두 쓰러졌다!\n마지막으로 %s 직접 맞서 볼까?" % [Game.g.name, J(Game.g.name, "이")], ["직접 맞선다!", "포기한다"])
	if r != 0:
		return false
	var lv := Game.top_level()
	var mx := 20 + lv * 3
	hero = {"lv": lv, "max": mx, "hp": mx}
	if me == null:
		me = _person("player", true, 330.0, ME_POS)
	me.visible = true
	me.position = ME_POS + Vector2(-VS.x * 0.6, 0)
	Sound.sfx("run")
	await _walk_in(me, ME_POS, 0.4)
	make_hud("p")
	await bsay("%s 쓰러진 몬스터들 앞을 막아섰다!" % J(Game.g.name, "은"), true)
	var foe_n: String = tn() if foe_hero != null else ("야생 " + N(fm()) if wild else N(fm()))
	await bsay("%s 앞에 %s 직접 맞선다!" % [foe_n, J(Game.g.name, "이")])
	return true


# =====================================================================
# 명령
# =====================================================================
func _clear_menu() -> void:
	for c in menu.get_children():
		c.queue_free()


func _btn_rect(i: int, cols := 2) -> Rect2:
	var gap := 14.0
	var bw := (VS.x - 32 - gap * (cols - 1)) / cols
	var bh := 118.0
	return Rect2(16 + (i % cols) * (bw + gap), SH + 214 + (i / cols) * (bh + gap), bw, bh)


func _buttons(list: Array, with_back: bool, auto_pick := -2) -> int:
	_clear_menu()
	var n := list.size() + (1 if with_back else 0)
	var cols := 2 if n <= 4 else 3
	var picked = [null]
	var first: Button = null
	var btns: Array = []
	for i in list.size():
		var e: Array = list[i]
		var b := UI.button(menu, e[0], _btn_rect(i, cols), e[1], 28 if "\n" in e[0] else 34)
		b.disabled = e.size() > 2 and e[2]
		b.pressed.connect(func() -> void: picked[0] = i)
		b.scale = Vector2(0.85, 0.85)
		b.pivot_offset = b.size / 2
		b.modulate.a = 0
		var tw := b.create_tween()
		tw.tween_interval(i * 0.03)
		tw.tween_property(b, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.parallel().tween_property(b, "modulate:a", 1.0, 0.12)
		if first == null and not b.disabled:
			first = b
		btns.append(b)
	if with_back:
		var bb := UI.button(menu, "뒤로", _btn_rect(list.size(), cols), Color(0.45, 0.47, 0.52), 30)
		bb.pressed.connect(func() -> void: picked[0] = -1)
	if first:
		first.grab_focus()
	if Game.auto_text:
		await get_tree().create_timer(0.05).timeout
		picked[0] = btns.find(first)
	while picked[0] == null:
		if auto_pick != -2 and Auto.fight_enabled():
			await get_tree().create_timer(0.35).timeout
			if Auto.fight_enabled(): picked[0] = auto_pick
		if with_back and Input.is_action_just_pressed("b_btn"):
			picked[0] = -1
		await get_tree().process_frame
	_clear_menu()
	return int(picked[0])


func choose_action() -> Dictionary:
	if not Auto.fight_enabled():
		await Guides.show_once("battle")
		await Guides.show_once("catchHuman" if foe_hero != null else ("capture" if wild else "steal"))
	if Auto.fight_enabled():
		await get_tree().create_timer(0.35).timeout
		return {"type":"move", "mi":Auto.move_index(pm(),fm())}
	if Game.auto_text:
		print("[battle]  choose")
	while true:
		Msg.say("%s 무엇을 할까?" % J(N(pm()), "은"), "", {"keep": true, "nowait": true})
		var c := await _buttons([["기술 지시", Color(0.22, 0.51, 0.52)], ["현장 장비", Color(0.63, 0.43, 0.26)],
			["동행 교대", Color(0.39, 0.51, 0.36)], ["조사 철수", Color(0.40, 0.43, 0.56)]], false, -3)
		if c == -3:
			return {"type":"move", "mi":Auto.move_index(pm(),fm())}
		match c:
			0:
				await Guides.show_once("moves")
				var p := pm()
				if p.moves.all(func(x: Dictionary) -> bool: return int(x.pp) <= 0):
					await bsay("%s 쓸 수 있는 기술이 없다!" % J(N(p), "은"), true)
					return {"type": "move", "mi": "struggle"}
				var f := fm()
				var opts: Array = []
				for x in p.moves:
					var d := Data.move(x.id)
					var hint := ""
					if d.c != "x" and not f.is_empty():
						var e := Data.eff(d.t, Game.sp(f.sid).t)
						hint = "\n피해 차단" if e == 0 else "\n상성 우세 · %s배" % str(e).trim_suffix(".0") if e > 1 else "\n상성 저항 · %s배" % str(e).trim_suffix(".0") if e < 1 else ""
					opts.append(["%s\n%s %d/%d%s" % [d.n, Data.type_name(d.t), int(x.pp), int(d.pp), hint], Data.type_color(d.t).darkened(0.1), int(x.pp) <= 0])
				Msg.say("어떤 기술을 쓸까?", "", {"keep": true, "nowait": true})
				var k := await _buttons(opts, true, -3)
				if k == -3:
					return {"type":"move", "mi":Auto.move_index(pm(),fm())}
				if k >= 0:
					return {"type": "move", "mi": k}
			1:
				Msg.hide_box()
				var r := await Menus.bag_screen("battle")
				Msg.place("battle")
				if r.is_empty():
					continue
				r.type = "item"
				return r
			2:
				Msg.hide_box()
				var j := await Menus.party_screen("battle", {"start": pi, "current": pi})
				Msg.place("battle")
				if j < 0:
					continue
				return {"type": "switch", "idx": j}
			3:
				return {"type": "run"}
	return {}


# =====================================================================
# 턴
# =====================================================================
func mult(s: int) -> float:
	return (2.0 + s) / 2.0 if s >= 0 else 2.0 / (2.0 - s)


func speed_of(s: String) -> float:
	var m := side_mon(s)
	return Game.calc(m)[5] * mult(st[s][5]) * (0.25 if m.st == "par" else 1.0)


func ai_move(e: Dictionary, p: Dictionary) -> String:
	var av = e.moves.filter(func(x: Dictionary) -> bool: return int(x.pp) > 0)
	if av.is_empty():
		return "struggle"
	var best: String = av[0].id
	var bs := -1.0
	for x in av:
		var d := Data.move(x.id)
		var s := 10.0
		var pt: Array = Game.sp(p.sid).t
		if int(d.p):
			var ef := Data.eff(d.t, pt)
			s = float(d.p) * ef * (1.5 if Game.sp(e.sid).t.has(d.t) else 1.0) * (float(d.a) / 100.0 if int(d.a) else 1.0)
			if ef == 0:
				s = 1
		elif d.fx.has("status"):
			var stt: String = d.fx.status
			var imm := (stt == "psn" and pt.has("poison")) or (stt == "brn" and pt.has("fire")) or (stt == "par" and (pt.has("elec") or pt.has("ground")))
			s = 2.0 if str(p.st) != "" or imm else 48.0
		elif d.fx.has("foe"):
			s = 32.0 if st.p[int(d.fx.foe[0][0])] > -2 else 4.0
		elif d.fx.has("self"):
			s = 32.0 if st.e[int(d.fx.self[0][0])] < 2 else 4.0
		s *= (0.4 + randf() * 1.3) if wild else (0.75 + randf() * 0.5)
		if s > bs:
			bs = s
			best = x.id
	return best


func do_turn(act: Dictionary):
	if Game.auto_text:
		print("[battle]  act ", act)
	flinch = {}
	moved = {}
	var f := fm()
	var leader_heal: bool = o.get("leader", false) and not used_item and f.hp > 0 and f.hp <= Game.max_hp(f) / 4
	var e_act := {"type": "item"} if leader_heal else {"type": "move", "id": ai_move(f, pm())}
	if act.type == "run":
		if not wild:
			await bsay("안 돼! 원정가와의 승부에서 등을 보일 수는 없다!", true)
			return null
		if try_run():
			await _run_away()
			return "run"
		await bsay("도망칠 수 없었다!")
		moved.p = true
	elif act.type == "switch":
		await bsay("돌아와, %s!" % N(pm()))
		await recall("p")
		pi = int(act.idx)
		await send_player()
		moved.p = true
	elif act.type == "item":
		var it: Dictionary = Data.D.items[act.id]
		if it.has("ball"):
			if await throw_ball(act.id):
				if wild:
					return "caught"
				await _foe_hero_start()
				return null
		else:
			await use_item_battle(act)
		moved.p = true
	if e_act.type == "item":
		used_item = true
		await bsay("%s 고급회복약을 사용했다!" % J(tn(), "은"))
		await _heal_fx(fp)
		await anim_hp("e", f, f.hp + 60)
		moved.e = true
	var seq: Array = []
	if act.type == "move":
		var pid: String = "struggle" if str(act.mi) == "struggle" else pm().moves[int(act.mi)].id
		if e_act.type == "move":
			var pp_ := int(Data.move(pid).fx.get("pri", 0))
			var ep := int(Data.move(e_act.id).fx.get("pri", 0))
			var ps := speed_of("p")
			var es := speed_of("e")
			var p_first := (pp_ > ep) if pp_ != ep else (ps > es) if ps != es else randf() < 0.5
			seq = [["p", pid, act.mi], ["e", e_act.id, null]] if p_first else [["e", e_act.id, null], ["p", pid, act.mi]]
		else:
			seq = [["p", pid, act.mi]]
	elif e_act.type == "move":
		seq = [["e", e_act.id, null]]
	for s in seq:
		if Game.auto_text:
			print("[battle]  use ", s)
		await use_move(s[0], s[1], s[2])
		if Game.auto_text:
			print("[battle]  used")
		var c = await check_faints()
		if c == "done":
			return result
		if c == "cut":
			return null
	await end_turn()
	var c2 = await check_faints()
	if c2 == "done":
		return result
	return null


func try_run() -> bool:
	runs += 1
	var a := speed_of("p")
	var b := speed_of("e")
	if a >= b:
		return true
	return randi() % 256 < int(a * 128 / b) + 30 * runs


func check_faints():
	var cut := false
	if foe_hero == null and not fm().is_empty() and fm().hp <= 0:
		cut = true
		if not wild and fi < foe.size() - 1:
			fi += 1
			await next_foe()
		else:
			result = "win"
			return "done"
	if hero != null:
		return "cut" if cut else ""
	if pm().hp <= 0:
		cut = true
		if Game.alive().is_empty():
			if not hero_used and await hero_start():
				return "cut"
			result = "lose"
			return "done"
		if wild:
			var r := await Msg.ask("다음 몬스터를 사용하겠습니까?", ["다음 몬스터", "도망친다"])
			if r == 1:
				if try_run():
					await _run_away()
					result = "run"
					return "done"
				await bsay("도망칠 수 없었다!", true)
		Msg.hide_box()
		pi = await Menus.party_screen("forced", {"start": pi, "current": pi})
		Msg.place("battle")
		await send_player()
	return "cut" if cut else ""


func next_foe() -> void:
	var nf := fm()
	if int(Game.settings.style) == 0 and pm().hp > 0 and Game.alive().size() > 1:
		var r := await Msg.ask("%s %s 내보내려 한다.\n%s도 몬스터를 교체하겠습니까?" % [J(tn(), "은"), J(N(nf), "을"), Game.g.name], ["예", "아니오"])
		if r == 0:
			Msg.hide_box()
			var j := await Menus.party_screen("battle", {"start": pi, "current": pi})
			Msg.place("battle")
			if j >= 0:
				await bsay("돌아와, %s!" % N(pm()))
				await recall("p")
				pi = j
				await send_foe()
				await send_player()
				return
	await send_foe()


# =====================================================================
# 기술
# =====================================================================
func use_move(side: String, id: String, mi) -> void:
	var u := side_mon(side)
	var ts := other(side)
	var t := side_mon(ts)
	if u.hp <= 0 or t.is_empty() or t.hp <= 0:
		return
	moved[side] = true
	if u.st == "slp":
		u.slp = int(u.get("slp", 1)) - 1
		if u.slp <= 0:
			u.st = ""
			u.slp = 0
			upd_hud(side)
			await bsay("%s 잠에서 깨어났다!" % J(bname(side), "은"))
		else:
			await status_fx(side, "slp")
			await bsay("%s 쿨쿨 잠들어 있다." % J(bname(side), "은"))
			return
	if flinch.get(side, false):
		await bsay("%s 풀이 죽어서 기술을 쓸 수 없다!" % J(bname(side), "은"))
		return
	if u.st == "par" and randf() * 100 < 25:
		await status_fx(side, "par")
		await bsay("%s 몸이 저려서 움직일 수 없다!" % J(bname(side), "은"))
		return
	var mv := Data.move(id)
	if id != "struggle":
		var slot = null
		if side == "p" and mi != null and str(mi) != "struggle":
			slot = u.moves[int(mi)]
		else:
			for x in u.moves:
				if x.id == id:
					slot = x
		if slot:
			slot.pp = maxi(0, int(slot.pp) - 1)
	await bsay("%s의 %s!" % [bname(side), mv.n])
	if int(mv.a) and randi() % 100 >= int(mv.a):
		await _miss_anim(side)
		await bsay("그러나 %s의 공격은 빗나갔다!" % bname(side))
		return
	var fx: Dictionary = mv.fx
	if mv.c == "x":
		await move_anim(side, mv, {"e": 1, "d": 0})
		if fx.has("status"):
			var e := Data.eff(mv.t, Game.sp(t.sid).t)
			if e == 0 or not can_status(t, fx.status):
				await bsay("%s 이미 %s 상태다!" % [J(bname(ts), "은"), Data.D.status[fx.status].n] if t.st == fx.status else "그러나 효과가 없었다...")
				return
			await inflict(ts, fx.status)
			return
		if fx.has("heal"):
			await heal_self(side, u, int(fx.heal))
			return
		if fx.has("foe"):
			for e in fx.foe:
				await stat_change(ts, int(e[0]), int(e[1]))
		if fx.has("self"):
			for e in fx.self:
				await stat_change(side, int(e[0]), int(e[1]))
		return
	var r := dmg_calc(u, t, mv, st[side], st[ts])
	if r.e == 0:
		await bsay("%s의 속성이 이 기술의 피해를 차단했다." % bname(ts))
		return
	await move_anim(side, mv, r)
	var before: int = int(t.hp)
	await anim_hp(ts, t, t.hp - r.d)
	var dealt: int = before - int(t.hp)
	if r.crit:
		await bsay("빈틈 포착 · 정밀 타격!")
	if r.e > 1:
		await bsay("상성 우세 · 피해 배율 %s배" % str(r.e).trim_suffix(".0"))
	elif r.e < 1:
		await bsay("상성 저항 · 피해 배율 %s배" % str(r.e).trim_suffix(".0"))
	if fx.has("drain") and u.hp > 0 and dealt > 0:
		Sound.sfx("absorb")
		await FX.projectile(stage, pup(ts).center(), pup(side).center(), "grass", 0.4, 40)
		await anim_hp(side, u, u.hp + maxi(1, dealt * int(fx.drain) / 100))
		await bsay("%s에게서 체력을 흡수했다!" % bname(ts))
	if fx.has("recoil") and dealt > 0:
		var rr := maxi(1, (Game.max_hp(u) if id == "struggle" else dealt) * int(fx.recoil) / 100)
		await _hurt(pup(side), Vector2.ZERO, 0.5)
		await anim_hp(side, u, u.hp - rr)
		await bsay("%s 반동으로 데미지를 입었다!" % J(bname(side), "은"))
	if t.hp > 0:
		if fx.has("st") and randf() * 100 < float(fx.st[1]) and can_status(t, fx.st[0]):
			await inflict(ts, fx.st[0])
		if fx.has("stat") and randf() * 100 < float(fx.stat[3]):
			await stat_change(ts if fx.stat[0] == "foe" else side, int(fx.stat[1]), int(fx.stat[2]))
		if fx.has("flinch") and randf() * 100 < float(fx.flinch) and not moved.get(ts, false):
			flinch[ts] = true
	if t.hp <= 0:
		await faint(ts)
	if u.hp <= 0:
		await faint(side)


func dmg_calc(u: Dictionary, t: Dictionary, mv: Dictionary, us: Array, ts: Array) -> Dictionary:
	var su := Game.calc(u)
	var stt := Game.calc(t)
	var ph: bool = mv.c == "p"
	var crit := randf() < (1.0 / 8.0 if mv.fx.has("crit") else 1.0 / 16.0)
	var A := float(su[1] if ph else su[3])
	var D := float(stt[2] if ph else stt[4])
	var as_: int = us[1 if ph else 3]
	var ds: int = ts[2 if ph else 4]
	A *= maxf(1.0, mult(as_)) if crit else mult(as_)
	D *= minf(1.0, mult(ds)) if crit else mult(ds)
	var d := int(floor(floor(floor(2.0 * int(u.lv) / 5.0 + 2.0) * float(mv.p) * A / D) / 50.0)) + 2
	if ph and u.st == "brn":
		d = d / 2
	if crit:
		d = int(d * 1.5)
	d = int(d * (85 + randi() % 16) / 100.0)
	var stab := 1.5 if Game.sp(u.sid).t.has(mv.t) else 1.0
	var e := 1.0 if mv.id == "struggle" else Data.eff(mv.t, Game.sp(t.sid).t)
	d = int(d * stab * e)
	if e > 0:
		d = maxi(1, d)
	return {"d": d, "e": e, "crit": crit}


func can_status(m: Dictionary, s: String) -> bool:
	if str(m.st) != "" or m.hp <= 0:
		return false
	var t: Array = Game.sp(m.sid).t
	if s == "psn" and t.has("poison"):
		return false
	if s == "brn" and t.has("fire"):
		return false
	if s == "par" and t.has("elec"):
		return false
	return true


func inflict(side: String, s: String) -> void:
	var m := side_mon(side)
	m.st = s
	if s == "slp":
		m.slp = 1 + randi() % 3
	upd_hud(side)
	await status_fx(side, s)
	await bsay({"psn": "%s 독에 걸렸다!", "brn": "%s 화상을 입었다!", "par": "%s 마비되어 기술이 나오기 어려워졌다!", "slp": "%s 잠들어 버렸다!"}[s] % J(bname(side), "은"))


func stat_change(side: String, s: int, v: int) -> void:
	var S: Array = st[side]
	var nm := bname(side)
	if (v > 0 and S[s] >= 6) or (v < 0 and S[s] <= -6):
		await bsay("%s의 %s 더 이상 %s 않는다!" % [nm, J(Data.D.stn[s], "은"), "올라가지" if v > 0 else "떨어지지"])
		return
	S[s] = clampi(S[s] + v, -6, 6)
	var p := pup(side)
	var up := v > 0
	Sound.sfx("statup" if up else "statdn")
	if anim() and p:
		p.p("glow_color", Color(1, 0.45, 0.3) if up else Color(0.3, 0.5, 1))
		var tw := create_tween()
		p.tp(tw, "glow", 0.9, 0.15)
		p.tp(tw, "glow", 0.0, 0.45)
		for k in 3:
			FX.burst(stage, p.center() + Vector2(randf_range(-50, 50), 40 if up else -60), Color(1, 0.6, 0.4) if up else Color(0.5, 0.7, 1),
				Color(1, 0.3, 0.2) if up else Color(0.2, 0.3, 1), 8, 60.0, Vector2(0, -500 if up else 500), 0.6, 0.8, 10.0, Vector2.UP if up else Vector2.DOWN)
		if up:
			await _hop(p, 1, 18.0)
		await tw.finished
	await bsay("%s의 %s %s%s" % [nm, J(Data.D.stn[s], "이"), "크게 " if absi(v) >= 2 else "", "올라갔다!" if up else "떨어졌다!"])


func end_turn() -> void:
	for side in ["p", "e"]:
		if side == "e" and foe_hero != null:
			continue
		var m := side_mon(side)
		if m.is_empty() or m.hp <= 0:
			continue
		if m.st == "psn" or m.st == "brn":
			await status_fx(side, m.st)
			await anim_hp(side, m, m.hp - maxi(1, Game.max_hp(m) / 8))
			await bsay("%s %s 데미지를 입고 있다!" % [J(bname(side), "은"), "독" if m.st == "psn" else "화상"])
			if m.hp <= 0:
				await faint(side)


func heal_self(side: String, u: Dictionary, pct: int) -> void:
	if u.hp >= Game.max_hp(u):
		await bsay("그러나 체력이 이미 가득하다!")
		return
	Sound.sfx("heal")
	await anim_hp(side, u, u.hp + maxi(1, Game.max_hp(u) * pct / 100))
	await bsay("%s 체력을 회복했다!" % J(bname(side), "은"))


func faint(side: String) -> void:
	var p := pup(side)
	if p == null or not p.visible:
		return
	var fm_ := side_mon(side)
	if not fm_.is_empty():
		Sound.cry(fm_.sid, true)
		await get_tree().create_timer(0.3).timeout
	Sound.sfx("faint")
	await _faint_anim(p)
	hide_hud(side)
	await bsay("%s 쓰러졌다!" % J(bname(side), "은"))
	if side == "e":
		await gain_exp()


# =====================================================================
# 도구 · 포획
# =====================================================================
func use_item_battle(a: Dictionary) -> void:
	var t: int = int(a.target)
	var m: Dictionary = Game.g.party[t]
	var it: Dictionary = Data.D.items[a.id]
	await bsay("%s %s 사용했다!" % [J(Game.g.name, "은"), J(it.n, "을")])
	if t == pi and it.has("heal") and m.hp > 0:
		Game.g.bag[a.id] = int(Game.g.bag[a.id]) - 1
		await _heal_fx(pp)
		var b0: int = int(m.hp)
		await anim_hp("p", m, mini(Game.max_hp(m), m.hp + int(it.heal)))
		await bsay("%s의 HP가 %d 회복되었다!" % [N(m), int(m.hp) - b0])
	else:
		await Menus.apply_item(a.id, m)
		Msg.place("battle")
	if t == pi:
		upd_hud("p")


func _capture_chance(cur_hp: float, max_hp: float, rate: float, strength: float, bonus: float) -> int:
	var chance := resonance_probability(cur_hp, max_hp, rate, strength, bonus)
	var roll := randf()
	return 3 if roll < chance else mini(2, int((roll - chance) / maxf(0.001, 1.0 - chance) * 3.0))


func resonance_probability(cur_hp: float, max_hp: float, rate: float, strength: float, bonus: float) -> float:
	var calm := 1.0 - clampf(cur_hp / maxf(1.0, max_hp), 0.0, 1.0)
	var affinity := pow(clampf(rate / 255.0, 0.0, 1.0), 0.72)
	return clampf(affinity * (0.28 + 0.55 * calm) * maxf(0.0, strength) * maxf(0.0, bonus), 0.0, 0.97)


func throw_ball(id: String) -> bool:
	var e := fm()
	var it: Dictionary = Data.D.items[id]
	Game.g.bag[id] = int(Game.g.bag[id]) - 1
	await bsay("%s 공명등으로 %s의 신호를 조율한다." % [Game.g.name, N(e)])
	var bonus: float = {"slp": 2.0, "par": 1.5, "psn": 1.5, "brn": 1.5}.get(str(e.st), 1.0)
	var n := _capture_chance(float(e.hp), float(Game.max_hp(e)), float(Game.sp(e.sid).c), float(it.ball), bonus)
	var cap := await _capsule_throw(fp, id, n)
	if n >= 3:
		Sound.stop_music(true)
		await Sound.jingle("caught")
		await bsay("공명 연결 완료. %s와 원정을 함께할 수 있다." % N(e), true)
		var is_new = not Game.g.caught.has(int(e.sid))
		Game.g.caught[int(e.sid)] = 1
		Game.g.seen[int(e.sid)] = 1
		e.ot = Game.g.name
		if is_new:
			await bsay("현장 노트에 %s의 동행 신호를 기록했다." % N(e), true)
		hide_hud("e")
		Msg.hide_box()
		if wild:
			await w.nickname_prompt(e)
			Msg.place("battle")
		else:
			stolen.append(e)
			if e.get("met") == null:
				e.met = {"map": w.m.name, "lv": int(e.lv)}
		if Game.add_mon(e) == "box":
			await bsay("%s 보관함으로 전송되었다!" % J(N(e), "은"), true)
		if cap:
			cap.queue_free()
		return true
	await bsay(["신호가 흩어졌다. 주변의 움직임을 먼저 살펴보자.", "주파수가 어긋났다. 생물의 상태에 맞춰 다시 조율하자.", "연결이 잠시 닿았지만 유지되지 않았다."][mini(n, 2)])
	return false


## 사람과의 직접 대결에서 이기면 상대가 스스로 동료로 합류한다 (사람에게는 공명등을 쓰지 않는다)
func _recruit() -> void:
	var t: Dictionary = foe_hero
	var sid := Game.human_sid(look_of())
	var name: String = str(o.name)
	var lv := mini(100, int(t.lv))
	var m := Game.make_mon(sid, lv, {"shiny": false, "ot": Game.g.name, "met": {"map": w.m.name, "lv": lv}})
	m.nick = name
	m.hp = maxi(1, int(Game.max_hp(m) / 2))
	await Msg.say(["...졌다. 정말 강하구나. 네 원정에 나도 함께하게 해 줘!", "후우, 내가 졌어. 너와 함께라면 더 강해질 수 있을 것 같아!",
		"대단한 실력이야! 나도 데려가 줄래?"].pick_random(), tn(), {"keep": true})
	if await Msg.ask("%s 동료로 맞이할까?" % J(name, "을"), ["함께 가자!", "괜찮아"]) != 0:
		await Msg.say("그래... 다음에 또 겨루자!", tn(), {"keep": true})
		return
	Sound.stop_music(true)
	await Sound.jingle("caught")
	captured = m
	o.captured = true
	if str(o.get("npc", "")) != "":
		Game.set_flag("cap_" + str(o.npc))
	await bsay("%s 동료가 되었다!" % J(name, "이"), true)
	if Game.add_mon(m) == "box":
		await bsay("%s 보관함으로 갔다!" % J(name, "은"), true)


func give_back() -> void:
	var names: Array = []
	for m in stolen:
		names.append(N(m))
		Game.g.party.erase(m)
		Game.g.box.erase(m)
	stolen = []
	pi = 0
	if tr:
		tr.visible = true
		tr.position = FOE_POS + Vector2(VS.x * 0.5, 0)
		await _walk_in(tr, FOE_POS, 0.4)
	await Msg.say("흥, 내 몬스터는 돌려받겠어!", tn(), {"keep": true})
	await bsay("%s %s 되찾아 갔다..." % [J(tn(), "은"), J(", ".join(names), "을")], true)


# =====================================================================
# 사람과의 턴
# =====================================================================
func hero_turn():
	if not Auto.fight_enabled(): await Guides.show_once("hero")
	var f := fm()
	var h: Dictionary = hero
	var vs_t := foe_hero != null
	Msg.say("%s 어떻게 맞설까?" % J(Game.g.name, "은"), "", {"keep": true, "nowait": true})
	var heal := ""
	for k in ["super", "potion"]:
		if int(Game.g.bag.get(k, 0)) > 0:
			heal = k
			break
	var opts: Array = []
	for a in HERO_ACT:
		opts.append(["%s\n%s · 명중 %d" % [a.n, a.d, a.acc], Color(0.85, 0.45, 0.3)])
	opts.append(["%s 마시기\n남은 %d개" % [Data.D.items[heal].n, int(Game.g.bag[heal])] if heal != "" else "회복약 없음", Color(0.86, 0.62, 0.25), heal == ""])
	opts.append(["도망치다" if wild else "버티기\n방어 자세", Color(0.36, 0.48, 0.72)])
	var i := await _buttons(opts, false, 0)
	Msg.hide_box()
	var guard := false
	var target: Puppet = tr if vs_t else fp
	var foe_n: String = tn() if vs_t else ("야생 " + N(f) if wild else N(f))
	if i < 2:
		var a: Dictionary = HERO_ACT[i]
		await bsay("%s %s 했다!" % [J(Game.g.name, "은"), J(a.n, "을")])
		if i == 0:
			await _rock_throw(me, target)
		else:
			await _lunge(me, target, {"t": "human"}, false)
		if randi() % 100 < int(a.acc):
			if vs_t:
				var dmg := maxi(1, int(round(float(foe_hero.max) * (a.lo + randf() * (a.hi - a.lo)) * pow(float(h.lv) / maxf(1, foe_hero.lv), 0.3))))
				await _hurt(tr, Vector2(1, -0.5).normalized(), 1.0)
				await _foe_hero_hp(foe_hero.hp - dmg)
			else:
				var dmg2 := maxi(1, int(round(Game.max_hp(f) * (a.lo + randf() * (a.hi - a.lo)))))
				await _hurt(fp, Vector2(1, -0.5).normalized(), 1.0)
				await anim_hp("e", f, f.hp - dmg2)
			if i == 1 and randf() < 0.35:
				await bsay("반동으로 %s도 조금 다쳤다!" % Game.g.name)
				await _hero_hp(h.hp - int(round(h.max * 0.06)))
		else:
			await bsay("하지만 %s에게 빗나갔다!" % foe_n)
	elif i == 2 and heal != "":
		Game.g.bag[heal] = int(Game.g.bag[heal]) - 1
		await bsay("%s %s 꿀꺽 마셨다!" % [J(Game.g.name, "은"), J(Data.D.items[heal].n, "을")])
		await _heal_fx(me)
		await _hero_hp(h.hp + int(round(h.max * (0.6 if heal == "super" else 0.35))))
	else:
		if wild:
			if randf() < 0.6:
				Sound.sfx("run")
				await bsay("몬스터들을 안고 무사히 도망쳤다!", true)
				return "run"
			await bsay("도망칠 수 없었다!")
		else:
			guard = true
			await bsay("%s 몸을 웅크리고 버틴다!" % J(Game.g.name, "은"))
	if vs_t:
		if foe_hero.hp <= 0:
			return await _foe_hero_down()
	elif f.hp <= 0:
		await faint("e")
		if not wild and fi < foe.size() - 1:
			fi += 1
			await bsay("%s 숨을 고른다..." % J(Game.g.name, "은"))
			await send_foe()
			return null
		await bsay("%s 직접 승리를 거머쥐었다!" % J(Game.g.name, "이"), true)
		return "win"
	if vs_t:
		await trainer_act(true, guard)
	else:
		var av = f.moves.filter(func(x: Dictionary) -> bool: return int(x.pp) > 0 and int(Data.move(x.id).p) > 0)
		var id: String = av.pick_random().id if av.size() else f.moves[0].id
		var mv := Data.move(id)
		await bsay("%s의 %s!" % [foe_n, mv.n])
		if anim():
			await _attack_motion(fp, me, mv)
		var pw := float(mv.p) if int(mv.p) else 40.0
		var raw := float(h.max) * (0.1 + pw / 650.0) * (0.85 + randf() * 0.3) * pow(float(f.lv) / maxf(1, h.lv), 0.5) * (0.4 if guard else 1.0)
		if randi() % 100 < (int(mv.a) if int(mv.a) else 100):
			await _impact(me, Vector2(-1, 0.4).normalized(), mv.t, false)
			await _hero_hp(h.hp - maxi(1, int(round(raw))))
		else:
			await _dodge(me)
			await bsay("%s 몸을 날려 피했다!" % J(Game.g.name, "은"))
	if h.hp <= 0:
		Sound.sfx("faint")
		await _faint_anim(me)
		hide_hud("p")
		await bsay("%s 힘이 다해 쓰러졌다..." % J(Game.g.name, "은"), true)
		return "lose"
	return null


func _hero_hp(to: float) -> void:
	var from: float = float(hero.hp)
	hero.hp = int(clampf(round(to), 0, hero.max))
	var tw := create_tween()
	tw.tween_method(func(v: float) -> void: upd_hud("p", v), from, float(hero.hp), minf(0.9, 0.3 + absf(from - hero.hp) / float(hero.max) * 0.7))
	await tw.finished
	upd_hud("p")


func _foe_hero_hp(to: float) -> void:
	var from: float = float(foe_hero.hp)
	foe_hero.hp = int(clampf(round(to), 0, foe_hero.max))
	var tw := create_tween()
	tw.tween_method(func(v: float) -> void: upd_hud("e", v), from, float(foe_hero.hp), minf(0.9, 0.3 + absf(from - foe_hero.hp) / float(foe_hero.max) * 0.7))
	await tw.finished
	upd_hud("e")


func foe_hero_turn():
	var act := await choose_action()
	flinch = {}
	moved = {}
	if act.type == "run":
		if o.kind == "npc":
			await _run_away()
			return "run"
		await bsay("안 돼! 화가 난 원정가에게 등을 보일 수는 없다!", true)
		return null
	if act.type == "switch":
		await bsay("돌아와, %s!" % N(pm()))
		await recall("p")
		pi = int(act.idx)
		await send_player()
	elif act.type == "item":
		if Data.D.items[act.id].has("ball"):
			await bsay("사람에게는 공명등을 던질 수 없다! 대결에서 실력으로 이기자.", true)
			return null
		else:
			await use_item_battle(act)
	else:
		await mon_vs_trainer(act.mi)
		if foe_hero.hp <= 0:
			return await _foe_hero_down()
	if pm().hp > 0:
		await trainer_act(false, false)
	if pm().hp > 0:
		await end_turn()
	if pm().hp <= 0:
		return await _player_down()
	return null


func mon_vs_trainer(mi) -> void:
	var u := pm()
	var t: Dictionary = foe_hero
	moved.p = true
	if u.st == "slp":
		u.slp = int(u.get("slp", 1)) - 1
		if u.slp <= 0:
			u.st = ""
			u.slp = 0
			upd_hud("p")
			await bsay("%s 잠에서 깨어났다!" % J(N(u), "은"))
		else:
			await status_fx("p", "slp")
			await bsay("%s 쿨쿨 잠들어 있다." % J(N(u), "은"))
			return
	if u.st == "par" and randf() * 100 < 25:
		await status_fx("p", "par")
		await bsay("%s 몸이 저려서 움직일 수 없다!" % J(N(u), "은"))
		return
	var id: String = "struggle" if str(mi) == "struggle" else u.moves[int(mi)].id
	var mv := Data.move(id)
	if id != "struggle":
		u.moves[int(mi)].pp = maxi(0, int(u.moves[int(mi)].pp) - 1)
	await bsay("%s의 %s!" % [N(u), mv.n])
	if int(mv.a) and randi() % 100 >= int(mv.a):
		await _dodge(tr)
		await bsay("그러나 %s의 공격은 빗나갔다!" % N(u))
		return
	if not int(mv.p):
		await _status_motion(pp, tr, mv)
		if mv.fx.has("heal"):
			await heal_self("p", u, int(mv.fx.heal))
			return
		if mv.fx.has("self"):
			for e in mv.fx.self:
				await stat_change("p", int(e[0]), int(e[1]))
		else:
			await bsay("하지만 %s 아랑곳하지 않는다!" % J(tn(), "은"))
		return
	await _attack_motion(pp, tr, mv)
	var su := Game.calc(u)
	var ph: bool = mv.c == "p"
	var A = (su[1] * mult(st.p[1]) if ph else su[3] * mult(st.p[3])) * (0.5 if ph and u.st == "brn" else 1.0)
	var crit := randf() < 1.0 / 16.0
	var stab := 1.2 if Game.sp(u.sid).t.has(mv.t) else 1.0
	var d := maxi(1, int(round(float(t.max) * (0.1 + float(mv.p) / 500.0) * sqrt(A / (10.0 + float(t.lv) * 1.6)) * (0.85 + randf() * 0.3) * stab * (1.5 if crit else 1.0))))
	await _impact(tr, (tr.position - pp.position).normalized(), mv.t, crit)
	FX.number(stage, tr.center() + Vector2(0, -tr.size.y * 0.35), str(d), Color(1, 0.85, 0.3) if crit else Color.WHITE, 58 if crit else 46)
	await _foe_hero_hp(t.hp - d)
	if crit:
		await bsay("빈틈 포착 · 정밀 타격!")
	if mv.fx.has("drain") and u.hp > 0:
		Sound.sfx("absorb")
		await anim_hp("p", u, u.hp + maxi(1, d * int(mv.fx.drain) / 100))
		await bsay("%s에게서 체력을 흡수했다!" % tn())
	if mv.fx.has("recoil"):
		var rr := maxi(1, (Game.max_hp(u) if id == "struggle" else d) * int(mv.fx.recoil) / 100)
		await anim_hp("p", u, u.hp - rr)
		await bsay("%s 반동으로 데미지를 입었다!" % J(N(u), "은"))
	if u.hp <= 0:
		await faint("p")


func trainer_act(on_hero: bool, guard: bool) -> void:
	var t: Dictionary = foe_hero
	if not t.healed and t.hp < t.max * 0.3:
		t.healed = true
		await bsay("%s 고급회복약을 벌컥벌컥 마셨다!" % J(tn(), "은"))
		await _heal_fx(tr)
		await _foe_hero_hp(t.hp + int(round(t.max * 0.45)))
		return
	var kick := randf() >= 0.6
	var a: Dictionary = FOE_ACT[1 if kick else 0]
	await bsay("%s의 %s!" % [tn(), a.n])
	var target: Puppet = me if on_hero else pp
	await _lunge(tr, target, {"t": "human"}, kick)
	if on_hero:
		var h: Dictionary = hero
		if randi() % 100 < int(a.acc):
			var raw = float(h.max) * (a.lo + randf() * (a.hi - a.lo)) * pow(float(t.lv) / maxf(1, h.lv), 0.3) * (0.4 if guard else 1.0)
			await _impact(me, Vector2(-1, 0.4).normalized(), "human", false)
			await _hero_hp(h.hp - maxi(1, int(round(raw))))
		else:
			await _dodge(me)
			await bsay("%s 몸을 날려 피했다!" % J(Game.g.name, "은"))
		return
	var u := pm()
	if randi() % 100 < int(a.acc):
		var dmg := maxi(1, int(round(Game.max_hp(u) * (a.lo + randf() * (a.hi - a.lo)) * pow(float(t.lv) / maxf(1, int(u.lv)), 0.6))))
		await _impact(pp, Vector2(-1, 0.4).normalized(), "human", false)
		await anim_hp("p", u, u.hp - dmg)
	else:
		await _dodge(pp)
		await bsay("%s 재빨리 피했다!" % J(N(u), "은"))
	if u.hp <= 0:
		await faint("p")


func _player_down():
	if Game.alive().is_empty():
		if not hero_used and await hero_start():
			return null
		return "lose"
	Msg.hide_box()
	pi = await Menus.party_screen("forced", {"start": pi, "current": pi})
	Msg.place("battle")
	await send_player()
	return null


func _foe_hero_down() -> String:
	Sound.sfx("faint")
	await _sit_down(tr)
	hide_hud("e")
	await bsay("%s 털썩 주저앉았다!" % J(tn(), "은"), true)
	if stolen.size():
		await Msg.say("크윽... 졌다. 그 몬스터는 이제 네 거야. 잘 돌봐 줘...", tn(), {"keep": true})
	await _recruit()
	return "win"


# =====================================================================
# 경험치
# =====================================================================
func gain_exp() -> void:
	var f := fm()
	if f.is_empty():
		return
	var parts := part.filter(func(m: Dictionary) -> bool: return m.hp > 0 and Game.g.party.has(m) and int(m.lv) < 100)
	if parts.is_empty():
		return
	var base := float(Game.sp(f.sid).x) * int(f.lv) / 7.0 * (1.0 if wild else 1.5)
	if wild and not o.get("legend", false):
		var g2 := maxi(1, int(base * 0.5))
		Game.g.money = int(Game.g.money) + g2
		gold += g2
	for m in parts:
		var gg := maxi(1, int(base / parts.size()))
		await bsay("%s %d 경험치를 얻었다!" % [J(N(m), "은"), gg])
		await add_exp(m, gg, m == pm() and pp != null and pp.visible)


func add_exp(m: Dictionary, g2: int, active: bool) -> void:
	var left := g2
	while left > 0 and int(m.lv) < 100:
		var need := Game.exp_for(int(m.lv) + 1) - int(m.exp)
		var add := mini(left, need)
		m.exp = int(m.exp) + add
		left -= add
		if active:
			await set_exp()
		if int(m.exp) >= Game.exp_for(int(m.lv) + 1):
			if active:
				await _level_fx(pp)
			await Menus.level_up(m, true)
			Msg.place("battle")
			if not leveled.has(m):
				leveled.append(m)
			if active:
				upd_hud("p")
				set_exp(true)


# =====================================================================
# 끝
# =====================================================================
func end_battle(res: String) -> String:
	if res == "win" and captured == null:
		Sound.music("victory")
	if res == "win":
		if wild and gold > 0:
			await bsay("%s %s 주웠다!" % [J(Game.g.name, "은"), J(Game.money(gold), "을")], true)
		if not wild:
			if captured == null:
				if tr == null:
					tr = _person(look_of(), false, 250.0, FOE_POS)
				tr.visible = true
				tr.modulate.a = 1.0
				tr.position = FOE_POS + Vector2(VS.x * 0.5, 0)
				hide_hud("e")
				await _walk_in(tr, FOE_POS, 0.45)
				await bsay("%s의 승부에서 이겼다!" % J(tn(), "과"), true)
				if str(o.get("lose", "")) != "":
					await Msg.say(o.lose, tn(), {"keep": true})
			if o.kind != "npc" and foe.size():
				var last_lv: int = int(foe[foe.size() - 1].lv)
				var prize: int = int(Data.D.tclass[o.cls].m) * last_lv
				Game.g.money = int(Game.g.money) + prize
				await bsay("%s 상금으로 %s 손에 넣었다!" % [J(Game.g.name, "은"), J(Game.money(prize), "을")], true)
	elif res == "lose":
		if stolen.size():
			await give_back()
		if o.kind == "npc" and str(o.get("win_msg", "")) != "":
			await Msg.say(o.win_msg, tn(), {"keep": true})
		if o.get("no_lose", false):
			if tr:
				tr.visible = true
				tr.position = FOE_POS
			if str(o.get("win_msg", "")) != "" and o.kind != "npc":
				await Msg.say(o.win_msg, tn(), {"keep": true})
		else:
			await bsay("%s에게는 싸울 수 있는 몬스터가 없다!" % Game.g.name, true)
			var lost := int(Game.g.money) / 2
			Game.g.money = int(Game.g.money) - lost
			await bsay(("%s 허둥지둥 %s 떨어뜨리고 말았다..." if wild else "%s 상금으로 %s 건네주었다...") % [J(Game.g.name, "은"), J(Game.money(lost), "을")], true)
			await bsay("...... 눈앞이 캄캄해졌다!", true)
	Msg.hide_box()
	await Game.fade_to(1.0, 0.35)
	return res


# =====================================================================
# 동작
# =====================================================================
func _walk_in(p: Puppet, to: Vector2, dur: float) -> void:
	var from := p.position
	var tw := create_tween()
	tw.tween_method(func(k: float) -> void:
		p.position = from.lerp(to, k)
		p.p("walk", 1.0 - k * k)
		p.p("walk_phase", k * TAU * dur * 3.0)
		p.p("lean", (0.04 if to.x < from.x else -0.04) * (1.0 - k)), 0.0, 1.0, dur).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	await tw.finished
	p.p("walk", 0.0)
	p.p("lean", 0.0)


func _throw_pose(p: Puppet, d: float) -> void:
	var tw := create_tween()
	p.tp(tw, "bend", -0.12 * d, 0.16).set_trans(Tween.TRANS_SINE)
	p.tp(tw, "bend", 0.16 * d, 0.1).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_IN)
	await tw.finished
	var back := create_tween()
	p.tp(back, "bend", 0.0, 0.3).set_trans(Tween.TRANS_BACK)


func _cry(p: Puppet) -> void:
	var cm := fm() if p == fp else pm() if p == pp else {}
	if not cm.is_empty():
		Sound.cry(cm.sid)
	var tw := create_tween()
	p.tp(tw, "squash", 0.12, 0.12)
	tw.parallel()
	p.tp(tw, "bend", -0.06, 0.12)
	p.tp(tw, "squash", -0.1, 0.1).set_trans(Tween.TRANS_BACK)
	tw.parallel()
	p.tp(tw, "bend", 0.05, 0.1)
	tw.parallel()
	p.tp(tw, "wobble", 0.5, 0.1)
	p.tp(tw, "squash", 0.0, 0.25)
	tw.parallel()
	p.tp(tw, "bend", 0.0, 0.25)
	tw.parallel()
	p.tp(tw, "wobble", 0.0, 0.35)
	var c := p.center()
	for i in 3:
		var ring := _ring(c, Color(1, 1, 1, 0.7))
		var rt := ring.create_tween()
		rt.tween_interval(0.12 + i * 0.1)
		rt.tween_property(ring, "scale", Vector2(2.2, 2.2), 0.4)
		rt.parallel().tween_property(ring, "modulate:a", 0.0, 0.4)
		rt.tween_callback(ring.queue_free)
	await tw.finished


func _shiny_fx(p: Puppet) -> void:
	Sound.sfx("shiny")
	for i in 3:
		FX.burst(stage, p.center() + Vector2(0, -20), Color(1, 0.97, 0.7), Color(1, 1, 1), 8, 160.0, Vector2.ZERO, 0.5, 1.2, 180.0)
		await get_tree().create_timer(0.16).timeout


func _ring(c: Vector2, col: Color) -> Node2D:
	var n := Node2D.new()
	n.position = c
	n.draw.connect(func() -> void: n.draw_arc(Vector2.ZERO, 50, 0, TAU, 40, col, 5.0, true))
	stage.add_child(n)
	n.modulate.a = 0.0
	n.create_tween().tween_property(n, "modulate:a", 1.0, 0.05).set_delay(0.1)
	return n


func _capsule_open(from: Vector2, at: Vector2, p: Puppet) -> void:
	var beacon := Capsule.make("ball", 23.0)
	stage.add_child(beacon)
	beacon.position = from
	var pulse := create_tween()
	pulse.tween_property(beacon, "position", at + Vector2(-60,-30), 0.3).set_trans(Tween.TRANS_SINE)
	await pulse.finished
	beacon.open = true
	beacon.queue_redraw()
	FX.burst(stage, at + Vector2(0,-40), Color("#caffea"), Color("#57bdaa"), 16, 150.0, Vector2(0,-100), 0.4, 0.7, 90.0)
	p.visible = true
	p.scale = Vector2.ONE
	p.modulate.a = 0.0
	await create_tween().tween_property(p, "modulate:a", 1.0, 0.35).finished
	beacon.queue_free()
	await _cry(p)
	var m := pm() if p == pp else fm()
	if not m.is_empty() and m.get("shiny", false):
		await _shiny_fx(p)


func _capsule_throw(target: Puppet, kind: String, result_grade: int) -> Capsule:
	var c := Capsule.make(kind if kind in ["great", "hyper"] else "ball", 23.0)
	stage.add_child(c)
	var from := Vector2(40, SH - 70)
	var to := target.center() + Vector2(-target.size.x * 0.6 - 30, 20)
	c.position = from
	var drift := create_tween()
	drift.tween_property(c, "position", to, 0.55).set_trans(Tween.TRANS_SINE)
	await drift.finished
	c.open = true
	c.queue_redraw()
	# A single continuous tuning sweep; creature stays visible and at its original scale.
	var line := Line2D.new()
	line.width = 4
	line.default_color = Color("#72e0d2")
	line.points = PackedVector2Array([to, target.center()])
	stage.add_child(line)
	var readout := UI.label(hud, "공명 조율 중", Vector2(24, SH - 42), 24, Color("#c8f3e8"))
	var gauge := ProgressBar.new()
	gauge.position = Vector2(VS.x * 0.38, SH - 38)
	gauge.size = Vector2(VS.x * 0.56, 18)
	gauge.show_percentage = false
	gauge.max_value = 100
	hud.add_child(gauge)
	Sound.sfx("sparkle")
	target.p("glow_color", Color("#72e0d2"))
	var tune := create_tween().set_parallel()
	tune.tween_property(gauge, "value", 100.0 if result_grade >= 3 else 36.0 + result_grade * 17.0, 1.1)
	target.tp(tune, "glow", 0.5, 1.1)
	await tune.finished
	line.queue_free()
	readout.queue_free()
	gauge.queue_free()
	target.p("glow", 0.0)
	c.open = false
	c.queue_redraw()
	if result_grade >= 3:
		FX.burst(stage, target.center(), Color("#d4ffee"), Color("#5bbda9"), 18, 180.0, Vector2(0,-100), 0.5, 0.8, 100.0)
		await _hop(target, 1, 12.0)
		return c
	var fade := create_tween()
	fade.tween_property(c, "modulate:a", 0.0, 0.25)
	await fade.finished
	c.queue_free()
	return null


func _hop(p: Puppet, n: int, h: float) -> void:
	for i in n:
		var tw := create_tween()
		p.tp(tw, "squash", 0.15, 0.06)
		tw.tween_method(func(k: float) -> void: p.lift = sin(k * PI) * h, 0.0, 1.0, 0.22)
		tw.parallel()
		p.tp(tw, "squash", -0.08, 0.1)
		p.tp(tw, "squash", 0.0, 0.12).set_trans(Tween.TRANS_BACK)
		await tw.finished


func _run_away() -> void:
	Sound.sfx("run")
	if pp and pp.visible:
		var tw := create_tween()
		pp.tp(tw, "squash", 0.1, 0.08)
		tw.tween_method(func(k: float) -> void:
			pp.position.x = ME_POS.x - k * 520
			pp.p("walk", 1.0)
			pp.p("walk_phase", k * 18.0)
			pp.lift = absf(sin(k * 18.0)) * 10.0, 0.0, 1.0, 0.55).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
		await tw.finished
	await bsay("무사히 도망쳤다!", true)


func move_anim(side: String, mv: Dictionary, r: Dictionary) -> void:
	var a := pup(side)
	var t := pup(other(side))
	if a == null or t == null:
		return
	if not anim():
		await get_tree().create_timer(0.18).timeout
	elif mv.c == "x":
		await _status_motion(a, t, mv)
		return
	else:
		await _attack_motion(a, t, mv)
	if float(r.get("e", 1)) == 0 or int(r.get("d", 0)) == 0:
		return
	var dir := (t.position - a.position).normalized()
	var big: bool = r.get("crit", false) or float(r.get("e", 1)) > 1
	await _impact(t, dir, mv.t, big, "weak" if float(r.get("e", 1)) < 1 else "")
	FX.number(stage, t.center() + Vector2(0, -t.size.y * 0.35), str(r.d), Color(1, 0.85, 0.3) if big else Color.WHITE, 58 if big else 46)


## 기술 고유의 효과음 (맞는 소리는 _impact에서). 두 번째 소리는 조금 뒤에
func _move_sounds(mv: Dictionary, attack: bool) -> void:
	var l: Array = Sound.move_sfx(str(mv.id), str(mv.t))
	if attack:
		l = l.filter(func(x: String) -> bool: return not x in ["hit", "super"])
	for i in l.size():
		if i == 0:
			Sound.sfx(l[i])
		else:
			get_tree().create_timer(0.3 * i).timeout.connect(Sound.sfx.bind(l[i]))


func _attack_motion(a: Puppet, t: Puppet, mv: Dictionary) -> void:
	_move_sounds(mv, true)
	match str(mv.id):
		"kick", "headbutt":
			await _lunge(a, t, mv, true)
		"aerial":
			await _aerial(a, t)
		"dig":
			await _dig(a, t)
		"quick":
			await _quick(a, t)
		"thunder":
			await _sky_bolt(t)
		"rockslide", "rocktomb":
			await _rock_rain(t)
		"wave":
			await _wave(t)
		_:
			if mv.c == "p":
				await _lunge(a, t, mv, false)
			else:
				await _special(a, t, mv)


func _lunge(a: Puppet, t: Puppet, mv: Dictionary, jump: bool) -> void:
	var home := a.position
	var dir := (t.position - a.position).normalized()
	var sx := signf(dir.x)
	var hit_pos := t.position - dir * (t.size.x * 0.45 + 30)
	var scale_to := 0.8 if a == pp or a == me else 1.2
	var tw := create_tween()
	tw.tween_property(a, "position", home - dir * 26, 0.16).set_trans(Tween.TRANS_SINE)
	tw.parallel()
	a.tp(tw, "squash", 0.16, 0.16)
	tw.parallel()
	a.tp(tw, "lean", -0.07 * sx, 0.16)
	await tw.finished
	var go := create_tween()
	if jump:
		go.tween_method(func(k: float) -> void:
			a.position = (home - dir * 26).lerp(hit_pos, k)
			a.lift = sin(k * PI) * 70.0
			a.body.rotation = sx * 0.5 * k, 0.0, 1.0, 0.22).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	else:
		go.tween_property(a, "position", hit_pos, 0.13).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_IN)
	go.parallel().tween_property(a, "scale", Vector2(scale_to, scale_to), 0.13)
	go.parallel()
	a.tp(go, "squash", -0.12, 0.1)
	go.parallel()
	a.tp(go, "lean", 0.12 * sx, 0.12)
	await go.finished
	FX.hit(stage, t.center() - dir * t.size.x * 0.2, str(mv.get("t", "normal")), 0.7)
	await get_tree().create_timer(0.07).timeout
	var back := create_tween()
	back.tween_property(a, "position", home, 0.32).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	back.parallel().tween_property(a, "scale", Vector2.ONE, 0.32)
	back.parallel().tween_property(a.body, "rotation", 0.0, 0.25)
	back.parallel().tween_method(func(v: float) -> void: a.lift = v, a.lift, 0.0, 0.2)
	back.parallel()
	a.tp(back, "squash", 0.0, 0.3)
	back.parallel()
	a.tp(back, "lean", 0.0, 0.3)


func _special(a: Puppet, t: Puppet, mv: Dictionary) -> void:
	var col := Data.type_color(mv.t)
	a.p("glow_color", col.lightened(0.3))
	var ch := FX.charge(stage, a.center(), mv.t)
	var tw := create_tween()
	a.tp(tw, "glow", 1.0, 0.4)
	tw.parallel()
	a.tp(tw, "squash", 0.1, 0.4)
	tw.parallel()
	a.tp(tw, "wobble", 0.15, 0.4)
	await tw.finished
	ch.emitting = false
	get_tree().create_timer(0.6).timeout.connect(ch.queue_free)
	var dir := (t.position - a.position).normalized()
	var home := a.position
	var rel := create_tween()
	a.tp(rel, "squash", -0.1, 0.08)
	rel.parallel().tween_property(a, "position", home - dir * 18, 0.08)
	a.tp(rel, "squash", 0.0, 0.3).set_trans(Tween.TRANS_BACK)
	rel.parallel().tween_property(a, "position", home, 0.3)
	rel.parallel()
	a.tp(rel, "glow", 0.0, 0.3)
	rel.parallel()
	a.tp(rel, "wobble", 0.0, 0.3)
	if mv.t == "elec":
		await _bolt(a.center(), t.center())
	else:
		await FX.projectile(stage, a.center(), t.center(), mv.t, 0.34, 70.0 if mv.t in ["water", "grass", "poison", "rock", "ground"] else 20.0)


func _status_motion(a: Puppet, t: Puppet, mv: Dictionary) -> void:
	_move_sounds(mv, false)
	var fx: Dictionary = mv.fx
	if fx.has("heal"):
		await _heal_fx(a)
	elif fx.has("status"):
		if mv.id == "sing":
			await _notes(a, t)
		else:
			await FX.projectile(stage, a.center(), t.center(), mv.t, 0.45, 60.0)
			FX.burst(stage, t.center(), Data.type_color(mv.t).lightened(0.4), Data.type_color(mv.t), 16, 160.0, Vector2(0, 200), 0.7, 0.9, 180.0)
	elif fx.has("foe"):
		await _cry(a)
	else:
		a.p("glow_color", Data.type_color(mv.t).lightened(0.3))
		var tw := create_tween()
		a.tp(tw, "glow", 0.8, 0.2)
		a.tp(tw, "glow", 0.0, 0.4)
		if mv.id in ["harden", "withdraw", "defcurl"]:
			tw.parallel()
			a.tp(tw, "squash", 0.18, 0.2)
			a.tp(tw, "squash", 0.0, 0.3).set_trans(Tween.TRANS_BACK)
			await tw.finished
		else:
			await _hop(a, 2, 16.0)


func _bolt(from: Vector2, to: Vector2) -> void:
	for n in 3:
		var l := Line2D.new()
		l.width = 9.0 - n * 2
		l.default_color = Color(1, 1, 0.7) if n == 0 else Color(1, 0.9, 0.3, 0.7)
		var pts := PackedVector2Array([from])
		for i in range(1, 8):
			pts.append(from.lerp(to, i / 8.0) + Vector2(randf_range(-26, 26), randf_range(-26, 26)))
		pts.append(to)
		l.points = pts
		stage.add_child(l)
		var tw := l.create_tween()
		tw.tween_property(l, "modulate:a", 0.0, 0.25).set_delay(0.05)
		tw.tween_callback(l.queue_free)
		await get_tree().create_timer(0.05).timeout


func _sky_bolt(t: Puppet) -> void:
	var c := t.center()
	var flash := ColorRect.new()
	flash.color = Color(1, 1, 0.9, 0.0)
	flash.size = Vector2(VS.x, SH)
	add_child(flash)
	for i in 3:
		await _bolt(Vector2(c.x + randf_range(-60, 60), -40), c)
	var tw := create_tween()
	tw.tween_property(flash, "color:a", 0.8, 0.05)
	tw.tween_property(flash, "color:a", 0.0, 0.3)
	tw.tween_callback(flash.queue_free)
	await tw.finished


func _rock_rain(t: Puppet) -> void:
	var c := t.center()
	for i in 6:
		var r := Sprite2D.new()
		r.texture = Data.tex.props
		r.region_enabled = true
		r.region_rect = Data.tight("props", 4)
		r.scale = Vector2(0.35, 0.35)
		r.position = Vector2(c.x + randf_range(-90, 90), -60)
		stage.add_child(r)
		var tw := r.create_tween()
		tw.tween_property(r, "position:y", c.y + randf_range(-30, 40), 0.32).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
		tw.parallel().tween_property(r, "rotation", randf_range(-2, 2), 0.32)
		tw.tween_callback(func() -> void: FX.burst(stage, r.position, Color(0.75, 0.68, 0.55), Color(0.45, 0.38, 0.3), 6, 260.0, Vector2(0, 900), 0.5, 1.0, 120.0))
		tw.tween_property(r, "modulate:a", 0.0, 0.25)
		tw.tween_callback(r.queue_free)
		await get_tree().create_timer(0.08).timeout
	await get_tree().create_timer(0.35).timeout


func _wave(t: Puppet) -> void:
	var band := ColorRect.new()
	band.color = Color(0.25, 0.5, 0.9, 0.55)
	band.size = Vector2(VS.x * 0.6, SH)
	band.position = Vector2(-VS.x * 0.6, 0)
	add_child(band)
	var tw := create_tween()
	tw.tween_property(band, "position:x", VS.x, 0.6).set_trans(Tween.TRANS_SINE)
	tw.tween_callback(band.queue_free)
	get_tree().create_timer(0.3).timeout.connect(func() -> void: FX.burst(stage, t.center(), Color(0.85, 0.95, 1.0), Color(0.3, 0.55, 1.0), 26, 420.0, Vector2(0, 900), 0.8, 1.2, 120.0))
	await tw.finished


func _aerial(a: Puppet, t: Puppet) -> void:
	var home := a.position
	var tw := create_tween()
	tw.tween_method(func(k: float) -> void: a.lift = k * 600.0, 0.0, 1.0, 0.3).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.parallel().tween_property(a, "modulate:a", 0.0, 0.3)
	await tw.finished
	await get_tree().create_timer(0.2).timeout
	a.position = t.position + Vector2(-20, 0)
	var dn := create_tween()
	dn.tween_property(a, "modulate:a", 1.0, 0.05)
	dn.parallel().tween_method(func(k: float) -> void: a.lift = (1.0 - k) * 500.0, 0.0, 1.0, 0.18).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	await dn.finished
	FX.shake(stage, 12.0, 0.25)
	var back := create_tween()
	back.tween_property(a, "position", home, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	back.parallel().tween_method(func(k: float) -> void: a.lift = sin(k * PI) * 60.0, 0.0, 1.0, 0.3)


func _dig(a: Puppet, t: Puppet) -> void:
	var home := a.position
	var tw := create_tween()
	tw.tween_property(a.body, "position:y", 160.0, 0.3).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.parallel().tween_property(a, "modulate:a", 0.0, 0.3)
	FX.burst(stage, home, Color(0.9, 0.78, 0.55), Color(0.6, 0.48, 0.3), 20, 240.0, Vector2(0, 600), 0.6, 1.2, 90.0)
	await tw.finished
	FX.shake(stage, 8.0, 0.4)
	await get_tree().create_timer(0.35).timeout
	FX.burst(stage, t.position, Color(0.9, 0.78, 0.55), Color(0.6, 0.48, 0.3), 26, 340.0, Vector2(0, 700), 0.7, 1.3, 70.0)
	a.position = home
	a.body.position.y = 0
	await create_tween().tween_property(a, "modulate:a", 1.0, 0.2).finished


func _quick(a: Puppet, t: Puppet) -> void:
	var home := a.position
	var dir := (t.position - a.position).normalized()
	var m := pm() if a == pp else fm()
	for i in 3:
		if m.is_empty():
			break
		var ghost := Puppet.new()
		stage.add_child(ghost)
		ghost.setup_mon(int(m.sid), a == pp, a.size.y)
		ghost.position = home.lerp(t.position - dir * 80, i / 3.0)
		ghost.modulate = Color(1, 1, 1, 0.35)
		var gt := ghost.create_tween()
		gt.tween_property(ghost, "modulate:a", 0.0, 0.3)
		gt.tween_callback(ghost.queue_free)
	await create_tween().tween_property(a, "position", t.position - dir * 80, 0.08).finished
	FX.hit(stage, t.center(), "normal", 0.6)
	await get_tree().create_timer(0.05).timeout
	await create_tween().tween_property(a, "position", home, 0.2).set_trans(Tween.TRANS_BACK).finished


func _notes(a: Puppet, t: Puppet) -> void:
	for i in 6:
		var l := UI.label(stage, "♪" if i % 2 else "♫", a.center() + Vector2(0, -20), 42, [Color(1, 0.48, 0.66), Color(0.48, 0.69, 1), Color(1, 0.85, 0.3)][i % 3])
		var tw := l.create_tween()
		tw.tween_property(l, "position", t.center() + Vector2(randf_range(-40, 40), randf_range(-60, 0)), 0.7).set_trans(Tween.TRANS_SINE)
		tw.tween_property(l, "modulate:a", 0.0, 0.2)
		tw.tween_callback(l.queue_free)
		await get_tree().create_timer(0.1).timeout
	await get_tree().create_timer(0.5).timeout


func _rock_throw(a: Puppet, t: Puppet) -> void:
	await _throw_pose(a, 1)
	var r := Sprite2D.new()
	r.texture = Data.tex.props
	r.region_enabled = true
	r.region_rect = Data.tight("props", 4)
	r.scale = Vector2(0.2, 0.2)
	stage.add_child(r)
	var from := a.center()
	var to := t.center()
	var tw := create_tween()
	tw.tween_method(func(k: float) -> void:
		r.position = from.lerp(to, k) + Vector2(0, -sin(k * PI) * 160)
		r.rotation = k * 8.0, 0.0, 1.0, 0.45)
	await tw.finished
	r.queue_free()


func _impact(t: Puppet, dir: Vector2, type: String, big: bool, snd := "") -> void:
	Sound.sfx(snd if snd != "" else "super" if big else "hit")
	FX.hit(stage, t.center(), type, 1.4 if big else 1.0)
	FX.shake(stage, 18.0 if big else 10.0, 0.3)
	await _hurt(t, dir, 1.3 if big else 1.0)


func _hurt(t: Puppet, dir: Vector2, k: float) -> void:
	if t == null:
		return
	var home := t.position
	t.p("flash", 1.0)
	t.p("wobble", 0.9 * k)
	t.p("squash", 0.14 * k)
	var tw := create_tween()
	tw.tween_property(t, "position", home + dir * 34 * k, 0.08).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.parallel()
	t.tp(tw, "lean", 0.08 * signf(dir.x) * k, 0.08)
	tw.tween_property(t, "position", home, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.parallel()
	t.tp(tw, "lean", 0.0, 0.35)
	tw.parallel()
	t.tp(tw, "flash", 0.0, 0.25)
	tw.parallel()
	t.tp(tw, "squash", 0.0, 0.3).set_trans(Tween.TRANS_BACK)
	tw.parallel()
	t.tp(tw, "wobble", 0.0, 0.55)
	for i in 2:
		tw.tween_property(t, "modulate:a", 0.35, 0.05)
		tw.tween_property(t, "modulate:a", 1.0, 0.05)
	await tw.finished


func _dodge(t: Puppet) -> void:
	Sound.sfx("miss")
	if t == null:
		return
	var x0 := t.position.x
	var dodge := create_tween()
	dodge.tween_property(t, "position:x", x0 + 50, 0.12).set_trans(Tween.TRANS_QUAD)
	dodge.tween_property(t, "position:x", x0, 0.3).set_trans(Tween.TRANS_BACK)
	await dodge.finished


func _miss_anim(side: String) -> void:
	var a := pup(side)
	var t := pup(other(side))
	if a == null or t == null:
		return
	var tw := create_tween()
	a.tp(tw, "lean", 0.1 * signf(t.position.x - a.position.x), 0.12)
	a.tp(tw, "lean", 0.0, 0.25)
	await _dodge(t)


func _heal_fx(p: Puppet) -> void:
	Sound.sfx("heal")
	if p == null:
		return
	p.p("glow_color", Color(0.5, 1, 0.6))
	var tw := create_tween()
	p.tp(tw, "glow", 0.9, 0.25)
	p.tp(tw, "glow", 0.0, 0.5)
	for i in 4:
		FX.burst(stage, p.position + Vector2(randf_range(-60, 60), -20), Color(0.8, 1, 0.8), Color(0.4, 1, 0.5), 5, 50.0, Vector2(0, -260), 0.8, 0.7, 20.0)
	await tw.finished


func _level_fx(p: Puppet) -> void:
	if p == null:
		return
	p.p("glow_color", Color(1, 0.95, 0.6))
	var tw := create_tween()
	p.tp(tw, "glow", 1.0, 0.2)
	tw.parallel()
	p.tp(tw, "squash", -0.15, 0.2)
	p.tp(tw, "squash", 0.0, 0.4).set_trans(Tween.TRANS_ELASTIC)
	tw.parallel()
	p.tp(tw, "glow", 0.0, 0.6)
	FX.burst(stage, p.position, Color(1, 1, 0.8), Color(1, 0.85, 0.3), 30, 120.0, Vector2(0, -700), 0.9, 1.0, 15.0)
	await tw.finished


func status_fx(side: String, s: String) -> void:
	var p := pup(side)
	if p == null or not anim():
		await get_tree().create_timer(0.1).timeout
		return
	var c := p.center()
	Sound.sfx({"psn": "poison", "brn": "burn", "par": "para", "slp": "sleep"}.get(s, ""))
	match s:
		"psn":
			p.p("glow_color", Color(0.7, 0.3, 0.9))
			var tw := create_tween()
			p.tp(tw, "glow", 0.8, 0.15)
			p.tp(tw, "glow", 0.0, 0.4)
			FX.burst(stage, c, Color(0.85, 0.55, 1.0), Color(0.5, 0.2, 0.7), 16, 140.0, Vector2(0, -300), 1.0, 1.0, 60.0)
			await _hurt(p, Vector2.ZERO, 0.5)
		"brn":
			FX.burst(stage, p.position + Vector2(0, -10), Color(1, 0.9, 0.4), Color(1, 0.3, 0.1), 26, 200.0, Vector2(0, -500), 0.7, 1.2, 40.0)
			await _hurt(p, Vector2.ZERO, 0.5)
		"par":
			var tw := create_tween()
			var x0 := p.position.x
			for i in 6:
				tw.tween_property(p, "position:x", x0 + (6 if i % 2 else -6), 0.03)
			tw.tween_property(p, "position:x", x0, 0.03)
			FX.burst(stage, c, Color(1, 1, 0.6), Color(1, 0.85, 0.1), 14, 500.0, Vector2.ZERO, 0.25, 0.7, 180.0)
			await _bolt(c + Vector2(-50, -60), c + Vector2(40, 30))
			await tw.finished
		"slp":
			for i in 3:
				var z := UI.label(stage, "Z", c + Vector2(30 + i * 18, -30 - i * 10), 30 + i * 8, Color(0.85, 0.9, 1))
				z.add_theme_constant_override("outline_size", 6)
				z.add_theme_color_override("font_outline_color", Color(0.2, 0.25, 0.4))
				z.modulate.a = 0
				var zt := z.create_tween()
				zt.tween_interval(i * 0.2)
				zt.tween_property(z, "modulate:a", 1.0, 0.15)
				zt.parallel().tween_property(z, "position", z.position + Vector2(30, -70), 0.9).set_trans(Tween.TRANS_SINE)
				zt.tween_property(z, "modulate:a", 0.0, 0.2)
				zt.tween_callback(z.queue_free)
			var tw2 := create_tween()
			p.tp(tw2, "bend", 0.08, 0.5)
			p.tp(tw2, "bend", 0.0, 0.5)
			await tw2.finished


func _faint_anim(p: Puppet) -> void:
	var tw := create_tween()
	p.tp(tw, "squash", 0.22, 0.18).set_trans(Tween.TRANS_SINE)
	tw.parallel()
	p.tp(tw, "bend", 0.12, 0.18)
	tw.tween_interval(0.15)
	p.tp(tw, "dissolve", 1.0, 0.7)
	tw.parallel().tween_property(p.body, "position:y", 40.0, 0.7).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.parallel().tween_property(p.shadow, "modulate:a", 0.0, 0.7)
	tw.parallel()
	p.tp(tw, "dark", 0.4, 0.7)
	get_tree().create_timer(0.33).timeout.connect(func() -> void:
		FX.burst(stage, p.center(), Color(1, 0.95, 0.75), Color(1, 0.8, 0.4, 0), 30, 160.0, Vector2(0, -200), 1.0, 0.9, 120.0))
	await tw.finished
	p.visible = false
	p.p("dissolve", 0.0)
	p.p("dark", 0.0)
	p.p("squash", 0.0)
	p.p("bend", 0.0)
	p.body.position.y = 0
	p.shadow.modulate.a = 0.38


func _sit_down(p: Puppet) -> void:
	var tw := create_tween()
	p.tp(tw, "squash", 0.3, 0.25).set_trans(Tween.TRANS_BOUNCE)
	tw.parallel()
	p.tp(tw, "bend", 0.18, 0.3)
	FX.burst(stage, p.position, Color(0.93, 0.88, 0.74), Color(0.8, 0.74, 0.6), 10, 120.0, Vector2(0, -40), 0.5, 1.0, 70.0)
	await tw.finished
	await get_tree().create_timer(0.4).timeout
	await create_tween().tween_property(p, "modulate:a", 0.0, 0.3).finished
	p.visible = false
	p.modulate.a = 1.0
	p.p("squash", 0.0)
	p.p("bend", 0.0)

