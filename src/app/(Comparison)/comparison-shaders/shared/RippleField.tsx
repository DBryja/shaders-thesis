'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { generateCircleDots, packPositions } from '../../comparison/shared/generateDots';
import { type PerfEffect } from '../../comparison/shared/perfResults';
import { useRegisterPerfEffect } from '../../comparison/shared/PerfTestProvider';
import { useStatsMonitor } from '../../comparison/shared/useStatsMonitor';

const CIRCLE_RADIUS = 1;

type RippleFieldProps = {
	effect: PerfEffect;
	controlsFolder: string;
	vertexShader: string;
	fragmentShader: string;
};

export function RippleField({ effect, controlsFolder, vertexShader, fragmentShader }: RippleFieldProps) {
	const [count, setCount] = useState(40_000);
	const {
		minSize,
		maxSize,
		displaceRadius,
		displaceStrength,
		swirlStrength,
		waveFreq,
		waveSpeed,
		waveAmp,
		pulseStrength,
	} = useControls(controlsFolder, {
		count: {
			value: 40_000,
			min: 1000,
			max: 1_000_000,
			step: 10_000,
			onChange: setCount,
		},
		minSize: { value: 2, min: 0.5, max: 14, step: 0.5, label: 'Min size (px)' },
		maxSize: { value: 12, min: 2, max: 28, step: 0.5, label: 'Max size (px)' },
		displaceRadius: { value: 0.4, min: 0.05, max: 1.2, step: 0.01, label: 'Cursor radius' },
		displaceStrength: { value: 0.2, min: 0, max: 0.8, step: 0.01, label: 'Repel' },
		swirlStrength: { value: 0.14, min: 0, max: 0.8, step: 0.01, label: 'Swirl' },
		waveFreq: { value: 14, min: 2, max: 40, step: 0.5, label: 'Wave freq' },
		waveSpeed: { value: 2.4, min: 0, max: 8, step: 0.1, label: 'Wave speed' },
		waveAmp: { value: 0.45, min: 0, max: 1.2, step: 0.01, label: 'Wave amp' },
		pulseStrength: { value: 0.04, min: 0, max: 0.2, step: 0.005, label: 'Pulse' },
	});

	const mouseNDC = useRef(new THREE.Vector2(0, 0));
	const mouseActive = useRef(0);
	const { gl, size, camera } = useThree();
	const stats = useStatsMonitor();

	useRegisterPerfEffect({
		study: 'shader-optimization',
		effect,
		getCount: () => count,
		setCount: n => setCount(n),
		getPointerTarget: () => gl.domElement,
	});

	const { geometry, material } = useMemo(() => {
		const seeds = generateCircleDots(count, CIRCLE_RADIUS);
		const packed = packPositions(seeds);
		const positions = new Float32Array(count * 3);
		const radials = new Float32Array(count);
		for (let i = 0; i < count; i++) {
			positions[i * 3] = packed[i * 3]!;
			positions[i * 3 + 1] = packed[i * 3 + 1]!;
			positions[i * 3 + 2] = 0;
			radials[i] = packed[i * 3 + 2]!;
		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geo.setAttribute('aRadial', new THREE.BufferAttribute(radials, 1));

		const mat = new THREE.ShaderMaterial({
			uniforms: {
				uMouse: { value: new THREE.Vector2(0, 0) },
				uMouseActive: { value: 0 },
				uDisplaceRadius: { value: displaceRadius },
				uDisplaceStrength: { value: displaceStrength },
				uSwirlStrength: { value: swirlStrength },
				uMinSize: { value: minSize },
				uMaxSize: { value: maxSize },
				uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
				uTime: { value: 0 },
				uWaveFreq: { value: waveFreq },
				uWaveSpeed: { value: waveSpeed },
				uWaveAmp: { value: waveAmp },
				uPulseStrength: { value: pulseStrength },
			},
			vertexShader,
			fragmentShader,
			transparent: true,
			depthWrite: false,
			blending: THREE.NormalBlending,
		});

		return { geometry: geo, material: mat };
	}, [count, vertexShader, fragmentShader]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		return () => {
			geometry.dispose();
			material.dispose();
		};
	}, [geometry, material]);

	useEffect(() => {
		const el = gl.domElement;
		const onMove = (e: PointerEvent) => {
			const rect = el.getBoundingClientRect();
			mouseNDC.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			mouseNDC.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
			mouseActive.current = 1;
		};
		const onLeave = () => {
			mouseActive.current = 0;
		};
		el.addEventListener('pointermove', onMove);
		el.addEventListener('pointerleave', onLeave);
		return () => {
			el.removeEventListener('pointermove', onMove);
			el.removeEventListener('pointerleave', onLeave);
		};
	}, [gl]);

	useFrame(({ clock }) => {
		const u = material.uniforms;
		u.uMinSize!.value = minSize;
		u.uMaxSize!.value = maxSize;
		u.uDisplaceRadius!.value = displaceRadius;
		u.uDisplaceStrength!.value = displaceStrength;
		u.uSwirlStrength!.value = swirlStrength;
		u.uMouseActive!.value = mouseActive.current;
		u.uPixelRatio!.value = Math.min(gl.getPixelRatio(), 2);
		u.uTime!.value = clock.elapsedTime;
		u.uWaveFreq!.value = waveFreq;
		u.uWaveSpeed!.value = waveSpeed;
		u.uWaveAmp!.value = waveAmp;
		u.uPulseStrength!.value = pulseStrength;

		const cam = camera as THREE.PerspectiveCamera;
		const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5)) * cam.position.z;
		const halfW = halfH * (size.width / Math.max(size.height, 1));
		(u.uMouse!.value as THREE.Vector2).set(mouseNDC.current.x * halfW, mouseNDC.current.y * halfH);

		stats.update();
	});

	return <points geometry={geometry} material={material} frustumCulled={false} />;
}
