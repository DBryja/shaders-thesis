'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { DemoCanvas } from '@/components/DemoCanvas';

import simFrag from './shaders/sim.frag';
import simVert from './shaders/sim.vert';
import fragmentShader from './shaders/void.frag';
import vertexShader from './shaders/void.vert';

const DATA_WIDTH = 512;
const DATA_HEIGHT = 512;
const PARTICLE_COUNT = 100000;

function createInitialPositionTexture(): THREE.DataTexture {
	const data = new Float32Array(PARTICLE_COUNT * 4);
	for (let i = 0; i < PARTICLE_COUNT; i++) {
		data[i * 4] = (Math.random() - 0.5) * 4.0; // full width spread
		data[i * 4 + 1] = 1.5 + Math.random() * 1.0; // all start ABOVE viewport, staggered
		data[i * 4 + 2] = Math.random(); // life
		data[i * 4 + 3] = 0; // attracted
	}
	const tex = new THREE.DataTexture(data, DATA_WIDTH, DATA_HEIGHT, THREE.RGBAFormat, THREE.FloatType);
	tex.needsUpdate = true;
	return tex;
}

function createInitialVelocityTexture(): THREE.DataTexture {
	const data = new Float32Array(PARTICLE_COUNT * 4);
	for (let i = 0; i < PARTICLE_COUNT; i++) {
		data[i * 4] = (Math.random() - 0.5) * 0.0002;
		data[i * 4 + 1] = -0.001 - Math.random() * 0.002; // initial downward velocity
		data[i * 4 + 2] = 0;
		data[i * 4 + 3] = 0;
	}
	const tex = new THREE.DataTexture(data, DATA_WIDTH, DATA_HEIGHT, THREE.RGBAFormat, THREE.FloatType);
	tex.needsUpdate = true;
	return tex;
}

function createBlurredAttractorTexture(img: HTMLImageElement): THREE.DataTexture {
	const size = 512;
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;
	canvas.width = size;
	canvas.height = size;

	// Draw image centered in square canvas
	const imgAspect = img.width / img.height;
	let drawW: number, drawH: number, drawX: number, drawY: number;
	if (imgAspect > 1) {
		drawW = size;
		drawH = size / imgAspect;
		drawX = 0;
		drawY = (size - drawH) / 2;
	} else {
		drawH = size;
		drawW = size * imgAspect;
		drawX = (size - drawW) / 2;
		drawY = 0;
	}
	ctx.drawImage(img, drawX, drawY, drawW, drawH);

	const imageData = ctx.getImageData(0, 0, size, size);
	const src = imageData.data;

	const field = new Float32Array(size * size);
	for (let i = 0; i < size * size; i++) {
		field[i] = src[i * 4]! / 255.0;
	}

	// Multi-pass box blur for smooth gradient field
	const blurRadius = 12;
	const temp = new Float32Array(size * size);

	for (let pass = 0; pass < 4; pass++) {
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
	const gpgpuRef = useRef<GPGPUState | null>(null);
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
				uTime: { value: 10000 },
				uDelta: { value: 0.016 },
				uResolution: { value: new THREE.Vector2(DATA_WIDTH, DATA_HEIGHT) },
				uMode: { value: 0 },
			},
		});

		const quadGeo = new THREE.PlaneGeometry(2, 2);
		const quadMesh = new THREE.Mesh(quadGeo, simMaterial);
		const quadScene = new THREE.Scene();
		quadScene.add(quadMesh);
		const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		gpgpuRef.current = { posRT, velRT, simMaterial, quadMesh, quadScene, quadCamera, currentIdx: 0 };
	}

	// Initialize render targets with data textures
	useEffect(() => {
		const g = gpgpuRef.current;
		if (!g) return;

		const posTex = createInitialPositionTexture();
		const velTex = createInitialVelocityTexture();

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

		posTex.dispose();
		velTex.dispose();
		initMat.dispose();
		quadGeo.dispose();
	}, [gl]);

	// Load attractor texture
	useEffect(() => {
		const g = gpgpuRef.current;
		if (!g) return;
		const img = new Image();
		img.onload = () => {
			const tex = createBlurredAttractorTexture(img);
			attractorTexRef.current = tex;
			g.simMaterial.uniforms.uAttractorTex!.value = tex;
		};
		img.src = '/text-distortion-white-text.png';
	}, []);

	const geometry = useMemo(() => {
		const geo = new THREE.BufferGeometry();
		const positions = new Float32Array(PARTICLE_COUNT * 3);
		const dataUvs = new Float32Array(PARTICLE_COUNT * 2);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const x = i % DATA_WIDTH;
			const y = Math.floor(i / DATA_WIDTH);
			dataUvs[i * 2] = (x + 0.5) / DATA_WIDTH;
			dataUvs[i * 2 + 1] = (y + 0.5) / DATA_HEIGHT;
		}

		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geo.setAttribute('aDataUv', new THREE.BufferAttribute(dataUvs, 2));
		return geo;
	}, []);

	const uniforms = useMemo(
		() => ({
			uPositionTex: { value: null as THREE.Texture | null },
			uPixelRatio: { value: 1 },
			uPointSize: { value: 12.0 },
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
