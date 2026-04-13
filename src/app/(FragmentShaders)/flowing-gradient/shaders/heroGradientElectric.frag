// Electric lime / canary — same noise foundation, hotter palette + gold spec

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
uniform sampler2D uNoiseMap;

varying vec2 vUv;

void main() {
	float aspect = uResolution.x / max(uResolution.y, 1.0);
	vec2 q = vec2(vUv.x * aspect, vUv.y);
	vec2 drift = uFlow * uTime;
	float sc = uNoiseScale;

	vec2 nUv = q * sc * 0.38 + drift * 1.1;
	vec2 warp = (texture2D(uNoiseMap, nUv * 1.07 + vec2(0.1, 0.2)).rg - 0.5) * 0.3;
	vec2 nUv2 = q * sc * 0.65 + drift * 1.55 + warp;

	float a = texture2D(uNoiseMap, nUv).r;
	float b = texture2D(uNoiseMap, nUv2).b;
	float n = mix(a, b, 0.48);

	float swirl = sin((q.x - q.y * 0.75) * 6.0 + n * 9.0 + drift.y * 7.0) * 0.5 + 0.5;
	n = mix(n, swirl, 0.4);

	n = pow(clamp(n, 0.0, 1.0), uContrast);
	n = clamp(n + uGradientShift, 0.0, 1.0);

	vec3 base = mix(uColorDeep, uColorMid, smoothstep(0.02, 0.52, n));
	vec3 hi = mix(base, uColorLight, smoothstep(0.35, 0.9, n));

	vec2 px = vec2(1.0 / max(uResolution.x, 1.0), 1.0 / max(uResolution.y, 1.0)) * 2.2;
	float h1 = texture2D(uNoiseMap, nUv + px.xy).r;
	float h2 = texture2D(uNoiseMap, nUv - px.xy).r;
	float h3 = texture2D(uNoiseMap, nUv + px.yx).r;
	float h4 = texture2D(uNoiseMap, nUv - px.yx).r;
	vec3 N = normalize(vec3(-(h1 - h2) * 2.8, -(h3 - h4) * 2.8, 1.0));
	vec3 L = normalize(vec3(-0.25, 0.75, 0.6));
	float spec = pow(max(dot(N, L), 0.0), 28.0);
	vec3 specCol = vec3(0.98, 0.94, 0.42);
	vec3 col = hi + spec * specCol * 1.35;

	float luma = dot(col, vec3(0.299, 0.587, 0.114));
	col = mix(vec3(luma), col, uSaturation);

	vec2 uvCentered = vUv - 0.5;
	float vig = 1.0 - dot(uvCentered, uvCentered) * uVignette;
	vig = clamp(vig, 0.0, 1.0);
	col *= vig;

	gl_FragColor = vec4(col, 1.0);
}
