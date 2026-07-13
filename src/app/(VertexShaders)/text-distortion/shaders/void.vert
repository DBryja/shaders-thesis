attribute vec2 aDataUv;

uniform sampler2D uPositionTex;
uniform float uPixelRatio;
uniform float uPointSize;
uniform float uScale;

varying float vAlpha;
varying float vSettled;

void main() {
	vec4 posData = texture2D(uPositionTex, aDataUv);
	vec2 particlePos = posData.xy;
	float life = posData.z;
	float attracted = posData.w;

	vec3 worldPos = vec3(particlePos * uScale, 0.0);
	vec4 mvPos = modelViewMatrix * vec4(worldPos, 1.0);

	float sizeMul = 0.7 + attracted * 0.7;
	gl_PointSize = uPointSize * sizeMul * uPixelRatio * (1.0 / -mvPos.z);
	gl_Position = projectionMatrix * mvPos;

	vAlpha = (0.3 + attracted * 0.7) * life;
	vSettled = attracted;
}
