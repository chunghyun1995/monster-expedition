class_name FX
extends RefCounted
## 파티클·흔들림·숫자 같은 연출 도구

static var _dot: Texture2D

const TYPE_FX := {
	# 색 두 개, 속도, 중력, 수명, 크기, 퍼짐
	"fire": [Color(1.0, 0.85, 0.3), Color(1.0, 0.35, 0.1), 300.0, Vector2(0, -420), 0.7, 1.2, 70.0],
	"water": [Color(0.75, 0.95, 1.0), Color(0.25, 0.55, 1.0), 460.0, Vector2(0, 1100), 0.7, 1.0, 80.0],
	"grass": [Color(0.75, 1.0, 0.5), Color(0.25, 0.65, 0.25), 340.0, Vector2(0, 260), 0.9, 1.1, 180.0],
	"elec": [Color(1.0, 1.0, 0.75), Color(1.0, 0.85, 0.15), 700.0, Vector2.ZERO, 0.28, 0.8, 180.0],
	"rock": [Color(0.75, 0.68, 0.55), Color(0.45, 0.38, 0.3), 520.0, Vector2(0, 1500), 0.8, 1.5, 70.0],
	"ground": [Color(0.9, 0.78, 0.55), Color(0.6, 0.48, 0.3), 220.0, Vector2(0, -60), 1.0, 1.8, 180.0],
	"fly": [Color(1, 1, 1), Color(0.75, 0.88, 1.0), 640.0, Vector2.ZERO, 0.45, 0.8, 30.0],
	"bug": [Color(0.95, 1.0, 0.6), Color(0.6, 0.75, 0.2), 260.0, Vector2(0, 80), 0.9, 0.8, 180.0],
	"poison": [Color(0.9, 0.6, 1.0), Color(0.5, 0.2, 0.65), 180.0, Vector2(0, -260), 1.1, 1.3, 120.0],
	"normal": [Color(1, 1, 0.9), Color(1, 0.9, 0.5), 420.0, Vector2(0, 300), 0.5, 1.0, 180.0],
	"human": [Color(1, 1, 0.9), Color(1, 0.75, 0.55), 420.0, Vector2(0, 300), 0.5, 1.0, 180.0],
}


static func dot() -> Texture2D:
	if _dot == null:
		var gr := Gradient.new()
		gr.set_color(0, Color(1, 1, 1, 1))
		gr.add_point(0.45, Color(1, 1, 1, 0.85))
		gr.set_color(gr.get_point_count() - 1, Color(1, 1, 1, 0))
		var gt := GradientTexture2D.new()
		gt.gradient = gr
		gt.fill = GradientTexture2D.FILL_RADIAL
		gt.fill_from = Vector2(0.5, 0.5)
		gt.fill_to = Vector2(1.0, 0.5)
		gt.width = 64
		gt.height = 64
		_dot = gt
	return _dot


static func burst(parent: Node, pos: Vector2, c1: Color, c2: Color, amount := 24, speed := 300.0, gravity := Vector2(0, 400),
		life := 0.6, size := 1.0, spread := 180.0, dir := Vector2.UP) -> CPUParticles2D:
	var p := CPUParticles2D.new()
	p.texture = dot()
	p.one_shot = true
	p.explosiveness = 0.92
	p.amount = amount
	p.lifetime = life
	p.direction = dir
	p.spread = spread
	p.initial_velocity_min = speed * 0.45
	p.initial_velocity_max = speed
	p.gravity = gravity
	p.damping_min = 40.0
	p.damping_max = 120.0
	p.scale_amount_min = 0.18 * size
	p.scale_amount_max = 0.42 * size
	var sc := Curve.new()
	sc.add_point(Vector2(0, 1))
	sc.add_point(Vector2(1, 0.2))
	p.scale_amount_curve = sc
	var gr := Gradient.new()
	gr.set_color(0, c1)
	gr.set_color(1, Color(c2, 0))
	p.color_ramp = gr
	p.position = pos
	parent.add_child(p)
	p.emitting = true
	parent.get_tree().create_timer(life + 0.4, true, false, true).timeout.connect(p.queue_free)
	return p


## 기술 타입별 맞는 순간의 파티클
static func hit(parent: Node, pos: Vector2, t: String, scale := 1.0) -> void:
	var c: Array = TYPE_FX.get(t, TYPE_FX.normal)
	burst(parent, pos, c[0], c[1], int(26 * scale), c[2] * scale, c[3], c[4], c[5] * scale, c[6])
	burst(parent, pos, Color(1, 1, 1, 0.9), Color(1, 1, 1, 0), 8, 180.0 * scale, Vector2.ZERO, 0.25, 2.2 * scale, 180.0)


## 기를 모으는 파티클 (바깥에서 안으로)
static func charge(parent: Node, pos: Vector2, t: String) -> CPUParticles2D:
	var c: Array = TYPE_FX.get(t, TYPE_FX.normal)
	var p := CPUParticles2D.new()
	p.texture = dot()
	p.amount = 30
	p.lifetime = 0.5
	p.emission_shape = CPUParticles2D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 90.0
	p.radial_accel_min = -500.0
	p.radial_accel_max = -380.0
	p.gravity = Vector2.ZERO
	p.scale_amount_min = 0.15
	p.scale_amount_max = 0.35
	var gr := Gradient.new()
	gr.set_color(0, Color(c[0], 0))
	gr.add_point(0.3, c[0])
	gr.set_color(gr.get_point_count() - 1, Color(c[1], 0))
	p.color_ramp = gr
	p.position = pos
	parent.add_child(p)
	return p


## 날아가는 기술: 꼬리를 끄는 빛 덩어리
static func projectile(parent: Node, from: Vector2, to: Vector2, t: String, dur := 0.32, arc := 0.0) -> void:
	var c: Array = TYPE_FX.get(t, TYPE_FX.normal)
	var head := Node2D.new()
	parent.add_child(head)
	head.position = from
	var core := Sprite2D.new()
	core.texture = dot()
	core.scale = Vector2(0.9, 0.9)
	core.modulate = c[0]
	head.add_child(core)
	var trail := CPUParticles2D.new()
	trail.texture = dot()
	trail.amount = 40
	trail.lifetime = 0.35
	trail.local_coords = false
	trail.gravity = c[3] * 0.3
	trail.initial_velocity_max = 40.0
	trail.spread = 180.0
	trail.scale_amount_min = 0.2
	trail.scale_amount_max = 0.5
	var gr := Gradient.new()
	gr.set_color(0, c[0])
	gr.set_color(1, Color(c[1], 0))
	trail.color_ramp = gr
	head.add_child(trail)
	var tw := parent.create_tween()
	tw.tween_method(func(k: float) -> void:
		head.position = from.lerp(to, k) + Vector2(0, -sin(k * PI) * arc)
		core.rotation += 0.4, 0.0, 1.0, dur).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	await tw.finished
	core.visible = false
	trail.emitting = false
	parent.get_tree().create_timer(0.5, true, false, true).timeout.connect(head.queue_free)


## 흔들기: 화면(또는 노드)을 감쇠하며 흔든다
static func shake(node: Node2D, strength := 14.0, dur := 0.35) -> void:
	var base := Vector2.ZERO
	var tw := node.create_tween()
	var n := int(dur / 0.035)
	for i in n:
		var k := 1.0 - float(i) / n
		tw.tween_property(node, "position", base + Vector2(randf_range(-1, 1), randf_range(-1, 1)) * strength * k, 0.035)
	tw.tween_property(node, "position", base, 0.05)


## 데미지 숫자가 튀어 올랐다가 사라진다
static func number(parent: Node, pos: Vector2, text: String, color := Color.WHITE, size := 46) -> void:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_constant_override("outline_size", 10)
	l.add_theme_color_override("font_outline_color", Color(0.1, 0.08, 0.12))
	l.position = pos - Vector2(40, 30)
	l.pivot_offset = Vector2(40, 30)
	l.scale = Vector2(0.3, 0.3)
	parent.add_child(l)
	var tw := parent.create_tween()
	tw.tween_property(l, "scale", Vector2(1.15, 1.15), 0.16).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(l, "position:y", l.position.y - 60, 0.5).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(l, "scale", Vector2.ONE, 0.1)
	tw.tween_property(l, "modulate:a", 0.0, 0.35).set_delay(0.25)
	tw.tween_callback(l.queue_free)
