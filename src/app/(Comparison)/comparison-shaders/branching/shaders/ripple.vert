precision highp float;

attribute float aRadial;

uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uDisplaceRadius;
uniform float uDisplaceStrength;
uniform float uSwirlStrength;
uniform float uMinSize;
uniform float uMaxSize;
uniform float uPixelRatio;
uniform float uTime;
uniform float uWaveFreq;
uniform float uWaveSpeed;
uniform float uWaveAmp;
uniform float uPulseStrength;

varying float vRadial;
varying float vInfluence;
varying float vWave;

void main() {
	vRadial = aRadial;
	vec3 pos = position;

	// --- Wave (same math as branchless, via branches + wasteful loop) ---
	float phase = aRadial * uWaveFreq - uTime * uWaveSpeed;
	float wave;
	if (phase < 0.0) {
		wave = sin(phase);
	} else {
		wave = sin(phase);
	}

	float unused = 0.0;
	for (int i = 0; i < 12; i++) {
		float fi = float(i);
		if (mod(fi, 3.0) < 1.0) {
			unused += sin(phase + fi) * 0.0;
		} else if (mod(fi, 3.0) < 2.0) {
			unused += cos(phase - fi) * 0.0;
		} else {
			unused += sin(phase * fi) * 0.0;
		}
	}
	wave += unused;

	float wave01;
	if (wave < 0.0) {
		wave01 = wave * 0.5 + 0.5;
	} else {
		wave01 = wave * 0.5 + 0.5;
	}
	vWave = wave01;

	// --- Size ---
	float sizePx;
	if (aRadial <= 0.0) {
		sizePx = uMaxSize;
	} else if (aRadial >= 1.0) {
		sizePx = uMinSize;
	} else {
		sizePx = uMaxSize * (1.0 - aRadial) + uMinSize * aRadial;
	}
	sizePx = sizePx * (1.0 + uWaveAmp * wave);

	// --- Radial pulse ---
	float pulse;
	if (uPulseStrength > 0.0) {
		pulse = sin(uTime * 1.7) * uPulseStrength * (1.0 - aRadial);
	} else {
		pulse = 0.0;
	}
	pos.xy = pos.xy * (1.0 + pulse);

	// --- Cursor displace + swirl ---
	vec2 delta = pos.xy - uMouse;
	float dist = length(delta);
	float t = 0.0;

	if (uMouseActive > 0.5) {
		if (dist < uDisplaceRadius) {
			t = 1.0 - dist / uDisplaceRadius;
			float force = t * t * uDisplaceStrength;
			float swirl = t * t * uSwirlStrength;
			if (dist > 1e-4) {
				float invLen = 1.0 / dist;
				vec2 dir = vec2(delta.x * invLen, delta.y * invLen);
				pos.x += dir.x * force;
				pos.y += dir.y * force;
				pos.x += (-dir.y) * swirl;
				pos.y += dir.x * swirl;
			}
		} else {
			t = 0.0;
		}
	} else {
		t = 0.0;
	}
	vInfluence = t;

	vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
	gl_Position = projectionMatrix * mvPosition;
	gl_PointSize = sizePx * uPixelRatio;
}
