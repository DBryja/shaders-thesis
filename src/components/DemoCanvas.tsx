import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

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

export function DemoCanvas({ children, background = '#0a0a0f', orbit = true, camera, lights = true }: DemoCanvasProps) {
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
		<div ref={containerRef} className="h-[80svh] w-[80svh] aspect-square mx-auto border-2">
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
