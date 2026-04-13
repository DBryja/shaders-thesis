// Lava-lamp blobs — Gaussian kernels (no 1/r²), no radial sin(field); centers kept inset

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
uniform float uReach;

varying vec2 vUv;

// Smooth blob without steep inverse-distance (reduces banding / “target” rings)
float softBlob(vec2 p, vec2 c, float r) {
	float d2 = dot(p - c, p - c);
	float s = max(r, 1e-4);
	return exp(-d2 / (2.0 * s * s));
}

// Keep animated centers inside a safe margin so masses stay mostly on-screen
vec2 orbit(float t, float ax, float ay, float phase, float radius) {
	vec2 v = vec2(sin(t * ax + phase), cos(t * ay + phase * 1.7));
	return v * radius;
}

void main() {
	float aspect = uResolution.x / max(uResolution.y, 1.0);
	vec2 p = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);

	float zoom = 0.52 + uNoiseScale * 0.14;
	p *= zoom;

	float t = uTime;
	vec2 drift = uFlow * t * 0.1;

	float reach = clamp(uReach, 0.1, 0.55);
	vec2 c0 = orbit(t * 0.51 + drift.x, 0.97, 0.83, 0.0, reach);
	vec2 c1 = orbit(t * 0.58 + drift.y, 1.05, 0.91, 2.1, reach * 0.92);
	vec2 c2 = orbit(t * 0.47 + drift.x * 0.7, 0.88, 1.02, 4.2, reach * 0.95);
	vec2 c3 = orbit(t * 0.54 + drift.y * 0.8, 0.93, 0.99, 1.4, reach * 0.88);

	float field = 0.0;
	field += softBlob(p, c0, 0.11);
	field += softBlob(p, c1, 0.095);
	field += softBlob(p, c2, 0.105);
	field += softBlob(p, c3, 0.088);

	float rSmall = reach * 1.05;
	vec2 s0 = orbit(t * 0.86 + 0.6, 1.12, 0.98, 0.5, rSmall);
	vec2 s1 = orbit(t * 0.79 + 2.0, 1.08, 1.06, 2.8, rSmall * 0.95);
	vec2 s2 = orbit(t * 1.02 + 4.0, 1.15, 0.89, 5.1, rSmall * 0.9);
	field += softBlob(p, s0, 0.044) * 0.55;
	field += softBlob(p, s1, 0.038) * 0.5;
	field += softBlob(p, s2, 0.032) * 0.45;

	float iso = 0.38 + uGradientShift * 0.12;
	float edge = 0.062 / max(uContrast, 0.35);
	float m = smoothstep(iso - edge, iso + edge, field);

	// Very subtle non-radial variation only (avoid sin(field) → concentric rings)
	float warp = sin(p.x * 3.2 + p.y * 2.7 + t * 0.85) * 0.5 + 0.5;
	float f = mix(m, warp, 0.06);
	f = pow(clamp(f, 0.0, 1.0), 0.92);

	vec3 col = mix(uColorDeep, uColorMid, smoothstep(0.06, 0.52, f));
	col = mix(col, uColorLight, smoothstep(0.36, 0.94, f));

	float luma = dot(col, vec3(0.299, 0.587, 0.114));
	col = mix(vec3(luma), col, uSaturation);

	vec2 uvCentered = vUv - 0.5;
	float vig = 1.0 - dot(uvCentered, uvCentered) * uVignette;
	vig = clamp(vig, 0.0, 1.0);
	col *= vig;

	gl_FragColor = vec4(col, 1.0);
}
