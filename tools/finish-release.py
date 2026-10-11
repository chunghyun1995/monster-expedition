"""One-time editorial migration for the audited Android release."""
import re, shutil
from pathlib import Path
R=Path(__file__).resolve().parent.parent
def edit(name, replacements):
    p=R/name;s=p.read_text(encoding='utf-8')
    for a,b in replacements.items():s=s.replace(a,b)
    p.write_text(s,encoding='utf-8')
def function(name, key, body):
    p=R/name;s=p.read_text(encoding='utf-8')
    s,n=re.subn(r'^func '+re.escape(key)+r'\([^\n]*\)[^\n]*:\n.*?(?=^func |\Z)',lambda m:body.strip()+'\n\n\n',s,flags=re.M|re.S)
    assert n==1,(key,n);p.write_text(s,encoding='utf-8')
gen=Path('C:/Users/kssks/.codex/generated_images/01a11367-21ba-7400-b5ad-dc27e4b0a0d1')
shutil.copyfile(gen/'exec-2d16c3c5-51c0-42f1-8740-dbb89661c08e.png',R/'assets/generated/characters-original.png')
shutil.copyfile(gen/'exec-53f925d9-1485-4a0c-849f-d832e5fa8460.png',R/'assets/generated/characters-back.png')
edit('src/data.js',{
"cat:'고치',h:.6,w:7.4,d:'나뭇가지에 매달려 꿈을 꾸는 중이다. 껍질을 톡톡 두드리면 안에서 콩콩 대답한다.'":"cat:'씨앗주머니',h:.6,w:7.4,d:'향기로운 씨앗을 엮어 잠자리를 만든다. 자주색 실로 입구를 묶고 꽃가루를 저장한다.'",
"cat:'여우',h:1.3,w:24,d:'옛이야기 속 구미호에서 이름을 땄다. 꼬리를 흔들 때마다 도깨비불이 춤춘다.'":"cat:'담비',h:1.3,w:24,d:'한 가닥 꼬리를 둥글게 말아 몸의 열을 모은다. 등 위의 유리질 돌기는 잔불처럼 빛난다.'",
"cat:'뇌운',h:2.2,w:58,d:'폭풍 봉우리의 먹구름 속을 나는 번개의 수호신. 날갯짓마다 천둥이 친다.'":"cat:'자계곤충',h:2.2,w:58,d:'여섯 구리색 다리로 광물을 모으는 희귀 곤충. 코일 더듬이가 기압 변화를 읽고 고리 날개가 자장을 만든다.'",
"몬스터에게 던져서 붙잡는 캡슐. 상대 원정가의 몬스터도 빼앗을 수 있다.":"빛 신호를 조율해 야생 생물과 동행 계약을 맺는 현장 장비. 사람에게는 사용할 수 없다.",
"전설의 몬스터도 노려볼 수 있는 최고급 캡슐.":"희귀 생물의 미약한 신호도 읽는 심층 조사용 공명등.",
"공명등보다 몬스터를 더 잘 붙잡을 수 있는 캡슐.":"여러 파장을 함께 조율해 공명 성공률을 높이는 현장 장비.",
"['ball','캡슐']":"['ball','공명장비']",
"['prof','박사'":"['prof','조사관'",
"실험 가운 주머니에 시약병이 가득하다. 실수로 엎지르는 일이 잦다.":"앞치마에 작은 표본병을 챙긴다. 채집 지점의 온도와 흙빛을 꼼꼼히 기록한다.",
"언제나 한발 앞서려는 경쟁심 덩어리. 지는 건 싫어하지만 동료는 끝까지 챙긴다.":"서로의 관측값을 비교하는 원정 동료. 위험한 구간에서는 먼저 연락하고 지원을 보낸다.",
"검은안개단을 이끄는 두목. 몬스터를 조종하는 기계를 꿈꾼다.":"검은안개단을 이끄는 책임자. 기상 관측 기록을 독점해 통행료를 받으려 한다.",
"사람: 화난 원정가나 NPC를 캡슐로 붙잡으면 동료가 된다.":"사람: 직접 대결한 뒤 자발적으로 합류하는 동료. 공명등 포획 대상이 아니다.",
"사람: 캡슐로 붙잡은 원정가·NPC":"사람: 자발적으로 합류한 원정가·NPC"})
E='godot/scripts/events.gd'
edit(E,{
"바위처럼 단단한 의지가 없으면 몬스터도 강해지지 않는다. 그 의지, 승부로 보여 다오!":"무너진 지반 센서에 새 기준값이 필요하다. 내 동료와 현장 대응 훈련을 하고 진동 기록을 맞추자.",
"잘 왔다, 도전자여. 나는 바위시티 관측소 현장 책임자 단단.":"바위시티의 지반 관측소다. 나는 센서를 관리하는 단단. 복구 지원을 기다리고 있었다.",
"좋다. 바위시티 관측소을 이긴 증표로 이 관측 인증를 주마.":"기준값이 안정됐다. 지반 관측소를 다시 연결하고 네 현장 기록을 인증하마.",
"물은 부드럽지만 바위도 깎아 내는 힘이 있지. 너와 몬스터의 유대, 내 물결로 시험해 볼게!":"호수 수위 기록이 폭풍 뒤로 끊겼어. 우리 동료들의 움직임을 비교해서 수변 센서를 보정하자.",
"정말 훌륭한 승부였어. 이 관측 인증를 받아 줘.":"수변 센서가 다시 신호를 보내고 있어. 이번 관측 기록을 인증할게.",
"왔구나, 도전자! 나는 붉은재마을 관측소 현장 책임자 화련!":"화산 열원 관측소에 잘 왔어. 여기 온도계를 관리하는 화련이야.",
"화산처럼 끓어오르는 열정이 없으면 이길 수 없어. 네 열정, 불꽃으로 시험해 주지!":"열원 센서를 안전하게 보정하려면 동료와 신호가 맞아야 해. 먼저 대응 훈련을 해 보자.",
"좋아, 이 관측 인증를 받아라!":"과열 구간의 값이 보정됐어. 열원 관측소 복구 기록을 전송할게.",
"그렇다고 봐주진 않아! 번개처럼 빠른 내 몬스터들을 따라올 수 있을까?":"전기는 돌아왔지만 통신 장치의 잡음이 남았어. 우리 동료들과 신호를 맞추면 센서를 보정할 수 있어.",
"대단해! 이 관측 인증를 받아!":"통신 신호가 선명해졌어. 번개도시 관측소 복구 완료!",
"네 개의 관측 인증를 모은 원정가라면 하늘을 날 자격이 있지. 마지막 시험을 시작할게!":"네 관측소의 데이터가 도착했어. 마지막으로 고도 센서를 보정하고 전체 관측망을 연결하자.",
"축하해. 마지막 관측 인증야.":"고도 기록도 정상으로 돌아왔어. 다섯 관측소가 다시 연결됐구나!",
"%s! 너도 관측 인증를 땄구나! 나도 방금 따고 왔지!":"%s! 지반 기록을 받았어. 나는 동쪽 길의 표본을 정리하고 있었지!",
"그럼 누가 더 강해졌는지 확인해 볼까? 간다!":"우리 동료들의 대응을 비교하고 기록을 서로 보내자. 준비됐어?",
"좋아, 물결마을 관측소에서는 내가 먼저 관측 인증를 따 주겠어! 그럼 간다!":"내가 먼저 물결마을에 가서 통신선을 확인할게. 그곳에서 만나자!",
"%s! 관측소에 도전하러 왔구나. 하지만 그 전에 나랑 마지막으로 한 판 하자!":"%s! 수변 관측소로 가는 길이지? 내 동료들도 새로운 신호를 익혔어. 비교 훈련을 부탁해!",
"이번엔 진심으로 간다! 내 파트너도 진화했다고!":"서로 다른 동료들이 같은 현장에서 어떻게 움직이는지 기록해 보자.",
"하라 씨는 강하지만 너라면 이길 수 있을 거야. 나는 좀 더 수행하고 올게!":"하라 씨에게 수위 자료를 맡겼어. 나는 다음 구간의 표본을 모으고 올게!",
"%s! 불꽃 관측 인증도 땄다며? 나도 방금 땄다고!":"%s! 열원 관측소가 연결됐다는 연락을 받았어!",
"좋아, 같이 가자고 하고 싶지만... 나는 나만의 방식으로 검은안개단을 막아 보겠어. 번개도시에서 보자!":"나는 주민들에게 우회로를 알려 줄게. 통신 복구는 너에게 부탁해. 번개도시에서 만나자!",
"이 발전소의 전기로 몬스터 조종 장치를 완성하면, 이 지방의 모든 몬스터는 우리 검은안개단의 것이 된다!":"통신망을 잠그면 기상 기록은 우리만 볼 수 있지. 안전한 길을 알고 싶다면 우리에게 통행료를 내야 한다!",
"크윽... 조종 장치는 포기하지. 하지만 검은안개단은 사라지지 않는다!":"암호화 장치가 멈췄군. 관측값을 공개하는 게 정말 옳은지 두고 보자!",
"그런데... 요즘 남쪽에서 검은 옷을 입은 무리가 몬스터를 빼앗는다는 소문이 돌고 있어. 스스로를 검은안개단이라고 부른대.":"남쪽에서 검은안개단이 관측 장비를 가져가고 있대. 기상 자료를 독점하려는 것 같아.",
"새싹마을에서 처음 몬스터를 받은 날부터 지금까지... 넌 늘 나보다 한 발 앞서 있었지.":"폭풍 이후 흩어진 기록을 우리가 함께 모았네. 마지막으로 동료들의 대응 기록을 맞춰 보자.",
"하지만 오늘은 다를 거야. 이 정상에서, 누가 진짜 최고의 원정대원인지 가리자!":"이곳의 고도 자료와 각 지역의 신호를 함께 전송하면 관측망 복구가 끝나!",
"역시 넌 대단해. 인정할게... 네가 최고의 원정대원이야!":"훌륭한 대응 기록이야. 네 자료와 내 자료가 잘 맞았어!",
"후우... 이번엔 내가 이겼지만, 넌 정말 강했어.":"내 동료들이 먼저 대응했네. 서로 다른 결과까지 기록하니 더 믿을 만해.",
"봐, 해가 뜬다. 우리 원정은 여기서 끝이 아니야. 언젠가 또 승부하자!":"관측망에 불이 켜졌어! 주민들에게 이 자료를 공개하자. 다음 조사도 함께하자!",
"Game.set_flag(\"badge%d\" % i)":"Game.set_flag(\"badge%d\" % i)\n\tGame.set_flag(\"station_online%d\" % i)"})
function('godot/scripts/battle.gd','recall', '''func recall(side: String) -> void:
\tvar p := pup(side)
\tif p == null:
\t\treturn
\tSound.sfx("exit")
\tvar tw := create_tween()
\ttw.tween_property(p, "modulate:a", 0.0, 0.3)
\ttw.parallel().tween_property(p, "position:x", p.position.x + (-80.0 if side == "p" else 80.0), 0.3)
\tawait tw.finished
\tp.visible = false
\thide_hud(side)''')
for p in (R/'godot/scripts').glob('*.gd'):
    s=p.read_text(encoding='utf-8')
    for a,b in {'관측 인증를':'관측 인증을','관측 인증는':'관측 인증은','관측 인증야':'관측 인증이야','관측소을':'관측소를','관측소이':'관측소가','원정 동료과':'원정 동료와','생태기록를':'생태기록을','캡슐을 던지세요':'공명등으로 신호를 조율하세요','물건·캡슐·':'물건·공명장비·','가방의 캡슐':'가방의 공명등','사람에게는 캡슐':'사람에게는 공명등','TRAINER CARD':'FIELD RECORD'}.items():s=s.replace(a,b)
    p.write_text(s,encoding='utf-8')
function('godot/scripts/menus.gd','badge_node', '''func badge_node(i: int, size := 40.0) -> Node2D:
\tvar n := Node2D.new()
\tn.draw.connect(func() -> void:
\t\tvar c: Color = BADGES[i][2]
\t\tn.draw_rect(Rect2(-size, -size * 0.65, size * 2, size * 1.3), Color(0.08, 0.18, 0.22))
\t\tn.draw_rect(Rect2(-size, -size * 0.65, size * 2, size * 1.3), c, false, 3.0)
\t\tn.draw_line(Vector2(-size * 0.65, 0), Vector2(size * 0.65, 0), c, 3.0)
\t\tn.draw_circle(Vector2.ZERO, size * 0.18, c)
\t\tn.draw_line(Vector2(0, -size * 0.4), Vector2(0, size * 0.4), c, 3.0))
\treturn n''')
edit('godot/scripts/menus.gd', {'관측 인증 케이스':'관측망 복구 기록','["프로그래밍 · 그림 · 모션", "Claude"]':'["원본 제작", "Claude"], ["표현 개정 · 신규 에셋", "Codex · OpenAI 이미지 생성"]','축하합니다! 다섯 개의 관측 인증을 모으고 원정 동료와의 마지막 승부까지 마쳐 벨로리아 생태기록을 클리어했습니다!':'다섯 관측소의 데이터가 연결되었습니다. 벨로리아의 기상 기록이 모두에게 공개됩니다!'})
edit('godot/tests/regression.gd', {'Game.g.starter = 1':'Game.g.starter = 10','Game.g.rival_starter = 4':'Game.g.rival_starter = 15','size() == 1, "Selected and rival starters should disappear on re-entry"':'size() == 2, "Only selected survey partner should disappear on re-entry"','일어났구나, 별아! 한결 박사님이 연구소로 와 달라고 하셨단다.':'별아! 한결 조사관이 다음 현장 기록을 기다리고 있단다.'})
edit('godot/export_presets.cfg', {'include_filter="data/*.json,fonts/*.txt"':'include_filter="data/*.json,fonts/*.txt,licenses/*.txt,licenses/*.json"'})
# Keep existing desktop save directory, while retaining the Android package ID.
edit('godot/project.godot', {'config/name="벨로리아 생태기록"':'config/name="벨로리아 생태기록"\nconfig/use_custom_user_dir=true\nconfig/custom_user_dir_name="Godot/app_userdata/몬스터 원정대"'})
print('Applied editorial/data/license export updates; copied 27 new front/back figures.')
