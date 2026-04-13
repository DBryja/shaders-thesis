'use client';

import { useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { type StaticImageData } from 'next/image';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { Timer } from 'three';

import fragmentShader from '../shaders/hoverImage.frag';
import vertexShader from '../shaders/hoverImage.vert';

interface DistortedImageProps {
	images: StaticImageData[];
	activeIndex: number | null;
}

type MouseForce = {
	direction: { x: number; y: number };
	strength: number;
};

type Center = {
	x: number;
	y: number;
};

export interface DistortionHandle {
	setForce: (direction: { x: number; y: number }, strength: number) => void;
	setCenter: (center: Center) => void;
}

interface ShaderUniforms {
	uTime: { value: number };
	uDirection: { value: THREE.Vector2 };
	uStrength: { value: number };
	uTexture: { value: THREE.Texture | null };
}

function DistortedPlane({
	images,
	activeIndex,
	forceRef,
	centerRef,
	frameWidth,
}: {
	images: StaticImageData[];
	activeIndex: number | null;
	forceRef: React.RefObject<MouseForce>;
	centerRef: React.RefObject<Center>;
	frameWidth: number;
}) {
	const textureUrls = images.map(image => image.src);
	const textures = useTexture(textureUrls) as THREE.Texture[];

	const timerRef = useRef(new Timer());
	const materialRef = useRef<THREE.ShaderMaterial | null>(null);
	const cardRef = useRef<THREE.Group | null>(null);
	const currentTextureIndexRef = useRef(0);

	useEffect(() => {
		const material = materialRef.current;
		if (!material || textures.length === 0) return;

		// Inicjalizacja własnych uniformów tylko raz
		const uniforms = material.uniforms as unknown as ShaderUniforms;
		if (!uniforms.uTime) {
			uniforms.uTime = { value: 0 };
			uniforms.uDirection = { value: new THREE.Vector2(0, 0) };
			uniforms.uStrength = { value: 0 };
		}
		const initialIndex = currentTextureIndexRef.current % textures.length;
		uniforms.uTexture = { value: textures[initialIndex] ?? null };
	}, [textures]);

	useEffect(() => {
		if (activeIndex == null || textures.length === 0) return;

		const material = materialRef.current;
		if (!material) return;

		const clampedIndex = ((activeIndex % textures.length) + textures.length) % textures.length;
		currentTextureIndexRef.current = clampedIndex;

		const uniforms = material.uniforms as unknown as ShaderUniforms;
		if (!uniforms.uTexture) {
			uniforms.uTexture = { value: textures[clampedIndex] };
		} else {
			uniforms.uTexture.value = textures[clampedIndex];
		}
	}, [activeIndex, textures]);

	useFrame((state, delta) => {
		const material = materialRef.current;
		const card = cardRef.current;
		if (!material || !card) return;
		const uniforms = material.uniforms as unknown as ShaderUniforms;

		// Pozycja i skala karty w przestrzeni świata
		const { viewport, size } = state;
		const { width: vpWidth, height: vpHeight } = viewport;
		const canvasWidthPx = size.width;
		const center = centerRef.current ?? { x: 0.5, y: 0.5 };
		const aspect = 16.0 / 9.0;
		const targetWidthWorld = (frameWidth / canvasWidthPx) * vpWidth;
		const targetHeightWorld = targetWidthWorld / aspect;
		const targetX = (center.x - 0.5) * vpWidth;
		const targetY = (0.5 - center.y) * vpHeight;

		card.position.lerp(new THREE.Vector3(targetX, targetY, 0), 0.25);
		card.scale.lerp(new THREE.Vector3(targetWidthWorld, targetHeightWorld, 1), 0.25);

		timerRef.current.update();
		uniforms.uTime.value = timerRef.current.getElapsed();

		// Odczyt siły z refa (bez re-renderów Reacta)
		const force = forceRef.current;
		const targetDir = force ? new THREE.Vector2(force.direction.x, -force.direction.y) : new THREE.Vector2(0, 0);
		const targetStrength = force ? force.strength : 0;

		// Aktualizacja kierunku (lerp dla płynności)
		const currentDir = uniforms.uDirection.value;
		currentDir.lerp(targetDir, 0.2);

		// Tłumienie siły w czasie, żeby efekt miękko wygasał
		const currentStrength = uniforms.uStrength.value;
		uniforms.uStrength.value = THREE.MathUtils.damp(currentStrength, targetStrength, 3, delta);
	});

	return (
		<group ref={cardRef}>
			<mesh>
				{/* Jednostkowy plane, skala ustawiana na groupie */}
				<planeGeometry args={[1, 1, 96, 96]} />
				<shaderMaterial
					ref={materialRef}
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
					transparent={false}
				/>
			</mesh>
		</group>
	);
}

// eslint-disable-next-line react/display-name
export const DistortedImage = forwardRef<DistortionHandle, DistortedImageProps>(({ images, activeIndex }, ref) => {
	const forceRef = useRef<MouseForce>({
		direction: { x: 0, y: 0 },
		strength: 0,
	});
	const centerRef = useRef<Center>({ x: 0.5, y: 0.5 });

	useImperativeHandle(
		ref,
		() => ({
			setForce(direction, strength) {
				forceRef.current = { direction, strength };
			},
			setCenter(center) {
				centerRef.current = center;
			},
		}),
		[]
	);
	return (
		<Canvas
			camera={{ position: [0, 0, 2], fov: 50 }}
			gl={{ antialias: true }}
			dpr={[1, 2]}
			style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}
		>
			<DistortedPlane
				images={images}
				activeIndex={activeIndex}
				forceRef={forceRef}
				centerRef={centerRef}
				frameWidth={400}
			/>
		</Canvas>
	);
});
