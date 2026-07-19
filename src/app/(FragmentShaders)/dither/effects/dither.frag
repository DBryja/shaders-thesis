uniform float uMode;
uniform float uColorMode;
uniform float uGridSize;
uniform float uPixelSizeRatio;
uniform float uBias;
uniform float uNoiseScale;
uniform float uCellSize;
uniform float uCharactersCount;
uniform float uInvert;
uniform float uDotScale;
uniform float uGradientLevels;
uniform float uDitherStrength;
uniform float uIncludeBackground;
uniform sampler2D uNoise;
uniform sampler2D uCharacters;
uniform sampler2D uGradientMap;

const vec2 ASCII_ATLAS = vec2(16.0);

float luminance(vec3 color) {
	return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

vec3 toneCompress(vec3 color) {
	return color / (color + vec3(1.0));
}

float bayerThreshold4(vec2 pos, float grid) {
	vec2 pixel = floor(mod(pos / max(grid, 1.0), 4.0));
	int x = int(pixel.x);
	int y = int(pixel.y);

	if (x == 0) {
		if (y == 0) return 0.0 / 16.0;
		if (y == 1) return 12.0 / 16.0;
		if (y == 2) return 3.0 / 16.0;
		return 15.0 / 16.0;
	}
	if (x == 1) {
		if (y == 0) return 8.0 / 16.0;
		if (y == 1) return 4.0 / 16.0;
		if (y == 2) return 11.0 / 16.0;
		return 7.0 / 16.0;
	}
	if (x == 2) {
		if (y == 0) return 2.0 / 16.0;
		if (y == 1) return 14.0 / 16.0;
		if (y == 2) return 1.0 / 16.0;
		return 13.0 / 16.0;
	}
	if (y == 0) return 10.0 / 16.0;
	if (y == 1) return 6.0 / 16.0;
	if (y == 2) return 9.0 / 16.0;
	return 5.0 / 16.0;
}

vec3 sampleGradient(float t) {
	return texture2D(uGradientMap, vec2(clamp(t, 0.0, 1.0), 0.5)).rgb;
}

vec3 shade(float lum, float threshold, float paperMask) {
	float levels = max(uGradientLevels, 2.0);
	float dithered = clamp(lum + (threshold - 0.5) * uDitherStrength + uBias, 0.0, 1.0);
	float mask = paperMask;

	if (uInvert > 0.5) {
		dithered = 1.0 - dithered;
		mask = 1.0 - mask;
	}

	if (uColorMode < 0.5) {
		return vec3(mask);
	}

	// Full A→B→C ramp: dithered luminance indexes the gradient map
	float quantized = floor(dithered * (levels - 1.0) + 0.5) / (levels - 1.0);
	return sampleGradient(quantized);
}

vec4 asciiPass(vec2 uv) {
	vec2 cell = resolution / max(uCellSize, 2.0);
	vec2 grid = 1.0 / cell;
	vec2 pixelizedUV = grid * (0.5 + floor(uv / grid));
	vec4 pixelized = texture2D(inputBuffer, pixelizedUV);
	float grey = luminance(toneCompress(pixelized.rgb));
	grey = clamp(grey + uBias, 0.0, 1.0);

	if (uInvert > 0.5) {
		grey = 1.0 - grey;
	}

	float characterIndex = floor((max(uCharactersCount, 2.0) - 1.0) * grey);
	vec2 characterPosition = vec2(
		mod(characterIndex, ASCII_ATLAS.x),
		floor(characterIndex / ASCII_ATLAS.x)
	);
	vec2 offset = vec2(characterPosition.x, -characterPosition.y) / ASCII_ATLAS;
	vec2 charUV = mod(uv * (cell / ASCII_ATLAS), 1.0 / ASCII_ATLAS) - vec2(0.0, 1.0 / ASCII_ATLAS) + offset;
	float glyph = texture2D(uCharacters, charUV).r;

	vec3 color;
	if (uColorMode < 0.5) {
		color = vec3(glyph);
	} else {
		vec3 paper = sampleGradient(0.0);
		vec3 ink = sampleGradient(grey);
		color = mix(paper, ink, glyph);
	}

	return vec4(color, 1.0);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	// Model-only: skip sky/clear pixels (depth at far plane).
	if (uIncludeBackground < 0.5) {
		float depth = readDepth(uv);
		if (depth >= 0.9999) {
			outputColor = inputColor;
			return;
		}
	}

	if (abs(uMode - 2.0) < 0.5) {
		outputColor = asciiPass(uv);
		return;
	}

	vec2 fragCoord = uv * resolution;
	float pixelSize = max(uGridSize * uPixelSizeRatio, 1.0);
	vec2 pixelatedUV = floor(fragCoord / pixelSize) * pixelSize / resolution;
	float lum = luminance(toneCompress(texture2D(inputBuffer, pixelatedUV).rgb));
	float adjustedLum = clamp(lum + uBias, 0.0, 1.0);

	float threshold;
	float paperMask;

	if (abs(uMode - 0.0) < 0.5) {
		threshold = bayerThreshold4(fragCoord, max(uGridSize, 1.0));

		vec2 cellUV = fract(fragCoord / max(pixelSize * 2.0, 1.0)) - 0.5;
		float dist = length(cellUV);
		float radius = (1.0 - adjustedLum) * 0.72 * uDotScale;
		float dotPaper = dist < radius ? 0.0 : 1.0;
		float orderedPaper = step(threshold, adjustedLum);
		float useDots = smoothstep(0.15, 0.85, uDotScale);

		paperMask = mix(orderedPaper, dotPaper, useDots);
	} else {
		threshold = texture2D(uNoise, fragCoord / max(uNoiseScale, 1.0)).r;
		paperMask = step(threshold, adjustedLum);
	}

	outputColor = vec4(shade(adjustedLum, threshold, paperMask), 1.0);
}
