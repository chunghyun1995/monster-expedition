extends Node2D
## 모션 보기: 몬스터 34종과 사람 26명의 기본 움직임을 한 화면씩 넘겨 본다

var page := 0
var _items: Array = []
var _label: Label


func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.86, 0.9, 0.84)
	bg.size = Vector2(720, 1600)
	bg.position = Vector2(0, -160)
	add_child(bg)
	_label = Label.new()
	_label.position = Vector2(24, 24)
	_label.add_theme_font_size_override("font_size", 30)
	_label.add_theme_color_override("font_color", Color(0.15, 0.2, 0.2))
	add_child(_label)
	_show()


func _show() -> void:
	for it in _items:
		it.queue_free()
	_items.clear()
	var ids: Array = []
	if page < 4:
		for i in range(page * 9 + 1, mini(page * 9 + 10, 35)):
			ids.append(i)
	else:
		for i in range(101 + (page - 4) * 9, mini(101 + (page - 4) * 9 + 9, 127)):
			ids.append(i)
	_label.text = "모션 보기 %d/7  (화면을 누르면 다음)" % (page + 1)
	for k in ids.size():
		var pp := Puppet.new()
		add_child(pp)
		pp.setup_mon(ids[k], false, 170.0)
		pp.position = Vector2(130 + (k % 3) * 230, 330 + (k / 3) * 330)
		_items.append(pp)
		var l := Label.new()
		l.text = Data.species(ids[k]).n
		l.add_theme_font_size_override("font_size", 22)
		l.add_theme_color_override("font_color", Color(0.15, 0.2, 0.2))
		l.position = pp.position + Vector2(-60, 16)
		add_child(l)
		_items.append(l)


func _unhandled_input(e: InputEvent) -> void:
	if (e is InputEventMouseButton and e.pressed) or e.is_action_pressed("a_btn"):
		page = (page + 1) % 7
		_show()
	elif e.is_action_pressed("b_btn"):
		Game.change_scene("res://scenes/main.tscn")
