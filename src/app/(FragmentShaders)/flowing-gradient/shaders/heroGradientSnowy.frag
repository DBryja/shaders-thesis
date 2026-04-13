vec3 mod289_3(vec3 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289_2(vec2 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute289(vec3 x) {
	return mod289_3((x * 34.0 + 1.0) * x);
}

// Simplex noise 2D — Ian McEwan, Ashima Arts (MIT)
float snoise2(vec2 v) {
	const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
	vec2 i = floor(v + dot(v, C.yy));
	vec2 x0 = v - i + dot(i, C.xx);
	vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
	vec4 x12 = x0.xyxy + C.xxzz;
	x12.xy -= i1;
	i = mod289_2(i);
	vec3 p = permute289(permute289(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
	vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
	m = m * m;
	m = m * m;
	vec3 x = 2.0 * fract(p * C.www) - 1.0;
	vec3 h = abs(x) - 0.5;
	vec3 ox = floor(x + 0.5);
	vec3 a0 = x - ox;
	vec3 g;
	g.x = a0.x * x0.x + h.x * x0.y;
	g.yz = a0.yz * x12.xz + h.yz * x12.yw;
	return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	mat2 rot = mat2(
		 1.6,  1.2,
		-1.2,  1.6
	);
	for (int i = 0; i < 5; i++) {
		v += a * snoise2(p);
		p = rot * p * 2.0;
		a *= 0.5;
	}
	return v;
}

uniform float uTime;
uniform vec2 uResolution;
uniform float uNoiseScale;
uniform vec2 uFlow;
uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorLight;
uniform float uContrast;
uniform float uGradientShift;
uniform float uVignette;
uniform float uSaturation;

varying vec2 vUv;

void main() {
	float aspect = uResolution.x / max(uResolution.y, 1.0);
	vec2 q = vec2(vUv.x * aspect, vUv.y);

	vec2 drift = uFlow * uTime;
	vec2 p = q * uNoiseScale + drift;

	float n = fbm(p);
	n = n * 0.5 + 0.5;
	n = pow(clamp(n, 0.0, 1.0), uContrast);
	n = clamp(n + uGradientShift, 0.0, 1.0);

	vec3 col = mix(uColorDeep, uColorMid, smoothstep(0.08, 0.45, n));
	col = mix(col, uColorLight, smoothstep(0.40, 0.88, n));

	float luma = dot(col, vec3(0.299, 0.587, 0.114));
	col = mix(vec3(luma), col, uSaturation);

	vec2 uvCentered = vUv - 0.5;
	float vig = 1.0 - dot(uvCentered, uvCentered) * uVignette;
	vig = clamp(vig, 0.0, 1.0);
	col *= vig;

	gl_FragColor = vec4(col, 1.0);
}
