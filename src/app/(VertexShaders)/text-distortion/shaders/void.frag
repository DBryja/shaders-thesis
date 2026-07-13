varying float vAlpha;
varying float vSettled;

void main() {
	vec2 c = gl_PointCoord - 0.5;
	float d = length(c);
	if (d > 0.5) discard;

	float core = exp(-d * 6.0);
	float glow = exp(-d * 2.5) * 0.5;
	float brightness = core + glow;

	vec3 coldCol = vec3(0.92, 0.94, 1.0);
	vec3 hotCol = vec3(1.0, 1.0, 1.0);
	vec3 col = mix(coldCol, hotCol, vSettled) * brightness;

	float alpha = smoothstep(0.5, 0.05, d) * vAlpha;

	gl_FragColor = vec4(col, alpha);
}
