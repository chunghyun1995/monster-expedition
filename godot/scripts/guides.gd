extends Node
## First-use guidance is separate from reports, matching the web version.
const PATH := "user://guides.cfg"
const TEXT := {
"move":["이동과 조사","원형 패드 또는 방향키로 이동해요. 사람이나 물건 앞에서 A(Z)를 누르면 말을 걸거나 조사해요."],
"menu":["메뉴와 저장","메뉴에서 도감·몬스터·가방·지도·설정을 열어요. 리포트로 저장한 뒤 게임을 종료하세요."],
"run":["달리기","질주신발을 받으면 B(X 또는 Shift)를 누른 채 이동해 빠르게 달릴 수 있어요."],
"party":["몬스터 관리","동료를 고르면 정보·능력치·기술을 확인하고 순서를 바꾸거나 합성할 수 있어요."],
"summary":["몬스터 정보","위쪽 탭으로 정보·능력치·기술을 바꿔요. 긴 설명은 위아래로 스크롤해 끝까지 읽을 수 있어요."],
"bag":["가방","아래 ◀ ▶로 물건·캡슐·중요한 물건을 바꿔요. 회복약은 동료에게, 포획캡슐은 전투 중 상대에게 사용해요."],
"pad":["원정패드와 지도","지도에서 현재 위치와 방문할 마을을 확인할 수 있어요."],
"dex":["몬스터 도감","만난 몬스터와 붙잡은 몬스터를 기록해요. 목록을 고르면 자세한 정보를 볼 수 있어요."],
"shop":["상점","물건을 고른 뒤 수량을 정해요. 배지를 모으면 판매하는 물건이 늘어나요."],
"pc":["PC 보관함","파티는 6마리까지예요. 보관함에 맡긴 몬스터는 10분마다 레벨이 1씩 올라요. 파티 최고 레벨까지만 자라요."],
"fusion":["몬스터 합성","몬스터 두 마리를 재료로 한 단계 높은 등급의 새 몬스터를 만들어요. 재료가 사라지므로 확인 화면을 잘 읽어 주세요."],
"battle":["전투와 자동전투","싸운다로 기술, 가방으로 물건, 몬스터로 교체를 선택해요. 위쪽 자동전투 버튼을 켜면 기술과 전투 대화가 자동 진행돼요."],
"capture":["포획","상대 체력을 낮춘 뒤 가방의 캡슐을 던지세요. 잠듦·마비 등 상태 이상이면 붙잡기 쉬워져요."],
"steal":["상대 몬스터 포획","상대 트레이너의 몬스터를 붙잡으면 트레이너가 직접 덤벼들어요. 이 승부에서 지면 되찾아 가요."],
"catchHuman":["사람 동료","사람도 캡슐로 붙잡아 동료로 데리고 다닐 수 있어요. 먼저 체력을 낮추면 유리해요."],
"moves":["기술 고르기","기술의 타입과 남은 PP를 확인하세요. PP가 없는 기술은 쓸 수 없고, 상성에 따라 효과가 달라져요."],
"hero":["최후의 수단","모든 몬스터가 쓰러지면 트레이너가 직접 맞설 수 있어요. 트레이너도 쓰러지면 패배해요."],
"evolve":["진화","진화 연출 중 B를 누르면 진화를 멈출 수 있어요."],
"auto":["자동 진행","자동 사냥은 풀숲을 찾아 이동·전투하고, 자동 등반은 탑 수호자를 돌파해 다음 층으로 이동해요. 자동 중지 또는 직접 이동으로 멈출 수 있어요."],
"tower":["무한의 탑","탑 버튼으로 어디서든 로비에 입장해요. 100층까지 도전하며 10층마다 회복·보상을 받아요. 로비 출구로 나가면 입장한 자리로 돌아와요."]
}
var seen: Dictionary = {}
var overlay: CanvasLayer
var closing := false

func _ready() -> void:
	var config := ConfigFile.new()
	if config.load(PATH) == OK:
		seen = config.get_value("guides", "seen", {})

func should_show(id: String) -> bool:
	return int(Game.settings.get("tips", 1)) != 0 and not Game.auto_text and not Auto.talk_enabled() and not bool(seen.get(id, false)) and overlay == null

func reset_all() -> void:
	seen.clear()
	_store()

func _store() -> void:
	var config := ConfigFile.new()
	config.set_value("guides", "seen", seen)
	config.save(PATH)

func show_once(id: String, target := Rect2()) -> void:
	if not should_show(id) or not TEXT.has(id):
		return
	overlay = CanvasLayer.new()
	overlay.layer = 90
	add_child(overlay)
	var screen := get_viewport().get_visible_rect().size
	var shield := ColorRect.new()
	shield.color = Color(0.02,0.04,0.09,0.7)
	shield.size = screen
	overlay.add_child(shield)
	if target.has_area():
		var spot := UI.panel(overlay, target.grow(5), Color(0,0,0,0), Color("#f3c75b"))
		spot.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var height := minf(360, screen.y - 80)
	var y := clampf(target.end.y + 24 if target.has_area() else screen.y * 0.35, 40, screen.y - height - 40)
	if target.has_area() and y < target.end.y:
		y = maxf(40, target.position.y - height - 24)
	var bubble := UI.panel(overlay, Rect2(24,y,screen.x-48,height))
	UI.label(bubble, "처음 쓰는 기능 · " + TEXT[id][0], Vector2(22,20), 24)
	UI.scroll_text(bubble, TEXT[id][1], Rect2(22,72,bubble.size.x-44,height-168), 28)
	var button := UI.button(bubble, "확인 · A / B", Rect2(22,height-78,bubble.size.x-44,56), Color(0.27,0.48,0.56), 26)
	closing = false
	button.pressed.connect(func() -> void: closing = true)
	await get_tree().process_frame
	while not closing:
		await get_tree().process_frame
	seen[id] = true
	_store()
	overlay.queue_free()
	overlay = null
	await get_tree().process_frame

func _input(event: InputEvent) -> void:
	if overlay == null:
		return
	if event.is_action_pressed("a_btn") or event.is_action_pressed("b_btn") or event.is_action_pressed("menu_btn"):
		closing = true
		get_viewport().set_input_as_handled()
