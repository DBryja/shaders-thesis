'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useRef } from 'react';
import * as THREE from 'three';
import { Timer } from 'three';

import { DemoCanvas } from '@/components/DemoCanvas';

import styles from './page.module.css';
import fragmentShader from './shaders/heroGradient.frag';
import vertexShader from './shaders/heroGradient.vert';

function GradientPlane() {
	const timerRef = useRef(new Timer());
	const colorDeep = useRef(new THREE.Color());
	const colorMid = useRef(new THREE.Color());
	const colorLight = useRef(new THREE.Color());

	const uniformsRef = useRef({
		uTime: { value: 0 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uNoiseScale: { value: 0.6 },
		uFlow: { value: new THREE.Vector2(0.03, 0.04) },
		uColorDeep: { value: new THREE.Color('#0a0627') },
		uColorMid: { value: new THREE.Color('#669ace') },
		uColorLight: { value: new THREE.Color('#95c3e2') },
		uContrast: { value: 1.1 },
		uGradientShift: { value: 0.25 },
		uVignette: { value: 1.15 },
		uSaturation: { value: 0.82 },
	});

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
	} = useControls('Background Gradient', {
		timeMultiplier: { value: 0.25, min: 0, max: 2, step: 0.01 },
		noiseScale: { value: 2.2, min: 0.6, max: 6, step: 0.05 },
		flowX: { value: 0.06, min: -0.35, max: 0.35, step: 0.01 },
		flowY: { value: 0.03, min: -0.35, max: 0.35, step: 0.01 },
		contrast: { value: 0.75, min: 0.35, max: 2.2, step: 0.05 },
		gradientShift: { value: 0.06, min: -0.35, max: 0.35, step: 0.01 },
		vignette: { value: 0.6, min: 0, max: 2.5, step: 0.05 },
		saturation: { value: 0.6, min: 0, max: 1.2, step: 0.02 },
		colorDeep: '#111d2e',
		colorMid: '#2c4a68',
		colorLight: '#6a92ad',
	});

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
			<color attach="background" args={['#080d13']} />
			<mesh>
				<planeGeometry args={[2, 2, 1, 1]} />
				<shaderMaterial
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
					// eslint-disable-next-line react-hooks/refs -- stable uniforms object for ShaderMaterial
					uniforms={uniformsRef.current}
					side={THREE.DoubleSide}
				/>
			</mesh>
		</>
	);
}

export default function Page() {
	return (
		<div className={styles.page}>
			<div className={styles.canvasLayer}>
				<DemoCanvas orbit={false} lights={false} camera={{ position: [0, 0, 1], fov: 'auto' }}>
					<GradientPlane />
				</DemoCanvas>
			</div>

			<div className={styles.overlay}>
				<nav className={styles.nav} aria-label="Main navigation">
					<span className={styles.brand}>Northline Studio</span>
					<ul className={styles.links}>
						<li>
							<a href="#work">Work</a>
						</li>
						<li>
							<a href="#services">Services</a>
						</li>
						<li>
							<a href="#journal">Journal</a>
						</li>
						<li>
							<a href="#contact">Contact</a>
						</li>
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
