varying vec2 vUv;

uniform sampler2D uTexture;

void main() {
	vec4 color = texture2D(uTexture, vUv);

	// Prosta ochrona przed artefaktami alpha
	if (color.a < 0.01) discard;

	gl_FragColor = color;
}
