precision highp float;

varying float vRadial;
varying float vInfluence;

void main() {
	float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
	float alpha = 1.0 - smoothstep(0.85, 1.0, r);

	vec3 nearCol = vec3(0.35, 0.65, 1.0);
	vec3 midCol = vec3(0.45, 0.75, 0.95);
	vec3 farCol = vec3(0.7, 0.85, 1.0);

	vec3 col = mix(nearCol, midCol, smoothstep(0.0, 0.5, vRadial));
	col = mix(col, farCol, smoothstep(0.5, 1.0, vRadial));
	col = mix(col, col * 1.08, vInfluence);

	gl_FragColor = vec4(col, alpha);
}
