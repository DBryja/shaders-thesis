varying vec2 vUv;

uniform float uTime;
uniform vec2 uDirection;
uniform float uStrength;

void main() {
	vUv = uv;

	vec3 pos = position;

	// UV zcentrowane wokół (0.0, 0.0) i przeskalowane do zakresu [-1, 1]
	vec2 centeredUv = (uv - 0.5) * 2.0;

	// Kierunek ruchu myszy przekazany z JS jest już tweenowany
	// w czasie (MathUtils.damp), więc NIE normalizujemy go tutaj,
	// żeby nie zgubić płynności ani nie wymuszać skoków -1/1.
	vec2 dir = uDirection;

	// Składowe kierunku delikatnie clampujemy, bez sign/step,
	// żeby wszystko pozostało ciągłe.
	float horizDir = clamp(dir.x, -1.0, 1.0); // ~-1..1, lewo/prawo
	float horizMag = abs(horizDir);
	float vertDir = clamp(dir.y, -1.0, 1.0); // ~-1..1, góra/dół
	float vertMag = abs(vertDir);

	// Pojedynczy, gładki łuk paraboliczny po osi Y:
	//  - maksimum w środku (y = 0),
	//  - wygasa do zera na górnej i dolnej krawędzi (y = +/-1).
	float orthWeight = 1.0 - centeredUv.y * centeredUv.y;
	// Analogiczny profil dla pionu: łuk po osi X.
	float sideWeight = 1.0 - centeredUv.x * centeredUv.x;

	// Zamiast liczyć along per-vertex (co powodowało przeskoki
	// między ekstremami), robimy prosty profil zależny tylko od
	// siły poziomej składowej kierunku.
	float baseFactor = 0.2;
	float maxFactor = 0.45; // łagodniejsza krzywizna
	float dirFactorX = mix(baseFactor, maxFactor, horizMag);
	float dirFactorY = mix(baseFactor * 0.35, maxFactor * 0.35, vertMag); // pion subtelniejszy

	float intensityX = orthWeight * dirFactorX;
	float intensityY = sideWeight * dirFactorY;

	// Przesuwamy w obu osiach:
	// - poziom pozostaje głównym efektem,
	// - pion działa analogicznie, ale delikatniej.
	float dispX = horizDir * uStrength * intensityX;
	float dispY = vertDir * uStrength * intensityY;
	pos.x += dispX;
	pos.y += dispY;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
