varying vec2 vUv;

uniform float uTime;
uniform vec2 uDirection;
uniform float uStrength;

void main() {
	vUv = uv;

	vec3 pos = position;

	// UV zcentrowane wokół (0.0, 0.0) i przeskalowane do zakresu [-1, 1]
	vec2 centeredUv = (uv - 0.5) * 2.0;

	// Kierunek ruchu kursora przekazany z aplikacji.
	vec2 dir = uDirection;

	// Ogranicza składowe kierunku do zakresu [-1, 1].
	float horizDir = clamp(dir.x, -1.0, 1.0); // ~-1..1, lewo/prawo
	float horizMag = abs(horizDir);
	float vertDir = clamp(dir.y, -1.0, 1.0); // ~-1..1, góra/dół
	float vertMag = abs(vertDir);

	// Profil paraboliczny w osi Y.
	float orthWeight = 1.0 - centeredUv.y * centeredUv.y;
	// Profil paraboliczny w osi X.
	float sideWeight = 1.0 - centeredUv.x * centeredUv.x;

	// Wyznacza skalę zniekształcenia na podstawie siły kierunku.
	float baseFactor = 0.2;
	float maxFactor = 0.45;
	float dirFactorX = mix(baseFactor, maxFactor, horizMag);
	float dirFactorY = mix(baseFactor * 0.35, maxFactor * 0.35, vertMag);

	float intensityX = orthWeight * dirFactorX;
	float intensityY = sideWeight * dirFactorY;

	// Przesuwa wierzchołki w obu osiach.
	float dispX = horizDir * uStrength * intensityX;
	float dispY = vertDir * uStrength * intensityY;
	pos.x += dispX;
	pos.y += dispY;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
