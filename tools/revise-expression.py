"""One-time, reviewable migration from godot-41; preserves save IDs and package ID."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
def read(p): return (ROOT / p).read_text(encoding='utf-8')
def write(p, text): (ROOT / p).write_text(text, encoding='utf-8')
def function(p, name, replacement):
    text = read(p)
    pattern = r'^func ' + re.escape(name) + r'\([^\n]*\n[\s\S]*?(?=^func |\Z)'
    result, count = re.subn(pattern, lambda _: replacement.rstrip() + '\n\n\n', text, count=1, flags=re.M)
    assert count == 1, (p, name)
    write(p, result)

# Display names only: identifiers/URLs/compatibility formats remain stable.
pairs = [('MONSTER EXPEDITION','VELORIA FIELDNOTES'), ('몬스터 원정대','벨로리아 생태기록'),
         ('한결 박사','한결 조사관'), ('체육관','관측소'), ('관장','현장 책임자'),
         ('트레이너','원정가'), ('라이벌','원정 동료'), ('도감','생태기록'), ('배지','관측 인증'),
         ('은빛캡슐','분광 공명등'), ('황금캡슐','심층 공명등'), ('포획캡슐','공명등'),
         ('단단고치','꽃잠주머니'), ('구미염','불꽃담비'), ('뇌명조','자계수')]
files = list((ROOT/'godot/scripts').glob('*.gd')) + list((ROOT/'src').glob('*.js'))
files += [ROOT/'src/shell.html', ROOT/'godot/project.godot', ROOT/'godot/export_presets.cfg', ROOT/'privacy.html']
for p in files:
    text = p.read_text(encoding='utf-8')
    for a,b in pairs: text = text.replace(a,b)
    p.write_text(text, encoding='utf-8')

title = 'godot/scripts/title.gd'
write(title, read(title).replace('Vector2(0, 130), 76', 'Vector2(0, 130), 56'))
function(title, '_intro', '''func _intro() -> void:
	var vs := get_viewport().get_visible_rect().size
	await Game.fade_to(1.0, 0.35)
	for c in get_children():
		c.queue_free()
	var bg := ColorRect.new()
	bg.color = Color("#16383d")
	bg.size = vs
	add_child(bg)
	var card := UI.panel(self, Rect2(36, 110, vs.x - 72, vs.y * 0.46), Color("#f0ead6"), Color("#b69055"))
	var heading := UI.label(card, "벨로리아 현장통신", Vector2(28, 24), 38)
	heading.size.x = card.size.x - 56
	heading.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var log := UI.label(card, "새벽 폭풍으로 관측망이 끊겼습니다.\\n다섯 지역의 센서를 다시 연결하고\\n야생 생물의 변화 기록을 회수해 주세요.", Vector2(28, 100), 28)
	log.size = Vector2(card.size.x - 56, 170)
	log.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	# Original incident map: five linked monitoring nodes, no professor demonstration.
	var chart := Node2D.new()
	chart.position = Vector2(card.size.x * 0.5, card.size.y - 100)
	chart.draw.connect(func() -> void:
		for i in range(5):
			var at := Vector2((i - 2) * 80, sin(i * 1.1) * 28)
			if i > 0:
				chart.draw_line(Vector2((i - 3) * 80, sin((i - 1) * 1.1) * 28), at, Color("#a7b1a1"), 4, true)
			chart.draw_circle(at, 12, Color("#b66b45")))
	card.add_child(chart)
	Sound.music("intro")
	await Game.fade_to(0.0, 0.35)
	await Msg.say("원정 접수처에 새 의뢰가 도착했습니다. 폭풍 뒤의 숲은 이전 기록과 달라졌습니다.", "현장통신")
	var name := await Msg.name_input("현장 기록에 서명할 이름", "", 6, ["하늘", "태양", "바다", "별이", "민준", "서연", "지호", "유나"])
	Game.new_game(name)
	Game.g.map = "lab"
	Game.g.x = 5
	Game.g.y = 8
	Game.g.dir = "up"
	Game.g.heal = {"map": "lab", "x": 5, "y": 8}
	await Msg.say("%s 원정가의 접수가 완료됐습니다. 현장통신소에서 조사 동료와 장비를 확인해 주세요." % name, "현장통신")
	await Game.fade_to(1.0, 0.35)
	Game.dev = "field_briefing"
	Game.change_scene("res://scenes/world.tscn")''')

events='godot/scripts/events.gd'
text=read(events).replace('match parts[0]:\n', 'match parts[0]:\n\t\t"field_briefing":\n\t\t\tawait w.run_script(func() -> void: await trig_lab_0())\n', 1)
write(events,text)
function(events, 'talk_prof', '''func talk_prof(_n: NPC) -> void:
	var o := "한결 조사관"
	if not F("starter"):
		await say("세 조사 동료는 각자 탐색을 도와주는 방식이 달라. 책상에서 동행 기록을 확인해 보렴.", o)
		return
	await say("회수한 기록은 발견 %d종, 동행 %d종이구나. 숫자보다 서식지를 어떻게 이해했는지가 중요하단다." % [Game.g.seen.size(), Game.g.caught.size()], o)
	await say("관측소의 책임자에게 현장 조건을 물어보고, 센서망을 하나씩 연결해 보렴.", o)''')
function(events, 'trig_lab_0', '''func trig_lab_0() -> void:
	Game.set_flag("labIntro")
	var o := "한결 조사관"
	await w.emote(w.npc_by_id("prof"), "!")
	await say("%s, 현장통신 의뢰를 받아 줘서 고맙구나. 폭풍이 지나간 뒤 다섯 관측소의 기록이 끊겼어." % nm(), o)
	await say("도윤은 장비 운반을 맡았고, 너는 생물들과 함께 센서가 놓인 길을 조사해 주면 돼.", o)
	await say("책상에는 짹짹이, 개굴물, 돌돌이의 동행 기록이 있어. 길 안내, 수변 탐색, 지반 조사 중 필요한 도움을 골라 보렴.", o)
	await say("나는 곡물 창고에서 만난 들쥐롱과 출발할게. 서로 다른 기록을 모아 와서 비교하자!", R)''')
function(events, 'talk_rival_lab', '''func talk_rival_lab(_n: NPC) -> void:
	await say("%s, 오늘은 함께 첫 현장 점검을 하는 날이야. 나는 운반 장비를 챙겨 두었어." % nm(), R)''')
function(events, 'pick_starter', '''func pick_starter(i: int) -> void:
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
		await give_starter(sid, false)''')
function(events, 'secret_starter', '''func secret_starter() -> void:
	# Old saves retain their companion; the three-declines electric starter route is retired.
	await say("별도 동료 배정은 없다. 세 현장 기록 중 필요한 탐색 도움을 골라 보렴.", "한결 조사관")''')
function(events, 'give_starter', '''func give_starter(sid: int, _secret: bool) -> void:
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
	Game.g.heal = {"map": "home", "x": 4, "y": 6}''')

world='godot/scripts/world.gd'
write(world,read(world).replace('const STARTERS := [[4, 4, 1], [5, 4, 4], [6, 4, 7]]','const STARTERS := [[4, 4, 10], [5, 4, 19], [6, 4, 23]]'))
game='godot/scripts/game.gd'
write(game,read(game).replace('const COUNTER := {1: 4, 4: 7, 7: 1, 17: 27}', 'const COUNTER := {1: 15, 4: 15, 7: 15, 17: 15, 10: 15, 19: 15, 23: 15}'))

battle='godot/scripts/battle.gd'
text=read(battle)
text=text.replace('FOE_POS = Vector2(VS.x * 0.7, SH * 0.47)', 'FOE_POS = Vector2(VS.x * 0.74, SH * 0.84)')
text=text.replace('ME_POS = Vector2(VS.x * 0.3, SH * 0.97)', 'ME_POS = Vector2(VS.x * 0.26, SH * 0.84)')
text=text.replace('pp = _new_mon_pup(p, true, ME_POS)', 'pp = _new_mon_pup(p, false, ME_POS)')
text=text.replace('var bw := 400.0','var bw := (VS.x - 60.0) / 2.0')
text=text.replace('var rect := Rect2(20, 26, bw, 116) if side == "e" else Rect2(VS.x - bw - 20, SH - 196, bw, 150)', 'var rect := Rect2(VS.x - bw - 20, 24, bw, 150) if side == "e" else Rect2(20, 24, bw, 150)')
text=text.replace('Vector2(20, 10), 30', 'Vector2(16, 10), 26').replace('nm.size.x = bw - 150','nm.size.x = bw - 118')
text=text.replace('Vector2(bw - 130, 12), 26','Vector2(bw - 100, 12), 24')
text=text.replace('"싸운다", Color(0.86, 0.36, 0.36)', '"기술 지시", Color(0.22, 0.51, 0.52)')
text=text.replace('"가방", Color(0.86, 0.62, 0.25)', '"현장 장비", Color(0.63, 0.43, 0.26)')
text=text.replace('"몬스터", Color(0.33, 0.62, 0.42)', '"동행 교대", Color(0.39, 0.51, 0.36)')
text=text.replace('"도망친다", Color(0.36, 0.48, 0.72)', '"조사 철수", Color(0.40, 0.43, 0.56)')
text=text.replace('bsay("가랏! %s!" % N(p))','bsay("%s, 함께 현장을 살피자." % N(p))')
text=text.replace('await bsay("%s %s 던졌다!" % [J(Game.g.name, "은"), J(it.n, "을")])','await bsay("%s 공명등으로 %s의 신호를 조율한다." % [Game.g.name, N(e)])')
text=text.replace('if n >= 4:', 'if n >= 3:')
text=text.replace('await bsay("좋았어! %s 붙잡았다!" % J(N(e), "을"), true)', 'await bsay("공명 연결 완료. %s와 원정을 함께할 수 있다." % N(e), true)')
text=text.replace('await bsay("%s의 데이터가 몬스터 생태기록에 새로 등록되었다!" % N(e), true)', 'await bsay("현장 노트에 %s의 동행 신호를 기록했다." % N(e), true)')
text=text.replace('await bsay(["앗! 캡슐에서 빠져나와 버렸다!", "아아앗! 붙잡았다고 생각했는데!", "아깝다! 조금만 더 하면 붙잡을 수 있었는데!", "으앗! 거의 다 붙잡았는데!"][mini(n, 3)])', 'await bsay("공명 연결이 이어지지 않았다. 다음 시도는 생물의 상태를 살펴 조율하자.")')
# Exact original spelling differs from older report excerpts.
text=re.sub(r'await bsay\(\["앗! 캡슐에서 빠져나와 버렸다!"[^\n]+', 'await bsay(["신호가 흩어졌다. 주변의 움직임을 먼저 살펴보자.", "주파수가 어긋났다. 생물의 상태에 맞춰 다시 조율하자.", "연결이 잠시 닿았지만 유지되지 않았다."][mini(n, 2)])', text)
write(battle,text)
function(battle, '_capture_chance', '''func _capture_chance(cur_hp: float, max_hp: float, rate: float, strength: float, bonus: float) -> int:
	var chance := resonance_probability(cur_hp, max_hp, rate, strength, bonus)
	var roll := randf()
	return 3 if roll < chance else mini(2, int((roll - chance) / maxf(0.001, 1.0 - chance) * 3.0))


func resonance_probability(cur_hp: float, max_hp: float, rate: float, strength: float, bonus: float) -> float:
	var calm := 1.0 - clampf(cur_hp / maxf(1.0, max_hp), 0.0, 1.0)
	var affinity := pow(clampf(rate / 255.0, 0.0, 1.0), 0.72)
	return clampf(affinity * (0.28 + 0.55 * calm) * maxf(0.0, strength) * maxf(0.0, bonus), 0.0, 0.97)''')
function(battle, '_capsule_throw', '''func _capsule_throw(target: Puppet, kind: String, result_grade: int) -> Capsule:
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
	return null''')
function(battle, '_capsule_open', '''func _capsule_open(from: Vector2, at: Vector2, p: Puppet) -> void:
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
		await _shiny_fx(p)''')
print('Updated display language, original field briefing, companion assignment, and resonance staging.')
