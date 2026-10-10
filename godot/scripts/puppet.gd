class_name Puppet
extends Node2D
## 2.5D 그림 한 장을 격자 메시로 만들어, 셰이더로 숨쉬기·휨·걷기·출렁임 같은 동작을 준다.
## 원점 = 발 중앙. body는 공중에 뜨거나 점프할 때 움직이고, 그림자는 바닥에 남는다.

const SHADER := preload("res://shaders/deform.gdshader")
const DEFAULTS := {"breath": 1.0, "speed": 1.0, "squash": 0.0, "lean": 0.0, "bend": 0.0, "sway": 0.0, "wobble": 0.0,
	"walk": 0.0, "walk_phase": 0.0, "flap": 0.0, "flutter": 0.0, "flutter_low": 0.0, "flash": 0.0, "dark": 0.0,
	"glow": 0.0, "dissolve": 0.0}

var body: Node2D
var mesh: MeshInstance2D
var shadow: Sprite2D
var mat: ShaderMaterial
var size := Vector2.ONE
var hover := 0.0        # 둥실 뜨는 높이(px)
var lift := 0.0         # 점프 등으로 뜬 높이(px)
var _t := randf() * 10.0
static var _shadow_tex: Texture2D


## 몬스터(sid) 또는 사람(외형) 그림으로 만든다
func setup_mon(sid: int, back: bool, height: float) -> Puppet:
	var sp: Dictionary = Data.species(sid)
	if sp.has("human"):
		return setup_atlas("peopleBack" if back else "people", Data.look_index(sp.human), height * 1.15, motion_profile(sid))
	return setup_atlas("backs" if back else "monsters", sid - 1, height, motion_profile(sid))


func setup_person(look: String, back: bool, height: float) -> Puppet:
	return setup_atlas("peopleBack" if back else "people", Data.look_index(look), height, {"breath": 0.7})


func setup_atlas(atlas: String, index: int, height: float, prof := {}, with_shadow := true, grid := Vector2i(10, 14)) -> Puppet:
	for c in get_children():
		c.queue_free()
	var r: Rect2 = Data.tight(atlas, index)
	var t: Texture2D = Data.tex[atlas]
	var s := height / r.size.y
	size = r.size * s
	shadow = Sprite2D.new()
	shadow.texture = _shadow()
	shadow.scale = Vector2(size.x / 128.0 * 1.1, size.x / 128.0 * 0.32)
	shadow.modulate = Color(0.05, 0.1, 0.08, 0.38)
	shadow.visible = with_shadow
	add_child(shadow)
	body = Node2D.new()
	add_child(body)
	mesh = MeshInstance2D.new()
	mesh.texture = t
	mesh.mesh = _grid(r, t.get_size(), size, grid.x, grid.y)
	mat = ShaderMaterial.new()
	mat.shader = SHADER
	for k in DEFAULTS:
		mat.set_shader_parameter(k, DEFAULTS[k])
	mat.set_shader_parameter("size", size)
	mat.set_shader_parameter("time_offset", randf() * 20.0)
	mesh.material = mat
	body.add_child(mesh)
	hover = float(prof.get("hover", 0.0))
	for k in prof:
		if DEFAULTS.has(k):
			mat.set_shader_parameter(k, prof[k])
	return self


## 종류마다 다른 기본 움직임 (불꽃은 일렁이고, 새는 날개짓, 해파리는 촉수가 흔들림)
static func motion_profile(sid: int) -> Dictionary:
	var sp: Dictionary = Data.species(sid)
	var t: Array = sp.t
	var p := {"breath": 1.0, "speed": 1.0}
	if sp.has("human"):
		p.breath = 0.75
		return p
	if t.has("fire"):
		p.flutter = 1.0
	if t.has("grass"):
		p.sway = 1.0
	if t.has("water"):
		p.breath = 1.4
		p.speed = 0.85
	if t.has("rock") or t.has("ground"):
		p.breath = 0.6
		p.speed = 0.7
	if t.has("elec"):
		p.speed = 1.5
	match sid:
		10, 11:
			p.hover = 3.0
			p.flap = 0.5
		14:
			p.hover = 14.0
			p.flap = 1.3
		29, 30:
			p.hover = 12.0
			p.flutter_low = 1.0
		33:
			p.hover = 12.0
			p.flap = 0.9
		34:
			p.hover = 16.0
			p.flap = 0.6
	return p


func _process(delta: float) -> void:
	_t += delta
	if body == null:
		return
	var h := hover * (0.5 + 0.5 * sin(_t * 2.4)) + lift
	body.position.y = -h
	if shadow and shadow.visible:
		var k := clampf(1.0 - h / 160.0, 0.45, 1.0)
		shadow.scale = Vector2(size.x / 128.0 * 1.1 * k, size.x / 128.0 * 0.32 * k)
		shadow.modulate.a = 0.38 * k


func p(name: String, v) -> void:
	mat.set_shader_parameter(name, v)


func g(name: String):
	return mat.get_shader_parameter(name)


## 셰이더 값 하나를 트윈으로 바꾼다
func tp(tw: Tween, name: String, to: float, dur: float) -> MethodTweener:
	return tw.tween_method(func(x: float) -> void: p(name, x), float(g(name)), to, dur)


## 몸 중심(가슴 높이)의 전역 좌표
func center() -> Vector2:
	return global_position + Vector2(0, -size.y * 0.5 - hover * 0.5)


func _grid(r: Rect2, tsize: Vector2, sz: Vector2, cols: int, rows: int) -> ArrayMesh:
	var verts := PackedVector2Array()
	var uvs := PackedVector2Array()
	var idx := PackedInt32Array()
	for j in rows + 1:
		for i in cols + 1:
			var fx := float(i) / cols
			var fy := float(j) / rows
			verts.append(Vector2((fx - 0.5) * sz.x, (fy - 1.0) * sz.y))
			uvs.append((r.position + Vector2(fx * r.size.x, fy * r.size.y)) / tsize)
	for j in rows:
		for i in cols:
			var a := j * (cols + 1) + i
			var c := a + cols + 1
			idx.append_array([a, a + 1, c, a + 1, c + 1, c])
	var arr := []
	arr.resize(Mesh.ARRAY_MAX)
	arr[Mesh.ARRAY_VERTEX] = verts
	arr[Mesh.ARRAY_TEX_UV] = uvs
	arr[Mesh.ARRAY_INDEX] = idx
	var m := ArrayMesh.new()
	m.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	return m


static func _shadow() -> Texture2D:
	if _shadow_tex == null:
		var gr := Gradient.new()
		gr.set_color(0, Color(1, 1, 1, 1))
		gr.set_color(1, Color(1, 1, 1, 0))
		var gt := GradientTexture2D.new()
		gt.gradient = gr
		gt.fill = GradientTexture2D.FILL_RADIAL
		gt.fill_from = Vector2(0.5, 0.5)
		gt.fill_to = Vector2(1.0, 0.5)
		gt.width = 128
		gt.height = 128
		_shadow_tex = gt
	return _shadow_tex
