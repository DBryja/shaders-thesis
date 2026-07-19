'use client';

import { Center, Environment, useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { folder, useControls } from 'leva';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import perlinNoiseSrc from '@/assets/perlin-noise-500.png';
import { DemoCanvas } from '@/components/DemoCanvas';

import { createAsciiTexture, DEFAULT_CHARACTERS } from './effects/createAsciiTexture';
import { createGradientMap } from './effects/createGradientMap';
import { type DitherColorMode, DitherEffect, type DitherMode } from './effects/DitherEffect';
import styles from './page.module.css';

const HELMET_URL = '/dither/gt3-helmet.gltf';
const PERLIN_URL = typeof perlinNoiseSrc === 'string' ? perlinNoiseSrc : perlinNoiseSrc.src;

useGLTF.preload(HELMET_URL);

function prepareHelmetMaterials(root: THREE.Object3D) {
	root.traverse(obj => {
		if (!(obj as THREE.Mesh).isMesh) return;
		const mesh = obj as THREE.Mesh;
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
		for (const material of materials) {
			if (!material || !(material instanceof THREE.MeshStandardMaterial)) continue;

			// Model ships with roughness 0 on polycarbonate — Environment blows those faces to white.
			material.roughness = Math.max(material.roughness, 0.45);
			material.metalness = Math.min(material.metalness, 0.25);
			material.envMapIntensity = 0.35;
			material.needsUpdate = true;
		}
	});
}

function HelmetModel() {
	const groupRef = useRef<THREE.Group>(null);
	const { scene } = useGLTF(HELMET_URL);

	const cloned = useMemo(() => {
		const root = scene.clone(true);
		prepareHelmetMaterials(root);
		return root;
	}, [scene]);

	useFrame((_, delta) => {
		if (groupRef.current) {
			groupRef.current.rotation.y += delta * 0.12;
		}
	});

	return (
		<Center>
			<group ref={groupRef}>
				<primitive object={cloned} scale={1} />
			</group>
		</Center>
	);
}

function configureNoiseTexture(texture: THREE.Texture) {
	const configured = texture.clone();
	configured.wrapS = THREE.RepeatWrapping;
	configured.wrapT = THREE.RepeatWrapping;
	configured.minFilter = THREE.NearestFilter;
	configured.magFilter = THREE.NearestFilter;
	configured.colorSpace = THREE.NoColorSpace;
	configured.needsUpdate = true;
	return configured;
}

function useDitherControls() {
	return useControls('Dither Post-Processing', {
		mode: {
			value: 'halftone',
			options: ['halftone', 'noise', 'ascii'],
		},
		colorMode: {
			value: 'gradient',
			options: ['bw', 'gradient'],
		},
		includeBackground: {
			value: false,
			label: 'Dither background',
		},
		Pattern: folder({
			gridSize: { value: 3, min: 1, max: 24, step: 1, label: 'Grid size' },
			pixelSizeRatio: { value: 1, min: 1, max: 10, step: 1, label: 'Pixelation' },
			bias: { value: 0.0, min: -0.5, max: 0.5, step: 0.01, label: 'Bias' },
			invert: { value: false, label: 'Invert' },
			dotScale: { value: 0.85, min: 0, max: 1.5, step: 0.01, label: 'Halftone dots' },
			ditherStrength: { value: 0.15, min: 0, max: 2, step: 0.05, label: 'Dither strength' },
		}),
		Noise: folder({
			noiseScale: { value: 16, min: 16, max: 512, step: 1, label: 'Noise scale' },
		}),
		ASCII: folder({
			cellSize: { value: 10, min: 4, max: 32, step: 1, label: 'Cell size' },
		}),
		Gradient: folder({
			gradientLevels: { value: 3, min: 2, max: 16, step: 1, label: 'Levels' },
			gradientA: { value: '#1600ff', label: 'Dark (A)' },
			gradientB: { value: '#ff6200', label: 'Mid (B)' },
			gradientC: { value: '#ffffff', label: 'Light (C)' },
		}),
	});
}

function CustomDitherEffect({
	mode,
	colorMode,
	includeBackground,
	gridSize,
	pixelSizeRatio,
	bias,
	noiseScale,
	cellSize,
	invert,
	dotScale,
	gradientLevels,
	ditherStrength,
	gradientA,
	gradientB,
	gradientC,
}: {
	mode: string;
	colorMode: string;
	includeBackground: boolean;
	gridSize: number;
	pixelSizeRatio: number;
	bias: number;
	noiseScale: number;
	cellSize: number;
	invert: boolean;
	dotScale: number;
	gradientLevels: number;
	ditherStrength: number;
	gradientA: string;
	gradientB: string;
	gradientC: string;
}) {
	const sourceNoise = useTexture(PERLIN_URL);
	const effectRef = useRef<DitherEffect | null>(null);

	const resources = useMemo(() => {
		const noiseTexture = configureNoiseTexture(sourceNoise);
		const asciiTexture = createAsciiTexture(DEFAULT_CHARACTERS);
		const gradientMap = createGradientMap([
			{ color: '#0b1d2a', position: 0 },
			{ color: '#e85d04', position: 0.5 },
			{ color: '#fff3b0', position: 1 },
		]);
		const effect = new DitherEffect({
			mode: 'halftone',
			colorMode: 'bw',
			noiseTexture,
			asciiTexture,
			gradientMap,
			charactersCount: DEFAULT_CHARACTERS.length,
			pixelSizeRatio: 2,
			cellSize: 10,
			gradientLevels: 6,
			ditherStrength: 1,
		});

		return { effect, noiseTexture, asciiTexture, gradientMap };
	}, [sourceNoise]);

	useEffect(() => {
		effectRef.current = resources.effect;
		resources.effect.setAsciiTexture(resources.asciiTexture, DEFAULT_CHARACTERS.length);
		resources.effect.setNoiseTexture(resources.noiseTexture);
		resources.effect.setGradientMap(resources.gradientMap);

		return () => {
			const activeGradient = resources.effect.uniforms.get('uGradientMap')?.value as THREE.Texture | undefined;
			resources.effect.dispose();
			resources.asciiTexture.dispose();
			resources.noiseTexture.dispose();
			if (activeGradient && activeGradient !== resources.gradientMap) {
				activeGradient.dispose();
			}
			resources.gradientMap.dispose();
			effectRef.current = null;
		};
	}, [resources]);

	useEffect(() => {
		const next = createGradientMap([
			{ color: gradientA, position: 0 },
			{ color: gradientB, position: 0.5 },
			{ color: gradientC, position: 1 },
		]);
		const prev = resources.effect.uniforms.get('uGradientMap')?.value as THREE.Texture | undefined;
		resources.effect.setGradientMap(next);
		if (prev && prev !== resources.gradientMap) {
			prev.dispose();
		}
	}, [resources, gradientA, gradientB, gradientC]);

	useFrame(() => {
		const pass = effectRef.current;
		if (!pass) return;

		pass.setMode(mode as DitherMode);
		pass.setColorMode(colorMode as DitherColorMode);
		pass.setGridSize(gridSize);
		pass.setPixelSizeRatio(pixelSizeRatio);
		pass.setBias(bias);
		pass.setNoiseScale(noiseScale);
		pass.setCellSize(cellSize);
		pass.setInvert(invert);
		pass.setDotScale(dotScale);
		pass.setGradientLevels(gradientLevels);
		pass.setDitherStrength(ditherStrength);
		pass.setIncludeBackground(includeBackground);

		const ascii = pass.uniforms.get('uCharacters')?.value as THREE.Texture | undefined;
		if (ascii) ascii.needsUpdate = true;
	});

	return <primitive object={resources.effect} dispose={null} />;
}

function DitherPostProcessing() {
	const controls = useDitherControls();
	const {
		mode,
		colorMode,
		includeBackground,
		gridSize,
		pixelSizeRatio,
		bias,
		noiseScale,
		cellSize,
		invert,
		dotScale,
		gradientLevels,
		ditherStrength,
		gradientA,
		gradientB,
		gradientC,
	} = controls;

	return (
		<EffectComposer key={`${mode}-${colorMode}-${includeBackground}`} multisampling={0} depthBuffer>
			<CustomDitherEffect
				mode={mode}
				colorMode={colorMode}
				includeBackground={includeBackground}
				gridSize={gridSize}
				pixelSizeRatio={pixelSizeRatio}
				bias={bias}
				noiseScale={noiseScale}
				cellSize={cellSize}
				invert={invert}
				dotScale={dotScale}
				gradientLevels={gradientLevels}
				ditherStrength={ditherStrength}
				gradientA={gradientA}
				gradientB={gradientB}
				gradientC={gradientC}
			/>
		</EffectComposer>
	);
}

function Scene() {
	const [background, setBackground] = useState('#1a1a1a');
	const { envIntensity, lightIntensity } = useControls('Scene', {
		background: {
			value: '#1a1a1a',
			label: 'Background',
			onChange: setBackground,
		},
		envIntensity: { value: 0.75, min: 0, max: 1.5, step: 0.05, label: 'Env intensity' },
		lightIntensity: { value: 1.5, min: 0, max: 2, step: 0.05, label: 'Key light' },
	});

	return (
		<>
			<color key={background} attach="background" args={[background]} />
			<ambientLight intensity={0.45} />
			<directionalLight position={[3.5, 5, 4]} intensity={lightIntensity} />
			<directionalLight position={[-3, 1.5, -2]} intensity={0.25} />
			<Environment preset="warehouse" environmentIntensity={envIntensity} />
			<Suspense fallback={null}>
				<HelmetModel />
			</Suspense>
			<DitherPostProcessing />
		</>
	);
}

export default function DitherDemo() {
	return (
		<div className={styles.page}>
			<div className={styles.canvasLayer}>
				<DemoCanvas camera={{ position: [0, 0.25, 120], fov: 35 }} lights={false} orbit>
					<Suspense fallback={null}>
						<Scene />
					</Suspense>
				</DemoCanvas>
			</div>
		</div>
	);
}
