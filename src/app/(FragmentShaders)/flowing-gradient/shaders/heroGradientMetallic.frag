// Flowing metallic blue — domain warp + Perlin texture + specular bands

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

	vec2 nUv = q * sc * 0.32 + drift;
	vec2 warp = (texture2D(uNoiseMap, nUv).rg - 0.5) * 0.24;
	vec2 nUv2 = q * sc * 0.58 + drift * 1.35 + warp;

	float a = texture2D(uNoiseMap, nUv).r;
	float b = texture2D(uNoiseMap, nUv2).g;
	float n = mix(a, b, 0.52);

	float ribbons = sin((q.x * 0.92 + q.y) * 5.5 + n * 8.0 + drift.x * 5.0) * 0.5 + 0.5;
	n = mix(n, ribbons, 0.32);

	n = pow(clamp(n, 0.0, 1.0), uContrast);
	n = clamp(n + uGradientShift, 0.0, 1.0);

	vec3 base = mix(uColorDeep, uColorMid, smoothstep(0.04, 0.46, n));
	vec3 hi = mix(base, uColorLight, smoothstep(0.38, 0.93, n));

	vec2 px = vec2(1.0 / max(uResolution.x, 1.0), 1.0 / max(uResolution.y, 1.0)) * 2.5;
	float h1 = texture2D(uNoiseMap, nUv + px.xy).r;
	float h2 = texture2D(uNoiseMap, nUv - px.xy).r;
	float h3 = texture2D(uNoiseMap, nUv + px.yx).r;
	float h4 = texture2D(uNoiseMap, nUv - px.yx).r;
	vec3 N = normalize(vec3(-(h1 - h2) * 3.0, -(h3 - h4) * 3.0, 1.0));
	vec3 L = normalize(vec3(0.32, 0.82, 0.48));
	float spec = pow(max(dot(N, L), 0.0), 42.0);
	vec3 specCol = vec3(0.58, 0.76, 0.98);
	vec3 col = hi + spec * specCol * 1.2;

	float luma = dot(col, vec3(0.299, 0.587, 0.114));
	col = mix(vec3(luma), col, uSaturation);

	vec2 uvCentered = vUv - 0.5;
	float vig = 1.0 - dot(uvCentered, uvCentered) * uVignette;
	vig = clamp(vig, 0.0, 1.0);
	col *= vig;

	gl_FragColor = vec4(col, 1.0);
}
