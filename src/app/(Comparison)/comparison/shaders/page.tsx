'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { DemoCanvas } from '@/components/DemoCanvas';

import { ComparisonShell } from '../shared/ComparisonShell';
import { generateCircleDots, packPositions } from '../shared/generateDots';
import { useStatsMonitor } from '../shared/useStatsMonitor';
import fragmentShader from './shaders/points.frag';
import vertexShader from './shaders/points.vert';

const CIRCLE_RADIUS = 1;

function ShaderPoints() {
	const { count, minSize, maxSize, displaceRadius, displaceStrength } = useControls('Shaders', {
		count: { value: 20_000, min: 1000, max: 1_000_000, step: 10_000 },
		minSize: { value: 2, min: 0.5, max: 16, step: 0.5, label: 'Min size (px)' },
		maxSize: { value: 14, min: 2, max: 32, step: 0.5, label: 'Max size (px)' },
		displaceRadius: { value: 0.35, min: 0.05, max: 1, step: 0.01, label: 'Cursor radius' },
		displaceStrength: { value: 0.22, min: 0, max: 0.8, step: 0.01, label: 'Cursor strength' },
	});

	const mouseNDC = useRef(new THREE.Vector2(0, 0));
	const mouseActive = useRef(0);
	const { gl, size, camera } = useThree();
	const stats = useStatsMonitor();

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
				uMinSize: { value: minSize },
				uMaxSize: { value: maxSize },
				uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
			},
			vertexShader,
			fragmentShader,
			transparent: true,
			depthWrite: false,
			blending: THREE.NormalBlending,
		});

		return { geometry: geo, material: mat };
	}, [count]); // eslint-disable-line react-hooks/exhaustive-deps

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

	useFrame(() => {
		const { uMinSize, uMaxSize, uDisplaceRadius, uDisplaceStrength, uMouseActive, uPixelRatio, uMouse } =
			material.uniforms;
		uMinSize!.value = minSize;
		uMaxSize!.value = maxSize;
		uDisplaceRadius!.value = displaceRadius;
		uDisplaceStrength!.value = displaceStrength;
		uMouseActive!.value = mouseActive.current;
		uPixelRatio!.value = Math.min(gl.getPixelRatio(), 2);

		const cam = camera as THREE.PerspectiveCamera;
		const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5)) * cam.position.z;
		const halfW = halfH * (size.width / Math.max(size.height, 1));
		(uMouse!.value as THREE.Vector2).set(mouseNDC.current.x * halfW, mouseNDC.current.y * halfH);

		stats.update();
	});

	return <points geometry={geometry} material={material} frustumCulled={false} />;
}

export default function ShadersPage() {
	return (
		<ComparisonShell
			title="Shaders (WebGL)"
			subtitle="Te same kropki i displacement co DOM/Canvas, ale pozycje i rozmiary liczone równolegle na GPU."
			activeHref="/comparison/shaders"
		>
			<DemoCanvas orbit={false} lights={false} camera={{ position: [0, 0, 2.5], fov: 50 }}>
				<color attach="background" args={['#07070a']} />
				<ShaderPoints />
			</DemoCanvas>
		</ComparisonShell>
	);
}
