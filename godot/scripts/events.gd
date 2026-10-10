class_name Events
extends RefCounted
## 이야기 이벤트: 기존 웹 게임의 maps.js·maps2.js·postgame.js·npcfight.js 스크립트를 GDScript로 옮긴 것.
## World(w)의 도우미로 대사·선택지·전투·걷기를 진행한다. 이름 규칙:
##   talk_<npc id>(n) · cond_<npc id>() · obj_<map>_<x>_<y>() · trig_<map>_<번호>() / trig_cond_<map>_<번호>()

const LEGENDS := [{"sid": 31, "map": "crater", "where": "붉은재 화산길(3번 도로)의 절벽 동굴"},
	{"sid": 32, "map": "spring", "where": "4번 도로 강물이 시작되는 수원 동굴"},
	{"sid": 33, "map": "storm", "where": "5번 산길의 폭풍 봉우리 동굴"}]
const TOWER_LOOKS := ["man", "hiker", "camper", "lady", "swim", "fisher", "girl", "kid", "bug", "villain"]
const STATUES := [["바위시티 관측소", "현장 책임자: 단단"], ["물결마을 관측소", "현장 책임자: 하라"], ["붉은재마을 관측소", "현장 책임자: 화련"],
	["번개도시 관측소", "현장 책임자: 찌나"], ["하늘봉마을 관측소", "현장 책임자: 하늬"]]

var w: World
var R := Game.RIVAL


func _init(world: World) -> void:
	w = world


func F(k: String) -> bool:
	return Game.flag(k)


func nm() -> String:
	return str(Game.g.name)


func say(t: String, who := "") -> void:
	await w.say(t, who)


func ask(t: String, opts: Array, who := "", start := 0) -> int:
	return await w.ask(t, opts, who, start)


# =====================================================================
# 분배
# =====================================================================
func cond(n: NPC) -> bool:
	if not n.info.get("cond", false):
		return true
	var f := "cond_" + n.id
	if n.id.begins_with("leg"):
		return not F("cap" + n.id.substr(3))
	return call(f) if has_method(f) else true


func talk(n: NPC) -> void:
	var id := n.id
	var f := "talk_" + id
	if has_method(f):
		await call(f, n)
	elif id.begins_with("nurse_"):
		await Menus.nurse(w, n)
	elif id.begins_with("clerk_"):
		await Menus.shop(w)
	elif id.begins_with("fuse_"):
		await Menus.fusion_lab(w)
	elif id.begins_with("leg"):
		await legend_battle(int(id.substr(3)), 50, str(w.m.bg))
	else:
		await Msg.talk(n.info.get("text", []), str(n.info.get("name", "")))


func sight(n: NPC) -> void:
	await talk(n)


func obj(map: String, key: String) -> void:
	var xy := key.split(",")
	var f := "obj_%s_%s_%s" % [map, xy[0], xy[1]]
	if has_method(f):
		await call(f)
	elif map.begins_with("gym"):
		await statue(int(map.substr(3)) - 1)
	elif map.begins_with("center"):
		await Menus.pc_menu(w)
	elif map == "towerLobby":
		await tower_record()


func trig_cond(map: String, i: int) -> bool:
	var f := "trig_cond_%s_%d" % [map, i]
	return call(f) if has_method(f) else true


func trig_run(map: String, i: int) -> void:
	var f := "trig_%s_%d" % [map, i]
	if has_method(f):
		await call(f)


# =====================================================================
# 새싹마을 · 집 · 연구소
# =====================================================================
func trig_cond_town_0() -> bool:
	return not F("starter")


func trig_town_0() -> void:
	await say("앗, 풀숲에서 무언가 바스락거린다...")
	await say("몬스터 없이 가는 건 위험할 것 같다. 먼저 연구소에 들르자!")
	await w.walk_player(["down"])


func talk_mom(_n: NPC) -> void:
	var o := "엄마"
	if not F("starter"):
		await say("일어났구나, %s! 한결 조사관님이 연구소로 와 달라고 하셨단다." % nm(), o)
		await say("연구소는 마을 위쪽에 있는 큰 건물이야.", o)
		return
	await say("%s, 피곤하지 않니? 잠깐 쉬었다 가렴." % nm(), o)
	await w.fade(1.0)
	w.heal_party()
	await Sound.jingle("heal")
	await w.fade(0.0)
	Game.g.heal = {"map": "home", "x": 4, "y": 6}
	await say("몬스터들이 기운을 되찾았다!")
	await say("힘내렴! 엄마는 언제나 응원할게.", o)


func talk_sister(_n: NPC) -> void:
	var o := "세은 누나"
	if not F("starter"):
		await say("%s는 벌써 연구소에 갔어! 성격이 급하다니까." % R, o)
		return
	if not F("gift1"):
		await say("%s도 몬스터를 받았구나! 이거 가져가. 모험에 꼭 필요할 거야." % nm(), o)
		await w.give_item("potion", 3)
		Game.set_flag("gift1")
		return
	await say("%s 녀석, 너한테는 절대 안 진다고 난리야. 잘 부탁해!" % R, o)


func talk_prof(_n: NPC) -> void:
	var o := "한결 조사관"
	if not F("starter"):
		await say("세 조사 동료는 각자 탐색을 도와주는 방식이 달라. 책상에서 동행 기록을 확인해 보렴.", o)
		return
	await say("회수한 기록은 발견 %d종, 동행 %d종이구나. 숫자보다 서식지를 어떻게 이해했는지가 중요하단다." % [Game.g.seen.size(), Game.g.caught.size()], o)
	await say("관측소의 책임자에게 현장 조건을 물어보고, 센서망을 하나씩 연결해 보렴.", o)


func cond_rival_lab() -> bool:
	return not F("rival1")


func talk_rival_lab(_n: NPC) -> void:
	await say("%s, 오늘은 함께 첫 현장 점검을 하는 날이야. 나는 운반 장비를 챙겨 두었어." % nm(), R)


func trig_cond_lab_0() -> bool:
	return not F("labIntro")


func trig_lab_0() -> void:
	Game.set_flag("labIntro")
	var o := "한결 조사관"
	await w.emote(w.npc_by_id("prof"), "!")
	await say("%s, 현장통신 의뢰를 받아 줘서 고맙구나. 폭풍이 지나간 뒤 다섯 관측소의 기록이 끊겼어." % nm(), o)
	await say("도윤은 장비 운반을 맡았고, 너는 생물들과 함께 센서가 놓인 길을 조사해 주면 돼.", o)
	await say("책상에는 짹짹이, 개굴물, 돌돌이의 동행 기록이 있어. 길 안내, 수변 탐색, 지반 조사 중 필요한 도움을 골라 보렴.", o)
	await say("나는 곡물 창고에서 만난 들쥐롱과 출발할게. 서로 다른 기록을 모아 와서 비교하자!", R)


func obj_lab_4_4() -> void:
	await pick_starter(0)


func obj_lab_5_4() -> void:
	await pick_starter(1)


func obj_lab_6_4() -> void:
	await pick_starter(2)


## 몬스터를 크게 보여 주는 카드 (스타터 고르기·생태기록 등록)
func mon_card(sid: int) -> Control:
	var s: Dictionary = Game.sp(sid)
	var vs := w.get_viewport().get_visible_rect().size
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	w.ui.add_child(root)
	Sound.cry(sid)
	var bg := ColorRect.new()
	bg.color = Color(0.06, 0.08, 0.14, 0.5)
	bg.size = vs
	root.add_child(bg)
	var card := UI.panel(root, Rect2(40, 140, vs.x - 80, 560), Color(1.0, 0.99, 0.93))
	var stage := Node2D.new()
	stage.position = Vector2(card.size.x / 2, 330)
	card.add_child(stage)
	var p := Puppet.new()
	stage.add_child(p)
	p.setup_mon(sid, false, 260.0)
	p.scale = Vector2(0.2, 0.2)
	p.create_tween().tween_property(p, "scale", Vector2.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	FX.burst(stage, Vector2(0, -120), Color(1, 1, 0.8), Color(1, 0.85, 0.4), 18, 260.0, Vector2.ZERO, 0.6, 1.0, 180.0)
	var types: Array = []
	for t in s.t:
		types.append(Data.type_name(t))
	UI.label(card, "%s  ·  %s 타입  ·  %s 몬스터" % [s.n, "/".join(types), s.cat], Vector2(28, 360), 30)
	var d := UI.label(card, s.d, Vector2(28, 410), 26, Color(0.3, 0.33, 0.42))
	d.size.x = card.size.x - 56
	d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return root


func pick_starter(i: int) -> void:
	var sid: int = World.STARTERS[i][2]
	if F("starter"):
		await say("이미 등록한 동행 기록이다. 다른 동료와는 현장에서 다시 만날 수 있다.")
		return
	var s: Dictionary = Game.sp(sid)
	var card := mon_card(sid)
	var roles := ["길을 살피는 정찰 동료", "수변 흔적을 찾는 탐색 동료", "지반을 확인하는 조사 동료"]
	var r := await ask("%s: %s와 첫 의뢰를 시작할까?" % [roles[i], s.n], ["동행 등록", "다른 기록 보기"], "한결 조사관")
	card.queue_free()
	if r == 0:
		await give_starter(sid, false)


func secret_starter() -> void:
	# Old saves retain their companion; the three-declines electric starter route is retired.
	await say("별도 동료 배정은 없다. 세 현장 기록 중 필요한 탐색 도움을 골라 보렴.", "한결 조사관")


func give_starter(sid: int, _secret: bool) -> void:
	Game.g.starter = sid
	Game.g.rival_starter = 15
	Game.set_flag("starter")
	var mon := Game.make_mon(sid, 5, {"met": {"map": "현장통신소", "lv": 5}, "ot": nm(), "shiny": false})
	Game.add_mon(mon)
	Game.g.seen[sid] = 1
	Game.g.caught[sid] = 1
	w.enter_map("lab", w.P, w.player.dir, {"quiet": true})
	await Sound.jingle("key")
	await say("%s와 동행 기록을 작성했다. 이름은 원정 메뉴에서 언제든 바꿀 수 있다." % Game.name_of(mon))
	await w.nickname_prompt(mon)
	var rv := w.npc_by_id("rival_lab")
	await say("현장에서는 기술을 잘못 쓰면 장비가 다칠 수 있어. 출발 전에 안전 점검을 해 보자.", R)
	await w.battle({"kind": "trainer", "cls": "rival", "name": R, "team": Game.rival_team(1), "no_lose": true, "look": "rival", "bg": "lab",
		"lose": "점검 끝! 서로의 탐색 방식을 확인했어.", "win_msg": "이제 현장에서도 장비를 안전하게 다룰 수 있겠어."})
	Game.set_flag("rival1")
	var o := "한결 조사관"
	await say("안전 점검 완료. 생태기록과 원정패드에 오늘 의뢰를 등록했어.", o)
	await w.give_item("dex")
	Game.set_flag("dex")
	await w.give_item("pad")
	Game.set_flag("pad")
	await w.give_item("shoes")
	Game.set_flag("shoes")
	await w.give_item("ball", 5)
	await say("공명등은 생물을 가두는 장비가 아니야. 가까이 놓고 주파수를 맞추면 함께 조사할 연결이 생겨.", o)
	await say("첫 의뢰는 바위시티의 지반 센서 점검이다. 책임자 단단에게 현장 조건을 확인해 보렴. B를 누른 채 이동하면 달릴 수 있어.", o)
	await say("나는 장비를 먼저 운반할게. 관측소에서 기록을 비교하자!", R)
	await w.walk_npc(rv, ["down", "down", "down", "down", "down", "down"], 0.2)
	Game.set_flag("rivalLeft")
	rv.gone = true
	Game.g.heal = {"map": "home", "x": 4, "y": 6}


func trig_cond_city_0() -> bool:
	return not F("badge0")


func trig_city_0() -> void:
	var g := w.npc_by_id("c_guard")
	await g.face("down")
	await w.emote(g, "!")
	await say("잠깐! 이 앞 2번 도로 숲은 아주 위험해.", "경비원")
	await say("바위시티 관측소의 관측 인증을 얻은 원정가만 지나갈 수 있단다.", "경비원")
	await w.walk_player(["left"])


func talk_granny(_n: NPC) -> void:
	var o := "할머니"
	if not F("badge0"):
		await say("젊은이, 관측소에 도전하려고? 현장 책임자 단단은 내 손자란다.", o)
		await say("관측 인증을 얻어 오면 좋은 걸 주마. 호호.", o)
		return
	if not F("gift2"):
		await say("어머나, 단단을 이겼구나! 약속대로 이걸 주마.", o)
		await w.give_item("great", 3)
		Game.set_flag("gift2")
		return
	await say("분광 공명등은 보통 캡슐보다 훨씬 잘 붙잡힌단다.", o)


func statue(i: int) -> void:
	var L: Array = STATUES[i]
	await say("%s · %s" % [L[0], L[1]])
	await say("인증 원정가: %s" % nm() if int(Game.g.badges[i]) else "인증 원정가: 아직 없음")


func badge(i: int, leader: String, badge_name: String) -> void:
	Game.g.badges[i] = 1
	Game.set_flag("badge%d" % i)
	Game.set_flag("station_online%d" % i)
	w.sparkle_player()
	Sound.jingle("badge")
	await Menus.badge_fx(w, i)
	await say("%s 현장 책임자 %s에게서 %s 받았다!" % [Game.josa(nm(), "은"), leader, Game.josa(badge_name, "을")])


func talk_leader1(_n: NPC) -> void:
	var o := "현장 책임자 단단"
	if int(Game.g.badges[0]):
		await say("다시 왔나. 너의 단단한 의지는 이미 증명되었다.", o)
		await say("동쪽 물결마을의 현장 책임자 하라는 물 타입의 고수다. 방심하지 마라.", o)
		return
	await say("바위시티의 지반 관측소다. 나는 센서를 관리하는 단단. 복구 지원을 기다리고 있었다.", o)
	await say("무너진 지반 센서에 새 기준값이 필요하다. 내 동료와 현장 대응 훈련을 하고 진동 기록을 맞추자.", o)
	var r := await w.battle({"kind": "trainer", "cls": "leader", "name": "단단", "look": "leaderRock", "team": [[23, 12], [24, 14]], "bg": "rock", "leader": true,
		"lose": "훌륭하다... 너의 의지는 바위보다 단단하구나!"})
	if r != "win":
		return
	await say("기준값이 안정됐다. 지반 관측소를 다시 연결하고 네 현장 기록을 인증하마.", o)
	await badge(0, "단단", "반석 관측 인증")
	await say("반석 관측 인증은 원정가 카드에서 볼 수 있다. 이제 동쪽 2번 도로로 갈 수 있을 거다.", o)
	await say("물결마을의 하라는 나보다 훨씬 까다로운 상대다. 몬스터를 잘 키워 두도록!", o)


# =====================================================================
# 2번 도로 · 물결마을
# =====================================================================
func trig_cond_route2_0() -> bool:
	return F("badge0") and not F("rival2")


func trig_route2_0() -> void:
	Game.set_flag("rival2")
	if w.P.y != 10:
		await w.walk_player(["up"])
	Sound.music("rival")
	var rv := w.add_npc({"id": "rv2", "x": 9, "y": 10, "dir": "left", "look": "rival", "name": R})
	await w.emote(rv, "!")
	while absi(rv.cell.x - w.P.x) > 1:
		await w.walk_npc(rv, ["left"], 0.22)
	await w.player.turn("right")
	await say("%s! 지반 기록을 받았어. 나는 동쪽 길의 표본을 정리하고 있었지!" % nm(), R)
	await say("우리 동료들의 대응을 비교하고 기록을 서로 보내자. 준비됐어?", R)
	await w.battle({"kind": "trainer", "cls": "rival", "name": R, "team": Game.rival_team(2), "look": "rival", "bg": "forest", "lose": "으으, 또 졌어! 너 너무 강해진 거 아냐?"})
	if Game.g.map != "route2":
		return
	await say("내가 먼저 물결마을에 가서 통신선을 확인할게. 그곳에서 만나자!", R)
	await w.walk_npc(rv, ["right", "right", "right", "right", "right", "right", "right", "right"], 0.2)
	w.remove_npc(rv)
	Sound.music(str(w.m.music))


func cond_rival3() -> bool:
	return F("rival2") and not F("rival3")


func talk_rival3(_n: NPC) -> void:
	if F("rival3"):
		return
	Game.set_flag("rival3")
	var rv := w.npc_by_id("rival3")
	Sound.music("rival")
	await say("%s! 수변 관측소로 가는 길이지? 내 동료들도 새로운 신호를 익혔어. 비교 훈련을 부탁해!" % nm(), R)
	await say("서로 다른 동료들이 같은 현장에서 어떻게 움직이는지 기록해 보자.", R)
	await w.battle({"kind": "trainer", "cls": "rival", "name": R, "team": Game.rival_team(3), "look": "rival", "bg": "water", "lose": "...인정할게. 넌 정말 강해."})
	if Game.g.map != "town2":
		return
	await say("하라 씨에게 수위 자료를 맡겼어. 나는 다음 구간의 표본을 모으고 올게!", R)
	if rv:
		rv.gone = true
	Sound.sfx("exit")


func cond_t2_gate() -> bool:
	return not F("badge1")


func talk_wife(_n: NPC) -> void:
	var o := "아주머니"
	if not F("gift3"):
		await say("먼 길 오느라 고생했지? 이거 가져가렴. 우리 남편이 호수에서 주운 거란다.", o)
		await w.give_item("revive", 1)
		Game.set_flag("gift3")
		return
	await say("부활의깃털은 쓰러진 몬스터를 되살려 준단다. 아껴 쓰렴.", o)


func talk_leader2(_n: NPC) -> void:
	var o := "현장 책임자 하라"
	if int(Game.g.badges[1]):
		await say("또 와 줬구나. 네 몬스터들은 정말 행복해 보여.", o)
		await say("앞으로도 함께 넓은 세상을 원정하렴!", o)
		return
	await say("어서 와. 나는 물결마을 관측소 현장 책임자 하라.", o)
	await say("호수 수위 기록이 폭풍 뒤로 끊겼어. 우리 동료들의 움직임을 비교해서 수변 센서를 보정하자.", o)
	var r := await w.battle({"kind": "trainer", "cls": "leader", "name": "하라", "look": "leaderWater", "team": [[29, 18], [19, 19], [20, 21]], "bg": "water", "leader": true,
		"lose": "멋져... 너희의 물결이 내 물결보다 더 높았어."})
	if r != "win":
		return
	await say("수변 센서가 다시 신호를 보내고 있어. 이번 관측 기록을 인증할게.", o)
	await badge(1, "하라", "물결 관측 인증")
	await say("두 개의 관측 인증을 모은 너는 이제 어엿한 원정대원이야. 축하해!", o)
	await say("남쪽에서 검은안개단이 관측 장비를 가져가고 있대. 기상 자료를 독점하려는 것 같아.", o)
	await say("마을 남쪽 3번 도로는 이제 지나갈 수 있을 거야. 붉은재마을 현장 책임자 화련에게도 소식을 전해 주겠니?", o)


# =====================================================================
# 붉은재마을 · 번개도시 · 하늘봉마을
# =====================================================================
func cond_t3_gate() -> bool:
	return not F("badge2")


func cond_rival4() -> bool:
	return F("badge2") and not F("rival4")


func talk_rival4(_n: NPC) -> void:
	if F("rival4"):
		return
	Game.set_flag("rival4")
	var r := w.npc_by_id("rival4")
	Sound.music("rival")
	await say("%s! 열원 관측소가 연결됐다는 연락을 받았어!" % nm(), R)
	await say("근데 들었어? 검은안개단이라는 녀석들이 번개도시 발전소를 점령했대. 그 전에 몸 좀 풀고 가자!", R)
	await w.battle({"kind": "trainer", "cls": "rival", "name": R, "team": Game.rival_team(4), "look": "rival", "bg": "rock", "lose": "쳇... 역시 넌 강하구나."})
	if Game.g.map != "town3":
		return
	await say("나는 주민들에게 우회로를 알려 줄게. 통신 복구는 너에게 부탁해. 번개도시에서 만나자!", R)
	if r:
		r.gone = true
	Sound.sfx("exit")


func talk_leader3(_n: NPC) -> void:
	var o := "현장 책임자 화련"
	if int(Game.g.badges[2]):
		await say("하하! 다시 왔구나. 네 몬스터들의 눈빛은 아직도 활활 타오르고 있어!", o)
		await say("동쪽 번개도시에 검은안개단이 있다던데... 조심하라고!", o)
		return
	await say("화산 열원 관측소에 잘 왔어. 여기 온도계를 관리하는 화련이야.", o)
	await say("열원 센서를 안전하게 보정하려면 동료와 신호가 맞아야 해. 먼저 대응 훈련을 해 보자.", o)
	var r := await w.battle({"kind": "trainer", "cls": "leader", "name": "화련", "look": "leaderFire", "team": [[21, 25], [2, 27], [22, 29]], "bg": "rock", "leader": true,
		"lose": "크하하! 완전히 불타 버렸어! 네 열정이 더 뜨거웠다!"})
	if r != "win":
		return
	await say("과열 구간의 값이 보정됐어. 열원 관측소 복구 기록을 전송할게.", o)
	await badge(2, "화련", "불꽃 관측 인증")
	await say("이제 동쪽 4번 도로로 갈 수 있을 거야. 그 너머 번개도시 발전소를 검은안개단이 점령했다는 소문이 있다.", o)
	await say("도시 전체가 정전이라 관측소도 문을 닫았다더군. 네가 가서 해결해 주지 않겠어?", o)


func cond_t4_gymgate() -> bool:
	return not F("plantClear")


func cond_t4_north() -> bool:
	return not F("badge3")


func cond_t4_man() -> bool:
	return not F("plantClear")


func cond_t4_man2() -> bool:
	return F("plantClear")


func cond_t4_rival() -> bool:
	return F("rival4") and not F("plantClear")


func talk_t4_rival(_n: NPC) -> void:
	await say("%s! 발전소 입구는 여기야. 안에 검은안개단 두목이 있대." % nm(), R)
	await say("나는 밖에서 도망치는 단원들을 막고 있을게. 안은 너한테 맡긴다!", R)


func cond_boss() -> bool:
	return not F("plantClear")


func talk_boss(_n: NPC) -> void:
	var o := "검은안개단 두목 흑운"
	await say("호오... 여기까지 오다니 제법이구나, 꼬마 원정가.", o)
	await say("통신망을 잠그면 기상 기록은 우리만 볼 수 있지. 안전한 길을 알고 싶다면 우리에게 통행료를 내야 한다!", o)
	await say("방해꾼은 안개 속으로 사라져라!", o)
	var r := await w.battle({"kind": "trainer", "cls": "boss", "name": "흑운", "look": "boss", "team": [[26, 30], [28, 31], [30, 32]], "bg": "lab",
		"lose": "이럴 수가... 나의 안개가 걷히다니..."})
	if r != "win":
		return
	await say("암호화 장치가 멈췄군. 관측값을 공개하는 게 정말 옳은지 두고 보자!", o)
	var b := w.npc_by_id("boss")
	Sound.sfx("exit")
	if b:
		b.gone = true
	Game.set_flag("plantClear")
	w.refresh_npcs()
	await w.sleep(0.4)
	Sound.sfx("save")
	await say("발전기가 다시 정상적으로 돌아가기 시작했다! 번개도시에 전기가 들어왔다!")
	await w.give_item("lvup", 3)
	await say("발전소 직원이 감사의 표시로 레벨업 물약을 주었다!")


func talk_leader4(_n: NPC) -> void:
	var o := "현장 책임자 찌나"
	if int(Game.g.badges[3]):
		await say("또 왔어? 발전소를 되찾아 준 거, 정말 고마워!", o)
		await say("북쪽 5번 도로 끝 하늘봉마을에 마지막 관측소가 있어. 힘내!", o)
		return
	await say("네가 발전소를 되찾아 준 원정가구나! 고마워. 나는 번개도시 관측소 현장 책임자 찌나야.", o)
	await say("전기는 돌아왔지만 통신 장치의 잡음이 남았어. 우리 동료들과 신호를 맞추면 센서를 보정할 수 있어.", o)
	var r := await w.battle({"kind": "trainer", "cls": "leader", "name": "찌나", "look": "leaderElec", "team": [[17, 31], [30, 32], [18, 34]], "bg": "city", "leader": true,
		"lose": "와... 번개보다 빨랐어!"})
	if r != "win":
		return
	await say("통신 신호가 선명해졌어. 번개도시 관측소 복구 완료!", o)
	await badge(3, "찌나", "번개 관측 인증")
	await say("이제 북쪽 5번 도로를 지나갈 수 있어. 산 정상의 하늘봉마을에 마지막 현장 책임자 하늬가 기다리고 있어!", o)


func cond_t5_gate() -> bool:
	return not F("badge4")


func cond_t5_summit() -> bool:
	return F("badge4") and not F("clear2")


func cond_t5_elder() -> bool:
	return F("clear2")


func cond_t5_sky() -> bool:
	return F("legendQuest") and F("awake31") and F("awake32") and F("awake33") and not F("cap34")


func cond_t5_tgate() -> bool:
	return not F("clear2")


func talk_leader5(_n: NPC) -> void:
	var o := "현장 책임자 하늬"
	if int(Game.g.badges[4]):
		await say("정상에 올라가 보았니? 그곳에서 네 원정의 끝과 새로운 시작을 볼 수 있을 거야.", o)
		return
	await say("구름 위까지 잘 왔어. 나는 하늘봉마을 관측소 현장 책임자 하늬.", o)
	await say("네 관측소의 데이터가 도착했어. 마지막으로 고도 센서를 보정하고 전체 관측망을 연결하자.", o)
	var r := await w.battle({"kind": "trainer", "cls": "leader", "name": "하늬", "look": "leaderSky", "team": [[14, 37], [11, 38], [26, 38], [22, 39], [11, 41]], "bg": "grass", "leader": true,
		"lose": "...아름다운 비행이었어. 너희는 진짜 하늘을 날았구나."})
	if r != "win":
		return
	await say("고도 기록도 정상으로 돌아왔어. 다섯 관측소가 다시 연결됐구나!", o)
	await badge(4, "하늬", "창공 관측 인증")
	await say("다섯 개의 관측 인증을 모두 모았구나! 이제 하늘봉 정상에 오를 수 있어.", o)
	await say("정상에서 누군가 너를 기다리고 있는 것 같던데?", o)


func talk_t5_summit(_n: NPC) -> void:
	if F("clear2"):
		return
	var r := w.npc_by_id("t5_summit")
	Sound.music("rival")
	await say("왔구나, %s. 나도 다섯 번째 관측 인증을 따고 여기서 기다리고 있었어." % nm(), R)
	await say("폭풍 이후 흩어진 기록을 우리가 함께 모았네. 마지막으로 동료들의 대응 기록을 맞춰 보자.", R)
	await say("이곳의 고도 자료와 각 지역의 신호를 함께 전송하면 관측망 복구가 끝나!", R)
	var res := await w.battle({"kind": "trainer", "cls": "rival", "name": R, "team": Game.rival_team(5), "look": "rival", "bg": "grass",
		"lose": "...졌다. 완벽하게 졌어.", "no_lose": true, "win_msg": "이겼다...! 하지만 다음엔 너도 더 강해져서 오겠지."})
	await say("훌륭한 대응 기록이야. 네 자료와 내 자료가 잘 맞았어!" if res == "win" else "내 동료들이 먼저 대응했네. 서로 다른 결과까지 기록하니 더 믿을 만해.", R)
	await say("관측망에 불이 켜졌어! 주민들에게 이 자료를 공개하자. 다음 조사도 함께하자!", R)
	Game.set_flag("clear2")
	if r:
		r.gone = true
	await w.credits(true)


# =====================================================================
# 엔딩 이후: 전설의 몬스터
# =====================================================================
func talk_t5_elder(_n: NPC) -> void:
	var o := "하늘봉 장로"
	if not F("legendQuest"):
		await say("오오, 정상에서의 승부, 잘 보았네. 자네라면 이 이야기를 들려줘도 되겠군.", o)
		await say("먼 옛날, 하늘의 신 천공신이 이 지방을 만들고 세 수호신에게 땅을 맡겼다네.", o)
		await say("불의 염화룡, 물의 심해왕, 번개의 자계수... 세 수호신은 지금도 깊은 동굴에서 잠들어 있지.", o)
		await say("세 수호신을 모두 깨우면, 천공신이 이 정상에 다시 모습을 드러낸다고 전해진다네.", o)
		for L in LEGENDS:
			await say("%s: %s" % [Game.sp(L.sid).n, L.where], o)
		await say("동굴 입구는 이제 자네에게 열릴 걸세. 수호신들은 아주 강하니, 심층 공명등을 넉넉히 챙겨 가게.", o)
		Game.set_flag("legendQuest")
		await w.give_item("hyper", 3)
		Sound.sfx("sparkle")
		return
	var left := LEGENDS.filter(func(L: Dictionary) -> bool: return not F("awake%d" % L.sid))
	if left.size():
		await say("아직 깨어나지 않은 수호신이 %d마리 남았네." % left.size(), o)
		for L in left:
			await say("%s: %s" % [Game.sp(L.sid).n, L.where], o)
		return
	if not F("cap34"):
		await say("세 수호신이 모두 깨어났군! 하늘이 울리고 있어... 정상으로 가 보게!", o)
		return
	await say("천공신과 함께하는 원정가라니... 살아서 이런 날을 보게 될 줄이야.", o)
	await say("남쪽 무한의 탑에서 자네의 힘을 더 시험해 보는 것도 좋겠지.", o)


func talk_t5_sky(_n: NPC) -> void:
	await legend_battle(34, 70, "grass")


func legend_battle(sid: int, lv: int, bg: String) -> void:
	var s: Dictionary = Game.sp(sid)
	await say("구름이 갈라지며 거대한 그림자가 내려왔다...!" if sid == 34 else "%s 깊은 잠에서 깨어나 이쪽을 노려본다...!" % Game.josa(s.n, "이"))
	await Sound.cry(sid)
	await w.sleep(0.2)
	var r := await w.battle({"kind": "wild", "team": [[sid, lv]], "bg": bg, "legend": true})
	if r == "lose":
		return
	var first := not F("awake%d" % sid)
	Game.set_flag("awake%d" % sid)
	if r == "caught":
		Game.set_flag("cap%d" % sid)
		await say("%s %s의 동료가 되었다!" % [Game.josa(s.n, "이"), nm()])
	elif r == "win":
		await say("%s 쓰러졌지만 그 기운은 사라지지 않았다... 다시 찾아오면 또 만날 수 있을 것 같다." % Game.josa(s.n, "은"))
	else:
		await say("%s 아직 이곳에서 기다리고 있다." % Game.josa(s.n, "은"))
	if first and sid != 34 and LEGENDS.all(func(L: Dictionary) -> bool: return F("awake%d" % L.sid)):
		Sound.sfx("shake")
		FX.shake(w, 16.0, 0.6)
		await say("...!")
		await say("멀리 하늘봉 쪽에서 천둥 같은 울림이 들려왔다! 세 수호신이 모두 깨어났다!")


# =====================================================================
# 무한의 탑
# =====================================================================
func tower() -> Dictionary:
	if not Game.g.has("tower"):
		Game.g.tower = {"best": 0, "cur": 0}
	return Game.g.tower


func tower_team(f: int) -> Array:
	Game.rng_seed(f * 9973 + 7)
	if f == 100:
		return [[31, 100], [32, 100], [33, 100], [6, 100], [3, 100], [9, 100]]
	var n := 1 if f < 10 else 2 if f < 25 else 3 if f < 50 else 4 if f < 80 else 5
	var all: Array = []
	for k in Data.D.species:
		var s: Dictionary = Data.D.species[k]
		if not s.has("legend") and not s.has("human") and int(k) != 13:
			all.append(int(k))
	all.sort()
	var team: Array = []
	for i in n:
		var r := Game.rng_next()
		var want := 0
		if f < 16:
			want = 0
		elif f < 36:
			want = 0 if r < 0.6 else 1
		elif f < 70:
			want = 1 if r < 0.6 else 2
		else:
			want = 1 if r < 0.25 else 2
		var pool := all.filter(func(s: int) -> bool: return int(Game.sp(s).st) == want)
		team.append([pool[int(Game.rng_next() * pool.size())], f])
	if f % 10 == 0:
		var pool2 := all.filter(func(s: int) -> bool: return int(Game.sp(s).st) == 2)
		team[team.size() - 1] = [pool2[int(Game.rng_next() * pool2.size())], f]
	return team


func tower_record() -> void:
	var t := tower()
	await say("기록판: %s의 최고 기록은 %d층이다.%s" % [nm(), int(t.best), " (100층 정복!)" if F("towerClear") else ""])


func talk_tw_rec(_n: NPC) -> void:
	var o := "탑 안내원"
	var t := tower()
	if not F("towerIntro"):
		Game.set_flag("towerIntro")
		await say("무한의 탑에 오신 걸 환영합니다! 이 탑은 100층까지 이어져 있어요.", o)
		await say("층마다 수호자가 기다리고, 수호자의 몬스터 레벨은 층수와 같아요. 100층은 레벨 100이랍니다!", o)
		await say("10층을 돌파할 때마다 몬스터가 회복되고 보상을 받아요. 다음에는 돌파한 10층 단위부터 다시 도전할 수 있어요.", o)
		await say("도중에 지면 이 로비로 돌아오게 되지만, 돈을 잃지는 않으니 안심하세요!", o)
	var top := mini(91, int(t.best) / 10 * 10 + 1)
	var cps: Array = []
	var f := 1
	while f <= top:
		cps.append(f)
		f += 10
	cps.reverse()
	var items: Array = []
	for c in cps:
		items.append({"text": "%d층부터 도전" % c, "right": "처음부터" if c == 1 else "체크포인트"})
	var r := await Msg.list(items, {"title": "무한의 탑 · 최고 기록 %d층" % int(t.best)})
	if r < 0:
		await say("또 오세요!", o)
		return
	if Game.alive().is_empty():
		await say("먼저 몬스터를 회복시켜 주세요.", o)
		return
	await say("도전 전에 몬스터들을 회복시켜 드릴게요.", o)
	w.heal_party()
	Sound.sfx("heal")
	await say("그럼 %d층으로 안내할게요. 행운을 빌어요!" % cps[r], o)
	await tower_enter(cps[r])


func tower_enter(f: int) -> void:
	var t := tower()
	t.cur = f
	var mp: Dictionary = Data.map("towerFloor")
	mp.name = "무한의 탑 %d층" % f
	mp.npcs[0].look = "boss" if f == 100 else "villain" if f % 10 == 0 else TOWER_LOOKS[f % TOWER_LOOKS.size()]
	mp.npcs[0].name = "%d층 수호자" % f
	await w.fade(1.0, 0.3)
	w.enter_map("towerFloor", Vector2i(5, 8), "up", {"sign": true})
	await w.fade(0.0, 0.3)


func talk_tw_guard(n: NPC) -> void:
	var t := tower()
	var f: int = int(t.cur)
	var o := "%d층 수호자" % f
	await say("...여기까지 올라온 자는 처음이다. 마지막 시험, 레벨 100의 힘을 받아라!" if f == 100 else "%d층의 문지기다. 이 층을 넘으면 보상이 기다린다!" % f if f % 10 == 0 else "탑을 오르려면 나를 넘어서라!", o)
	var r := await w.battle({"kind": "trainer", "cls": "tower", "name": "%d층 수호자" % f, "look": n.look, "team": tower_team(f), "no_lose": true,
		"lose": "...길을 열어 주지.", "win_msg": "다시 도전하도록.", "bg": "lab"})
	if r != "win":
		await say("%d층에서 도전이 끝났다... 로비로 돌아간다." % f)
		w.heal_party()
		await w.fade(1.0, 0.3)
		w.enter_map("towerLobby", Vector2i(5, 8), "up", {"quiet": true})
		await w.fade(0.0, 0.3)
		await say("최고 기록: %d층. 다음엔 %d층부터 다시 도전할 수 있어요!" % [int(t.best), mini(91, int(t.best) / 10 * 10 + 1)], "탑 안내원")
		return
	t.best = maxi(int(t.best), f)
	Sound.sfx("open")
	n.gone = true
	w.refresh_npcs()
	if f % 10 == 0:
		w.heal_party()
		Sound.sfx("heal")
		await say("%d층 돌파! 몬스터들이 회복되었다." % f)
		var prize := f * 40
		Game.g.money = int(Game.g.money) + prize
		await say("%s 보상으로 %s 받았다!" % [Game.josa(nm(), "은"), Game.josa(Game.money(prize), "을")])
		await w.give_item("lvup", maxi(1, f / 20))
		if f % 50 == 0:
			await w.give_item("revive", 2)
	if f == 100:
		Game.set_flag("towerClear")
		await Sound.jingle("badge")
		await say("무한의 탑 100층을 정복했다!!")
		await w.give_item("hyper", 5)
		await w.give_item("lvup", 10)
		await say("탑의 꼭대기에서 이 지방 전체가 내려다보인다... 진정한 원정대장의 탄생이다!")
		return
	await say("위층으로 가는 계단이 열렸다!")


func trig_towerFloor_0() -> void:
	var t := tower()
	var g := w.npc_by_id("tw_guard")
	if g and g.visible:
		return
	if int(t.cur) >= 100:
		await say("더 이상 올라갈 곳이 없다. 하늘이 손에 닿을 것 같다.")
		return
	Sound.sfx("exit")
	await tower_enter(int(t.cur) + 1)


# =====================================================================
# 사람과 싸우기 (npcfight.js)
# =====================================================================
func npc_caught(n: NPC) -> bool:
	return F("cap_" + n.id)


func subst_of(n: NPC) -> Dictionary:
	if not npc_caught(n) or not n.info.get("talk", false):
		return {}
	var S: Dictionary = Data.D.fight.subst
	var k := n.id
	if not S.has(k):
		k = "leader" if n.id.begins_with("leader") else n.id.split("_")[0]
	if S.has(k):
		return {"name": S[k][0], "look": S[k][1], "hello": S[k][2]}
	return {"name": "대신 온 " + str(n.info.get("name", "")), "look": n.look, "hello": "%s 자리를 비워서 제가 대신 맡고 있어요." % Game.josa(n.info.get("name", ""), "이")}


func npc_gone(n: NPC) -> bool:
	return npc_caught(n) and not n.info.get("talk", false)


func npc_look(d: Dictionary) -> String:
	if Game.flag("cap_" + str(d.get("id", ""))) and d.get("talk", false):
		var S: Dictionary = Data.D.fight.subst
		var id: String = d.id
		var k := id if S.has(id) else "leader" if id.begins_with("leader") else id.split("_")[0]
		if S.has(k):
			return S[k][1]
	return ""


func npc_name(n: NPC) -> String:
	var s := subst_of(n)
	if s.size():
		return s.name
	if n.info.get("trainer") != null:
		return w.trainer_name(n)
	return str(n.info.get("name", ""))


func subst_talk(n: NPC) -> void:
	var s := subst_of(n)
	await say(Game.fmt_name(s.hello), s.name)
	if n.id == "mom":
		await say("피곤해 보이는구나. 잠깐 쉬었다 가렴.", s.name)
		await w.fade(1.0)
		w.heal_party()
		await Sound.jingle("heal")
		await w.fade(0.0)
		Game.g.heal = {"map": "home", "x": 4, "y": 6}
		await say("몬스터들이 기운을 되찾았다!")
		await say("네 엄마 몫까지 아줌마가 응원할게!", s.name)
		return
	await talk(n)


func fight_lines(n: NPC) -> Dictionary:
	var FD: Dictionary = Data.D.fight
	var role := n.id.split("_")[0]
	var lk: Dictionary = FD.look.get(n.look, FD.look.man)
	var f: Dictionary = {}
	if FD.npc.has(n.id):
		f = FD.npc[n.id]
	elif FD.role.has(role):
		f = FD.role[role]
	elif n.info.get("trainer") != null and FD.cls.has(n.info.trainer.cls):
		f = {"go": [FD.cls[n.info.trainer.cls]], "lose": "크윽, 맨손 승부에서도 지다니...", "win": "어때, 맨손 승부도 만만치 않지?"}
	var go: Array = []
	for l in f.get("go", [lk.go]):
		go.append(Game.fmt_name(str(l)))
	return {"go": go, "lose": Game.fmt_name(str(f.get("lose", lk.lose))), "win": Game.fmt_name(str(f.get("win", lk.win))),
		"lv": int(f.lv) if f.has("lv") else int(lk.get("lv", 0))}


## 대화가 끝난 뒤: 싸우자 / 대화를 그만한다
func fight_choice(n: NPC) -> void:
	if n.is_mon() or n.id == "tw_guard" or Game.alive().is_empty():
		return
	var name := npc_name(n)
	var r := await ask("%s 무엇을 할까?" % Game.josa(name, "과"), ["싸우자", "대화를 그만한다"], "", 1)
	if r != 0:
		return
	if subst_of(n).size():
		await say(Data.D.fight.refuse, name)
		return
	var f := fight_lines(n)
	for l in f.go:
		n.nod()
		await say(l, name)
	await w.battle({"kind": "npc", "name": n.info.trainer.name if n.info.get("trainer") != null else str(n.info.get("name", "")),
		"cls": n.info.trainer.cls if n.info.get("trainer") != null else "", "look": n.look,
		"lv": clampi(Game.top_level() + int(f.lv), 2, 100), "npc": n.id, "lose": f.lose, "win_msg": f.win, "bg": w.m.bg})


# =====================================================================
# 개발용 바로가기 (실행 인자 -- battle / 웹 #battle)
# =====================================================================
func dev(cmd: String) -> void:
	var parts := cmd.split(":")
	match parts[0]:
		"field_briefing":
			await w.run_script(func() -> void: await trig_lab_0())
		"intro_mom":
			await w.run_script(func() -> void:
				w.banner("우리 집")
				var mom := w.npc_by_id("mom")
				await mom.face("right")
				await w.emote(mom, "!")
				await say("일어났구나, %s! 한결 조사관님이 연구소로 와 달라고 하셨단다." % nm(), "엄마")
				await say("연구소는 마을 위쪽에 있는 큰 건물이야. 메뉴는 오른쪽 위 메뉴 버튼(또는 C 키)으로 열 수 있단다.", "엄마")
				await say("조심해서 다녀오렴!", "엄마")
				await mom.face("left"))
		"selftest":
			await selftest(parts.slice(1))
		"battle":
			var sid := int(parts[1]) if parts.size() > 1 else 17     # battle:24 → 24번과 전투
			await w.run_script(func() -> void: await w.battle({"kind": "wild", "team": [[sid, 5]]}))
		"person":
			await w.run_script(func() -> void: await w.battle({"kind": "npc", "name": "아저씨", "look": "man", "lv": 6, "npc": "dev", "lose": "아이고!", "win_msg": "허허"}))
		"trainer":
			await w.run_script(func() -> void: await w.battle({"kind": "trainer", "cls": "kid", "name": "민수", "team": [[15, 4], [10, 3]], "look": "kid", "lose": "으앙!"}))
		"menu":
			await w.open_menu()
		"shop":
			await w.run_script(func() -> void: await Menus.shop_buy())
		"evolve":
			await w.run_script(func() -> void: await Menus.evolve(Game.g.party[0]))
		"credits":
			await w.run_script(func() -> void: await w.credits(true))


## 자동 점검: 모든 지도를 돌며 사람마다 말을 걸고(전투 포함), 트리거·조사 이벤트를 실행한다
func selftest(only := []) -> void:
	Game.auto_text = true
	Engine.time_scale = 8.0
	for i in Game.g.party.size():
		Game.g.party[i] = Game.make_mon([1, 4, 7, 17, 24, 11][i % 6], 100)
	var ids: Array = Data.D.maps.keys() if only.is_empty() else only
	var n_talk := 0
	for id in ids:
		print("[selftest] map ", id)
		var mp: Dictionary = Data.map(id)
		var start := _safe_cell(mp)
		w.enter_map(id, start, "down", {"quiet": true})
		await w.sleep(0.05)
		for npc in w.npcs.duplicate():
			if not is_instance_valid(npc) or not npc.visible:
				continue
			if Game.g.map != id:
				w.enter_map(id, start, "down", {"quiet": true})
			w.P = npc.cell + Vector2i.DOWN
			print("[selftest]   talk ", npc.id)
			await w.run_script(func() -> void: await w._talk_npc(npc))
			n_talk += 1
			Game.heal_party()
		for k in mp.obj:
			if Game.g.map != id:
				w.enter_map(id, start, "down", {"quiet": true})
			if mp.obj[k] is String and mp.obj[k] == "@fn":
				await w.run_script(func() -> void: await obj(id, k))
		for t in mp.get("trig", []).size():
			if Game.g.map != id:
				w.enter_map(id, start, "down", {"quiet": true})
			w.P = Vector2i(int(mp.trig[t].x), int(mp.trig[t].y))
			if not mp.trig[t].cond or trig_cond(id, t):
				await w.run_script(func() -> void: await trig_run(id, t))
	print("[selftest] done talks=", n_talk, " money=", Game.g.money, " party=", Game.g.party.size(), " box=", Game.g.box.size())
	Engine.time_scale = 1.0
	w.get_tree().quit()


func _safe_cell(mp: Dictionary) -> Vector2i:
	for y in mp.rows.size():
		for x in str(mp.rows[y]).length():
			var c: String = mp.rows[y][x]
			if c == "." or c == "=":
				return Vector2i(x, y)
	return Vector2i(1, 1)
