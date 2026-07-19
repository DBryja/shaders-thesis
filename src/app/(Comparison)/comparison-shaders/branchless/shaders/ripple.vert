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

	float wave = sin(aRadial * uWaveFreq - uTime * uWaveSpeed);
	float wave01 = wave * 0.5 + 0.5;
	vWave = wave01;

	float sizePx = mix(uMaxSize, uMinSize, clamp(aRadial, 0.0, 1.0));
	sizePx *= 1.0 + uWaveAmp * wave;

	float pulse = sin(uTime * 1.7) * uPulseStrength * (1.0 - aRadial);
	pos.xy *= 1.0 + pulse;

	vec2 delta = pos.xy - uMouse;
	float dist = length(delta);
	float t = clamp(1.0 - dist / uDisplaceRadius, 0.0, 1.0) * uMouseActive;
	vInfluence = t;

	vec2 dir = delta * inversesqrt(dist * dist + 1e-8);
	vec2 perp = vec2(-dir.y, dir.x);
	float falloff = t * t;
	pos.xy += dir * (falloff * uDisplaceStrength);
	pos.xy += perp * (falloff * uSwirlStrength);

	vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
	gl_Position = projectionMatrix * mvPosition;
	gl_PointSize = sizePx * uPixelRatio;
}
