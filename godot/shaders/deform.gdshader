shader_type canvas_item;
// 몬스터·사람 그림을 격자 메시로 그려 부드럽게 변형한다.
// 메시 원점은 발 중앙(위쪽이 -y). lp: 그림 안 위치(0~1, y=0 머리, y=1 발).

uniform vec2 size = vec2(100.0, 100.0);
uniform float time_offset = 0.0;
uniform float speed = 1.0;
uniform float breath = 1.0;      // 숨쉬기 세기
uniform float squash = 0.0;      // +: 납작, -: 길쭉 (발 기준, 부피 유지)
uniform float lean = 0.0;        // 몸 전체 기울기
uniform float bend = 0.0;        // 위로 갈수록 크게 휨 (머리 숙이기·젖히기)
uniform float sway = 0.0;        // 잎·몸이 천천히 흔들림
uniform float wobble = 0.0;      // 맞았을 때 젤리처럼 출렁임
uniform float walk = 0.0;        // 걷기 세기
uniform float walk_phase = 0.0;  // 걷기 위상
uniform float flap = 0.0;        // 날개짓
uniform float flutter = 0.0;     // 위쪽 일렁임 (불꽃·머리카락)
uniform float flutter_low = 0.0; // 아래쪽 일렁임 (해파리 촉수)
uniform float flash = 0.0;
uniform vec4 flash_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float dark = 0.0;        // 실루엣
uniform float glow = 0.0;        // 기 모으기
uniform vec4 glow_color : source_color = vec4(1.0, 0.8, 0.4, 1.0);
uniform float dissolve = 0.0;    // 쓰러질 때 흩어짐

varying vec2 lp;
varying vec4 vcol;

void vertex() {
	vcol = COLOR;
	vec2 v = VERTEX;
	lp = vec2(v.x / size.x + 0.5, 1.0 + v.y / size.y);
	float h = clamp(1.0 - lp.y, 0.0, 1.0);
	float t = TIME * speed + time_offset;
	// 숨쉬기: 몸통 가운데가 부풀고 키가 살짝 커짐
	float br = sin(t * 2.1) * breath;
	v.x *= 1.0 + br * 0.03 * sin(h * 3.14159);
	v.y *= 1.0 + br * 0.022;
	// 납작/길쭉
	v.y *= 1.0 - squash;
	v.x *= 1.0 + squash * 0.8;
	// 기울기·휨·흔들림 (위로 갈수록 크게)
	v.x += lean * h * size.y + bend * h * h * size.y;
	v.x += sin(t * 1.7 + 1.3) * sway * h * h * size.x * 0.05;
	// 젤리 출렁임
	v.x += sin(t * 26.0 + h * 7.0) * wobble * h * size.x * 0.06;
	v.y += cos(t * 23.0 + lp.x * 6.0) * wobble * h * size.y * 0.03;
	// 걷기: 다리 번갈아 들기 + 팔 흔들기 + 몸 통통
	float side = lp.x < 0.5 ? 1.0 : -1.0;
	float edge = 1.0 - smoothstep(0.0, 0.32, min(lp.x, 1.0 - lp.x));
	float leg = smoothstep(0.74, 1.0, lp.y);
	float arm = smoothstep(0.30, 0.45, lp.y) * (1.0 - smoothstep(0.62, 0.78, lp.y)) * edge;
	float s = sin(walk_phase);
	v.y -= walk * leg * max(0.0, s * side) * size.y * 0.07;
	v.x += walk * leg * s * side * size.x * 0.035;
	v.y += walk * arm * s * side * size.y * 0.035;
	v.y -= walk * abs(cos(walk_phase)) * size.y * 0.03 * (1.0 - leg);
	// 날개짓: 양옆 윗부분이 위아래로
	float wing = edge * (1.0 - smoothstep(0.2, 0.75, lp.y));
	v.y += flap * wing * sin(t * 9.0) * size.y * 0.08;
	// 위쪽 일렁임
	v.x += flutter * h * h * (sin(t * 7.0 + lp.y * 9.0) * 0.022 + sin(t * 11.0 + lp.x * 7.0) * 0.012) * size.x;
	v.y += flutter * h * h * sin(t * 9.0 + lp.x * 6.0) * 0.015 * size.y;
	// 아래쪽 일렁임
	v.x += flutter_low * lp.y * lp.y * sin(t * 3.0 + lp.y * 8.0 + lp.x * 4.0) * size.x * 0.05;
	VERTEX = v;
}

void fragment() {
	vec4 c = texture(TEXTURE, UV);
	c.rgb = mix(c.rgb, vec3(0.07, 0.08, 0.12), dark);
	c.rgb += glow_color.rgb * glow * 0.55 * c.a;
	c.rgb = mix(c.rgb, flash_color.rgb, flash);
	if (dissolve > 0.0) {
		vec2 cp = floor(lp * 40.0);
		float n = fract(sin(dot(cp, vec2(12.9898, 78.233))) * 43758.5453);
		float thr = dissolve * 1.3 - (1.0 - lp.y) * 0.3;
		if (n < thr) {
			c.a = 0.0;
		} else if (n < thr + 0.08) {
			c.rgb = mix(c.rgb, vec3(1.0, 0.95, 0.7), 0.85);
		}
	}
	COLOR = c * vcol;
}
