extends Node
## 메뉴와 시설: 기존 menus.js · battle.js(진화·레벨업)·world.js(엔딩)를 옮긴 것.

const BOX_MIN := 10
const STAGE_N := ["기본", "1진화", "최종진화"]
const BADGES := [["반석 배지", "단단", Color(0.62, 0.55, 0.45)], ["물결 배지", "하라", Color(0.35, 0.6, 0.95)],
	["불꽃 배지", "화련", Color(0.95, 0.42, 0.22)], ["번개 배지", "찌나", Color(0.98, 0.8, 0.2)], ["창공 배지", "하늬", Color(0.55, 0.82, 1.0)]]
const REGION := {"town": ["새싹마을", 0.12, 0.85], "route1": ["1번 도로", 0.12, 0.55], "city": ["바위시티", 0.12, 0.22], "route2": ["2번 도로", 0.33, 0.22],
	"town2": ["물결마을", 0.55, 0.22], "route3": ["3번 도로", 0.55, 0.55], "town3": ["붉은재마을", 0.55, 0.85], "route4": ["4번 도로", 0.72, 0.85],
	"town4": ["번개도시", 0.88, 0.85], "route5": ["5번 도로", 0.88, 0.5], "town5": ["하늘봉마을", 0.88, 0.16]}
const REGION_PATH := ["town", "city", "town2", "town3", "town4", "town5"]
const PRIVACY_URL := "https://chunghyun1995.github.io/monster-expedition/privacy.html"

var pending_evo: Array = []


func vs() -> Vector2:
	return get_viewport().get_visible_rect().size


func mon_icon(m) -> Array:
	var sid: int = int(m.sid) if m is Dictionary else int(m)
	var s: Dictionary = Game.sp(sid)
	if s.has("human"):
		return ["people", Data.look_index(s.human)]
	return ["monsters", sid - 1]


func hp_text(m: Dictionary) -> String:
	return "%d/%d" % [int(m.hp), Game.max_hp(m)]


## 미리보기 칸에 몬스터 정보 (그림이 숨 쉬는 퍼펫)
func mon_preview(m: Dictionary, title := "") -> void:
	var p := Msg.preview()
	if p == null:
		return
	var s: Dictionary = Game.sp(m.sid)
	var pn := UI.panel(p, Rect2(12, 110, p.size.x - 24, p.size.y - 120), Color(0.95, 0.97, 1.0))
	var stage := Node2D.new()
	stage.position = Vector2(150, pn.size.y - 30)
	pn.add_child(stage)
	var pup := Puppet.new()
	stage.add_child(pup)
	pup.setup_mon(int(m.sid), false, minf(pn.size.y - 70, 230.0))
	if m.get("shiny", false):
		pup.mesh.modulate = Color(1.0, 0.92, 0.75)
	if m.hp <= 0:
		pup.p("dark", 0.5)
	var types: Array = []
	for t in s.t:
		types.append(Data.type_name(t))
	var x0 := 300.0
	UI.label(pn, "%s%s" % [Game.name_of(m), " ★" if m.get("shiny", false) else ""], Vector2(x0, 18), 34)
	UI.label(pn, "Lv%d · %s" % [int(m.lv), "/".join(types)], Vector2(x0, 66), 26, Color(0.3, 0.35, 0.45))
	UI.label(pn, "HP %s" % hp_text(m), Vector2(x0, 106), 28)
	var st: String = m.get("st", "")
	UI.label(pn, "상태: %s" % (Data.D.status[st].n if st != "" else "건강"), Vector2(x0, 146), 26, Color(0.3, 0.35, 0.45))
	UI.label(pn, "%s 성격" % Data.D.natures[int(m.nat)][0], Vector2(x0, 184), 24, Color(0.4, 0.45, 0.55))
	var mv: Array = []
	for x in m.moves:
		mv.append(Data.move(x.id).n)
	var ml := UI.label(pn, " · ".join(mv), Vector2(x0, 222), 24, Color(0.25, 0.3, 0.4))
	ml.size.x = pn.size.x - x0 - 16
	ml.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	if title != "":
		var tl := UI.label(p, title, Vector2(24, 50), 30, Color.WHITE)
		tl.add_theme_constant_override("outline_size", 8)
		tl.add_theme_color_override("font_outline_color", Color(0.1, 0.12, 0.2))


# =====================================================================
# 시작 메뉴
# =====================================================================
func main_menu(w: World) -> void:
	Sound.sfx("menu")
	var at := 0
	while true:
		var s := vs()
		var bw := (s.x - 60) / 2.0
		var defs := [["도감", Game.flag("dex"), Color(0.86, 0.36, 0.42)], ["몬스터", Game.g.party.size() > 0, Color(0.33, 0.62, 0.42)],
			["가방", true, Color(0.86, 0.62, 0.25)], [str(Game.g.name), true, Color(0.36, 0.48, 0.72)],
			["리포트", true, Color(0.5, 0.42, 0.75)], ["지도", Game.flag("pad"), Color(0.3, 0.6, 0.62)],
			["설정", true, Color(0.42, 0.45, 0.52)], ["닫기", true, Color(0.3, 0.32, 0.38)]]
		var btns: Array = []
		for i in defs.size():
			btns.append({"text": defs[i][0] if defs[i][1] else "???", "disabled": not defs[i][1], "color": defs[i][2],
				"rect": Rect2(20 + (i % 2) * (bw + 20), s.y * 0.3 + (i / 2) * 130, bw, 116), "size": 36})
		var i := await Msg.buttons(btns, 7, at)
		if i == 7:
			break
		at = i
		match i:
			0:
				await dex_screen()
			1:
				await party_screen("field")
			2:
				await bag_screen("field")
			3:
				await trainer_card()
			4:
				if await save_menu(w):
					break
			5:
				await map_screen(w)
			6:
				await options_menu()
	await run_pending_evo()


func run_pending_evo() -> void:
	while pending_evo.size():
		var mon: Dictionary = pending_evo.pop_front()
		if Game.g.party.has(mon):
			var e = Game.sp(mon.sid).get("ev")
			if e and int(mon.lv) >= int(e[0]):
				await evolve(mon)


# =====================================================================
# 파티
# =====================================================================
## mode: field | battle | forced | item | deposit → 고른 번호 (-1 = 취소)
func party_screen(mode: String, opts := {}) -> int:
	if Game.auto_text:
		await get_tree().process_frame
		if mode == "field":
			return -1
		for i in Game.g.party.size():
			if i != int(opts.get("current", -1)) and (Game.g.party[i].hp > 0 or mode == "item"):
				return i
		return -1
	var at: int = int(opts.get("start", 0))
	while true:
		var items: Array = []
		for m in Game.g.party:
			items.append({"text": Game.name_of(m), "right": "Lv%d  HP %s%s" % [int(m.lv), hp_text(m), "  " + Data.D.status[m.st].n if str(m.get("st", "")) != "" else ""],
				"icon": mon_icon(m), "color": Color(0.85, 0.85, 0.88) if m.hp <= 0 else Color(0.93, 0.95, 0.99)})
		var title: String = {"field": "몬스터", "battle": "교체할 몬스터", "forced": "다음에 내보낼 몬스터", "item": opts.get("tip", "누구에게 사용할까요?"), "deposit": "맡길 몬스터"}[mode]
		var i := await Msg.list(items, {"title": title, "start": at, "cancel": mode != "forced",
			"on_move": func(k: int) -> void: mon_preview(Game.g.party[k], title)})
		if i < 0:
			return -1
		at = i
		var m: Dictionary = Game.g.party[i]
		if mode == "item" or mode == "deposit":
			return i
		if mode == "forced":
			if m.hp <= 0:
				await Msg.say("%s 싸울 수 있는 기력이 없다!" % Game.josa(Game.name_of(m), "은"))
				continue
			if opts.get("current", -1) == i:
				continue
			return i
		if mode == "battle":
			var c := await Msg.ask("%s 어떻게 할까?" % Game.josa(Game.name_of(m), "을"), ["교체한다", "정보 보기", "취소"])
			if c == 0:
				if m.hp <= 0:
					await Msg.say("%s 싸울 수 있는 기력이 없다!" % Game.josa(Game.name_of(m), "은"))
					continue
				if opts.get("current", -1) == i:
					await Msg.say("%s 이미 싸우고 있다!" % Game.josa(Game.name_of(m), "은"))
					continue
				return i
			if c == 1:
				await summary(Game.g.party, i)
			continue
		var c2 := await Msg.ask("%s 어떻게 할까?" % Game.josa(Game.name_of(m), "을"), ["정보 보기", "순서 바꾸기", "합성하기", "취소"])
		if c2 == 0:
			await summary(Game.g.party, i)
		elif c2 == 1 and Game.g.party.size() > 1:
			var j := await Msg.list(items, {"title": "%s 어디로 옮길까요?" % Game.josa(Game.name_of(m), "을"), "start": i})
			if j >= 0 and j != i:
				var t = Game.g.party[i]
				Game.g.party[i] = Game.g.party[j]
				Game.g.party[j] = t
				at = j
		elif c2 == 2:
			await fusion_flow(null, {"m": m, "where": "party"})
			at = mini(at, Game.g.party.size() - 1)
	return -1


## 요약: 몬스터 정보 · 능력치 · 기술
func summary(lst: Array, idx: int) -> void:
	var layer := CanvasLayer.new()
	layer.layer = 61
	add_child(layer)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.add_child(root)
	var ctx := {"root": root, "lst": lst, "cur": idx, "page": 0, "done": false}
	_sum_render(ctx)
	while not ctx.done:
		if Input.is_action_just_pressed("b_btn"):
			ctx.done = true
		elif Input.is_action_just_pressed("ui_left"):
			ctx.page = (int(ctx.page) + 2) % 3
			_sum_render(ctx)
		elif Input.is_action_just_pressed("ui_right"):
			ctx.page = (int(ctx.page) + 1) % 3
			_sum_render(ctx)
		await get_tree().process_frame
	layer.queue_free()


func _sum_set(ctx: Dictionary, k: String, v) -> void:
	ctx[k] = v
	_sum_render(ctx)


func _sum_render(ctx: Dictionary) -> void:
	var s := vs()
	var root: Control = ctx.root
	var lst: Array = ctx.lst
	if ctx.get("cried", -1) != ctx.cur:
		ctx.cried = ctx.cur
		Sound.cry(lst[int(ctx.cur)].sid)
	else:
		Sound.sfx("cur")
	var page: int = int(ctx.page)
	for c in root.get_children():
		c.queue_free()
	var m: Dictionary = lst[int(ctx.cur)]
	var sp: Dictionary = Game.sp(m.sid)
	var st := Game.calc(m)
	var bg := ColorRect.new()
	bg.color = [Color(1.0, 0.95, 0.85), Color(0.9, 0.97, 0.87), Color(0.88, 0.92, 1.0)][page]
	bg.size = s
	root.add_child(bg)
	var stage := Node2D.new()
	stage.position = Vector2(s.x / 2, 470)
	root.add_child(stage)
	var pup := Puppet.new()
	stage.add_child(pup)
	pup.setup_mon(int(m.sid), false, 300.0)
	UI.label(root, "%s%s  Lv%d" % [Game.name_of(m), " ★" if m.get("shiny", false) else "", int(m.lv)], Vector2(30, 30), 40)
	var info := UI.panel(root, Rect2(20, 520, s.x - 40, s.y - 700))
	var lines: Array = []
	if page == 0:
		var types: Array = []
		for t in sp.t:
			types.append(Data.type_name(t))
		lines = ["도감 No. %s" % ("—" if sp.has("human") else "%03d" % int(m.sid)), "종류: %s (%s 몬스터)" % [sp.n, sp.cat], "타입: %s" % "/".join(types),
			"어버이: %s" % str(m.ot if m.get("ot") != null else Game.g.name), "성격: %s" % Data.D.natures[int(m.nat)][0],
			("%s에서 Lv%d일 때 만났다." % [m.met.map, int(m.met.lv)]) if m.get("met") != null else "운명적으로 만났다.", "", str(sp.d)]
	elif page == 1:
		var nat: Array = Data.D.natures[int(m.nat)]
		lines = ["HP  %d / %d" % [int(m.hp), st[0]]]
		for i in range(1, 6):
			var mark := " ▲" if int(nat[1]) == i and int(nat[2]) != i else " ▼" if int(nat[2]) == i and int(nat[1]) != i else ""
			lines.append("%s  %d%s" % [Data.D.stn[i], st[i], mark])
		lines.append("경험치 %d · 다음 레벨까지 %d" % [int(m.exp), 0 if int(m.lv) >= 100 else Game.exp_for(int(m.lv) + 1) - int(m.exp)])
	else:
		for x in m.moves:
			var d: Dictionary = Data.move(x.id)
			lines.append("%s [%s·%s] PP %d/%d  위력 %s 명중 %s" % [d.n, Data.type_name(d.t), Data.D.catn[d.c], int(x.pp), int(d.pp), str(d.p) if int(d.p) else "-", str(d.a) if int(d.a) else "-"])
			lines.append("   " + str(d.d))
	var l := UI.label(info, "\n".join(lines), Vector2(26, 20), 28)
	l.size.x = info.size.x - 52
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var tabs := ["정보", "능력치", "기술"]
	for j in 3:
		var b := UI.button(root, tabs[j], Rect2(20 + j * ((s.x - 40) / 3.0), 100, (s.x - 40) / 3.0 - 10, 70), Color(0.3, 0.5, 0.8) if j == page else Color(0.5, 0.52, 0.6), 28)
		b.pressed.connect(_sum_set.bind(ctx, "page", j))
	var w3 := (s.x - 60) / 3.0
	var prev := UI.button(root, "▲ 이전", Rect2(20, s.y - 150, w3, 100), Color(0.4, 0.5, 0.65), 28)
	prev.pressed.connect(_sum_set.bind(ctx, "cur", (int(ctx.cur) - 1 + lst.size()) % lst.size()))
	var nxt := UI.button(root, "▼ 다음", Rect2(30 + w3, s.y - 150, w3, 100), Color(0.4, 0.5, 0.65), 28)
	nxt.pressed.connect(_sum_set.bind(ctx, "cur", (int(ctx.cur) + 1) % lst.size()))
	var back := UI.button(root, "돌아가기", Rect2(40 + 2 * w3, s.y - 150, w3, 100), Color(0.3, 0.32, 0.38), 28)
	back.pressed.connect(func() -> void: ctx.done = true)
	back.grab_focus()


# =====================================================================
# 가방
# =====================================================================
func bag_ids(pocket: String) -> Array:
	var out: Array = []
	for k in Data.D.items:
		if Data.D.items[k].p == pocket and int(Game.g.bag.get(k, 0)) > 0:
			out.append(k)
	return out


## mode: field | battle → battle에서는 {id, target} 또는 {} 를 돌려준다
func bag_screen(mode: String) -> Dictionary:
	var pocket := 0
	while true:
		var P: Array = Data.D.pockets
		var ids := bag_ids(P[pocket][0])
		var items: Array = []
		for k in ids:
			var it: Dictionary = Data.D.items[k]
			items.append({"text": it.n, "right": "" if it.p == "key" else "× %d" % int(Game.g.bag[k]), "disabled": mode == "battle" and it.p == "key"})
		var btns := [["◀", -10], ["%s" % P[pocket][1], -12], ["▶", -11], ["닫기", -1]]
		var r := await Msg.list(items, {"title": "가방 · %s · %s" % [P[pocket][1], Game.money(Game.g.money)], "buttons": btns,
			"on_move": func(i: int) -> void: _item_preview(ids[i]),
			"keys": func(k: String, _i: int):
				return -10 if k == "ui_left" else -11})
		if r == -10:
			pocket = (pocket + 2) % 3
			continue
		if r == -11 or r == -12:
			pocket = (pocket + 1) % 3
			continue
		if r < 0:
			return {}
		var id: String = ids[r]
		var it: Dictionary = Data.D.items[id]
		if it.p == "key":
			await Msg.say("원정패드는 메뉴의 지도에서 쓸 수 있다." if id == "pad" else "도감은 메뉴에서 볼 수 있다." if id == "dex" else "%s 신고 있는 것만으로 효과가 있다." % Game.josa(it.n, "은"))
			continue
		if mode == "battle":
			if it.has("ball"):
				return {"id": id}
			if it.has("lvup"):
				await Msg.say("전투 중에는 마실 틈이 없다!")
				continue
			var t := await party_screen("item", {"tip": "%s 누구에게 사용할까요?" % Game.josa(it.n, "을")})
			if t < 0:
				continue
			if not can_use(id, Game.g.party[t]):
				await Msg.say("사용해도 효과가 없을 것 같다.")
				continue
			return {"id": id, "target": t}
		if it.has("ball"):
			await Msg.say("지금은 사용할 수 없다!")
			continue
		var t2 := await party_screen("item", {"tip": "%s 누구에게 사용할까요?" % Game.josa(it.n, "을")})
		if t2 < 0:
			continue
		var m: Dictionary = Game.g.party[t2]
		if not can_use(id, m):
			await Msg.say("사용해도 효과가 없을 것 같다.")
			continue
		await apply_item(id, m)
	return {}


func _item_preview(id: String) -> void:
	var p := Msg.preview()
	if p == null:
		return
	var it: Dictionary = Data.D.items[id]
	var pn := UI.panel(p, Rect2(12, 110, p.size.x - 24, p.size.y - 120), Color(1.0, 0.97, 0.9))
	UI.label(pn, it.n, Vector2(30, 24), 38)
	UI.label(pn, "중요한 물건" if it.p == "key" else "보유 %d개" % int(Game.g.bag.get(id, 0)), Vector2(30, 80), 26, Color(0.4, 0.42, 0.5))
	var d := UI.label(pn, it.d, Vector2(30, 130), 28)
	d.size.x = pn.size.x - 60
	d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART


func can_use(id: String, m: Dictionary) -> bool:
	var it: Dictionary = Data.D.items[id]
	if it.has("lvup"):
		return int(m.lv) < 100
	if it.has("revive"):
		return m.hp <= 0
	if m.hp <= 0:
		return false
	if it.has("heal"):
		return m.hp < Game.max_hp(m)
	if it.has("cure"):
		return str(m.st) != "" if it.cure == "all" else str(m.st) == it.cure
	return false


func apply_item(id: String, m: Dictionary) -> void:
	var it: Dictionary = Data.D.items[id]
	Game.g.bag[id] = int(Game.g.bag[id]) - 1
	if it.has("lvup"):
		await Msg.say("%s %s 꿀꺽 마셨다!" % [Game.josa(Game.name_of(m), "은"), Game.josa(it.n, "을")])
		m.exp = Game.exp_for(int(m.lv) + 1)
		await level_up(m, false)
		var e = Game.sp(m.sid).get("ev")
		if e and int(m.lv) >= int(e[0]) and m.hp > 0 and not pending_evo.has(m):
			pending_evo.append(m)
			await Msg.say("어라...? %s의 몸이 빛나기 시작했다! (메뉴를 닫으면 진화가 시작된다)" % Game.name_of(m))
		return
	if it.has("revive"):
		m.hp = maxi(1, int(Game.max_hp(m) * float(it.revive)))
		m.st = ""
		Sound.sfx("heal")
		await Msg.say("%s 기운을 되찾았다!" % Game.josa(Game.name_of(m), "은"))
		return
	if it.has("heal"):
		var b0: int = int(m.hp)
		m.hp = mini(Game.max_hp(m), int(m.hp) + int(it.heal))
		Sound.sfx("heal")
		await Msg.say("%s의 HP가 %d 회복되었다!" % [Game.name_of(m), int(m.hp) - b0])
		return
	if it.has("cure"):
		m.st = ""
		m.slp = 0
		Sound.sfx("heal")
		await Msg.say("%s의 상태 이상이 나았다!" % Game.name_of(m))


# =====================================================================
# 레벨업 · 기술 · 진화
# =====================================================================
func level_up(m: Dictionary, show_box := true) -> void:
	var o := Game.calc(m)
	m.lv = int(m.lv) + 1
	var n := Game.calc(m)
	m.hp = mini(n[0], int(m.hp) + n[0] - o[0])
	Sound.jingle("level")
	await Msg.say("%s 레벨 %s 올랐다!" % [Game.josa(Game.name_of(m), "은"), Game.josa(int(m.lv), "로")], "", {"keep": true})
	if show_box:
		var s := vs()
		var layer := CanvasLayer.new()
		layer.layer = 61
		add_child(layer)
		var p := UI.panel(layer, Rect2(s.x - 330, s.y * 0.2, 310, 380), Color(0.98, 0.98, 1.0))
		var labels: Array = []
		for i in 6:
			labels.append(UI.label(p, "%s  +%d" % [Data.D.stn[i], n[i] - o[i]], Vector2(30, 24 + i * 56), 30))
		p.scale = Vector2(0.6, 0.6)
		p.pivot_offset = p.size / 2
		p.create_tween().tween_property(p, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_BACK)
		await _wait_a()
		for i in 6:
			labels[i].text = "%s  %d" % [Data.D.stn[i], n[i]]
		await _wait_a()
		layer.queue_free()
	Msg.hide_box()
	await learn_moves(m)


func _wait_a() -> void:
	if Game.auto_text:
		await get_tree().create_timer(0.05).timeout
		return
	while true:
		await get_tree().process_frame
		if Input.is_action_just_pressed("a_btn") or Input.is_action_just_pressed("b_btn") or Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
			break
	while Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		await get_tree().process_frame


func learn_moves(m: Dictionary) -> void:
	for e in Game.sp(m.sid).ls:
		if int(e[0]) != int(m.lv):
			continue
		if m.moves.any(func(x: Dictionary) -> bool: return x.id == e[1]):
			continue
		await learn_move(m, e[1])


func learn_move(m: Dictionary, id: String) -> void:
	var d: Dictionary = Data.move(id)
	var nmv: String = d.n
	var n := Game.name_of(m)
	if m.moves.size() < 4:
		m.moves.append({"id": id, "pp": int(d.pp)})
		Sound.jingle("level")
		await Msg.say("%s 새로 %s 배웠다!" % [Game.josa(n, "은"), Game.josa(nmv, "을")])
		return
	await Msg.say("%s 새로 %s 배우고 싶다..." % [Game.josa(n, "은"), Game.josa(nmv, "을")])
	await Msg.say("하지만 %s 기술을 4개까지만 기억할 수 있다!" % Game.josa(n, "은"))
	while true:
		var r := await Msg.ask("다른 기술을 잊게 하고 %s 배우게 하겠습니까?" % Game.josa(nmv, "을"), ["예", "아니오"])
		if r == 0:
			var items: Array = []
			for x in m.moves:
				var dd: Dictionary = Data.move(x.id)
				items.append({"text": dd.n, "right": "%s · PP %d/%d" % [Data.type_name(dd.t), int(x.pp), int(dd.pp)], "color": Data.type_color(dd.t).lerp(Color.WHITE, 0.6)})
			var i := await Msg.list(items, {"title": "어느 기술을 잊게 할까요? (새 기술: %s · 위력 %s)" % [nmv, str(d.p) if int(d.p) else "-"]})
			if i >= 0:
				var old: String = Data.move(m.moves[i].id).n
				m.moves[i] = {"id": id, "pp": int(d.pp)}
				await Msg.say("하나, 둘... 뿅!")
				await Msg.say("%s %s 깨끗이 잊었다!" % [Game.josa(n, "은"), Game.josa(old, "을")])
				Sound.jingle("level")
				await Msg.say("그리고... %s 새로 %s 배웠다!" % [Game.josa(n, "은"), Game.josa(nmv, "을")])
				return
		var q := await Msg.ask("그럼... %s 배우는 것을 포기하겠습니까?" % Game.josa(nmv, "을"), ["예", "아니오"])
		if q == 0:
			await Msg.say("%s 결국 %s 배우지 않았다!" % [Game.josa(n, "은"), Game.josa(nmv, "을")])
			return


## 진화: 빛 속에서 두 모습이 점점 빠르게 번갈아 바뀌다가 새 모습으로 터져 나온다 (B로 멈춤)
func evolve(m: Dictionary) -> void:
	var from: int = int(m.sid)
	var to: int = int(Game.sp(from).ev[1])
	var old_name := Game.name_of(m)
	var prev_music := Sound.cur if Sound.cur != "" else Sound.want
	var s := vs()
	var layer := CanvasLayer.new()
	layer.layer = 40
	add_child(layer)
	await Game.fade_to(1.0, 0.3)
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.06, 0.14)
	bg.size = s
	layer.add_child(bg)
	var rays := Node2D.new()
	rays.position = Vector2(s.x / 2, s.y * 0.38)
	rays.draw.connect(func() -> void:
		for i in 12:
			var a := i * PI / 6
			var col := Color(1, 0.85, 0.3, 0.1) if i % 2 else Color(0.5, 0.72, 1.0, 0.1)
			rays.draw_colored_polygon(PackedVector2Array([Vector2.ZERO, Vector2.from_angle(a - 0.12) * 900, Vector2.from_angle(a + 0.12) * 900]), col))
	layer.add_child(rays)
	var spin := rays.create_tween().set_loops()
	spin.tween_property(rays, "rotation", TAU, 9.0).from(0.0)
	var stage := Node2D.new()
	stage.position = Vector2(s.x / 2, s.y * 0.5)
	layer.add_child(stage)
	var a := Puppet.new()
	stage.add_child(a)
	a.setup_mon(from, false, 280.0)
	var b := Puppet.new()
	stage.add_child(b)
	b.setup_mon(to, false, 300.0)
	b.visible = false
	Msg.place("field")
	Sound.music("evolve")
	await Game.fade_to(0.0, 0.3)
	await Msg.say("어...? %s의 모습이...!" % old_name, "", {"keep": true})
	await Sound.cry(from)
	a.p("glow_color", Color.WHITE)
	b.p("glow_color", Color.WHITE)
	var tw := create_tween()
	a.tp(tw, "glow", 1.4, 0.7)
	await tw.finished
	b.p("glow", 1.4)
	Msg.toast("B 버튼을 누르면 진화를 멈출 수 있어요")
	var cancel := false
	for i in 16:
		if Input.is_action_pressed("b_btn"):
			cancel = true
			break
		var d := maxf(0.07, 0.42 - i * 0.024)
		var show_b := i % 2 == 1
		a.visible = not show_b
		b.visible = show_b
		var cur := b if show_b else a
		Sound.sfx("cur")
		cur.scale = Vector2(0.92, 0.92)
		var t2 := create_tween()
		t2.tween_property(cur, "scale", Vector2(1.08, 1.08), d * 0.5)
		t2.tween_property(cur, "scale", Vector2.ONE, d * 0.5)
		if i % 3 == 0:
			FX.burst(stage, Vector2(randf_range(-200, 200), randf_range(-300, 0)), Color(1, 1, 0.8), Color(1, 0.85, 0.3, 0), 10, 120.0, Vector2.ZERO, 0.6, 0.8, 180.0)
		await t2.finished
	if cancel:
		a.visible = true
		b.visible = false
		var t3 := create_tween()
		a.tp(t3, "glow", 0.0, 0.4)
		await t3.finished
		await Sound.cry(from)
		await Msg.say("어라...? %s의 변화가 멈췄다!" % old_name)
	else:
		a.visible = false
		b.visible = true
		var flash := ColorRect.new()
		flash.color = Color(1, 1, 1, 0)
		flash.size = s
		layer.add_child(flash)
		var t4 := create_tween()
		t4.tween_property(flash, "color:a", 1.0, 0.25)
		await t4.finished
		var o := Game.calc(m)
		m.sid = to
		var n := Game.calc(m)
		m.hp = mini(n[0], int(m.hp) + n[0] - o[0])
		Game.g.seen[to] = 1
		Game.g.caught[to] = 1
		b.p("glow", 0.0)
		var t5 := create_tween()
		t5.tween_property(flash, "color:a", 0.0, 0.45)
		await t5.finished
		FX.burst(stage, Vector2(0, -150), Color(1, 1, 0.8), Color(0.6, 0.85, 1.0), 30, 360.0, Vector2(0, 200), 1.0, 1.2, 180.0)
		var t6 := create_tween()
		b.tp(t6, "squash", -0.15, 0.15)
		b.tp(t6, "squash", 0.0, 0.5).set_trans(Tween.TRANS_ELASTIC)
		Sound.cry(to)
		await Sound.jingle("evolved")
		await Msg.say("축하합니다! %s %s 진화했다!" % [Game.josa(old_name, "은"), Game.josa(Game.sp(to).n, "로")])
		await learn_moves(m)
	await Game.fade_to(1.0, 0.3)
	layer.queue_free()
	Sound.music(prev_music)
	await Game.fade_to(0.0, 0.3)


# =====================================================================
# 도감 · 트레이너 카드 · 지도
# =====================================================================
func dex_screen() -> void:
	var ids: Array = []
	for k in Data.D.species:
		if not Data.D.species[k].has("human"):
			ids.append(int(k))
	ids.sort()
	var items: Array = []
	for id in ids:
		var seen: bool = Game.g.seen.has(id)
		items.append({"text": ("%03d  %s" % [id, Game.sp(id).n]) if seen else "%03d  - - - - -" % id, "right": "◆" if Game.g.caught.has(id) else "",
			"icon": mon_icon(id) if seen else null})
	for it in items:
		if it.icon == null:
			it.erase("icon")
	await Msg.list(items, {"title": "몬스터 도감 · 발견 %d · 포획 %d" % [Game.g.seen.size(), Game.g.caught.size()], "top": 0.5,
		"on_move": func(i: int) -> void: _dex_preview(ids[i])})


func _dex_preview(id: int) -> void:
	var p := Msg.preview()
	if p == null:
		return
	var sp: Dictionary = Game.sp(id)
	var seen: bool = Game.g.seen.has(id)
	var cg: bool = Game.g.caught.has(id)
	var pn := UI.panel(p, Rect2(12, 110, p.size.x - 24, p.size.y - 120), Color(1.0, 0.95, 0.95))
	if seen:
		var stage := Node2D.new()
		stage.position = Vector2(150, pn.size.y - 40)
		pn.add_child(stage)
		var pup := Puppet.new()
		stage.add_child(pup)
		pup.setup_mon(id, false, minf(pn.size.y - 80, 260.0))
		if not cg:
			pup.p("dark", 0.85)
	UI.label(pn, "No.%03d" % id, Vector2(300, 20), 26, Color(0.4, 0.42, 0.5))
	UI.label(pn, sp.n if seen else "？？？", Vector2(300, 56), 40)
	if seen:
		var types: Array = []
		for t in sp.t:
			types.append(Data.type_name(t))
		UI.label(pn, "%s 몬스터 · %s" % [sp.cat, "/".join(types)], Vector2(300, 112), 26)
	UI.label(pn, ("키 %.1f m · %.1f kg" % [float(sp.h), float(sp.w)]) if cg else "키 ??? · 몸무게 ???", Vector2(300, 152), 26, Color(0.35, 0.38, 0.46))
	var d := UI.label(pn, sp.d if cg else "붙잡으면 자세한 데이터가 기록된다." if seen else "아직 만나지 못한 몬스터.", Vector2(300, 200), 24)
	d.size.x = pn.size.x - 320
	d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART


func badge_node(i: int, size := 40.0) -> Node2D:
	var n := Node2D.new()
	var col: Color = BADGES[i][2]
	n.draw.connect(func() -> void:
		var pts := PackedVector2Array()
		for k in 8:
			var a := k * TAU / 8 + PI / 8
			pts.append(Vector2.from_angle(a) * size)
		n.draw_colored_polygon(pts, col.darkened(0.35))
		var pts2 := PackedVector2Array()
		for k in 8:
			var a := k * TAU / 8 + PI / 8
			pts2.append(Vector2.from_angle(a) * size * 0.8)
		n.draw_colored_polygon(pts2, col)
		n.draw_circle(Vector2(-size * 0.25, -size * 0.25), size * 0.18, Color(1, 1, 1, 0.6)))
	return n


func badge_fx(w: World, i: int) -> void:
	var s := vs()
	var layer := CanvasLayer.new()
	layer.layer = 30
	add_child(layer)
	var b := badge_node(i, 80.0)
	b.position = Vector2(s.x / 2, s.y * 0.35)
	b.scale = Vector2(0.1, 0.1)
	layer.add_child(b)
	var tw := create_tween()
	tw.tween_property(b, "scale", Vector2(1.3, 1.3), 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(b, "rotation", TAU, 0.6)
	tw.tween_property(b, "scale", Vector2.ONE, 0.2)
	FX.burst(layer, b.position, Color(1, 1, 0.8), BADGES[i][2], 30, 380.0, Vector2(0, 300), 0.9, 1.2, 180.0)
	await tw.finished
	await get_tree().create_timer(0.5).timeout
	var t2 := create_tween()
	t2.tween_property(b, "modulate:a", 0.0, 0.3)
	await t2.finished
	layer.queue_free()


func trainer_card() -> void:
	Sound.sfx("sparkle")
	var s := vs()
	var layer := CanvasLayer.new()
	layer.layer = 61
	add_child(layer)
	var bg := ColorRect.new()
	bg.color = Color(0.16, 0.2, 0.35)
	bg.size = s
	layer.add_child(bg)
	var card := UI.panel(layer, Rect2(24, 80, s.x - 48, 560), Color(0.42, 0.66, 1.0), Color(0.12, 0.25, 0.48))
	UI.label(card, "TRAINER CARD", Vector2(30, 20), 28, Color.WHITE)
	UI.label(card, "ID No.%s" % Game.g.id, Vector2(card.size.x - 220, 20), 26, Color.WHITE)
	var start := Time.get_datetime_dict_from_unix_time(int(Game.g.start))
	var info := UI.label(card, "이름   %s\n소지금   %s\n도감   %d마리\n플레이 시간   %s\n걸음 수   %d\n모험 시작   %d.%d.%d" % [Game.g.name, Game.money(Game.g.money),
		Game.g.caught.size(), Game.fmt_time(float(Game.g.play_ms)), int(Game.g.steps), start.year, start.month, start.day], Vector2(30, 80), 30, Color.WHITE)
	info.add_theme_constant_override("line_spacing", 14)
	var who := Node2D.new()
	who.position = Vector2(card.size.x - 120, 470)
	card.add_child(who)
	var pup := Puppet.new()
	who.add_child(pup)
	pup.setup_person("player", false, 260.0)
	var case := UI.panel(layer, Rect2(24, 670, s.x - 48, 360), Color(0.36, 0.28, 0.22), Color(0.2, 0.15, 0.1))
	UI.label(case, "배지 케이스", Vector2(26, 16), 28, Color(0.95, 0.86, 0.63))
	for i in 5:
		var cx := 90 + (i % 3) * ((case.size.x - 120) / 3.0) if i < 3 else 170 + (i - 3) * ((case.size.x - 120) / 3.0)
		var cy := 120 if i < 3 else 260
		if int(Game.g.badges[i]):
			var b := badge_node(i, 42.0)
			b.position = Vector2(cx, cy)
			case.add_child(b)
		else:
			var e := Node2D.new()
			e.position = Vector2(cx, cy)
			e.draw.connect(func() -> void: e.draw_circle(Vector2.ZERO, 42, Color(0, 0, 0, 0.25)))
			case.add_child(e)
		var l := UI.label(case, BADGES[i][0] if int(Game.g.badges[i]) else "???", Vector2(cx - 70, cy + 50), 22, Color(0.95, 0.86, 0.63))
		l.size.x = 140
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var back := UI.button(layer, "돌아가기", Rect2(s.x - 260, s.y - 130, 236, 100), Color(0.3, 0.32, 0.38), 30)
	var done := [false]
	back.pressed.connect(func() -> void: done[0] = true)
	back.grab_focus()
	while not done[0]:
		if Input.is_action_just_pressed("b_btn"):
			done[0] = true
		await get_tree().process_frame
	layer.queue_free()


func map_screen(w: World) -> void:
	var s := vs()
	var layer := CanvasLayer.new()
	layer.layer = 61
	add_child(layer)
	var bg := ColorRect.new()
	bg.color = Color(0.75, 0.85, 0.7)
	bg.size = s
	layer.add_child(bg)
	UI.label(layer, "원정패드 · 지도", Vector2(30, 30), 36)
	var area := Rect2(50, 140, s.x - 100, s.y * 0.55)
	var cur: String = w.m.get("region", "town")
	var mapn := Node2D.new()
	layer.add_child(mapn)
	var pos := func(k: String) -> Vector2:
		return area.position + Vector2(float(REGION[k][1]) * area.size.x, float(REGION[k][2]) * area.size.y)
	mapn.draw.connect(func() -> void:
		mapn.draw_rect(area, Color(0.82, 0.92, 0.78))
		var prev := Vector2.ZERO
		for i in REGION_PATH.size():
			var p: Vector2 = pos.call(REGION_PATH[i])
			if i > 0:
				mapn.draw_line(prev, p, Color(0.42, 0.55, 0.36), 14.0, true)
			prev = p
		for k in REGION:
			if not str(k).begins_with("route"):
				var p: Vector2 = pos.call(k)
				mapn.draw_rect(Rect2(p - Vector2(22, 22), Vector2(44, 44)), Color(0.18, 0.29, 0.16))
				mapn.draw_rect(Rect2(p - Vector2(16, 16), Vector2(32, 32)), Color(0.91, 0.96, 0.88)))
	for k in REGION:
		if not str(k).begins_with("route"):
			var p: Vector2 = pos.call(k)
			UI.label(layer, REGION[k][0], p + Vector2(-60, 28), 22, Color(0.15, 0.22, 0.12)).size.x = 120
	if REGION.has(cur):
		var dot := Node2D.new()
		dot.position = pos.call(cur)
		dot.draw.connect(func() -> void: dot.draw_circle(Vector2.ZERO, 16, Color(0.89, 0.34, 0.44)))
		layer.add_child(dot)
		var tw := dot.create_tween().set_loops()
		tw.tween_property(dot, "scale", Vector2(1.4, 1.4), 0.4)
		tw.tween_property(dot, "scale", Vector2.ONE, 0.4)
		UI.label(layer, "현재 위치: %s" % w.m.name, Vector2(50, area.end.y + 30), 32)
	UI.label(layer, "걸음 수 %d · 배지 %d개 · 도감 %d" % [int(Game.g.steps), Game.badge_count(), Game.g.caught.size()], Vector2(50, area.end.y + 80), 26)
	var back := UI.button(layer, "닫기", Rect2(s.x - 260, s.y - 130, 236, 100), Color(0.3, 0.32, 0.38), 30)
	var done := [false]
	back.pressed.connect(func() -> void: done[0] = true)
	back.grab_focus()
	while not done[0]:
		if Input.is_action_just_pressed("b_btn"):
			done[0] = true
		await get_tree().process_frame
	layer.queue_free()


# =====================================================================
# 리포트 · 설정
# =====================================================================
func save_menu(w: World) -> bool:
	var r := await Msg.ask("%s · 배지 %d · 도감 %d · %s\n지금까지의 모험을 리포트에 기록하시겠습니까?" % [w.m.name, Game.badge_count(), Game.g.caught.size(), Game.fmt_time(float(Game.g.play_ms))],
		["리포트에 기록", "그만두기"])
	if r != 0:
		return false
	Game.g.x = w.P.x
	Game.g.y = w.P.y
	Game.g.dir = w.player.dir
	await Msg.say("리포트를 기록하고 있습니다...\n전원을 끄지 마세요.", "", {"auto": 0.8})
	if Game.save_game():
		Sound.jingle("save")
		await Msg.say("%s 리포트에 제대로 기록했다!" % Game.josa(Game.g.name, "은"))
		return true
	await Msg.say("리포트를 기록하지 못했습니다...")
	return false


func options_menu() -> void:
	var rows := [["텍스트 속도", ["느림", "보통", "빠름"], "text"], ["전투 애니메이션", ["끄기", "켜기"], "anim"],
		["배경음 볼륨", ["0", "1", "2", "3", "4", "5"], "bgm"], ["효과음", ["끄기", "켜기"], "sfx"], ["전투 방식", ["교체", "연속"], "style"]]
	var at := 0
	while true:
		var items: Array = []
		for r in rows:
			items.append({"text": r[0], "right": "◀ %s ▶" % r[1][int(Game.settings[r[2]])]})
		items.append({"text": "개인정보처리방침", "right": "열기 ▶"})
		var i := await Msg.list(items, {"title": "설정 (◀ ▶ 또는 누르기로 바꾸기)", "start": at, "buttons": [["결정", -1, Color(0.3, 0.5, 0.75)]],
			"keys": func(k: String, i2: int):
				if i2 < 0 or i2 >= rows.size():
					return null
				var r: Array = rows[i2]
				Game.settings[r[2]] = (int(Game.settings[r[2]]) + (-1 if k == "ui_left" else 1) + r[1].size()) % r[1].size()
				Sound.apply_volume()
				Sound.sfx("cur")
				return 1000 + i2})
		if i < 0:
			break
		if i >= 1000:
			at = i - 1000
			continue
		at = i
		if i < rows.size():
			var r: Array = rows[i]
			Game.settings[r[2]] = (int(Game.settings[r[2]]) + 1) % r[1].size()
			Sound.apply_volume()
			Sound.sfx("cur")
		else:
			OS.shell_open(PRIVACY_URL)
	Game.save_settings()


# =====================================================================
# 시설: 상점 · 몬스터 쉼터 · PC · 합성
# =====================================================================
func shop_stock() -> Array:
	var s := ["ball", "lvup", "potion", "antidote", "burnheal", "parheal", "awake"]
	if int(Game.g.badges[0]):
		s.insert(1, "great")
		s.insert(3, "super")
		s.append("fullheal")
	if int(Game.g.badges[1]):
		s.append("revive")
	if int(Game.g.badges[2]):
		s.append_array(["super", "fullheal"])
	if Game.flag("clear2"):
		s.append("hyper")
	var out: Array = []
	for k in s:
		if not out.has(k):
			out.append(k)
	return out


func shop(_w: World) -> void:
	var o := "점원"
	var first := true
	while true:
		var c := await Msg.ask("어서 오세요! 무엇을 도와드릴까요?" if first else "그 밖에 필요하신 건 없으세요?", ["사러 왔어요", "팔러 왔어요", "괜찮아요"], o)
		first = false
		if c == 0:
			await shop_buy()
		elif c == 1:
			await shop_sell()
		else:
			break
	await Msg.say("감사합니다! 또 오세요!", o)


func shop_buy() -> void:
	var at := 0
	while true:
		var st := shop_stock()
		var items: Array = []
		for k in st:
			items.append({"text": Data.D.items[k].n, "right": Game.money(Data.D.items[k].price)})
		var r := await Msg.list(items, {"title": "몬스터 상점 · 사기 · %s" % Game.money(Game.g.money), "start": at, "buttons": [["그만두기", -1]],
			"on_move": func(i: int) -> void: _item_preview(st[i])})
		if r < 0:
			break
		at = r
		var id: String = st[r]
		var it: Dictionary = Data.D.items[id]
		var mx := mini(99, int(Game.g.money) / int(it.price))
		if mx < 1:
			await Msg.say("돈이 부족하신 것 같아요.", "점원")
			continue
		var n := await Msg.number(mx, int(it.price), "%s 몇 개 사시겠어요?" % Game.josa(it.n, "을"))
		if n <= 0:
			continue
		var ok := await Msg.ask("%s %d개, 총 %s입니다. 괜찮으시겠어요?" % [it.n, n, Game.money(n * int(it.price))], ["예", "아니오"], "점원")
		if ok != 0:
			continue
		Game.g.money = int(Game.g.money) - n * int(it.price)
		Game.g.bag[id] = int(Game.g.bag.get(id, 0)) + n
		await Msg.say("네, 여기 있습니다! 감사합니다!", "점원")
		if id == "ball" and n >= 10:
			Game.g.bag.great = int(Game.g.bag.get("great", 0)) + 1
			await Msg.say("캡슐을 많이 사 주셔서 은빛캡슐을 하나 덤으로 드릴게요!", "점원")


func shop_sell() -> void:
	while true:
		var ids: Array = []
		for k in Data.D.items:
			if Data.D.items[k].has("price") and int(Game.g.bag.get(k, 0)) > 0:
				ids.append(k)
		if ids.is_empty():
			await Msg.say("팔 수 있는 물건이 없는 것 같네요.", "점원")
			return
		var items: Array = []
		for k in ids:
			items.append({"text": Data.D.items[k].n, "right": "× %d · %s" % [int(Game.g.bag[k]), Game.money(int(Data.D.items[k].price) / 2)]})
		var r := await Msg.list(items, {"title": "몬스터 상점 · 팔기", "buttons": [["그만두기", -1]], "on_move": func(i: int) -> void: _item_preview(ids[i])})
		if r < 0:
			return
		var id: String = ids[r]
		var it: Dictionary = Data.D.items[id]
		var n := await Msg.number(int(Game.g.bag[id]), int(it.price) / 2, it.n)
		if n <= 0:
			continue
		var ok := await Msg.ask("%s %d개를 %s에 사겠습니다. 괜찮으세요?" % [it.n, n, Game.money(n * int(it.price) / 2)], ["예", "아니오"], "점원")
		if ok != 0:
			continue
		Game.g.bag[id] = int(Game.g.bag[id]) - n
		Game.g.money = int(Game.g.money) + n * int(it.price) / 2
		await Msg.say("%s 받았다!" % Game.josa(Game.money(n * int(it.price) / 2), "을"))


func nurse(w: World, n: NPC) -> void:
	var o := "간호사"
	await Msg.say("어서 오세요! 몬스터 쉼터입니다.", o)
	var r := await Msg.ask("몬스터의 체력을 회복시켜 드릴까요?", ["예", "아니오"], o)
	if r != 0:
		await Msg.say("또 들러 주세요!", o)
		return
	await Msg.say("그럼 몬스터를 잠시 맡아 두겠습니다.", o)
	await n.face("left")
	await w.heal_anim()
	Game.heal_party()
	await Sound.jingle("heal")
	await n.face("down")
	var wp: Array = w.m.warps.get("6,9", [])
	if wp.size():
		Game.g.heal = {"map": wp[0], "x": int(wp[1]), "y": int(wp[2])}
	await Msg.say("기다리셨습니다! 맡겨 주신 몬스터는 모두 건강해졌어요.", o)
	await n.bow()
	await Msg.say("또 들러 주세요!", o)


func box_cap() -> int:
	return maxi(5, Game.top_level())


## 보관함 몬스터는 실제 시간이 흐른 만큼 자란다: 10분마다 레벨 1 (파티 최고 레벨까지)
func box_grow() -> Array:
	var now := Time.get_unix_time_from_system()
	var cap := box_cap()
	var out: Array = []
	for m in Game.g.box:
		if not m.has("box_at"):
			m.box_at = now
			continue
		var steps := int((now - float(m.box_at)) / (BOX_MIN * 60.0))
		if steps <= 0:
			continue
		if int(m.lv) >= cap:
			m.box_at = now
			continue
		var from: int = int(m.lv)
		var to := mini(mini(cap, 100), int(m.lv) + steps)
		var r := {"m": m, "from": from, "to": to, "learned": [], "full": []}
		for l in range(from + 1, to + 1):
			var o := Game.calc(m)
			m.lv = l
			m.exp = Game.exp_for(l)
			var nn := Game.calc(m)
			m.hp = mini(nn[0], int(m.hp) + nn[0] - o[0])
			for e in Game.sp(m.sid).ls:
				if int(e[0]) == l and not m.moves.any(func(x: Dictionary) -> bool: return x.id == e[1]):
					if m.moves.size() < 4:
						m.moves.append({"id": e[1], "pp": int(Data.move(e[1]).pp)})
						r.learned.append(Data.move(e[1]).n)
					else:
						r.full.append(Data.move(e[1]).n)
		m.box_at = now if to >= cap else float(m.box_at) + (to - from) * BOX_MIN * 60.0
		out.append(r)
	return out


func pc_menu(_w: World) -> void:
	Sound.sfx("menu")
	await Msg.say("%s PC의 전원을 켰다!" % Game.josa(Game.g.name, "은"))
	var grown := box_grow()
	if grown.size():
		Sound.jingle("level")
		await Msg.say("보관함에 맡겨 둔 몬스터들이 그동안 훈련을 했다!")
		for r in grown:
			var t := "%s Lv%d → %s 자랐다!" % [Game.josa(Game.name_of(r.m), "은"), int(r.from), Game.josa("Lv%d" % int(r.to), "로")]
			if r.learned.size():
				t += " 새로 %s 배웠다!" % Game.josa(", ".join(r.learned), "을")
			await Msg.say(t)
			if r.full.size():
				await Msg.say("(%s도 배울 수 있었지만 기술 칸이 가득 차 있었다.)" % ", ".join(r.full))
	while true:
		var c := await Msg.ask("무엇을 할까?", ["몬스터 맡기기", "몬스터 데려오기", "그만두기"])
		if c == 0:
			if Game.g.party.size() <= 1:
				await Msg.say("마지막 한 마리는 맡길 수 없습니다!")
				continue
			var i := await party_screen("deposit")
			if i < 0:
				continue
			var m: Dictionary = Game.g.party[i]
			if await Msg.ask("%s 보관함에 맡기겠습니까?" % Game.josa(Game.name_of(m), "을"), ["예", "아니오"]) != 0:
				continue
			Game.g.party.remove_at(i)
			Game.heal_mon(m)
			m.box_at = Time.get_unix_time_from_system()
			Game.g.box.append(m)
			Sound.sfx("save")
			await Msg.say("%s 보관함에 맡겼다." % Game.josa(Game.name_of(m), "을"))
			if int(m.lv) < box_cap():
				await Msg.say("보관함에서 %d분마다 레벨이 1씩 오른다. (지금은 Lv%d까지)" % [BOX_MIN, box_cap()])
			else:
				await Msg.say("%s 이미 파티 최고 레벨이라 보관함에서는 더 자라지 않는다." % Game.josa(Game.name_of(m), "은"))
		elif c == 1:
			if Game.g.box.is_empty():
				await Msg.say("보관함에 몬스터가 없습니다.")
				continue
			var items: Array = []
			for m in Game.g.box:
				items.append({"text": Game.name_of(m), "right": "Lv%d" % int(m.lv), "icon": mon_icon(m)})
			var r := await Msg.list(items, {"title": "보관함", "on_move": func(k: int) -> void: mon_preview(Game.g.box[k], "보관함")})
			if r < 0:
				continue
			if Game.g.party.size() >= 6:
				await Msg.say("파티가 가득 찼습니다! 먼저 몬스터를 맡겨 주세요.")
				continue
			var m2: Dictionary = Game.g.box[r]
			Game.g.box.remove_at(r)
			m2.erase("box_at")
			Game.g.party.append(m2)
			Sound.sfx("save")
			await Msg.say("%s 데려왔다!" % Game.josa(Game.name_of(m2), "을"))
			var e = Game.sp(m2.sid).get("ev")
			if e and int(m2.lv) >= int(e[0]) and not pending_evo.has(m2):
				pending_evo.append(m2)
		else:
			break
	await Msg.say("PC의 전원을 껐다.")
	await run_pending_evo()


func fusion_stage(a: Dictionary, b: Dictionary) -> int:
	return mini(2, maxi(int(Game.sp(a.sid).st), int(Game.sp(b.sid).st)) + 1)


func fusion_result(a: Dictionary, b: Dictionary) -> int:
	var stage := fusion_stage(a, b)
	var pool: Array = []
	for k in Data.D.species:
		var s: Dictionary = Data.D.species[k]
		if int(s.st) == stage and int(k) != 13 and not s.has("legend") and not s.has("human") and (stage == 2 or int(s.get("line", 0)) > 9):
			pool.append(int(k))
	var types: Array = []
	for sid in pool:
		for t in Game.sp(sid).t:
			if not types.has(t):
				types.append(t)
	var t: String = types.pick_random()
	var cand := pool.filter(func(sid: int) -> bool: return Game.sp(sid).t.has(t))
	return cand.pick_random()


func fuse_mons() -> Array:
	var out: Array = []
	for m in Game.g.party:
		if not Game.is_human(m):
			out.append({"m": m, "where": "party"})
	for m in Game.g.box:
		if not Game.is_human(m):
			out.append({"m": m, "where": "box"})
	return out


func pick_fuse_mon(excl, title: String) -> Dictionary:
	var c := fuse_mons().filter(func(x: Dictionary) -> bool: return excl == null or x.m != excl.m)
	if c.is_empty():
		return {}
	var items: Array = []
	for x in c:
		items.append({"text": Game.name_of(x.m), "right": "%s · %s · Lv%d" % ["파티" if x.where == "party" else "보관함", STAGE_N[int(Game.sp(x.m.sid).st)], int(x.m.lv)], "icon": mon_icon(x.m)})
	var r := await Msg.list(items, {"title": title, "on_move": func(k: int) -> void: mon_preview(c[k].m, title)})
	return {} if r < 0 else c[r]


func fusion_flow(_w, first = null) -> bool:
	if first != null and Game.is_human(first.m):
		await Msg.say("%s 사람이라서 합성할 수 없어요!" % Game.josa(Game.name_of(first.m), "은"))
		return false
	if fuse_mons().size() < 2:
		await Msg.say("합성하려면 몬스터가 두 마리 이상 있어야 해요.")
		return false
	var a: Dictionary = first if first != null else await pick_fuse_mon(null, "첫 번째 재료")
	if a.is_empty():
		return false
	var b: Dictionary = await pick_fuse_mon(a, "두 번째 재료")
	if b.is_empty():
		return false
	var st := fusion_stage(a.m, b.m)
	if await Msg.ask("%s Lv%d + %s Lv%d → %s 등급\n합성하면 두 마리는 사라져요. 괜찮아요?" % [Game.name_of(a.m), int(a.m.lv), Game.name_of(b.m), int(b.m.lv), STAGE_N[st]], ["합성한다", "그만둔다"]) != 0:
		return false
	var to := fusion_result(a.m, b.m)
	var lv := mini(100, maxi(int(a.m.lv), int(b.m.lv)) + 2)
	var m := Game.make_mon(to, lv, {"met": {"map": "합성 장치", "lv": lv}, "ot": Game.g.name, "shiny": a.m.get("shiny", false) or b.m.get("shiny", false)})
	var idx: Array = []
	for x in [a, b]:
		if x.where == "party":
			idx.append(Game.g.party.find(x.m))
	Game.g.party = Game.g.party.filter(func(x: Dictionary) -> bool: return x != a.m and x != b.m)
	Game.g.box = Game.g.box.filter(func(x: Dictionary) -> bool: return x != a.m and x != b.m)
	if idx.size():
		Game.g.party.insert(mini(idx.min(), Game.g.party.size()), m)
	else:
		Game.add_mon(m)
	await _fusion_fx(int(a.m.sid), int(b.m.sid), to)
	Game.g.seen[to] = 1
	Game.g.caught[to] = 1
	var types: Array = []
	for t in Game.sp(to).t:
		types.append(Data.type_name(t))
	await Msg.say("합성 성공! %s 타입 %s 태어났다! (Lv%d)" % ["·".join(types), Game.josa(Game.sp(to).n, "이"), lv])
	var r := await Msg.ask("%s에게 이름을 붙여 주시겠습니까?" % Game.sp(to).n, ["예", "아니오"])
	if r == 0:
		var v := await Msg.name_input("%s의 이름은?" % Game.sp(to).n, "", 6, [], true)
		if v != "":
			m.nick = v
	_fx_layer_free()
	if not Game.g.party.has(m):
		await Msg.say("파티가 가득 차서 %s 보관함으로 보내졌다." % Game.josa(Game.name_of(m), "은"))
	return true


var _fx_layer: CanvasLayer


func _fx_layer_free() -> void:
	if _fx_layer:
		_fx_layer.queue_free()
		_fx_layer = null


## 합성 연출: 두 몬스터가 빛이 되어 가운데로 빨려 들어가 하나로 터져 나온다
func _fusion_fx(sa: int, sb: int, to: int) -> void:
	var s := vs()
	_fx_layer = CanvasLayer.new()
	_fx_layer.layer = 30
	add_child(_fx_layer)
	var bg := ColorRect.new()
	bg.color = Color(0.3, 0.24, 0.48, 0.85)
	bg.size = s
	_fx_layer.add_child(bg)
	var stage := Node2D.new()
	stage.position = Vector2(s.x / 2, s.y * 0.45)
	_fx_layer.add_child(stage)
	var pa := Puppet.new()
	stage.add_child(pa)
	pa.setup_mon(sa, false, 200.0)
	pa.position = Vector2(-200, 0)
	var pb := Puppet.new()
	stage.add_child(pb)
	pb.setup_mon(sb, false, 200.0)
	pb.position = Vector2(200, 0)
	await get_tree().create_timer(0.4).timeout
	Sound.sfx("absorb")
	pa.p("glow_color", Color(0.9, 0.85, 1.0))
	pb.p("glow_color", Color(0.9, 0.85, 1.0))
	var tw := create_tween().set_parallel()
	for p in [pa, pb]:
		p.tp(tw, "glow", 1.4, 0.6)
		tw.tween_property(p, "position", Vector2(0, -40), 0.9).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN).set_delay(0.3)
		tw.tween_property(p, "scale", Vector2(0.2, 0.2), 0.9).set_delay(0.3)
		tw.tween_property(p, "rotation", TAU * (1 if p == pa else -1), 0.9).set_delay(0.3)
	await tw.finished
	pa.queue_free()
	pb.queue_free()
	Sound.sfx("open")
	FX.burst(stage, Vector2(0, -60), Color(1, 1, 1), Color(0.8, 0.7, 1.0), 40, 520.0, Vector2.ZERO, 0.7, 1.5, 180.0)
	var pr := Puppet.new()
	stage.add_child(pr)
	pr.setup_mon(to, false, 280.0)
	pr.scale = Vector2(0.1, 0.1)
	pr.p("flash", 1.0)
	var t2 := create_tween()
	t2.tween_property(pr, "scale", Vector2(1.15, 1.15), 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	t2.parallel()
	pr.tp(t2, "flash", 0.0, 0.5)
	t2.tween_property(pr, "scale", Vector2.ONE, 0.15)
	await t2.finished
	await Sound.cry(to)
	await Sound.jingle("evolved")


func fusion_lab(_w: World) -> void:
	var o := "합성 연구원"
	if not Game.flag("fuseIntro2"):
		Game.set_flag("fuseIntro2")
		await Msg.say("어서 오세요! 여기는 몬스터 합성 연구실이에요.", o)
		await Msg.say("아무 몬스터나 두 마리를 맡겨 주시면, 하나로 합쳐서 한 단계 위 등급의 몬스터로 만들어 드려요.", o)
		await Msg.say("어떤 타입이 나올지는 저도 몰라요! 레벨은 두 마리 중 높은 쪽보다 2 올라간답니다.", o)
		await Msg.say("참, 메뉴 → 몬스터 화면에서도 합성 장치를 쓸 수 있게 해 뒀어요!", o)
	if fuse_mons().size() < 2:
		await Msg.say("지금은 몬스터가 한 마리뿐이네요. 동료를 더 모아서 다시 와 주세요!", o)
		return
	if await Msg.ask("합성을 해 볼까요?", ["합성한다", "그만둔다"], o) != 0:
		await Msg.say("또 오세요!", o)
		return
	if await fusion_flow(null):
		await Msg.say("소중히 키워 주세요!", o)
	else:
		await Msg.say("또 오세요!", o)


# =====================================================================
# 엔딩 크레딧: 붙잡은 몬스터들이 줄지어 걸어가고, 그 뒤를 주인공이 따라간다
# =====================================================================
func credits(w: World, final: bool) -> void:
	var s := vs()
	await Game.fade_to(1.0, 0.6)
	Sound.music("title")
	var layer := CanvasLayer.new()
	layer.layer = 40
	add_child(layer)
	var bg := TextureRect.new()
	var at := AtlasTexture.new()
	at.atlas = Data.tex.scenes
	at.region = Data.cell("scenes", 0)
	bg.texture = at
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	bg.size = s
	bg.modulate = Color(1.0, 0.85, 0.7)
	layer.add_child(bg)
	var shade := ColorRect.new()
	shade.color = Color(0.1, 0.05, 0.15, 0.35)
	shade.size = s
	layer.add_child(shade)
	var list: Array = []
	for k in Game.g.caught:
		list.append(int(k))
	list.sort()
	if list.is_empty():
		list = [int(Game.g.starter)]
	var parade := Node2D.new()
	parade.position = Vector2(s.x + 100, s.y * 0.8)
	layer.add_child(parade)
	var x := 0.0
	for sid in list:
		var p := Puppet.new()
		parade.add_child(p)
		p.setup_mon(sid, false, 150.0)
		p.position = Vector2(x, 0)
		p.p("walk", 0.8)
		x += 170
	var hero := Puppet.new()
	parade.add_child(hero)
	hero.setup_person("player", false, 200.0)
	hero.position = Vector2(x + 40, 0)
	hero.p("walk", 1.0)
	var lines := [["몬스터 원정대", ""], ["제작", "chunghyun1995"], ["프로그래밍 · 그림 · 모션", "Claude"],
		["함께한 몬스터들", " · ".join(list.map(func(sid: int) -> String: return str(Game.sp(sid).n)))],
		["관장들", "단단 · 하라 · 화련 · 찌나 · 하늬"], ["라이벌", Game.RIVAL], ["그리고 플레이해 준", "%s 님" % Game.g.name], ["", ""], ["THE END", "…그리고 원정은 계속된다!"]]
	var roll := VBoxContainer.new()
	roll.position = Vector2(40, s.y)
	roll.custom_minimum_size.x = s.x - 80
	roll.add_theme_constant_override("separation", 40)
	layer.add_child(roll)
	for l in lines:
		var h := Label.new()
		h.text = l[0]
		h.add_theme_font_size_override("font_size", 42)
		h.add_theme_color_override("font_color", Color(1, 0.95, 0.75))
		h.add_theme_constant_override("outline_size", 10)
		h.add_theme_color_override("font_outline_color", Color(0.2, 0.1, 0.2))
		h.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		h.custom_minimum_size.x = s.x - 80
		roll.add_child(h)
		var t := Label.new()
		t.text = l[1]
		t.add_theme_font_size_override("font_size", 30)
		t.add_theme_color_override("font_color", Color.WHITE)
		t.add_theme_constant_override("outline_size", 8)
		t.add_theme_color_override("font_outline_color", Color(0.2, 0.1, 0.2))
		t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		t.custom_minimum_size.x = s.x - 80
		roll.add_child(t)
	await Game.fade_to(0.0, 0.6)
	var total := maxf(14.0, (x + s.x + 300) / 160.0)
	if Game.auto_text:
		total = 1.0
	var tw := create_tween().set_parallel()
	tw.tween_property(roll, "position:y", -1400.0, total)
	tw.tween_method(func(k: float) -> void:
		parade.position.x = s.x + 100 - k * (x + s.x + 300)
		for c in parade.get_children():
			c.p("walk_phase", k * total * 7.0)
			c.lift = absf(sin(k * total * 7.0)) * 6.0, 0.0, 1.0, total)
	await tw.finished
	await Game.fade_to(1.0, 0.6)
	layer.queue_free()
	if final:
		w.enter_map("town5", Vector2i(12, 4), "down", {"quiet": true})
	else:
		w.enter_map("town2", Vector2i(19, 13), "down", {"quiet": true})
	await Game.fade_to(0.0, 0.6)
	await Msg.say("축하합니다! 다섯 개의 배지를 모으고 라이벌과의 마지막 승부까지 마쳐 몬스터 원정대를 클리어했습니다!" if final else "축하합니다! 두 번째 배지를 얻었습니다!")
	await Msg.say("도감을 모두 채우거나, 몬스터를 더 강하게 키워 보세요. 원정은 계속됩니다!")
