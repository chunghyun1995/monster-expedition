class_name Emote
extends RefCounted
## 머리 위에 말풍선(! ? …)이 튀어 오르고, 캐릭터는 깜짝 놀라 살짝 뛴다.


static func pop(owner: Node2D, kind: String, top: float, hold := 0.5, jumper: Node2D = null) -> void:
	var l := Label.new()
	l.text = kind
	l.add_theme_font_size_override("font_size", 40)
	l.add_theme_color_override("font_color", Color(0.85, 0.2, 0.2) if kind == "!" else Color(0.25, 0.35, 0.6))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color.WHITE
	sb.set_corner_radius_all(14)
	sb.set_border_width_all(4)
	sb.border_color = Color(0.2, 0.2, 0.25)
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	l.add_theme_stylebox_override("normal", sb)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.position = Vector2(-28, top)
	l.size = Vector2(56, 58)
	l.pivot_offset = Vector2(28, 58)
	l.scale = Vector2(0.1, 0.1)
	l.z_index = 50
	owner.add_child(l)
	var tw := owner.create_tween()
	tw.tween_property(l, "scale", Vector2(1.25, 1.25), 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if jumper and "lift" in jumper:
		tw.parallel().tween_method(func(k: float) -> void: jumper.lift = sin(k * PI) * 14.0, 0.0, 1.0, 0.22)
	elif jumper:
		tw.parallel().tween_method(func(k: float) -> void: jumper.position.y = -sin(k * PI) * 14.0, 0.0, 1.0, 0.22)
	tw.tween_property(l, "scale", Vector2.ONE, 0.1)
	tw.tween_interval(hold)
	tw.tween_property(l, "modulate:a", 0.0, 0.15)
	tw.tween_callback(l.queue_free)
	await tw.finished
