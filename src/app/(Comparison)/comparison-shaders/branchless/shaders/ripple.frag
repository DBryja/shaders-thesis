precision highp float;

varying float vRadial;
varying float vInfluence;
varying float vWave;

void main() {
	float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
	float alpha = 1.0 - smoothstep(0.85, 1.0, r);

	vec3 c0 = vec3(0.2, 0.45, 0.95);
	vec3 c1 = vec3(0.35, 0.85, 0.95);
	vec3 c2 = vec3(0.95, 0.55, 0.85);

	vec3 col = mix(c0, c1, smoothstep(0.0, 0.55, vRadial));
	col = mix(col, c2, smoothstep(0.45, 1.0, vRadial));
	col = mix(col, col * 1.25, vWave * 0.65);
	col = mix(col, vec3(1.0), vInfluence * 0.35);

	gl_FragColor = vec4(col, alpha);
}
