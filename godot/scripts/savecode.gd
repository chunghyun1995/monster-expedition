class_name SaveCode
## 웹 게임의 저장 코드(ME3·ME2, 무압축 ME3U·ME2U, 또는 "…#c=코드" 링크)를 읽어 Godot 리포트로 바꾼다.
## 형식(src/menus.js): <태그>-<체크섬4>-<base64url(deflate-raw(JSON))>
##   ME3 = 짧게 압축한 배열 표현(packSave), ME2 = 게임 상태 JSON 그대로
## 사용: var r := SaveCode.read(text) → {"ok": true, "g": 리포트} 또는 {"ok": false, "err": 이유}

const B32 := "0123456789abcdefghijklmnopqrstuv"
const B36 := "0123456789abcdefghijklmnopqrstuvwxyz"


static func read(text: String) -> Dictionary:
	var t := text.strip_edges()
	var hi := t.find("#c=")
	if hi >= 0:
		t = t.substr(hi + 3).uri_decode()
	t = t.replace(" ", "").replace("\n", "").replace("\r", "").replace("\t", "")
	var re := RegEx.create_from_string("^(ME[23]U?)-([0-9A-Z]{4})-([A-Za-z0-9_-]+)$")
	var m := re.search(t)
	if m == null:
		return _err("코드 형식이 올바르지 않아요.")
	var tag := m.get_string(1)
	var body := m.get_string(3)
	if ck4(body) != m.get_string(2):
		return _err("코드 일부가 빠졌거나 잘못 입력됐어요.")
	var bytes := b64u_dec(body)
	if bytes.is_empty():
		return _err("코드를 읽을 수 없어요.")
	if not tag.ends_with("U"):
		bytes = inflate(bytes)
		if bytes.is_empty():
			return _err("코드의 압축을 풀 수 없어요.")
	var j = JSON.parse_string(bytes.get_string_from_utf8())
	if j == null:
		return _err("저장 데이터를 읽을 수 없어요.")
	var web = unpack_save(j) if tag.begins_with("ME3") else j
	if not web is Dictionary:
		return _err("저장 데이터를 읽을 수 없어요.")
	var g := to_godot(web)
	if g.is_empty():
		return _err("저장 데이터를 읽을 수 없어요.")
	return {"ok": true, "g": g}


static func _err(s: String) -> Dictionary:
	return {"ok": false, "err": s}


## 웹 게임 ck4: FNV-1a 32비트 → 36진수 끝 4자리(대문자)
static func ck4(t: String) -> String:
	var h := 2166136261
	for i in t.length():
		h ^= t.unicode_at(i)
		h = (h * 16777619) & 0xFFFFFFFF
	var s := ""
	while h > 0:
		s = B36[h % 36] + s
		h /= 36
	if s.is_empty():
		s = "0"
	s = s.right(4)
	while s.length() < 4:
		s = "0" + s
	return s.to_upper()


static func b64u_dec(t: String) -> PackedByteArray:
	var s := t.replace("-", "+").replace("_", "/")
	while s.length() % 4:
		s += "="
	return Marshalls.base64_to_raw(s)


# ---------------- deflate-raw 풀기 (RFC 1951) ----------------
## 압축 해제. 실패하면 빈 배열.
static func inflate(src: PackedByteArray) -> PackedByteArray:
	var st := {"src": src, "pos": 0, "bit": 0, "bitcnt": 0, "out": [], "bad": false}
	var last := 0
	while last == 0:
		last = _bits(st, 1)
		var type := _bits(st, 2)
		if st.bad:
			return PackedByteArray()
		if type == 0:
			st.bit = 0
			st.bitcnt = 0
			if st.pos + 4 > src.size():
				return PackedByteArray()
			var n: int = src[st.pos] | (src[st.pos + 1] << 8)
			st.pos += 4
			if st.pos + n > src.size():
				return PackedByteArray()
			for k in n:
				st.out.append(src[st.pos + k])
			st.pos += n
		elif type == 1:
			if not _codes(st, _fixed_len(), _fixed_dist()):
				return PackedByteArray()
		elif type == 2:
			var tables := _dynamic(st)
			if tables.is_empty() or not _codes(st, tables[0], tables[1]):
				return PackedByteArray()
		else:
			return PackedByteArray()
	return PackedByteArray(st.out)


static func _bits(st: Dictionary, need: int) -> int:
	var val: int = st.bit
	while st.bitcnt < need:
		if st.pos >= st.src.size():
			st.bad = true
			return 0
		val |= int(st.src[st.pos]) << st.bitcnt
		st.pos += 1
		st.bitcnt += 8
	st.bit = val >> need
	st.bitcnt -= need
	return val & ((1 << need) - 1)


static func _huff(lengths: Array) -> Dictionary:
	var count := []
	count.resize(16)
	count.fill(0)
	for l in lengths:
		count[l] += 1
	count[0] = 0
	var offs := [0, 0]
	for i in range(1, 15):
		offs.append(offs[i] + count[i])
	var sym := []
	sym.resize(lengths.size())
	for s in lengths.size():
		if lengths[s] != 0:
			sym[offs[lengths[s]]] = s
			offs[lengths[s]] += 1
	return {"count": count, "sym": sym}


static func _decode(st: Dictionary, h: Dictionary) -> int:
	var code := 0
	var first := 0
	var index := 0
	for l in range(1, 16):
		code |= _bits(st, 1)
		if st.bad:
			return -1
		var c: int = h.count[l]
		if code - c < first:
			return h.sym[index + (code - first)]
		index += c
		first += c
		first <<= 1
		code <<= 1
	return -1


const LBASE := [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258]
const LEXT := [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
const DBASE := [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577]
const DEXT := [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]


static func _codes(st: Dictionary, lh: Dictionary, dh: Dictionary) -> bool:
	while true:
		var s := _decode(st, lh)
		if s < 0:
			return false
		if s < 256:
			st.out.append(s)
		elif s == 256:
			return true
		else:
			s -= 257
			if s >= 29:
				return false
			var length: int = LBASE[s] + _bits(st, LEXT[s])
			var d := _decode(st, dh)
			if d < 0 or d >= 30:
				return false
			var dist: int = DBASE[d] + _bits(st, DEXT[d])
			var out: Array = st.out
			if dist > out.size() or st.bad:
				return false
			var from := out.size() - dist
			for k in length:
				out.append(out[from + k])
	return false


static func _fixed_len() -> Dictionary:
	var l := []
	for i in 288:
		l.append(8 if i < 144 else 9 if i < 256 else 7 if i < 280 else 8)
	return _huff(l)


static func _fixed_dist() -> Dictionary:
	var l := []
	for i in 30:
		l.append(5)
	return _huff(l)


static func _dynamic(st: Dictionary) -> Array:
	var nlen := _bits(st, 5) + 257
	var ndist := _bits(st, 5) + 1
	var ncode := _bits(st, 4) + 4
	if st.bad or nlen > 286 or ndist > 30:
		return []
	var order := [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
	var cl := []
	cl.resize(19)
	cl.fill(0)
	for i in ncode:
		cl[order[i]] = _bits(st, 3)
	var ch := _huff(cl)
	var lengths := []
	while lengths.size() < nlen + ndist:
		var sym := _decode(st, ch)
		if sym < 0:
			return []
		if sym < 16:
			lengths.append(sym)
		else:
			var rep := 0
			var val := 0
			if sym == 16:
				if lengths.is_empty():
					return []
				val = lengths[lengths.size() - 1]
				rep = 3 + _bits(st, 2)
			elif sym == 17:
				rep = 3 + _bits(st, 3)
			else:
				rep = 11 + _bits(st, 7)
			for k in rep:
				lengths.append(val)
	if st.bad or lengths.size() > nlen + ndist:
		return []
	return [_huff(lengths.slice(0, nlen)), _huff(lengths.slice(nlen))]


# ---------------- ME3 배열 → 웹 게임 상태 ----------------
## 36진수 비트 묶음 → {번호: 1} (BigInt 대신 자리 배열로 계산)
static func unbits(t: String) -> Dictionary:
	var limbs := [0]          # 24비트씩, 작은 자리부터
	for ch in t:
		var d := B36.find(ch.to_lower())
		if d < 0:
			continue
		var carry := d
		for i in limbs.size():
			var v: int = limbs[i] * 36 + carry
			limbs[i] = v & 0xFFFFFF
			carry = v >> 24
		while carry > 0:
			limbs.append(carry & 0xFFFFFF)
			carry >>= 24
	var o := {}
	for i in limbs.size():
		for b in 24:
			if (int(limbs[i]) >> b) & 1:
				o[i * 24 + b] = 1
	return o


static func unpack_mon(a: Array, name: String, mvk: Array) -> Dictionary:
	var m := {"sid": int(a[0]), "lv": int(a[1]), "exp": Game.exp_for(int(a[1])) + int(a[2]), "nick": str(a[3]), "moves": []}
	if str(a[4]) != "":
		for tok in str(a[4]).split(","):
			var p := tok.split(".")
			var i := _b36(p[0])
			if i < 0 or i >= mvk.size():
				continue
			var id: String = mvk[i]
			m.moves.append({"id": id, "pp": int(p[1]) if p.size() > 1 else int(Data.move(id).pp)})
	var iv := []
	for c in str(a[5]):
		iv.append(maxi(0, B32.find(c)))
	m.iv = iv
	m.nat = int(a[6])
	m.shiny = bool(a[7])
	m.st = str(a[8]) if a[8] != null else ""
	m.slp = int(a[9]) if a[9] != null else 0
	m.hp = int(a[10])
	m.met = {"map": str(a[11]), "lv": int(a[12])} if str(a[11]) != "" else null
	var ot = a[13]
	m.ot = name if (ot is float or ot is int) and int(ot) == 0 else (str(ot) if ot != null and str(ot) != "" else null)
	if a.size() > 14 and a[14] is Dictionary:
		for k in a[14]:
			m[k] = a[14][k]
	return m


static func _b36(t: String) -> int:
	var n := 0
	for ch in t:
		var d := B36.find(ch.to_lower())
		if d < 0:
			return -1
		n = n * 36 + d
	return n


static func unpack_save(a) -> Variant:
	if not a is Array or a.size() < 22:
		return null
	var name := str(a[1])
	var mvk: Array = Data.D.moves.keys()
	var flags := {}
	if str(a[11]) != "":
		for k in str(a[11]).split(","):
			flags[k] = 1
	if a[12] is Dictionary:
		for k in a[12]:
			flags[k] = a[12][k]
	var party := []
	for x in a[4]:
		party.append(unpack_mon(x, name, mvk))
	var box := []
	for x in a[5]:
		box.append(unpack_mon(x, name, mvk))
	var badges := []
	for c in str(a[15]):
		badges.append(int(c))
	var heal: Array = a[16]
	var g := {"v": 2, "name": name, "id": str(a[2]), "money": a[3], "party": party, "box": box, "bag": a[6], "map": a[7],
		"x": a[8], "y": a[9], "dir": ["up", "down", "left", "right"][clampi(int(a[10]), 0, 3)] if int(a[10]) >= 0 else "down",
		"flags": flags, "seen": unbits(str(a[13])), "caught": unbits(str(a[14])), "badges": badges,
		"heal": {"map": heal[0], "x": heal[1], "y": heal[2]}, "steps": a[17], "playMs": float(a[18]) * 1000.0,
		"start": float(a[19]) * 1000.0, "starter": a[20], "rivalStarter": a[21]}
	if a.size() > 22 and a[22] is Dictionary:
		for k in a[22]:
			g[k] = a[22][k]
	return g


# ---------------- 웹 게임 상태 → Godot 리포트 ----------------
static func _num(v, def := 0) -> int:
	return int(v) if (v is float or v is int) else def


static func _mon(w: Dictionary) -> Dictionary:
	var sid := _num(w.get("sid"))
	if not Data.D.species.has(str(sid)):
		return {}
	var moves := []
	for x in w.get("moves", []):
		if x is Dictionary and Data.D.moves.has(str(x.get("id", ""))):
			moves.append({"id": str(x.id), "pp": _num(x.get("pp"), int(Data.move(str(x.id)).pp))})
	var iv := []
	for v in w.get("iv", []):
		iv.append(clampi(_num(v), 0, 31))
	while iv.size() < 6:
		iv.append(0)
	var lv := clampi(_num(w.get("lv"), 1), 1, 100)
	var m := {"sid": sid, "lv": lv, "exp": _num(w.get("exp"), Game.exp_for(lv)), "nick": str(w.get("nick", "")) if w.get("nick") != null else "",
		"moves": moves, "iv": iv, "nat": clampi(_num(w.get("nat")), 0, Data.D.natures.size() - 1), "shiny": bool(w.get("shiny", false)),
		"st": str(w.get("st", "")) if w.get("st") != null else "", "slp": _num(w.get("slp")), "hp": _num(w.get("hp"), 1),
		"met": null, "ot": w.get("ot")}
	var met = w.get("met")
	if met is Dictionary:
		m.met = {"map": str(met.get("map", "")), "lv": _num(met.get("lv"))}
	if w.has("boxAt") and (w.boxAt is float or w.boxAt is int):
		m.box_at = float(w.boxAt) / 1000.0
	if moves.is_empty():
		var fresh := Game.make_mon(sid, lv)
		m.moves = fresh.moves
	return m


static func to_godot(w: Dictionary) -> Dictionary:
	if not w.get("name") is String or not w.get("party") is Array or w.party.is_empty():
		return {}
	if not Data.D.maps.has(str(w.get("map", ""))):
		return {}
	var party := []
	for x in w.party:
		if x is Dictionary:
			var m := _mon(x)
			if not m.is_empty():
				party.append(m)
	if party.is_empty():
		return {}
	var box := []
	for x in w.get("box", []):
		if x is Dictionary:
			var m := _mon(x)
			if not m.is_empty():
				box.append(m)
	var bag := {}
	var wb = w.get("bag", {})
	if wb is Dictionary:
		for k in wb:
			if Data.D.items.has(str(k)) and _num(wb[k]) > 0:
				bag[str(k)] = _num(wb[k])
	var flags := {}
	var wf = w.get("flags", {})
	if wf is Dictionary:
		for k in wf:
			var v = wf[k]
			flags[str(k)] = int(v) if (v is float and v == floor(v)) else v
	var seen := {}
	var caught := {}
	for pair in [[w.get("seen", {}), seen], [w.get("caught", {}), caught]]:
		if pair[0] is Dictionary:
			for k in pair[0]:
				if pair[0][k]:
					pair[1][int(k)] = 1
	var badges := []
	for b in w.get("badges", []):
		badges.append(1 if b else 0)
	while badges.size() < 5:
		badges.append(0)
	var heal = w.get("heal", {})
	var g := {"v": 2, "name": str(w.name).left(10), "id": str(w.get("id", "00000")), "money": _num(w.get("money"), 3000),
		"party": party.slice(0, 6), "box": box + party.slice(6), "bag": bag, "map": str(w.map),
		"x": _num(w.get("x"), 1), "y": _num(w.get("y"), 1), "dir": str(w.get("dir", "down")) if str(w.get("dir", "")) in ["up", "down", "left", "right"] else "down",
		"flags": flags, "seen": seen, "caught": caught, "badges": badges.slice(0, 5),
		"heal": {"map": str(heal.get("map", "home")), "x": _num(heal.get("x"), 4), "y": _num(heal.get("y"), 6)} if heal is Dictionary else {"map": "home", "x": 4, "y": 6},
		"steps": _num(w.get("steps")), "play_ms": float(_num(w.get("playMs"))),
		"start": float(_num(w.get("start"))) / 1000.0 if _num(w.get("start")) > 0 else Time.get_unix_time_from_system(),
		"starter": _num(w.get("starter")), "rival_starter": _num(w.get("rivalStarter"), 4)}
	if not Data.D.maps.has(g.heal.map):
		g.heal = {"map": "home", "x": 4, "y": 6}
	var tw = w.get("tower")
	if tw is Dictionary:
		g.tower = {"best": _num(tw.get("best")), "cur": _num(tw.get("cur"))}
	for m in g.party + g.box:
		if str(m.ot) == "" or m.ot == null:
			m.ot = g.name
	return g
