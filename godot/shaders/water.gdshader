shader_type canvas_item;
// 물: 무늬가 천천히 일렁이고, 물결 반짝임이 흘러간다.

varying vec2 wp;

void vertex() {
	wp = VERTEX;
}

void fragment() {
	vec2 d = vec2(sin(wp.y * 0.06 + TIME * 1.6), cos(wp.x * 0.05 + TIME * 1.3)) * 0.0035;
	vec4 c = texture(TEXTURE, UV + d);
	float s = sin(wp.x * 0.045 + wp.y * 0.02 + TIME * 1.8) * sin(wp.y * 0.07 - TIME * 1.1 + wp.x * 0.01);
	c.rgb += smoothstep(0.72, 1.0, s) * 0.28;
	c.rgb = mix(c.rgb, vec3(0.3, 0.55, 0.85), 0.08 + 0.05 * sin(TIME * 0.7 + wp.x * 0.01));
	COLOR = c * COLOR;
}
