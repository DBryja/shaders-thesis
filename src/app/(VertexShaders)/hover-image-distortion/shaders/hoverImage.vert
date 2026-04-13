varying vec2 vUv;

uniform vec2 uDirection;
uniform float uStrength;

void main() {
	vUv = uv;

	vec3 pos = position;
	// Sinusowa deformacja zależna od kierunku i siły ruchu.
	const float PI = 3.14159265358979323846;
	vec2 dir = clamp(uDirection, vec2(-1.0), vec2(1.0));
	float amplitude = 0.18 * uStrength;

	pos.x += sin(uv.y * PI) * dir.x * amplitude;
	pos.y += sin(uv.x * PI) * dir.y * amplitude * 0.7;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
