'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { DemoCanvas } from '@/components/DemoCanvas';

import simFrag from './shaders/sim.frag';
import simVert from './shaders/sim.vert';
import fragmentShader from './shaders/void.frag';
import vertexShader from './shaders/void.vert';

const DATA_WIDTH = 512;
const DATA_HEIGHT = 512;
const TEXTURE_PIXELS = DATA_WIDTH * DATA_HEIGHT;

const DEFAULTS = {
	dataWidth: DATA_WIDTH,
	dataHeight: DATA_HEIGHT,
	particleCount: (DATA_WIDTH * DATA_HEIGHT) / 2,
	logoWidthRatio: 1,
	gravity: -0.00011,
	windStrength: 0.00599,
	damping: 0.596,
	settleDamping: 0.5,
	attractStrength: 0.0001,
	speedScale: 0.5,
	spawnTop: 1.6,
	spawnBottom: -1.8,
	logoHalfWidth: 1.0,
	pointSize: 10.0,
} as const;

function hash01(n: number): number {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
}

function worldFromCanvasPixel(px: number, py: number, size: number, logoWidthRatio: number): [number, number] {
	const uvX = (px + 0.5) / size;
	const uvY = (py + 0.5) / size;
	const x = (uvX - 0.5) / (logoWidthRatio * 0.5);
	const y = (0.5 - uvY) / 0.5;
	return [x, y];
}

function sampleLogoWorldPositions(
	img: HTMLImageElement,
	maxSamples: number,
	logoWidthRatio: number
): [number, number][] {
	const size = 512;
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;
	canvas.width = size;
	canvas.height = size;

	const imgAspect = img.width / img.height;
	const logoW = size * logoWidthRatio;
	const logoH = logoW / imgAspect;
	const drawX = (size - logoW) / 2;
	const drawY = (size - logoH) / 2;
	ctx.drawImage(img, drawX, drawY, logoW, logoH);

	const { data } = ctx.getImageData(0, 0, size, size);
	const pixels: [number, number][] = [];
	for (let y = 0; y < size; y += 2) {
		for (let x = 0; x < size; x += 2) {
			if (data[(y * size + x) * 4]! > 128) pixels.push([x, y]);
		}
	}

	const count = Math.min(maxSamples, pixels.length);
	const out: [number, number][] = [];
	for (let i = 0; i < count; i++) {
		const idx = Math.floor((i / count) * pixels.length);
		const [px, py] = pixels[idx]!;
		const [wx, wy] = worldFromCanvasPixel(px, py, size, logoWidthRatio);
		out.push([wx + (Math.random() - 0.5) * 0.004, wy + (Math.random() - 0.5) * 0.004]);
	}
	return out;
}

function createInitialPositionTexture(particleCount: number, logoPositions?: [number, number][]): THREE.DataTexture {
	const data = new Float32Array(TEXTURE_PIXELS * 4);
	const logoCount = logoPositions?.length ?? 0;
	const logoSeedCount = Math.min(logoCount, Math.floor(particleCount * 0.38));

	for (let i = 0; i < TEXTURE_PIXELS; i++) {
		if (i < particleCount) {
			if (i < logoSeedCount && logoPositions) {
				const [lx, ly] = logoPositions[i % logoCount]!;
				data[i * 4] = lx;
				data[i * 4 + 1] = ly;
				data[i * 4 + 2] = 1;
				data[i * 4 + 3] = 0.85;
			} else {
				data[i * 4] = (hash01(i * 1.7) - 0.5) * 2.3;
				data[i * 4 + 1] = -1.35 + hash01(i * 2.3 + 17) * 2.85;
				data[i * 4 + 2] = 0.75 + hash01(i * 3.1) * 0.25;
				data[i * 4 + 3] = 0;
			}
		} else {
			data[i * 4] = (hash01(i * 5.1) - 0.5) * 2.3;
			data[i * 4 + 1] = 2.2 + hash01(i * 6.7);
			data[i * 4 + 2] = 0;
			data[i * 4 + 3] = 0;
		}
	}

	const tex = new THREE.DataTexture(data, DATA_WIDTH, DATA_HEIGHT, THREE.RGBAFormat, THREE.FloatType);
	tex.needsUpdate = true;
	return tex;
}

function createInitialVelocityTexture(particleCount: number, logoPositions?: [number, number][]): THREE.DataTexture {
	const data = new Float32Array(TEXTURE_PIXELS * 4);
	const logoSeedCount = Math.min(logoPositions?.length ?? 0, Math.floor(particleCount * 0.38));

	for (let i = 0; i < TEXTURE_PIXELS; i++) {
		if (i < particleCount) {
			if (i < logoSeedCount) {
				data[i * 4] = 0;
				data[i * 4 + 1] = 0;
				data[i * 4 + 2] = 0.9;
				data[i * 4 + 3] = 0;
			} else {
				data[i * 4] = (hash01(i * 4.3) - 0.5) * 0.00003;
				data[i * 4 + 1] = -0.00005 - hash01(i * 8.1) * 0.00004;
				data[i * 4 + 2] = 0;
				data[i * 4 + 3] = 0;
			}
		}
	}
	const tex = new THREE.DataTexture(data, DATA_WIDTH, DATA_HEIGHT, THREE.RGBAFormat, THREE.FloatType);
	tex.needsUpdate = true;
	return tex;
}

function createBlurredAttractorTexture(img: HTMLImageElement, logoWidthRatio: number): THREE.DataTexture {
	const size = 512;
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;
	canvas.width = size;
	canvas.height = size;

	const imgAspect = img.width / img.height;

	const logoW = size * logoWidthRatio;
	const logoH = logoW / imgAspect;
	const drawW = logoW;
	const drawH = logoH;
	const drawX = (size - drawW) / 2;
	const drawY = (size - drawH) / 2;
	ctx.drawImage(img, drawX, drawY, drawW, drawH);

	const imageData = ctx.getImageData(0, 0, size, size);
	const src = imageData.data;

	const field = new Float32Array(size * size);
	for (let i = 0; i < size * size; i++) {
		field[i] = src[i * 4]! / 255.0;
	}

	// Lighter blur — avoids blob-like "power fields" between letters
	const blurRadius = 5;
	const temp = new Float32Array(size * size);

	for (let pass = 0; pass < 2; pass++) {
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				let sum = 0;
				let count = 0;
				for (let dx = -blurRadius; dx <= blurRadius; dx++) {
					const sx = x + dx;
					if (sx >= 0 && sx < size) {
						sum += field[y * size + sx]!;
						count++;
					}
				}
				temp[y * size + x] = sum / count;
			}
		}
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				let sum = 0;
				let count = 0;
				for (let dy = -blurRadius; dy <= blurRadius; dy++) {
					const sy = y + dy;
					if (sy >= 0 && sy < size) {
						sum += temp[sy * size + x]!;
						count++;
					}
				}
				field[y * size + x] = sum / count;
			}
		}
	}

	let maxVal = 0;
	for (let i = 0; i < size * size; i++) {
		maxVal = Math.max(maxVal, field[i]!);
	}
	if (maxVal > 0) {
		for (let i = 0; i < size * size; i++) {
			field[i] = field[i]! / maxVal;
		}
	}

	// R = blurred field (for gradient attraction), G = original (for "on text" settling)
	const outData = new Float32Array(size * size * 4);
	for (let i = 0; i < size * size; i++) {
		outData[i * 4] = field[i]!;
		outData[i * 4 + 1] = src[i * 4]! / 255.0;
		outData[i * 4 + 2] = 0;
		outData[i * 4 + 3] = 1;
	}

	const tex = new THREE.DataTexture(outData, size, size, THREE.RGBAFormat, THREE.FloatType);
	tex.needsUpdate = true;
	tex.wrapS = THREE.ClampToEdgeWrapping;
	tex.wrapT = THREE.ClampToEdgeWrapping;
	tex.minFilter = THREE.LinearFilter;
	tex.magFilter = THREE.LinearFilter;
	return tex;
}

interface GPGPUState {
	posRT: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
	velRT: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
	simMaterial: THREE.ShaderMaterial;
	quadMesh: THREE.Mesh;
	quadScene: THREE.Scene;
	quadCamera: THREE.Camera;
	currentIdx: number;
}

function uploadTextureToTargets(
	gl: THREE.WebGLRenderer,
	g: GPGPUState,
	posTex: THREE.DataTexture,
	velTex: THREE.DataTexture
) {
	const initMat = new THREE.ShaderMaterial({
		vertexShader: simVert,
		fragmentShader: `
			uniform sampler2D uSource;
			varying vec2 vUv;
			void main() {
				gl_FragColor = texture2D(uSource, vUv);
			}
		`,
		uniforms: { uSource: { value: null } },
	});

	const quadGeo = new THREE.PlaneGeometry(2, 2);
	const initMesh = new THREE.Mesh(quadGeo, initMat);
	const initScene = new THREE.Scene();
	initScene.add(initMesh);
	const initCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

	initMat.uniforms.uSource!.value = posTex;
	gl.setRenderTarget(g.posRT[0]);
	gl.render(initScene, initCamera);
	gl.setRenderTarget(g.posRT[1]);
	gl.render(initScene, initCamera);

	initMat.uniforms.uSource!.value = velTex;
	gl.setRenderTarget(g.velRT[0]);
	gl.render(initScene, initCamera);
	gl.setRenderTarget(g.velRT[1]);
	gl.render(initScene, initCamera);

	gl.setRenderTarget(null);

	initMat.dispose();
	quadGeo.dispose();
}

function runWarmupSimulation(gl: THREE.WebGLRenderer, g: GPGPUState, frames: number) {
	const { posRT, velRT, simMaterial, quadScene, quadCamera } = g;
	let curr = 0;

	for (let frame = 0; frame < frames; frame++) {
		const next = 1 - curr;
		const t = frame * 0.016;

		simMaterial.uniforms.uPositions!.value = posRT[curr]!.texture;
		simMaterial.uniforms.uVelocities!.value = velRT[curr]!.texture;
		simMaterial.uniforms.uTime!.value = t;
		simMaterial.uniforms.uDelta!.value = 0.016;
		simMaterial.uniforms.uMode!.value = 1.0;

		gl.setRenderTarget(velRT[next]!);
		gl.render(quadScene, quadCamera);

		simMaterial.uniforms.uVelocities!.value = velRT[next]!.texture;
		simMaterial.uniforms.uMode!.value = 0.0;

		gl.setRenderTarget(posRT[next]!);
		gl.render(quadScene, quadCamera);

		curr = next;
	}

	g.currentIdx = curr;
	gl.setRenderTarget(null);
	simMaterial.uniforms.uTime!.value = frames * 0.016;
}

function createRenderTarget(): THREE.WebGLRenderTarget {
	return new THREE.WebGLRenderTarget(DATA_WIDTH, DATA_HEIGHT, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
	});
}

function ParticleSand() {
	const { viewport, gl } = useThree();
	const pointsRef = useRef<THREE.Points>(null!);
	const matRef = useRef<THREE.ShaderMaterial>(null!);
	const attractorTexRef = useRef<THREE.DataTexture | null>(null);
	const logoImgRef = useRef<HTMLImageElement | null>(null);
	const gpgpuRef = useRef<GPGPUState | null>(null);

	const { dataWidth, dataHeight, particleCount, logoWidthRatio, pointSize } = useControls('System', {
		dataWidth: { value: DEFAULTS.dataWidth, min: 256, max: 1024, step: 64 },
		dataHeight: { value: DEFAULTS.dataHeight, min: 256, max: 1024, step: 64 },
		particleCount: { value: DEFAULTS.particleCount, min: 1000, max: TEXTURE_PIXELS, step: 1000 },
		logoWidthRatio: { value: DEFAULTS.logoWidthRatio, min: 0.2, max: 1, step: 0.01 },
		pointSize: { value: DEFAULTS.pointSize, min: 1, max: 40, step: 0.5 },
	});

	const {
		gravity,
		windStrength,
		damping,
		settleDamping,
		attractStrength,
		speedScale,
		spawnTop,
		spawnBottom,
		logoHalfWidth,
	} = useControls('Simulation', {
		gravity: { value: DEFAULTS.gravity, min: -0.001, max: 0, step: 0.00001 },
		windStrength: { value: DEFAULTS.windStrength, min: 0, max: 0.02, step: 0.0001 },
		damping: { value: DEFAULTS.damping, min: 0.1, max: 0.999, step: 0.001 },
		settleDamping: { value: DEFAULTS.settleDamping, min: 0.1, max: 0.99, step: 0.01 },
		attractStrength: { value: DEFAULTS.attractStrength, min: 0, max: 0.02, step: 0.0001 },
		speedScale: { value: DEFAULTS.speedScale, min: 0.1, max: 2, step: 0.05 },
		spawnTop: { value: DEFAULTS.spawnTop, min: 0.5, max: 3, step: 0.05 },
		spawnBottom: { value: DEFAULTS.spawnBottom, min: -3, max: 0, step: 0.05 },
		logoHalfWidth: { value: DEFAULTS.logoHalfWidth, min: 0.5, max: 2, step: 0.05 },
	});

	if (gpgpuRef.current == null) {
		const posRT: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] = [createRenderTarget(), createRenderTarget()];
		const velRT: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] = [createRenderTarget(), createRenderTarget()];

		const simMaterial = new THREE.ShaderMaterial({
			vertexShader: simVert,
			fragmentShader: simFrag,
			uniforms: {
				uPositions: { value: null },
				uVelocities: { value: null },
				uAttractorTex: { value: null },
				uTime: { value: 0 },
				uDelta: { value: 0.016 },
				uResolution: { value: new THREE.Vector2(DATA_WIDTH, DATA_HEIGHT) },
				uMode: { value: 0 },
				uGravity: { value: DEFAULTS.gravity },
				uWindStrength: { value: DEFAULTS.windStrength },
				uDamping: { value: DEFAULTS.damping },
				uSettleDamping: { value: DEFAULTS.settleDamping },
				uAttractStrength: { value: DEFAULTS.attractStrength },
				uSpeedScale: { value: DEFAULTS.speedScale },
				uSpawnTop: { value: DEFAULTS.spawnTop },
				uSpawnBottom: { value: DEFAULTS.spawnBottom },
				uLogoHalfWidth: { value: DEFAULTS.logoHalfWidth },
				uLogoWidthRatio: { value: DEFAULTS.logoWidthRatio },
			},
		});

		const quadGeo = new THREE.PlaneGeometry(2, 2);
		const quadMesh = new THREE.Mesh(quadGeo, simMaterial);
		const quadScene = new THREE.Scene();
		quadScene.add(quadMesh);
		const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		gpgpuRef.current = { posRT, velRT, simMaterial, quadMesh, quadScene, quadCamera, currentIdx: 0 };
	}

	// Load attractor, seed particles across screen + logo, warm-start simulation
	useEffect(() => {
		const g = gpgpuRef.current;
		if (!g) return;

		const img = new Image();
		img.onload = () => {
			logoImgRef.current = img;
			const attractorTex = createBlurredAttractorTexture(img, DEFAULTS.logoWidthRatio);
			const logoPositions = sampleLogoWorldPositions(img, 12000, DEFAULTS.logoWidthRatio);
			const posTex = createInitialPositionTexture(DEFAULTS.particleCount, logoPositions);
			const velTex = createInitialVelocityTexture(DEFAULTS.particleCount, logoPositions);

			attractorTexRef.current = attractorTex;
			g.simMaterial.uniforms.uAttractorTex!.value = attractorTex;

			uploadTextureToTargets(gl, g, posTex, velTex);
			runWarmupSimulation(gl, g, 90);

			posTex.dispose();
			velTex.dispose();
		};
		img.src = '/text-distortion-white-text.png';
	}, [gl]);

	useEffect(() => {
		const g = gpgpuRef.current;
		const img = logoImgRef.current;
		if (!g || !img) return;

		attractorTexRef.current?.dispose();
		const attractorTex = createBlurredAttractorTexture(img, logoWidthRatio);
		attractorTexRef.current = attractorTex;
		g.simMaterial.uniforms.uAttractorTex!.value = attractorTex;
	}, [logoWidthRatio]);

	const geometry = useMemo(() => {
		const geo = new THREE.BufferGeometry();
		const count = Math.min(particleCount, TEXTURE_PIXELS);
		const positions = new Float32Array(count * 3);
		const dataUvs = new Float32Array(count * 2);

		for (let i = 0; i < count; i++) {
			const x = i % DATA_WIDTH;
			const y = Math.floor(i / DATA_WIDTH);
			dataUvs[i * 2] = (x + 0.5) / DATA_WIDTH;
			dataUvs[i * 2 + 1] = (y + 0.5) / DATA_HEIGHT;
		}

		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geo.setAttribute('aDataUv', new THREE.BufferAttribute(dataUvs, 2));
		return geo;
	}, [particleCount]);

	const uniforms = useMemo(
		() => ({
			uPositionTex: { value: null as THREE.Texture | null },
			uPixelRatio: { value: 1 },
			uPointSize: { value: DEFAULTS.pointSize },
			uScale: { value: 1 },
		}),
		[]
	);

	useFrame((_state, delta) => {
		const g = gpgpuRef.current;
		if (!g) return;
		const mat = matRef.current;
		if (!mat) return;

		const { posRT, velRT, simMaterial, quadScene, quadCamera } = g;
		const curr = g.currentIdx;
		const next = 1 - curr;

		const dt = Math.min(delta, 0.033);

		simMaterial.uniforms.uPositions!.value = posRT[curr]!.texture;
		simMaterial.uniforms.uVelocities!.value = velRT[curr]!.texture;
		simMaterial.uniforms.uTime!.value += dt;
		simMaterial.uniforms.uDelta!.value = dt;
		simMaterial.uniforms.uResolution!.value.set(dataWidth, dataHeight);
		simMaterial.uniforms.uGravity!.value = gravity;
		simMaterial.uniforms.uWindStrength!.value = windStrength;
		simMaterial.uniforms.uDamping!.value = damping;
		simMaterial.uniforms.uSettleDamping!.value = settleDamping;
		simMaterial.uniforms.uAttractStrength!.value = attractStrength;
		simMaterial.uniforms.uSpeedScale!.value = speedScale;
		simMaterial.uniforms.uSpawnTop!.value = spawnTop;
		simMaterial.uniforms.uSpawnBottom!.value = spawnBottom;
		simMaterial.uniforms.uLogoHalfWidth!.value = logoHalfWidth;
		simMaterial.uniforms.uLogoWidthRatio!.value = logoWidthRatio;
		simMaterial.uniforms.uMode!.value = 1.0;

		gl.setRenderTarget(velRT[next]!);
		gl.render(quadScene, quadCamera);

		simMaterial.uniforms.uVelocities!.value = velRT[next]!.texture;
		simMaterial.uniforms.uMode!.value = 0.0;

		gl.setRenderTarget(posRT[next]!);
		gl.render(quadScene, quadCamera);

		gl.setRenderTarget(null);

		g.currentIdx = next;

		mat.uniforms.uPositionTex!.value = posRT[next]!.texture;
		mat.uniforms.uPixelRatio!.value = gl.getPixelRatio();
		mat.uniforms.uPointSize!.value = pointSize;
		mat.uniforms.uScale!.value = viewport.width * 0.5;
	});

	return (
		<points ref={pointsRef} geometry={geometry} frustumCulled={false}>
			<shaderMaterial
				ref={matRef}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
				uniforms={uniforms}
			/>
		</points>
	);
}

export function TextVoid() {
	return (
		<DemoCanvas orbit={false} lights={false} camera={{ position: [0, 0, 5], fov: 'auto' }}>
			<color attach="background" args={['#000000']} />
			<ParticleSand />
		</DemoCanvas>
	);
}
