uniform sampler2D uPositions;
uniform sampler2D uVelocities;
uniform sampler2D uAttractorTex;
uniform float uTime;
uniform float uDelta;
uniform vec2 uResolution;
uniform float uMode;
uniform float uGravity;
uniform float uWindStrength;
uniform float uDamping;
uniform float uSettleDamping;
uniform float uAttractStrength;
uniform float uSpeedScale;
uniform float uSpawnTop;
uniform float uSpawnBottom;
uniform float uLogoHalfWidth;
uniform float uLogoWidthRatio;

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
	float n1 = noise(vec2(p.x + eps, p.y) + t * 0.1);
	float n2 = noise(vec2(p.x - eps, p.y) + t * 0.1);
	float n3 = noise(vec2(p.x, p.y + eps) + t * 0.1);
	float n4 = noise(vec2(p.x, p.y - eps) + t * 0.1);

	return vec2((n3 - n4) / (2.0 * eps), -(n1 - n2) / (2.0 * eps));
}

// Logo centered at 80% of screen width
vec2 posToUv(vec2 pos) {
	return vec2(pos.x / uLogoHalfWidth * (uLogoWidthRatio * 0.5) + 0.5, -pos.y * 0.5 + 0.5);
}

vec2 sampleAttractorGradient(vec2 pos) {
	vec2 uv = posToUv(pos);
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec2(0.0);
	float eps = 3.0 / uResolution.x;

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
		vec2 newPos = pos + vel * uSpeedScale;
		float newLife = min(life + 0.004, 1.0);

		float onTextSharp = sampleAttractorSharp(newPos);
		float newAttracted = attracted;
		if (onTextSharp > 0.38) {
			newAttracted = min(1.0, attracted + 0.05);
		} else {
			newAttracted = max(0.0, attracted - 0.005);
		}

		// Respawn only below screen — no horizontal teleport
		if (newPos.y < uSpawnBottom) {
			float rndX = hash(vUv * 13.0);
			float rndY = hash(vUv * 7.0 + floor(uTime * 0.4));
			newPos.x = (rndX - 0.5) * 2.2;
			newPos.y = uSpawnTop + rndY * 0.8;
			newLife = 0.75;
			newAttracted = 0.0;
		}

		gl_FragColor = vec4(newPos, newLife, newAttracted);
	} else {
		// === VELOCITY PASS ===
		vec2 newVel = vel;
		float newSettled = settled;

		// Freshly respawned at the top
		if (pos.y > uSpawnTop - 0.15) {
			float rndA = hash(vUv * 3.0);
			float rndB = hash(vUv * 11.0);
			newVel = vec2((rndA - 0.5) * 0.00004, -0.000075 - rndB * 0.00006);
			newSettled = 0.0;
			gl_FragColor = vec4(newVel, newSettled, 0.0);
			return;
		}

		if (life < 0.02) {
			float rndA = hash(vUv * 3.0);
			float rndB = hash(vUv * 11.0);
			newVel = vec2((rndA - 0.5) * 0.00004, -0.000075 - rndB * 0.00006);
			newSettled = 0.0;
			gl_FragColor = vec4(newVel, newSettled, 0.0);
			return;
		}

		// Gravity
		float fallMul = mix(1.65, 1.0 - settled * 0.98, settled);
		newVel.y += uGravity * dt * fallMul;

		// Wind
		float windPhaseX = sin(uTime * 0.4) * 0.25 + cos(uTime * 0.15) * 0.15;
		float windPhaseY = cos(uTime * 0.3) * 0.08;
		vec2 curl = curlNoise(pos * 1.5 + vec2(windPhaseX, windPhaseY), uTime);

		float gustX = sin(uTime * 0.7) * cos(uTime * 0.4) * 0.22;
		float gustY = cos(uTime * 0.55) * 0.03;

		float windMul = mix(1.0, 0.12, settled);
		newVel += (curl + vec2(gustX, gustY)) * uWindStrength * windMul * dt;

		// Attractor
		float fieldBlurred = sampleAttractor(pos);
		float fieldSharp = sampleAttractorSharp(pos);
		vec2 gradient = sampleAttractorGradient(pos);
		float gradLen = length(gradient);

		if (fieldSharp > 0.38) {
			newSettled = min(0.95, settled + 0.035);
			newVel *= uSettleDamping;
		} else if (fieldBlurred > 0.025 && gradLen > 0.001) {
			vec2 dir = gradient / gradLen;
			float strength = fieldBlurred * uAttractStrength * dt;
			newVel += dir * strength;
			newVel.y *= 0.92;
			newSettled = max(0.0, settled - 0.008);
		} else {
			newSettled = max(0.0, settled - 0.03);
		}

		// Anti-stuck: unsettle particles caught in weak gradient blobs
		if (settled > 0.3 && fieldSharp < 0.35 && gradLen < 0.002) {
			newSettled = max(0.0, settled - 0.08);
			newVel += vec2((hash(vUv + uTime) - 0.5) * 0.0004, -0.0003 - hash(vUv * 2.0) * 0.0002);
		}

		// Wind tears settled particles away occasionally
		float escapeForce = abs(gustX) * 0.4 + length(curl) * 0.25;
		float rnd = hash(vUv * 99.0 + floor(uTime * 4.0));
		if (settled > 0.6 && rnd < escapeForce * 0.0006) {
			newSettled = 0.0;
			newVel.y = -0.0005 - rnd * 0.00075;
			newVel.x = (hash(vUv + uTime) - 0.5) * 0.001;
		}

		float damp = mix(uDamping, uSettleDamping, settled * 0.7);
		newVel *= damp;

		gl_FragColor = vec4(newVel, newSettled, 0.0);
	}
}
