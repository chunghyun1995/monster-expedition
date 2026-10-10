extends Node
## 게임 데이터(기존 웹 게임에서 내보낸 JSON)와 2.5D 그림 아틀라스

const ATLAS := {
	"monsters": [6, 160, 160], "backs": [6, 160, 160], "people": [7, 128, 192], "peopleBack": [7, 128, 192],
	"walk": [4, 128, 192], "props": [6, 192, 192], "terrain": [4, 128, 128], "scenes": [3, 512, 384],
}
var D: Dictionary = {}
var bounds: Dictionary = {}
var tex: Dictionary = {}


func _ready() -> void:
	D = _json("res://data/game.json")
	bounds = _json("res://data/bounds.json")
	for k in ATLAS:
		tex[k] = load("res://assets/%s.webp" % k)


func _json(path: String) -> Dictionary:
	var f := FileAccess.open(path, FileAccess.READ)
	return JSON.parse_string(f.get_as_text())


## 아틀라스 칸 전체 영역
func cell(atlas: String, i: int) -> Rect2:
	var a: Array = ATLAS[atlas]
	var cols: int = a[0]
	return Rect2((i % cols) * a[1], (i / cols) * a[2], a[1], a[2])


## 칸 안에서 실제로 그림이 있는 영역
func tight(atlas: String, i: int) -> Rect2:
	if bounds.has(atlas):
		var b: Array = bounds[atlas][i]
		return Rect2(b[0], b[1], b[2] - b[0], b[3] - b[1])
	return cell(atlas, i)


func species(sid: int) -> Dictionary:
	return D.species[str(sid)]


func move(id: String) -> Dictionary:
	return D.moves[id]


func type_name(t: String) -> String:
	return D.types[t].n


func type_color(t: String) -> Color:
	return Color(D.types[t].c)


## 공격 타입 하나가 방어 타입들에 주는 배율
func eff(atk: String, defs: Array) -> float:
	var m := 1.0
	var row: Dictionary = D.chart.get(atk, {})
	for t in defs:
		if row.has(t):
			m *= float(row[t])
	return m


func look_index(look: String) -> int:
	return maxi(0, D.looks.find(look))


func map(id: String) -> Dictionary:
	return D.maps[id]
