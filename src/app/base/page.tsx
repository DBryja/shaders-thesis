'use client';

import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { useRef } from 'react';
import * as THREE from 'three';
import { Timer } from 'three';

import { DemoCanvas } from '@/components/DemoCanvas';

import fragmentShader from './fragment.frag';
import vertexShader from './vertex.vert';

function ShaderMesh() {
	const timerRef = useRef(new Timer());
	const uniformsRef = useRef<{
		uTime: { value: number };
	}>({
		uTime: { value: 0 },
	});

	const { timeMultiplier } = useControls({
		timeMultiplier: {
			value: 1,
			min: 0,
			max: 5,
			step: 0.1,
		},
	});

	useFrame(({}) => {
		timerRef.current.update();
		uniformsRef.current.uTime.value = timerRef.current.getElapsed() * timeMultiplier;
	});

	return (
		<mesh>
			<planeGeometry args={[1, 1, 32, 32]} />
			<shaderMaterial
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				// eslint-disable-next-line
				uniforms={uniformsRef.current}
				side={THREE.DoubleSide}
			/>
		</mesh>
	);
}

export default function Page() {
	return (
		<DemoCanvas camera={{ position: [0, 0, 1], fov: 75 }} lights={false}>
			<ShaderMesh />
		</DemoCanvas>
	);
}
