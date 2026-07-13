uniform sampler2D uPositions;
uniform sampler2D uVelocities;
uniform sampler2D uAttractorTex;
uniform float uTime;
uniform float uDelta;
uniform vec2 uResolution;
uniform float uMode;

const float GRAVITY = -0.0004;
const float WIND_STRENGTH = 0.00025;
const float DAMPING = 0.994;
const float SETTLE_DAMPING = 0.86;
const float ATTRACT_STRENGTH = 0.006;
const float SPAWN_TOP = 1.5;
const float SPAWN_BOTTOM = -1.6;
const float SPAWN_WIDTH = 2.0;

float hash(vec2 p) {
	float h = dot(p, vec2(127.1, 311.7));
	return fract(sin(h) * 43758.5453);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);

	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));

	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec2 curlNoise(vec2 p, float t) {
	float eps = 0.01;
	float n1 = noise(vec2(p.x + eps, p.y) + t * 0.12);
	float n2 = noise(vec2(p.x - eps, p.y) + t * 0.12);
	float n3 = noise(vec2(p.x, p.y + eps) + t * 0.12);
	float n4 = noise(vec2(p.x, p.y - eps) + t * 0.12);

	return vec2((n3 - n4) / (2.0 * eps), -(n1 - n2) / (2.0 * eps));
}

// World position to attractor texture UV
// Logo is wide (~3.4:1 aspect), drawn centered in 512x512 square texture
// It fills full width, narrow vertical band in center
// World area: x in [-0.55, 0.55] maps to U [0,1], y in [-0.16, 0.16] maps to V [0,1]
// But we want LARGER capture radius, so we scale less aggressively
vec2 posToUv(vec2 pos) {
	return vec2(pos.x * 0.5 + 0.5, -pos.y * 0.5 + 0.5);
}

vec2 sampleAttractorGradient(vec2 pos) {
	vec2 uv = posToUv(pos);
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec2(0.0);
	float eps = 5.0 / uResolution.x;

	float right = texture2D(uAttractorTex, uv + vec2(eps, 0.0)).r;
	float left = texture2D(uAttractorTex, uv - vec2(eps, 0.0)).r;
	float up = texture2D(uAttractorTex, uv + vec2(0.0, eps)).r;
	float down = texture2D(uAttractorTex, uv - vec2(0.0, eps)).r;

	return vec2(right - left, up - down);
}

float sampleAttractor(vec2 pos) {
	vec2 uv = posToUv(pos);
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
	return texture2D(uAttractorTex, uv).r;
}

float sampleAttractorSharp(vec2 pos) {
	vec2 uv = posToUv(pos);
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
	return texture2D(uAttractorTex, uv).g;
}

varying vec2 vUv;

void main() {
	vec4 posSample = texture2D(uPositions, vUv);
	vec4 velSample = texture2D(uVelocities, vUv);

	vec2 pos = posSample.xy;
	float life = posSample.z;
	float attracted = posSample.w;

	vec2 vel = velSample.xy;
	float settled = velSample.z;

	float dt = min(uDelta, 0.033) * 60.0;

	if (uMode < 0.5) {
		// === POSITION PASS ===
		vec2 newPos = pos + vel;
		float newLife = min(life + 0.008, 1.0);

		// Update attracted: use sharp (G channel) for precise text detection
		float onTextSharp = sampleAttractorSharp(newPos);
		float newAttracted = attracted;
		if (onTextSharp > 0.4) {
			newAttracted = min(1.0, attracted + 0.06);
		} else {
			newAttracted = max(0.0, attracted - 0.01);
		}

		// Respawn: always from top edge, spread across full width
		if (newPos.y < SPAWN_BOTTOM || abs(newPos.x) > SPAWN_WIDTH) {
			float rndX = hash(vUv * 13.0 + uTime * 0.07);
			float rndY = hash(vUv * 7.0 + uTime * 0.13);
			newPos.x = (rndX - 0.5) * SPAWN_WIDTH * 2.0;
			newPos.y = SPAWN_TOP + rndY * 0.5;
			newLife = 0.0;
			newAttracted = 0.0;
		}

		gl_FragColor = vec4(newPos, newLife, newAttracted);
	} else {
		// === VELOCITY PASS ===
		vec2 newVel = vel;
		float newSettled = settled;

		// Gravity — constant downward pull (like sand/snow falling)
		newVel.y += GRAVITY * dt * (1.0 - settled * 0.97);

		// Curl noise wind — chaotic, vortex-like
		float windPhaseX = sin(uTime * 0.5) * 0.3 + cos(uTime * 0.2) * 0.2;
		float windPhaseY = cos(uTime * 0.4) * 0.1;
		vec2 curl = curlNoise(pos * 1.8 + vec2(windPhaseX, windPhaseY), uTime);

		// Global wind gusts
		float gustX = sin(uTime * 0.9) * cos(uTime * 0.5) * 0.3;
		float gustY = cos(uTime * 0.7) * 0.05;

		float windMul = mix(1.0, 0.05, settled);
		newVel += (curl + vec2(gustX, gustY)) * WIND_STRENGTH * windMul * dt;

		// Attractor: use blurred field (R) for gradient, sharp (G) for settling
		float fieldBlurred = sampleAttractor(pos);
		float fieldSharp = sampleAttractorSharp(pos);
		vec2 gradient = sampleAttractorGradient(pos);

		if (fieldSharp > 0.4) {
			// Directly on text letterform → settle hard
			newSettled = min(1.0, settled + 0.05);
			newVel *= SETTLE_DAMPING;
		} else if (fieldBlurred > 0.02) {
			// In influence zone → attract toward text
			vec2 dir = normalize(gradient + vec2(0.0001));
			float strength = fieldBlurred * ATTRACT_STRENGTH * dt;
			newVel += dir * strength;
			newVel *= 0.97;
			newSettled = max(0.0, settled - 0.02);
		} else {
			newSettled = max(0.0, settled - 0.05);
		}

		// Occasional escape from settled state (wind tears particles away)
		float escapeForce = abs(gustX) * 0.5 + length(curl) * 0.3;
		float rnd = hash(vUv * 99.0 + floor(uTime * 6.0));
		if (settled > 0.7 && rnd < escapeForce * 0.002) {
			newSettled = 0.0;
			newVel.y = -0.002 - rnd * 0.003;
			newVel.x = (hash(vUv + uTime) - 0.5) * 0.004;
		}

		// Damping
		float damp = mix(DAMPING, SETTLE_DAMPING, settled);
		newVel *= damp;

		gl_FragColor = vec4(newVel, newSettled, 0.0);
	}
}
