'use client';

import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import Link from 'next/link';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Timer } from 'three';

import perlinNoiseSrc from '@/assets/perlin.png';
import { DemoCanvas } from '@/components/DemoCanvas';

import { GRADIENT_ORDER, GRADIENT_PRESETS, type GradientDefaults, type GradientSlug } from './config';
import styles from './page.module.css';
import vertexShader from './shaders/heroGradient.vert';
import blobFragmentShader from './shaders/heroGradientBlob.frag';
import electricFragmentShader from './shaders/heroGradientElectric.frag';
import metallicFragmentShader from './shaders/heroGradientMetallic.frag';
import snowyFragmentShader from './shaders/heroGradientSnowy.frag';

const PERLIN_TEXTURE_URL = typeof perlinNoiseSrc === 'string' ? perlinNoiseSrc : perlinNoiseSrc.src;

const proceduralControlBase = (defaults: GradientDefaults) =>
	({
		timeMultiplier: { value: defaults.timeMultiplier, min: 0, max: 2, step: 0.01 },
		noiseScale: { value: defaults.noiseScale, min: 0.2, max: 6, step: 0.05 },
		flowX: { value: defaults.flowX, min: -0.35, max: 0.35, step: 0.01 },
		flowY: { value: defaults.flowY, min: -0.35, max: 0.35, step: 0.01 },
		contrast: { value: defaults.contrast, min: 0.35, max: 2.2, step: 0.05 },
		gradientShift: { value: defaults.gradientShift, min: -0.35, max: 0.35, step: 0.01 },
		vignette: { value: defaults.vignette, min: 0, max: 2.5, step: 0.05 },
		saturation: { value: defaults.saturation, min: 0, max: 1.2, step: 0.02 },
		colorDeep: defaults.colorDeep,
		colorMid: defaults.colorMid,
		colorLight: defaults.colorLight,
	}) as const;

function useProceduralGradientControls(defaults: GradientDefaults, label: string, withReach: boolean) {
	const schema = useMemo(
		() =>
			withReach
				? {
						...proceduralControlBase(defaults),
						reach: { value: defaults.reach, min: 0.12, max: 0.52, step: 0.01 },
					}
				: proceduralControlBase(defaults),
		[defaults, withReach]
	);

	return useControls(`Background Gradient (${label})`, schema);
}

function useGradientControls(defaults: GradientDefaults, label: string) {
	return useControls(`Background Gradient (${label})`, {
		...proceduralControlBase(defaults),
	});
}

function ProceduralGradientPlane({
	fragmentShader,
	defaults,
	background,
	label,
	withReach,
}: {
	fragmentShader: string;
	defaults: GradientDefaults;
	background: string;
	label: string;
	withReach: boolean;
}) {
	const timerRef = useRef(new Timer());
	const colorDeep = useRef(new THREE.Color());
	const colorMid = useRef(new THREE.Color());
	const colorLight = useRef(new THREE.Color());

	const uniformsRef = useRef({
		uTime: { value: 0 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uNoiseScale: { value: defaults.noiseScale },
		uFlow: { value: new THREE.Vector2(defaults.flowX, defaults.flowY) },
		uColorDeep: { value: new THREE.Color(defaults.colorDeep) },
		uColorMid: { value: new THREE.Color(defaults.colorMid) },
		uColorLight: { value: new THREE.Color(defaults.colorLight) },
		uContrast: { value: defaults.contrast },
		uGradientShift: { value: defaults.gradientShift },
		uVignette: { value: defaults.vignette },
		uSaturation: { value: defaults.saturation },
		...(withReach ? { uReach: { value: defaults.reach } } : {}),
	});

	const controls = useProceduralGradientControls(defaults, label, withReach);
	const {
		timeMultiplier,
		noiseScale,
		flowX,
		flowY,
		colorDeep: deepHex,
		colorMid: midHex,
		colorLight: lightHex,
		contrast,
		gradientShift,
		vignette,
		saturation,
		reach,
	} = controls as typeof controls & { reach?: number };

	const { size } = useThree();

	useFrame(() => {
		timerRef.current.update();
		const u = uniformsRef.current as typeof uniformsRef.current & { uReach?: { value: number } };
		u.uTime.value = timerRef.current.getElapsed() * timeMultiplier;
		u.uResolution.value.set(size.width, size.height);
		u.uNoiseScale.value = noiseScale;
		u.uFlow.value.set(flowX, flowY);
		u.uContrast.value = contrast;
		u.uGradientShift.value = gradientShift;
		u.uVignette.value = vignette;
		u.uSaturation.value = saturation;
		if (withReach && u.uReach) {
			u.uReach.value = reach ?? defaults.reach;
		}
		colorDeep.current.set(deepHex);
		colorMid.current.set(midHex);
		colorLight.current.set(lightHex);
		u.uColorDeep.value.copy(colorDeep.current);
		u.uColorMid.value.copy(colorMid.current);
		u.uColorLight.value.copy(colorLight.current);
	});

	return (
		<>
			<color attach="background" args={[background]} />
			<mesh>
				<planeGeometry args={[2, 2, 1, 1]} />
				<shaderMaterial
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
					// eslint-disable-next-line react-hooks/refs -- ShaderMaterial: stable uniforms mutated in useFrame
					uniforms={uniformsRef.current}
					side={THREE.DoubleSide}
				/>
			</mesh>
		</>
	);
}

function NoiseTextureGradientPlane({
	fragmentShader,
	defaults,
	background,
	label,
}: {
	fragmentShader: string;
	defaults: GradientDefaults;
	background: string;
	label: string;
}) {
	const loadedNoise = useTexture(PERLIN_TEXTURE_URL);
	const noiseTexture = useMemo(() => {
		const t = loadedNoise.clone();
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.colorSpace = THREE.NoColorSpace;
		t.generateMipmaps = true;
		t.minFilter = THREE.LinearMipmapLinearFilter;
		t.magFilter = THREE.LinearFilter;
		t.needsUpdate = true;
		return t;
	}, [loadedNoise]);

	useEffect(
		() => () => {
			noiseTexture.dispose();
		},
		[noiseTexture]
	);

	const timerRef = useRef(new Timer());
	const colorDeep = useRef(new THREE.Color());
	const colorMid = useRef(new THREE.Color());
	const colorLight = useRef(new THREE.Color());

	const uniformsRef = useRef({
		uTime: { value: 0 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uNoiseScale: { value: defaults.noiseScale },
		uFlow: { value: new THREE.Vector2(defaults.flowX, defaults.flowY) },
		uColorDeep: { value: new THREE.Color(defaults.colorDeep) },
		uColorMid: { value: new THREE.Color(defaults.colorMid) },
		uColorLight: { value: new THREE.Color(defaults.colorLight) },
		uContrast: { value: defaults.contrast },
		uGradientShift: { value: defaults.gradientShift },
		uVignette: { value: defaults.vignette },
		uSaturation: { value: defaults.saturation },
		uNoiseMap: { value: noiseTexture },
	});

	useLayoutEffect(() => {
		uniformsRef.current.uNoiseMap.value = noiseTexture;
	}, [noiseTexture]);

	const controls = useGradientControls(defaults, label);
	const {
		timeMultiplier,
		noiseScale,
		flowX,
		flowY,
		colorDeep: deepHex,
		colorMid: midHex,
		colorLight: lightHex,
		contrast,
		gradientShift,
		vignette,
		saturation,
	} = controls;

	const { size } = useThree();

	useFrame(() => {
		timerRef.current.update();
		const u = uniformsRef.current;
		u.uTime.value = timerRef.current.getElapsed() * timeMultiplier;
		u.uResolution.value.set(size.width, size.height);
		u.uNoiseScale.value = noiseScale;
		u.uFlow.value.set(flowX, flowY);
		u.uContrast.value = contrast;
		u.uGradientShift.value = gradientShift;
		u.uVignette.value = vignette;
		u.uSaturation.value = saturation;
		colorDeep.current.set(deepHex);
		colorMid.current.set(midHex);
		colorLight.current.set(lightHex);
		u.uColorDeep.value.copy(colorDeep.current);
		u.uColorMid.value.copy(colorMid.current);
		u.uColorLight.value.copy(colorLight.current);
	});

	return (
		<>
			<color attach="background" args={[background]} />
			<mesh>
				<planeGeometry args={[2, 2, 1, 1]} />
				<shaderMaterial
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
					// eslint-disable-next-line react-hooks/refs -- ShaderMaterial: stable uniforms mutated in useFrame
					uniforms={uniformsRef.current}
					side={THREE.DoubleSide}
				/>
			</mesh>
		</>
	);
}

export default function FlowingGradientHero({ slug }: { slug: GradientSlug }) {
	const preset = GRADIENT_PRESETS[slug];

	return (
		<div className={styles.page}>
			<div className={styles.canvasLayer}>
				<DemoCanvas orbit={false} lights={false} camera={{ position: [0, 0, 1], fov: 'auto' }}>
					{slug === 'snowy' || slug === 'blob' ? (
						<ProceduralGradientPlane
							key={slug}
							fragmentShader={slug === 'blob' ? blobFragmentShader : snowyFragmentShader}
							defaults={preset.defaults}
							background={preset.background}
							label={preset.label}
							withReach={slug === 'blob'}
						/>
					) : (
						<Suspense fallback={null}>
							<NoiseTextureGradientPlane
								fragmentShader={slug === 'metallic' ? metallicFragmentShader : electricFragmentShader}
								defaults={preset.defaults}
								background={preset.background}
								label={preset.label}
							/>
						</Suspense>
					)}
				</DemoCanvas>
			</div>

			<div className={styles.overlay}>
				<nav className={styles.nav} aria-label="Main navigation">
					<span className={styles.brand}>Northline Studio</span>
					<ul className={styles.links}>
						{GRADIENT_ORDER.map(variant => (
							<li key={variant}>
								<Link href={`/flowing-gradient/${variant}`}>{GRADIENT_PRESETS[variant].label}</Link>
							</li>
						))}
					</ul>
				</nav>

				<header className={styles.hero}>
					<h1 className={styles.heading}>
						<span className={styles.line}>We craft digital</span>
						<span className={styles.line}>experiences that</span>
						<span className={styles.line}>endure.</span>
					</h1>
				</header>
			</div>
		</div>
	);
}
