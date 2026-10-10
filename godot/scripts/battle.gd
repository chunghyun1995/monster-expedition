class_name Battle
extends CanvasLayer
## 전투: 기존 게임과 같은 공식(데미지·포획·경험치)에, 메시 변형 퍼펫으로 새로 만든 동작을 입혔다.
## 예비 동작 → 돌진 → 타격 정지(히트스톱) → 넉백·출렁임, 기 모으기·발사체, 캡슐 흡수·흔들림, 흩어지며 쓰러짐 등.

const STN := ["HP", "공격", "방어", "특수공격", "특수방어", "스피드"]
const ST_NAME := {"psn": "독", "brn": "화상", "par": "마비", "slp": "잠듦"}
const ST_COL := {"psn": Color(0.6, 0.3, 0.7), "brn": Color(0.9, 0.4, 0.2), "par": Color(0.85, 0.7, 0.1), "slp": Color(0.45, 0.5, 0.6)}

var VS := Vector2(720, 1280)
var SH := 760.0
var stage: Node2D
var hud: Control
var msg: MessageBox
var menu: Control
var kind := "wild"
var opts: Dictionary
var foe_team: Array = []
var foe: Dictionary
var me: Dictionary
var fp: Puppet
var pp: Puppet
var hero: Puppet
var huds := {}
var stg := {"p": [0, 0, 0, 0, 0, 0], "f": [0, 0, 0, 0, 0, 0]}
var flinch := {"p": false, "f": false}
var _pick = null
var FOE_POS := Vector2(500, 330)
var ME_POS := Vector2(205, 720)


func run(o: Dictionary) -> String:
	opts = o
	kind = o.kind
	foe_team = o.team
	foe = foe_team[0]
	VS = get_viewport().get_visible_rect().size
	SH = VS.y - 520.0
	FOE_POS = Vector2(VS.x * 0.7, SH * 0.47)
	ME_POS = Vector2(VS.x * 0.3, SH * 0.97)
	layer = 10
	_build()
	await Game.fade_to(0.0, 0.25)
	var r := await _intro()
	if r == "":
		r = await _loop()
	await UI.wait(self, 0.3)
	await Game.fade_to(1.0, 0.35)
	return r


# ---------------- 화면 ----------------
func _build() -> void:
	var bg_root := Control.new()
	bg_root.clip_contents = true
	bg_root.size = Vector2(VS.x, SH)
	add_child(bg_root)
	var bg := TextureRect.new()
	var at := AtlasTexture.new()
	at.atlas = Data.tex.scenes
	at.region = Data.cell("scenes", 0 if Game.map_id == "route1" else 2 if Game.map_id == "town" else 0)
	bg.texture = at
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	bg.size = Vector2(VS.x, SH)
	bg_root.add_child(bg)
	# 배경이 천천히 다가오는 느낌
	bg.pivot_offset = bg.size / 2
	bg.scale = Vector2(1.12, 1.12)
	bg.create_tween().tween_property(bg, "scale", Vector2.ONE, 1.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
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
	msg = MessageBox.new()
	add_child(msg)
	msg.build(Rect2(16, SH + 18, VS.x - 32, 180))
	msg.auto_close = false
	menu = Control.new()
	menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	menu.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(menu)


func _hud(side: String) -> void:
	if huds.has(side):
		huds[side].root.queue_free()
	var m: Dictionary = me if side == "p" else foe
	var w := 400.0
	var rect := Rect2(20, 26, w, 116) if side == "f" else Rect2(VS.x - w - 20, SH - 196, w, 150)
	var root := UI.panel(hud, rect, Color(0.99, 0.98, 0.94, 0.95))
	var nm := UI.label(root, "%s%s" % [Game.name_of(m), " ★" if m.shiny else ""], Vector2(20, 10), 30)
	nm.size.x = w - 140
	nm.clip_text = true
	UI.label(root, "Lv%d" % m.lv, Vector2(w - 112, 12), 28, Color(0.3, 0.33, 0.4))
	var bar_bg := ColorRect.new()
	bar_bg.color = Color(0.25, 0.27, 0.3)
	bar_bg.position = Vector2(80, 64)
	bar_bg.size = Vector2(w - 104, 18)
	root.add_child(bar_bg)
	UI.label(root, "HP", Vector2(26, 54), 24, Color(0.85, 0.55, 0.2))
	var bar := ColorRect.new()
	bar.position = Vector2(3, 3)
	bar_bg.add_child(bar)
	var st := UI.label(root, "", Vector2(w - 92, 86) if side == "p" else Vector2(w - 92, 84), 22, Color.WHITE)
	var sb := StyleBoxFlat.new()
	sb.set_corner_radius_all(8)
	sb.content_margin_left = 8
	sb.content_margin_right = 8
	st.add_theme_stylebox_override("normal", sb)
	var hp_txt: Label = null
	var exp_bar: ColorRect = null
	if side == "p":
		hp_txt = UI.label(root, "", Vector2(80, 88), 26)
		var eb := ColorRect.new()
		eb.color = Color(0.25, 0.27, 0.3)
		eb.position = Vector2(20, 132)
		eb.size = Vector2(w - 40, 8)
		root.add_child(eb)
		exp_bar = ColorRect.new()
		exp_bar.color = Color(0.35, 0.65, 0.95)
		exp_bar.size = Vector2(0, 8)
		eb.add_child(exp_bar)
	huds[side] = {"root": root, "bar": bar, "bw": w - 110, "hp": hp_txt, "st": st, "exp": exp_bar, "shown": float(m.hp), "rect": rect}
	_set_bar(side, m.hp)
	_set_status(side)
	_set_exp()
	# 옆에서 미끄러져 들어온다
	var from_x := -w - 30 if side == "f" else VS.x + 30
	root.position.x = from_x
	root.create_tween().tween_property(root, "position:x", rect.position.x, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _set_bar(side: String, hp: float) -> void:
	var h: Dictionary = huds[side]
	var m: Dictionary = me if side == "p" else foe
	var mx := float(Game.max_hp(m))
	var k := clampf(hp / mx, 0, 1)
	h.shown = hp
	h.bar.size = Vector2(h.bw * k, 12)
	h.bar.color = Color(0.36, 0.8, 0.45) if k > 0.5 else Color(0.95, 0.75, 0.2) if k > 0.2 else Color(0.92, 0.3, 0.3)
	if h.hp:
		h.hp.text = "%d / %d" % [ceili(hp), int(mx)]


func _set_status(side: String) -> void:
	var h: Dictionary = huds[side]
	var m: Dictionary = me if side == "p" else foe
	var s: String = m.get("st", "")
	h.st.visible = s != ""
	if s != "":
		h.st.text = ST_NAME[s]
		(h.st.get_theme_stylebox("normal") as StyleBoxFlat).bg_color = ST_COL[s]


func _set_exp() -> void:
	if not huds.has("p") or huds.p.exp == null:
		return
	var a := Game.exp_for(me.lv)
	var b := Game.exp_for(me.lv + 1)
	huds.p.exp.size.x = (huds.p.rect.size.x - 40) * clampf(float(me.exp - a) / maxf(1, b - a), 0, 1)


## HP 바가 부드럽게 줄어든다 (뒤에 남는 흰 잔상 포함)
func _tween_hp(side: String, to: int) -> void:
	var h: Dictionary = huds[side]
	var from: float = h.shown
	var ghost := ColorRect.new()
	ghost.color = Color(1, 1, 1, 0.75)
	ghost.position = h.bar.position
	ghost.size = h.bar.size
	h.bar.get_parent().add_child(ghost)
	h.bar.get_parent().move_child(ghost, 0)
	var tw := create_tween()
	tw.tween_method(func(v: float) -> void: _set_bar(side, v), from, float(to), clampf(absf(from - to) * 0.03, 0.25, 0.8)).set_trans(Tween.TRANS_SINE)
	tw.tween_property(ghost, "size:x", h.bar.size.x if to >= from else h.bw * clampf(to / float(Game.max_hp(me if side == "p" else foe)), 0, 1), 0.3)
	tw.tween_callback(ghost.queue_free)
	await tw.finished


# ---------------- 등장 ----------------
func _intro() -> String:
	me = _first_alive()
	if kind == "wild":
		fp = _new_pup(foe, false, FOE_POS)
		# 풀숲에서 실루엣으로 솟아올랐다가 색이 돌아온다
		fp.p("dark", 1.0)
		fp.scale = Vector2(0.2, 0.2)
		var tw := create_tween()
		FX.burst(stage, FOE_POS + Vector2(0, -20), Color(0.6, 0.9, 0.4), Color(0.3, 0.6, 0.25), 20, 320.0, Vector2(0, 700), 0.8, 1.0, 70.0)
		tw.tween_property(fp, "scale", Vector2(1.1, 1.1), 0.28).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_property(fp, "scale", Vector2.ONE, 0.12)
		fp.tp(tw, "dark", 0.0, 0.4)
		await tw.finished
		await _cry(fp)
		_hud("f")
		await msg.say("앗! 야생 %s 튀어나왔다!" % Game.josa(Game.name_of(foe), "이"))
	elif kind == "person":
		# 사람이 직접 걸어 들어온다
		fp = _new_pup(foe, false, FOE_POS + Vector2(VS.x * 0.5, 0))
		await _walk_in(fp, FOE_POS, 0.9)
		_hud("f")
		await msg.say("%s 직접 덤벼든다!" % Game.josa(opts.name, "이"))
	else:
		var tr := Puppet.new()
		stage.add_child(tr)
		tr.setup_person(opts.look, false, 250.0)
		tr.position = FOE_POS + Vector2(VS.x * 0.5, 0)
		await _walk_in(tr, FOE_POS, 0.8)
		await msg.say("%s 승부를 걸어왔다!" % Game.josa(opts.name, "이"))
		await _trainer_send(tr, true)
	hero = Puppet.new()
	stage.add_child(hero)
	hero.setup_person("player", true, 330.0)
	hero.position = ME_POS + Vector2(-VS.x * 0.6, 40)
	await _walk_in(hero, ME_POS + Vector2(-20, 40), 0.6)
	await _send_out(me, "가랏, %s!" % Game.name_of(me))
	return ""


func _trainer_send(tr: Puppet, first: bool) -> void:
	if tr == null:
		tr = Puppet.new()
		stage.add_child(tr)
		tr.setup_person(opts.look, false, 250.0)
		tr.position = FOE_POS + Vector2(VS.x * 0.4, 0)
		await _walk_in(tr, FOE_POS + Vector2(110, 0), 0.4)
	else:
		var tw := create_tween()
		tw.tween_property(tr, "position:x", FOE_POS.x + 110, 0.25)
		await tw.finished
	await msg.say("%s %s 내보냈다!" % [Game.josa(opts.name, "은"), Game.josa(Game.name_of(foe), "을")], "", false)
	await _throw_pose(tr, -1)
	fp = _new_pup(foe, false, FOE_POS)
	fp.visible = false
	await _capsule_open(FOE_POS + Vector2(110, -200), FOE_POS, fp)
	var tw2 := create_tween()
	tw2.tween_property(tr, "position:x", VS.x + 200, 0.4).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw2.tween_callback(tr.queue_free)
	_hud("f")
	if first:
		await UI.wait(self, 0.2)


func _send_out(m: Dictionary, text: String) -> void:
	me = m
	stg.p = [0, 0, 0, 0, 0, 0]
	msg.say(text, "", false)
	if hero == null or not is_instance_valid(hero):
		hero = Puppet.new()
		stage.add_child(hero)
		hero.setup_person("player", true, 330.0)
		hero.position = ME_POS + Vector2(-VS.x * 0.6, 40)
		await _walk_in(hero, ME_POS + Vector2(-20, 40), 0.35)
	await _throw_pose(hero, 1)
	pp = _new_pup(me, true, ME_POS)
	pp.visible = false
	var out := create_tween()
	out.tween_property(hero, "position:x", -260.0, 0.45).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	out.tween_callback(hero.queue_free)
	await _capsule_open(ME_POS + Vector2(-60, -260), ME_POS, pp)
	_hud("p")
	await UI.wait(self, 0.25)


func _new_pup(m: Dictionary, back: bool, pos: Vector2) -> Puppet:
	var p := Puppet.new()
	stage.add_child(p)
	var sp: Dictionary = Data.species(m.sid)
	var h := 245.0 if back else 215.0
	h *= clampf(0.75 + float(sp.get("h", 1.0)) * 0.25, 0.8, 1.25)
	p.setup_mon(m.sid, back, h)
	p.position = pos
	if m.shiny:
		p.mesh.modulate = Color(1.0, 0.92, 0.75)
	return p


## 걸어 들어오기: 메시 다리가 번갈아 움직인다
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


## 던지는 자세: 뒤로 젖혔다가 앞으로 휘두름
func _throw_pose(p: Puppet, d: float) -> void:
	var tw := create_tween()
	p.tp(tw, "bend", -0.12 * d, 0.16).set_trans(Tween.TRANS_SINE)
	p.tp(tw, "bend", 0.16 * d, 0.1).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_IN)
	await tw.finished
	var back := create_tween()
	p.tp(back, "bend", 0.0, 0.3).set_trans(Tween.TRANS_BACK)


## 몬스터 울음: 몸을 젖혔다가 앞으로 내지르며 부르르
func _cry(p: Puppet) -> void:
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


func _ring(c: Vector2, col: Color) -> Node2D:
	var n := Node2D.new()
	n.position = c
	n.draw.connect(func() -> void: n.draw_arc(Vector2.ZERO, 50, 0, TAU, 40, col, 5.0, true))
	stage.add_child(n)
	n.modulate.a = 0.0
	n.create_tween().tween_property(n, "modulate:a", 1.0, 0.05).set_delay(0.1)
	return n


# ---------------- 캡슐 ----------------
func _capsule() -> Node2D:
	var n := Node2D.new()
	n.draw.connect(func() -> void:
		n.draw_circle(Vector2.ZERO, 26, Color(0.15, 0.15, 0.2))
		n.draw_circle(Vector2.ZERO, 23, Color(0.97, 0.97, 0.95))
		var top := PackedVector2Array()
		for i in 25:
			top.append(Vector2.from_angle(PI + PI * i / 24.0) * 23)
		n.draw_colored_polygon(top, Color(0.9, 0.27, 0.32))
		n.draw_rect(Rect2(-24, -3, 48, 6), Color(0.15, 0.15, 0.2))
		n.draw_circle(Vector2.ZERO, 9, Color(0.15, 0.15, 0.2))
		n.draw_circle(Vector2.ZERO, 6, Color.WHITE)
		n.draw_circle(Vector2(-9, -12), 5, Color(1, 1, 1, 0.6)))
	stage.add_child(n)
	return n


## 캡슐이 날아가 열리며 몬스터가 빛과 함께 튀어나온다
func _capsule_open(from: Vector2, at: Vector2, p: Puppet) -> void:
	var c := _capsule()
	c.position = from
	var to := at + Vector2(0, -p.size.y * 0.4)
	var tw := create_tween()
	tw.tween_method(func(k: float) -> void:
		c.position = from.lerp(to, k) + Vector2(0, -sin(k * PI) * 90)
		c.rotation = k * TAU * 1.5, 0.0, 1.0, 0.42)
	await tw.finished
	FX.burst(stage, to, Color(1, 1, 1), Color(0.8, 0.95, 1.0), 24, 380.0, Vector2.ZERO, 0.45, 1.3, 180.0)
	c.queue_free()
	p.visible = true
	p.p("flash", 1.0)
	p.scale = Vector2(0.1, 0.1)
	var t2 := create_tween()
	t2.tween_property(p, "scale", Vector2(1.12, 1.12), 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	t2.parallel()
	p.tp(t2, "flash", 0.0, 0.4)
	t2.tween_property(p, "scale", Vector2.ONE, 0.1)
	await t2.finished
	await _cry(p)


## 포획: 던지기 → 빛으로 빨려 들어감 → 떨어져 통통 → 흔들흔들 → 딸깍 / 튀어나옴
func _throw_ball(ball: String) -> bool:
	Game.bag[ball] -= 1
	var c := _capsule()
	var from := Vector2(-40, SH * 0.9)
	var to := fp.center()
	var tw := create_tween()
	tw.tween_method(func(k: float) -> void:
		c.position = from.lerp(to, k) + Vector2(0, -sin(k * PI) * 260)
		c.rotation = k * TAU * 2.0, 0.0, 1.0, 0.6)
	await tw.finished
	# 튕겨 열리며 몬스터를 빨아들임
	var bounce := create_tween()
	bounce.tween_property(c, "position", to + Vector2(-30, -70), 0.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	bounce.parallel().tween_property(c, "rotation", -0.4, 0.2)
	fp.p("glow_color", Color(1, 1, 1))
	var suck := create_tween()
	fp.tp(suck, "flash", 1.0, 0.2)
	suck.tween_property(fp, "scale", Vector2(0.05, 0.05), 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	suck.parallel().tween_property(fp, "position", to + Vector2(-30, -70 + fp.size.y * 0.4), 0.3).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	FX.burst(stage, to, Color(1, 1, 1), Color(1, 0.6, 0.6), 18, 180.0, Vector2.ZERO, 0.4, 1.0, 180.0)
	await suck.finished
	fp.visible = false
	# 떨어지며 두 번 통통
	var ground := Vector2(FOE_POS.x - 30, FOE_POS.y - 24)
	var fall := create_tween()
	fall.tween_property(c, "position", ground, 0.32).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
	fall.parallel().tween_property(c, "rotation", 0.0, 0.32)
	await fall.finished
	var sh := Sprite2D.new()
	sh.texture = Puppet._shadow()
	sh.scale = Vector2(0.45, 0.14)
	sh.modulate = Color(0, 0, 0, 0.3)
	sh.position = ground + Vector2(0, 24)
	stage.add_child(sh)
	stage.move_child(sh, 0)
	# 포획 판정 (기존 게임 공식)
	var mx := float(Game.max_hp(foe))
	var rate := float(Data.species(foe.sid).c)
	var bonus: float = {"slp": 2.0, "par": 1.5, "psn": 1.5, "brn": 1.5}.get(foe.get("st", ""), 1.0)
	var a: float = (3.0 * mx - 2.0 * foe.hp) * rate * float(Data.D.items[ball].ball) * bonus / (3.0 * mx)
	var p := clampf(a / 255.0, 0.0, 1.0)
	var ok := randf() < p
	var shakes := 3 if ok else 0
	if not ok:
		var per := pow(p, 0.25)
		while shakes < 2 and randf() < per:
			shakes += 1
	for i in shakes:
		await UI.wait(self, 0.35)
		var wt := create_tween()
		var side := -1.0 if i % 2 == 0 else 1.0
		wt.tween_property(c, "rotation", 0.45 * side, 0.12).set_trans(Tween.TRANS_SINE)
		wt.parallel().tween_property(c, "position:x", ground.x + 10 * side, 0.12)
		wt.tween_property(c, "rotation", -0.2 * side, 0.12).set_trans(Tween.TRANS_SINE)
		wt.parallel().tween_property(c, "position:x", ground.x - 4 * side, 0.12)
		wt.tween_property(c, "rotation", 0.0, 0.1)
		wt.parallel().tween_property(c, "position:x", ground.x, 0.1)
		await wt.finished
	await UI.wait(self, 0.35)
	if ok:
		# 딸깍: 별이 튀고 캡슐이 살짝 어두워진다
		FX.burst(stage, c.position + Vector2(0, -20), Color(1, 0.95, 0.5), Color(1, 0.8, 0.2), 14, 260.0, Vector2(0, 500), 0.7, 0.9, 50.0)
		var dim := create_tween()
		dim.tween_property(c, "scale", Vector2(1.15, 0.85), 0.06)
		dim.tween_property(c, "scale", Vector2.ONE, 0.15).set_trans(Tween.TRANS_BACK)
		dim.tween_property(c, "modulate", Color(0.75, 0.75, 0.8), 0.3)
		await dim.finished
		await msg.say("좋았어! %s 붙잡았다!" % Game.josa(Game.name_of(foe), "을"))
		foe.st = ""
		if Game.party.size() < 6:
			Game.party.append(foe)
		c.queue_free()
		sh.queue_free()
		return true
	# 실패: 캡슐이 터지고 몬스터가 화난 듯 튀어나온다
	FX.burst(stage, c.position, Color(1, 1, 1), Color(1, 0.5, 0.5), 26, 420.0, Vector2(0, 300), 0.5, 1.2, 180.0)
	c.queue_free()
	sh.queue_free()
	fp.visible = true
	fp.position = FOE_POS
	fp.scale = Vector2(0.2, 0.2)
	var back := create_tween()
	back.tween_property(fp, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	back.parallel()
	fp.tp(back, "flash", 0.0, 0.35)
	await back.finished
	await _hop(fp, 2, 22.0)
	await msg.say(["아앗! 캡슐에서 나와 버렸다!", "아깝다! 조금만 더 하면 잡을 수 있었는데!", "으윽! 거의 잡았는데!"][mini(shakes, 2)])
	return false


func _hop(p: Puppet, n: int, h: float) -> void:
	for i in n:
		var tw := create_tween()
		p.tp(tw, "squash", 0.15, 0.06)
		tw.tween_method(func(k: float) -> void: p.lift = sin(k * PI) * h, 0.0, 1.0, 0.22)
		tw.parallel()
		p.tp(tw, "squash", -0.08, 0.1)
		p.tp(tw, "squash", 0.0, 0.12).set_trans(Tween.TRANS_BACK)
		await tw.finished


# ---------------- 전투 진행 ----------------
func _first_alive() -> Dictionary:
	for m in Game.party:
		if m.hp > 0:
			return m
	return Game.party[0]


func _loop() -> String:
	while true:
		var act: Dictionary = await _choose()
		var r := await _turn(act)
		if r != "":
			return r
	return ""


func _turn(act: Dictionary) -> String:
	flinch = {"p": false, "f": false}
	if act.t == "run":
		if kind != "wild":
			await msg.say("승부 중에는 도망칠 수 없다!")
			return ""
		await _run_away()
		return "run"
	if act.t == "ball":
		var caught := await _throw_ball(act.id)
		if caught:
			foe_team.erase(foe)
			if foe_team.is_empty():
				return "caught" if kind != "trainer" else "win"
			await _next_foe()
			return ""
		return await _foe_only()
	if act.t == "potion":
		Game.bag.potion -= 1
		var before: int = me.hp
		me.hp = mini(Game.max_hp(me), me.hp + 20)
		await _heal_fx(pp)
		await _tween_hp("p", me.hp)
		await msg.say("회복약을 썼다! %s의 HP가 %d 회복되었다." % [Game.name_of(me), me.hp - before])
		return await _foe_only()
	if act.t == "switch":
		await _recall()
		await _send_out(Game.party[act.i], "돌아와! ...가랏, %s!" % Game.name_of(Game.party[act.i]))
		return await _foe_only()
	# 기술 대결: 우선도 → 스피드
	var mv_p: Dictionary = me.moves[act.i]
	var mv_f := _foe_move()
	var pf := _first(mv_p, mv_f)
	var order := [["p", mv_p], ["f", mv_f]] if pf else [["f", mv_f], ["p", mv_p]]
	for o in order:
		var side: String = o[0]
		var mon: Dictionary = me if side == "p" else foe
		if mon.hp <= 0:
			continue
		await _use(side, o[1])
		var r := await _after_hit()
		if r != "":
			return r
	return await _end_turn()


func _foe_only() -> String:
	await _use("f", _foe_move())
	var r := await _after_hit()
	if r != "":
		return r
	return await _end_turn()


func _first(a: Dictionary, b: Dictionary) -> bool:
	var pa := int(Data.move(a.id).fx.get("pri", 0))
	var pb := int(Data.move(b.id).fx.get("pri", 0))
	if pa != pb:
		return pa > pb
	var sa := _stat("p", 5) * (0.5 if me.st == "par" else 1.0)
	var sb := _stat("f", 5) * (0.5 if foe.st == "par" else 1.0)
	return sa > sb or (sa == sb and randf() < 0.5)


func _mult(s: int) -> float:
	return (2.0 + s) / 2.0 if s >= 0 else 2.0 / (2.0 - s)


func _stat(side: String, i: int) -> float:
	var m: Dictionary = me if side == "p" else foe
	return Game.calc(m)[i] * _mult(stg[side][i])


## 상대 AI: 가장 아프게 들어갈 기술을 주로 고른다
func _foe_move() -> Dictionary:
	var best: Dictionary = foe.moves[0]
	var score := -1.0
	for x in foe.moves:
		var mv := Data.move(x.id)
		var s := float(mv.p) * Data.eff(mv.t, Data.species(me.sid).t) * (1.5 if Data.species(foe.sid).t.has(mv.t) else 1.0)
		if mv.p == 0:
			s = 25.0
		s *= randf_range(0.7, 1.3)
		if s > score:
			score = s
			best = x
	return best


func _use(side: String, slot: Dictionary) -> void:
	var u: Dictionary = me if side == "p" else foe
	var t: Dictionary = foe if side == "p" else me
	var o := "f" if side == "p" else "p"
	var mv: Dictionary = Data.move(slot.id)
	var nm := _bname(side)
	if u.st == "slp":
		u.slp = int(u.get("slp", 1)) - 1
		if u.slp <= 0:
			u.st = ""
			_set_status(side)
			await msg.say("%s 잠에서 깨어났다!" % Game.josa(nm, "은"))
		else:
			await _status_fx(side, "slp")
			await msg.say("%s 쿨쿨 자고 있다." % Game.josa(nm, "은"))
			return
	if flinch[side]:
		await msg.say("%s 풀이 죽어 움직이지 못했다!" % Game.josa(nm, "은"))
		return
	if u.st == "par" and randf() < 0.25:
		await _status_fx(side, "par")
		await msg.say("%s 몸이 저려서 움직일 수 없다!" % Game.josa(nm, "은"))
		return
	slot.pp = maxi(0, int(slot.pp) - 1)
	msg.say("%s의 %s!" % [nm, mv.n], "", false)
	await UI.wait(self, 0.25)
	if mv.c != "x" or mv.fx.has("foe") or mv.fx.has("status"):
		if randf() * 100.0 >= float(mv.a):
			await _miss_anim(side)
			await msg.say("그러나 %s의 공격은 빗나갔다!" % nm)
			return
	var fx: Dictionary = mv.fx
	if mv.c == "x":
		await _status_move_anim(side, mv)
		if fx.has("self"):
			for e in fx.self:
				await _stat_change(side, int(e[0]), int(e[1]))
		if fx.has("foe"):
			for e in fx.foe:
				await _stat_change(o, int(e[0]), int(e[1]))
		if fx.has("status"):
			await _inflict(o, fx.status, true)
		if fx.has("heal"):
			var before: int = u.hp
			u.hp = mini(Game.max_hp(u), u.hp + Game.max_hp(u) * int(fx.heal) / 100)
			await _tween_hp(side, u.hp)
			await msg.say("%s의 HP가 %d 회복되었다!" % [nm, u.hp - before])
		return
	var r := _dmg(u, t, mv, stg[side], stg[o])
	await _attack_anim(side, mv, r)
	t.hp = maxi(0, t.hp - r.d)
	await _tween_hp(o, t.hp)
	if r.crit:
		await msg.say("급소에 맞았다!")
	if r.e > 1:
		await msg.say("효과가 굉장했다!")
	elif r.e > 0 and r.e < 1:
		await msg.say("효과가 별로인 듯하다...")
	elif r.e == 0:
		await msg.say("%s에게는 효과가 없는 것 같다..." % _bname(o))
	if fx.has("drain") and r.d > 0:
		var g := maxi(1, r.d * int(fx.drain) / 100)
		await FX.projectile(stage, _pup(o).center(), _pup(side).center(), "grass", 0.4, 40)
		u.hp = mini(Game.max_hp(u), u.hp + g)
		await _tween_hp(side, u.hp)
		await msg.say("%s에게서 체력을 빨아들였다!" % _bname(o))
	if fx.has("recoil") and r.d > 0:
		u.hp = maxi(0, u.hp - maxi(1, r.d * int(fx.recoil) / 100))
		await _hurt(_pup(side), Vector2.ZERO, 0.6)
		await _tween_hp(side, u.hp)
		await msg.say("%s 반동으로 피해를 입었다!" % Game.josa(nm, "은"))
	if t.hp > 0:
		if fx.has("st") and randf() * 100.0 < float(fx.st[1]):
			await _inflict(o, fx.st[0], false)
		if fx.has("stat") and randf() * 100.0 < float(fx.stat[3]):
			await _stat_change(o if fx.stat[0] == "foe" else side, int(fx.stat[1]), int(fx.stat[2]))
		if fx.has("flinch") and randf() * 100.0 < float(fx.flinch):
			flinch[o] = true


func _bname(side: String) -> String:
	if side == "p":
		return Game.name_of(me)
	return ("야생 " if kind == "wild" else "상대 ") + Game.name_of(foe)


func _pup(side: String) -> Puppet:
	return pp if side == "p" else fp


## 기존 게임(battle.js dmgCalc)과 같은 계산
func _dmg(u: Dictionary, t: Dictionary, mv: Dictionary, us: Array, ts: Array) -> Dictionary:
	var su := Game.calc(u)
	var st := Game.calc(t)
	var ph: bool = mv.c == "p"
	var crit := randf() < (1.0 / 8.0 if mv.fx.has("crit") else 1.0 / 16.0)
	var A := float(su[1] if ph else su[3])
	var D := float(st[2] if ph else st[4])
	var as_: int = us[1 if ph else 3]
	var ds: int = ts[2 if ph else 4]
	A *= maxf(1.0, _mult(as_)) if crit else _mult(as_)
	D *= minf(1.0, _mult(ds)) if crit else _mult(ds)
	var d := int(floor(floor(floor(2.0 * u.lv / 5.0 + 2.0) * mv.p * A / D) / 50.0)) + 2
	if ph and u.st == "brn":
		d = d / 2
	if crit:
		d = int(d * 1.5)
	d = int(d * (85 + randi() % 16) / 100.0)
	var stab := 1.5 if Data.species(u.sid).t.has(mv.t) else 1.0
	var e := Data.eff(mv.t, Data.species(t.sid).t)
	d = int(d * stab * e)
	if e > 0:
		d = maxi(1, d)
	return {"d": d, "e": e, "crit": crit}


func _after_hit() -> String:
	if foe.hp <= 0:
		await _faint(fp)
		await msg.say("%s 쓰러졌다!" % Game.josa(_bname("f"), "은"))
		await _gain_exp()
		foe_team.erase(foe)
		if foe_team.is_empty():
			if kind != "wild":
				await msg.say("%s의 승부에서 이겼다!" % Game.josa(opts.name, "과") if kind == "trainer" else "%s 털썩 주저앉았다!" % Game.josa(opts.name, "이"))
				if opts.has("lose"):
					await msg.say(opts.lose, opts.name)
			return "win"
		await _next_foe()
	if me.hp <= 0:
		await _faint(pp)
		await msg.say("%s 쓰러졌다!" % Game.josa(Game.name_of(me), "은"))
		var alive := Game.party.filter(func(x: Dictionary) -> bool: return x.hp > 0)
		if alive.is_empty():
			return "lose"
		await _send_out(alive[0], "부탁해, %s!" % Game.name_of(alive[0]))
	return ""


func _next_foe() -> void:
	foe = foe_team[0]
	stg.f = [0, 0, 0, 0, 0, 0]
	if kind == "trainer":
		await _trainer_send(null, false)


func _end_turn() -> String:
	for side in ["p", "f"]:
		var m: Dictionary = me if side == "p" else foe
		if m.hp <= 0 or not (m.st == "psn" or m.st == "brn"):
			continue
		await _status_fx(side, m.st)
		m.hp = maxi(0, m.hp - maxi(1, Game.max_hp(m) / 8))
		await _tween_hp(side, m.hp)
		await msg.say("%s %s 피해를 입었다!" % [Game.josa(_bname(side), "은"), "독으로" if m.st == "psn" else "화상으로"])
		var r := await _after_hit()
		if r != "":
			return r
	return ""


func _inflict(side: String, s: String, announce_fail: bool) -> void:
	var m: Dictionary = me if side == "p" else foe
	var t: Array = Data.species(m.sid).t
	if m.st != "" or m.hp <= 0 or (s == "psn" and t.has("poison")) or (s == "brn" and t.has("fire")) or (s == "par" and t.has("elec")):
		if announce_fail:
			await msg.say("그러나 아무 일도 일어나지 않았다!")
		return
	m.st = s
	if s == "slp":
		m.slp = 1 + randi() % 3
	_set_status(side)
	await _status_fx(side, s)
	await msg.say({"psn": "%s 독에 걸렸다!", "brn": "%s 화상을 입었다!", "par": "%s 마비되어 기술이 나오기 어려워졌다!", "slp": "%s 잠들어 버렸다!"}[s] % Game.josa(_bname(side), "은"))


func _stat_change(side: String, i: int, v: int) -> void:
	var S: Array = stg[side]
	var nm := _bname(side)
	if (v > 0 and S[i] >= 6) or (v < 0 and S[i] <= -6):
		await msg.say("%s의 %s 더 이상 %s 않는다!" % [nm, Game.josa(STN[i], "은"), "올라가지" if v > 0 else "떨어지지"])
		return
	S[i] = clampi(S[i] + v, -6, 6)
	var p := _pup(side)
	var up := v > 0
	# 오를 땐 붉은 빛이 위로, 떨어질 땐 푸른 빛이 아래로 흐른다
	p.p("glow_color", Color(1, 0.45, 0.3) if up else Color(0.3, 0.5, 1))
	var tw := create_tween()
	p.tp(tw, "glow", 0.9, 0.15)
	p.tp(tw, "glow", 0.0, 0.45)
	if not up:
		tw.parallel()
		p.tp(tw, "squash", 0.1, 0.2)
		p.tp(tw, "squash", 0.0, 0.25)
	for k in 3:
		FX.burst(stage, p.center() + Vector2(randf_range(-50, 50), 40 if up else -60), Color(1, 0.6, 0.4) if up else Color(0.5, 0.7, 1),
			Color(1, 0.3, 0.2) if up else Color(0.2, 0.3, 1), 8, 60.0, Vector2(0, -500 if up else 500), 0.6, 0.8, 10.0, Vector2.UP if up else Vector2.DOWN)
	if up:
		await _hop(p, 1, 18.0)
	await tw.finished
	await msg.say("%s의 %s %s!" % [nm, Game.josa(STN[i], "이"), ("올라갔다" if abs(v) == 1 else "크게 올라갔다") if up else ("떨어졌다" if abs(v) == 1 else "크게 떨어졌다")])


# ---------------- 동작 ----------------
func _attack_anim(side: String, mv: Dictionary, r: Dictionary) -> void:
	var a := _pup(side)
	var t := _pup("f" if side == "p" else "p")
	if mv.c == "p":
		await _lunge(a, t, mv)
	else:
		await _special(a, t, mv)
	if r.e == 0:
		return
	var dir := (t.position - a.position).normalized()
	var big: bool = r.crit or r.e > 1
	await _impact(t, dir, mv.t, big)
	FX.number(stage, t.center() + Vector2(0, -t.size.y * 0.35), str(r.d),
		Color(1, 0.85, 0.3) if big else Color.WHITE, 58 if big else 46)


## 물리 기술: 웅크림(예비) → 순간 돌진(늘어남) → 타격 → 튕겨 돌아옴. 가까워질수록 원근에 맞게 크기가 바뀐다.
func _lunge(a: Puppet, t: Puppet, mv: Dictionary) -> void:
	var home := a.position
	var dir := (t.position - a.position).normalized()
	var sx := signf(dir.x)
	var hit_pos := t.position - dir * (t.size.x * 0.45 + 30)
	var scale_to := 0.8 if a == pp else 1.2
	var kick: bool = mv.id in ["kick", "jumpkick", "dropkick"]
	var tw := create_tween()
	tw.tween_property(a, "position", home - dir * 26, 0.16).set_trans(Tween.TRANS_SINE)
	tw.parallel()
	a.tp(tw, "squash", 0.16, 0.16)
	tw.parallel()
	a.tp(tw, "lean", -0.07 * sx, 0.16)
	await tw.finished
	var go := create_tween()
	if kick:
		go.tween_method(func(k: float) -> void:
			a.position = (home - dir * 26).lerp(hit_pos, k)
			a.lift = sin(k * PI) * 70.0
			a.body.rotation = sx * 0.5 * k, 0.0, 1.0, 0.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	else:
		go.tween_property(a, "position", hit_pos, 0.13).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_IN)
	go.parallel().tween_property(a, "scale", Vector2(scale_to, scale_to), 0.13)
	go.parallel()
	a.tp(go, "squash", -0.12, 0.1)
	go.parallel()
	a.tp(go, "lean", 0.12 * sx, 0.12)
	await go.finished
	FX.hit(stage, t.center() - dir * t.size.x * 0.2, mv.t, 0.7)
	# 히트스톱: 맞는 순간 아주 잠깐 멈춘다
	await UI.wait(self, 0.07)
	var back := create_tween()
	back.tween_property(a, "position", home, 0.32).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	back.parallel().tween_property(a, "scale", Vector2.ONE, 0.32)
	back.parallel().tween_property(a.body, "rotation", 0.0, 0.25)
	back.parallel().tween_method(func(v: float) -> void: a.lift = v, a.lift, 0.0, 0.2)
	back.parallel()
	a.tp(back, "squash", 0.0, 0.3)
	back.parallel()
	a.tp(back, "lean", 0.0, 0.3)


## 특수 기술: 몸이 빛나며 기를 모은 뒤, 반동과 함께 발사
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
	var rel := create_tween()
	a.tp(rel, "squash", -0.1, 0.08)
	rel.parallel().tween_property(a, "position", a.position - dir * 18, 0.08)
	a.tp(rel, "squash", 0.0, 0.3).set_trans(Tween.TRANS_BACK)
	rel.parallel().tween_property(a, "position", a.position, 0.3)
	rel.parallel()
	a.tp(rel, "glow", 0.0, 0.3)
	rel.parallel()
	a.tp(rel, "wobble", 0.0, 0.3)
	if mv.t == "elec":
		await _bolt(a.center(), t.center())
	else:
		await FX.projectile(stage, a.center(), t.center(), mv.t, 0.34, 70.0 if mv.t in ["water", "grass", "poison", "rock", "ground"] else 20.0)


func _bolt(from: Vector2, to: Vector2) -> void:
	for n in 3:
		var l := Line2D.new()
		l.width = 9.0 - n * 2
		l.default_color = Color(1, 1, 0.7) if n == 0 else Color(1, 0.9, 0.3, 0.7)
		var pts := PackedVector2Array([from])
		for i in range(1, 8):
			var k := i / 8.0
			pts.append(from.lerp(to, k) + Vector2(randf_range(-26, 26), randf_range(-26, 26)))
		pts.append(to)
		l.points = pts
		stage.add_child(l)
		var tw := l.create_tween()
		tw.tween_property(l, "modulate:a", 0.0, 0.25).set_delay(0.05)
		tw.tween_callback(l.queue_free)
		await UI.wait(self, 0.05)


## 맞는 쪽: 흰 번쩍임 → 넉백 → 젤리처럼 출렁 → 제자리
func _impact(t: Puppet, dir: Vector2, type: String, big: bool) -> void:
	FX.hit(stage, t.center(), type, 1.4 if big else 1.0)
	FX.shake(stage, 18.0 if big else 10.0, 0.3)
	await _hurt(t, dir, 1.3 if big else 1.0)


func _hurt(t: Puppet, dir: Vector2, k: float) -> void:
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
	# 맞은 뒤 두어 번 깜빡임
	for i in 2:
		tw.tween_property(t, "modulate:a", 0.35, 0.05)
		tw.tween_property(t, "modulate:a", 1.0, 0.05)
	await tw.finished


func _miss_anim(side: String) -> void:
	var a := _pup(side)
	var t := _pup("f" if side == "p" else "p")
	var tw := create_tween()
	a.tp(tw, "lean", 0.1 * signf(t.position.x - a.position.x), 0.12)
	a.tp(tw, "lean", 0.0, 0.25)
	# 상대는 옆으로 슬쩍 피한다
	var dodge := create_tween()
	dodge.tween_property(t, "position:x", t.position.x + 50, 0.12).set_trans(Tween.TRANS_QUAD)
	dodge.tween_property(t, "position:x", t.position.x, 0.3).set_trans(Tween.TRANS_BACK)
	await dodge.finished


func _status_move_anim(side: String, mv: Dictionary) -> void:
	var a := _pup(side)
	if mv.fx.has("foe") or mv.fx.has("status"):
		await _cry(a)
	elif mv.fx.has("heal"):
		await _heal_fx(a)
	else:
		a.p("glow_color", Data.type_color(mv.t).lightened(0.3))
		var tw := create_tween()
		a.tp(tw, "glow", 0.8, 0.2)
		a.tp(tw, "glow", 0.0, 0.4)
		await _hop(a, 2, 16.0)


func _heal_fx(p: Puppet) -> void:
	p.p("glow_color", Color(0.5, 1, 0.6))
	var tw := create_tween()
	p.tp(tw, "glow", 0.9, 0.25)
	p.tp(tw, "glow", 0.0, 0.5)
	for i in 4:
		FX.burst(stage, p.position + Vector2(randf_range(-60, 60), -20), Color(0.8, 1, 0.8), Color(0.4, 1, 0.5), 5, 50.0, Vector2(0, -260), 0.8, 0.7, 20.0)
	await tw.finished


## 상태 이상 연출: 독 거품, 화상 불꽃, 마비 찌릿, 잠 Z
func _status_fx(side: String, s: String) -> void:
	var p := _pup(side)
	var c := p.center()
	match s:
		"psn":
			p.p("glow_color", Color(0.7, 0.3, 0.9))
			var tw := create_tween()
			p.tp(tw, "glow", 0.8, 0.15)
			p.tp(tw, "glow", 0.0, 0.4)
			tw.parallel()
			p.tp(tw, "squash", 0.0, 0.4)
			FX.burst(stage, c, Color(0.85, 0.55, 1.0), Color(0.5, 0.2, 0.7), 16, 140.0, Vector2(0, -300), 1.0, 1.0, 60.0)
			await _hurt(p, Vector2.ZERO, 0.5)
		"brn":
			FX.burst(stage, p.position + Vector2(0, -10), Color(1, 0.9, 0.4), Color(1, 0.3, 0.1), 26, 200.0, Vector2(0, -500), 0.7, 1.2, 40.0)
			await _hurt(p, Vector2.ZERO, 0.5)
		"par":
			var tw := create_tween()
			for i in 6:
				tw.tween_property(p, "position:x", p.position.x + (6 if i % 2 else -6), 0.03)
			tw.tween_property(p, "position:x", p.position.x, 0.03)
			FX.burst(stage, c, Color(1, 1, 0.6), Color(1, 0.85, 0.1), 14, 500.0, Vector2.ZERO, 0.25, 0.7, 180.0)
			await _bolt(c + Vector2(-50, -60), c + Vector2(40, 30))
			await tw.finished
		"slp":
			p.p("speed", 0.35)
			for i in 3:
				var z := UI.label(stage, "Z", c + Vector2(30 + i * 18, -30 - i * 10), 30 + i * 8, Color(0.85, 0.9, 1))
				z.add_theme_constant_override("outline_size", 6)
				z.add_theme_color_override("font_outline_color", Color(0.2, 0.25, 0.4))
				z.modulate.a = 0
				var tw := z.create_tween()
				tw.tween_interval(i * 0.2)
				tw.tween_property(z, "modulate:a", 1.0, 0.15)
				tw.parallel().tween_property(z, "position", z.position + Vector2(30, -70), 0.9).set_trans(Tween.TRANS_SINE)
				tw.tween_property(z, "modulate:a", 0.0, 0.2)
				tw.tween_callback(z.queue_free)
			var tw2 := create_tween()
			p.tp(tw2, "bend", 0.08, 0.5)
			p.tp(tw2, "bend", 0.0, 0.5)
			await tw2.finished
			p.p("speed", float(Puppet.motion_profile(me.sid if side == "p" else foe.sid).get("speed", 1.0)))


## 쓰러짐: 무릎 꺾이듯 눌렸다가 가라앉으며 빛 조각으로 흩어진다
func _faint(p: Puppet) -> void:
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
	await UI.wait(self, 0.33)
	FX.burst(stage, p.center(), Color(1, 0.95, 0.75), Color(1, 0.8, 0.4, 0), 30, 160.0, Vector2(0, -200), 1.0, 0.9, 120.0)
	await tw.finished
	p.queue_free()


## 돌아오기: 빨간 빛으로 줄어들며 캡슐로
func _recall() -> void:
	pp.p("glow_color", Color(1, 0.4, 0.4))
	var tw := create_tween()
	pp.tp(tw, "flash", 0.9, 0.15)
	tw.tween_property(pp, "scale", Vector2(0.05, 0.05), 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	await tw.finished
	pp.queue_free()
	huds.p.root.queue_free()
	huds.erase("p")


func _run_away() -> void:
	var tw := create_tween()
	pp.tp(tw, "squash", 0.1, 0.08)
	tw.tween_method(func(k: float) -> void:
		pp.position.x = ME_POS.x - k * 520
		pp.p("walk", 1.0)
		pp.p("walk_phase", k * 18.0)
		pp.lift = absf(sin(k * 18.0)) * 10.0, 0.0, 1.0, 0.55).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	await tw.finished
	await msg.say("무사히 도망쳤다!")


func _gain_exp() -> void:
	var x := int(Data.species(foe.sid).x) * int(foe.lv) / 7
	if kind == "trainer":
		x = int(x * 1.5)
	x = maxi(1, x)
	await msg.say("%s %d 경험치를 얻었다!" % [Game.josa(Game.name_of(me), "은"), x])
	var target: int = me.exp + x
	while true:
		var nxt := Game.exp_for(me.lv + 1)
		var to := mini(target, nxt)
		var a := Game.exp_for(me.lv)
		var w: float = huds.p.rect.size.x - 40
		var tw := create_tween()
		tw.tween_property(huds.p.exp, "size:x", w * clampf(float(to - a) / maxf(1, nxt - a), 0, 1), 0.45)
		await tw.finished
		me.exp = to
		if target < nxt or me.lv >= 100:
			break
		var old_max := Game.max_hp(me)
		me.lv += 1
		me.hp += Game.max_hp(me) - old_max
		_hud_level_up()
		await _level_fx()
		await msg.say("%s 레벨 %d%s 올랐다!" % [Game.josa(Game.name_of(me), "은"), me.lv, "으로" if me.lv % 10 in [3, 6, 0] else "로"])
		for e in Data.species(me.sid).ls:
			if int(e[0]) == me.lv and me.moves.size() < 4 and not me.moves.any(func(q: Dictionary) -> bool: return q.id == e[1]):
				me.moves.append({"id": e[1], "pp": int(Data.move(e[1]).pp)})
				await msg.say("%s 새로 %s 배웠다!" % [Game.josa(Game.name_of(me), "은"), Game.josa(Data.move(e[1]).n, "을")])
		huds.p.exp.size.x = 0


func _hud_level_up() -> void:
	var r: Control = huds.p.root
	for c in r.get_children():
		if c is Label and str(c.text).begins_with("Lv"):
			c.text = "Lv%d" % me.lv
	_set_bar("p", me.hp)


## 레벨 업: 빛 기둥 + 쭉 늘어났다 돌아오기
func _level_fx() -> void:
	pp.p("glow_color", Color(1, 0.95, 0.6))
	var tw := create_tween()
	pp.tp(tw, "glow", 1.0, 0.2)
	tw.parallel()
	pp.tp(tw, "squash", -0.15, 0.2)
	pp.tp(tw, "squash", 0.0, 0.4).set_trans(Tween.TRANS_ELASTIC)
	tw.parallel()
	pp.tp(tw, "glow", 0.0, 0.6)
	FX.burst(stage, pp.position, Color(1, 1, 0.8), Color(1, 0.85, 0.3), 30, 120.0, Vector2(0, -700), 0.9, 1.0, 15.0)
	await tw.finished


# ---------------- 메뉴 ----------------
func _clear_menu() -> void:
	for c in menu.get_children():
		c.queue_free()


func _btn_rect(i: int, n_cols := 2) -> Rect2:
	var gap := 14.0
	var w := (VS.x - 32 - gap * (n_cols - 1)) / n_cols
	var h := 118.0
	return Rect2(16 + (i % n_cols) * (w + gap), SH + 214 + (i / n_cols) * (h + gap), w, h)


func _choose() -> Dictionary:
	while true:
		msg.say("%s 무엇을 할까?" % Game.josa(Game.name_of(me), "은"), "", false)
		var c: int = await _buttons([["싸운다", Color(0.86, 0.36, 0.36)], ["가방", Color(0.86, 0.62, 0.25)],
			["몬스터", Color(0.33, 0.62, 0.42)], ["도망친다", Color(0.36, 0.48, 0.72)]], false)
		match c:
			0:
				var opts_m := []
				for x in me.moves:
					var mv := Data.move(x.id)
					opts_m.append(["%s\n%s  %d/%d" % [mv.n, Data.type_name(mv.t), x.pp, mv.pp], Data.type_color(mv.t).darkened(0.1), x.pp <= 0])
				msg.say("어떤 기술을 쓸까?", "", false)
				var k: int = await _buttons(opts_m, true)
				if k >= 0:
					return {"t": "move", "i": k}
			1:
				var items := [["포획캡슐 ×%d" % Game.bag.ball, Color(0.85, 0.3, 0.35), Game.bag.ball <= 0],
					["은빛캡슐 ×%d" % Game.bag.great, Color(0.45, 0.55, 0.75), Game.bag.great <= 0],
					["회복약 ×%d" % Game.bag.potion, Color(0.35, 0.65, 0.45), Game.bag.potion <= 0 or me.hp >= Game.max_hp(me)]]
				msg.say("가방에서 무엇을 꺼낼까?", "", false)
				var k: int = await _buttons(items, true)
				if k == 0 or k == 1:
					return {"t": "ball", "id": "ball" if k == 0 else "great"}
				if k == 2:
					return {"t": "potion"}
			2:
				var list := []
				for m in Game.party:
					list.append(["%s Lv%d\nHP %d/%d" % [Game.name_of(m), m.lv, m.hp, Game.max_hp(m)], Color(0.33, 0.55, 0.5), m == me or m.hp <= 0])
				msg.say("누구로 교체할까?", "", false)
				var k: int = await _buttons(list, true)
				if k >= 0:
					return {"t": "switch", "i": k}
			3:
				return {"t": "run"}
	return {}


## 버튼 묶음을 띄우고 고른 번호를 돌려준다 (-1 = 뒤로)
func _buttons(list: Array, with_back: bool) -> int:
	_clear_menu()
	_pick = null
	var n := list.size() + (1 if with_back else 0)
	var cols := 2 if n <= 4 else 3
	var first: Button = null
	for i in list.size():
		var e: Array = list[i]
		var b := UI.button(menu, e[0], _btn_rect(i, cols), e[1], 28 if "\n" in e[0] else 34)
		b.disabled = e.size() > 2 and e[2]
		b.pressed.connect(func() -> void: _pick = i)
		b.scale = Vector2(0.85, 0.85)
		b.pivot_offset = b.size / 2
		b.modulate.a = 0
		var tw := b.create_tween()
		tw.tween_interval(i * 0.03)
		tw.tween_property(b, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.parallel().tween_property(b, "modulate:a", 1.0, 0.12)
		if first == null and not b.disabled:
			first = b
	if with_back:
		var bb := UI.button(menu, "뒤로", _btn_rect(list.size(), cols), Color(0.45, 0.47, 0.52), 30)
		bb.pressed.connect(func() -> void: _pick = -1)
	if first:
		first.grab_focus()
	while _pick == null:
		if with_back and Input.is_action_just_pressed("b_btn"):
			_pick = -1
		await get_tree().process_frame
	_clear_menu()
	return _pick
