varying vec2 vUv;

uniform float uTime;
uniform vec2 uDirection;
uniform float uStrength;

void main() {
	vUv = uv;

	vec3 pos = position;

	// UV zcentrowane wokół (0.0, 0.0) i przeskalowane do zakresu [-1, 1]
	vec2 centeredUv = (uv - 0.5) * 2.0;

	// Kierunek ruchu myszy znormalizowany
	vec2 dir = uDirection;
	float dirLen = length(dir);
	if (dirLen > 0.0001) {
		dir /= dirLen;
	} else {
		dir = vec2(0.0);
	}

	// Interesuje nas tylko pozioma składowa kierunku
	float horizDir = dir.x; // -1..1, lewo/prawo
	float horizMag = abs(horizDir);

	// Jedna gładka krzywa w pionie:
	//  - max w centrum wysokości,
	//  - rogi nadal lekko pracują (minCornerWeight > 0).
	float minCornerWeight = 0.25;
	float falloffPower = 1.5;
	float orthWeight = minCornerWeight + (1.0 - minCornerWeight) * (1.0 - pow(abs(centeredUv.y), falloffPower));

	// Pozycja wzdłuż osi X względem kierunku (tył/przód)
	float along = centeredUv.x * sign(horizDir); // -1..1

	// Profil rozciągania wzdłuż poziomej osi – obie strony się przesuwają,
	// ale "przód" (w kierunku ruchu) dostaje większy offset.
	float frontFactor = clamp(along * 0.5 + 0.5, 0.0, 1.0); // 0..1
	float baseFactor = 0.2;
	float maxFactor = 0.6; // ograniczenie maksymalnego odchylenia
	float stretchProfile = mix(baseFactor, maxFactor, frontFactor);

	float intensity = orthWeight * stretchProfile * horizMag;

	// Przesuwamy wierzchołki wyłącznie w poziomie, zredukowana amplituda
	float dispX = sign(horizDir) * uStrength * intensity;
	pos.x += dispX;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
