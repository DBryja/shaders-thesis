precision highp float;

varying float vRadial;
varying float vInfluence;
varying float vWave;

void main() {
	float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
	float alpha = 1.0 - smoothstep(0.85, 1.0, r);

	if (alpha <= 0.0) {
		discard;
	}

	vec3 c0 = vec3(0.2, 0.45, 0.95);
	vec3 c1 = vec3(0.35, 0.85, 0.95);
	vec3 c2 = vec3(0.95, 0.55, 0.85);

	float tA = smoothstep(0.0, 0.55, vRadial);
	float tB = smoothstep(0.45, 1.0, vRadial);

	vec3 col;
	if (vRadial < 0.5) {
		col = mix(c0, c1, tA);
		col = mix(col, c2, tB);
	} else {
		col = mix(c0, c1, tA);
		col = mix(col, c2, tB);
	}

	if (vWave > 0.0) {
		col = mix(col, col * 1.25, vWave * 0.65);
	} else {
		col = mix(col, col * 1.25, 0.0);
	}

	if (vInfluence > 0.0) {
		col = mix(col, vec3(1.0), vInfluence * 0.35);
	} else {
		col = mix(col, vec3(1.0), 0.0);
	}

	gl_FragColor = vec4(col, alpha);
}
