import { Effect, EffectAttribute } from 'postprocessing';
import * as THREE from 'three';

import fragmentShader from './dither.frag';

export type DitherMode = 'halftone' | 'noise' | 'ascii';
export type DitherColorMode = 'bw' | 'gradient';

export type DitherEffectOptions = {
	mode?: DitherMode;
	colorMode?: DitherColorMode;
	gridSize?: number;
	pixelSizeRatio?: number;
	bias?: number;
	noiseScale?: number;
	cellSize?: number;
	invert?: boolean;
	dotScale?: number;
	gradientLevels?: number;
	ditherStrength?: number;
	includeBackground?: boolean;
	noiseTexture?: THREE.Texture;
	asciiTexture?: THREE.Texture;
	gradientMap?: THREE.Texture;
	charactersCount?: number;
};

const MODE_INDEX: Record<DitherMode, number> = {
	halftone: 0,
	noise: 1,
	ascii: 2,
};

const COLOR_MODE_INDEX: Record<DitherColorMode, number> = {
	bw: 0,
	gradient: 1,
};

function emptyTexture() {
	const data = new Uint8Array([255, 255, 255, 255]);
	const texture = new THREE.DataTexture(data, 1, 1);
	texture.needsUpdate = true;
	return texture;
}

function resolveMode(mode: string): number {
	if (mode in MODE_INDEX) return MODE_INDEX[mode as DitherMode];
	const asNumber = Number(mode);
	if (!Number.isNaN(asNumber)) return asNumber;
	return 0;
}

function resolveColorMode(colorMode: string): number {
	if (colorMode in COLOR_MODE_INDEX) return COLOR_MODE_INDEX[colorMode as DitherColorMode];
	const asNumber = Number(colorMode);
	if (!Number.isNaN(asNumber)) return asNumber;
	return 0;
}

export class DitherEffect extends Effect {
	override readonly uniforms: Map<string, THREE.Uniform>;

	constructor({
		mode = 'halftone',
		colorMode = 'bw',
		gridSize = 4,
		pixelSizeRatio = 1,
		bias = 0,
		noiseScale = 128,
		cellSize = 12,
		invert = false,
		dotScale = 1,
		gradientLevels = 6,
		ditherStrength = 1,
		includeBackground = true,
		noiseTexture = emptyTexture(),
		asciiTexture = emptyTexture(),
		gradientMap = emptyTexture(),
		charactersCount = 18,
	}: DitherEffectOptions = {}) {
		const uniforms = new Map<string, THREE.Uniform>([
			['uMode', new THREE.Uniform(resolveMode(mode))],
			['uColorMode', new THREE.Uniform(resolveColorMode(colorMode))],
			['uGridSize', new THREE.Uniform(gridSize)],
			['uPixelSizeRatio', new THREE.Uniform(pixelSizeRatio)],
			['uBias', new THREE.Uniform(bias)],
			['uNoiseScale', new THREE.Uniform(noiseScale)],
			['uCellSize', new THREE.Uniform(cellSize)],
			['uCharactersCount', new THREE.Uniform(charactersCount)],
			['uInvert', new THREE.Uniform(invert ? 1 : 0)],
			['uDotScale', new THREE.Uniform(dotScale)],
			['uGradientLevels', new THREE.Uniform(gradientLevels)],
			['uDitherStrength', new THREE.Uniform(ditherStrength)],
			['uIncludeBackground', new THREE.Uniform(includeBackground ? 1 : 0)],
			['uNoise', new THREE.Uniform(noiseTexture)],
			['uCharacters', new THREE.Uniform(asciiTexture)],
			['uGradientMap', new THREE.Uniform(gradientMap)],
		]);

		super('DitherEffect', fragmentShader, {
			uniforms,
			attributes: EffectAttribute.DEPTH,
		});
		this.uniforms = uniforms;
	}

	setMode(mode: DitherMode | string | number) {
		this.uniforms.get('uMode')!.value = typeof mode === 'number' ? mode : resolveMode(String(mode));
	}

	setColorMode(colorMode: DitherColorMode | string | number) {
		this.uniforms.get('uColorMode')!.value =
			typeof colorMode === 'number' ? colorMode : resolveColorMode(String(colorMode));
	}

	setGridSize(value: number) {
		this.uniforms.get('uGridSize')!.value = value;
	}

	setPixelSizeRatio(value: number) {
		this.uniforms.get('uPixelSizeRatio')!.value = value;
	}

	setBias(value: number) {
		this.uniforms.get('uBias')!.value = value;
	}

	setNoiseScale(value: number) {
		this.uniforms.get('uNoiseScale')!.value = value;
	}

	setCellSize(value: number) {
		this.uniforms.get('uCellSize')!.value = value;
	}

	setInvert(value: boolean) {
		this.uniforms.get('uInvert')!.value = value ? 1 : 0;
	}

	setDotScale(value: number) {
		this.uniforms.get('uDotScale')!.value = value;
	}

	setGradientLevels(value: number) {
		this.uniforms.get('uGradientLevels')!.value = value;
	}

	setDitherStrength(value: number) {
		this.uniforms.get('uDitherStrength')!.value = value;
	}

	setIncludeBackground(value: boolean) {
		this.uniforms.get('uIncludeBackground')!.value = value ? 1 : 0;
	}

	setNoiseTexture(texture: THREE.Texture) {
		this.uniforms.get('uNoise')!.value = texture;
	}

	setAsciiTexture(texture: THREE.Texture, charactersCount?: number) {
		this.uniforms.get('uCharacters')!.value = texture;
		if (typeof charactersCount === 'number') {
			this.uniforms.get('uCharactersCount')!.value = charactersCount;
		}
	}

	setGradientMap(texture: THREE.Texture) {
		this.uniforms.get('uGradientMap')!.value = texture;
	}
}
