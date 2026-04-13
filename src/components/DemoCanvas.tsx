import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

import BodyPortal from './BodyPortal';

interface DemoCanvasProps {
	children: ReactNode;
	background?: string;
	orbit?: boolean;
	camera?: {
		position?: [number, number, number];
		fov?: number | 'auto';
	};
	lights?: boolean;
}

/** Oblicza FOV (w stopniach) tak, by prostokąt 2×2 w świecie mieścił się w kadrze przy danej odległości i aspect ratio. */
function fitFov(distance: number, aspect: number): number {
	const radToDeg = 180 / Math.PI;
	// Widoczna wysokość = 2·tan(fov/2)·d, szerokość = wysokość·aspect. Chcemy obie >= 2.
	const fovY = 2 * Math.atan(1 / distance);
	const fovX = 2 * Math.atan(1 / (distance * aspect));
	const fovRad = Math.max(fovY, fovX);
	return fovRad * radToDeg;
}

export function DemoCanvas({
	children,
	background: _background = '#0a0a0f',
	orbit = true,
	camera,
	lights = true,
}: DemoCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ width: 1, height: 1 });

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) => {
			const { width, height } = entry?.contentRect ?? { width: 1, height: 1 };
			setSize({ width, height });
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const position = camera?.position ?? [0, 0, 5];
	const distance = Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2);
	const aspect = size.width / size.height - 0.05;

	const calculatedFov =
		camera?.fov === 'auto' ? fitFov(distance, aspect) : typeof camera?.fov === 'number' ? camera.fov : 50;

	return (
		<div ref={containerRef} className="relative h-full w-full">
			<BodyPortal>
				<div data-leva-root>
					<Leva
						collapsed
						theme={{
							colors: {
								accent1: '#007bff',
								accent2: '#3399ff',
								accent3: '#66b3ff',
								elevation1: '#1a1a1a',
								elevation2: '#2a2a2a',
								elevation3: '#3a3a3a',
								highlight1: '#ffffff',
								highlight2: '#f0f0f0',
								highlight3: '#e0e0e0',
							},
						}}
					/>
				</div>
			</BodyPortal>

			<Canvas
				camera={{
					position,
					fov: calculatedFov,
				}}
				gl={{ antialias: true }}
				dpr={[1, 2]}
			>
				{orbit && <OrbitControls />}
				{lights && (
					<>
						<ambientLight intensity={0.6} />
						<directionalLight position={[5, 5, 5]} intensity={1} />
					</>
				)}
				{children}
			</Canvas>
		</div>
	);
}
