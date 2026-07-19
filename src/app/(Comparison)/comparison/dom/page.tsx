'use client';

import { Leva, useControls } from 'leva';
import { useEffect, useMemo, useRef } from 'react';

import BodyPortal from '@/components/BodyPortal';

import { ComparisonShell } from '../shared/ComparisonShell';
import styles from '../shared/comparison.module.css';
import { cursorDisplacement, dotSize, generateCircleDots } from '../shared/generateDots';
import { useStatsMonitor } from '../shared/useStatsMonitor';

const CIRCLE_RADIUS = 1;

export default function DomDotsPage() {
	const { count, minSize, maxSize, displaceRadius, displaceStrength } = useControls('DOM Dots', {
		count: { value: 800, min: 100, max: 8000, step: 100 },
		minSize: { value: 2, min: 1, max: 12, step: 0.5, label: 'Min size (px)' },
		maxSize: { value: 14, min: 2, max: 28, step: 0.5, label: 'Max size (px)' },
		displaceRadius: { value: 0.35, min: 0.05, max: 1, step: 0.01, label: 'Cursor radius' },
		displaceStrength: { value: 0.22, min: 0, max: 0.8, step: 0.01, label: 'Cursor strength' },
	});

	const viewportRef = useRef<HTMLDivElement>(null);
	const dotsRef = useRef<HTMLDivElement>(null);
	const mouseRef = useRef({ x: 0, y: 0, active: false });
	const stats = useStatsMonitor();

	const seeds = useMemo(() => generateCircleDots(count, CIRCLE_RADIUS), [count]);

	useEffect(() => {
		const viewport = viewportRef.current;
		const layer = dotsRef.current;
		if (!viewport || !layer) return;

		const onMove = (e: PointerEvent) => {
			const rect = viewport.getBoundingClientRect();
			const side = Math.min(rect.width, rect.height);
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			mouseRef.current = {
				x: ((e.clientX - cx) / (side / 2)) * CIRCLE_RADIUS,
				y: (-(e.clientY - cy) / (side / 2)) * CIRCLE_RADIUS,
				active: true,
			};
		};
		const onLeave = () => {
			mouseRef.current.active = false;
		};

		viewport.addEventListener('pointermove', onMove);
		viewport.addEventListener('pointerleave', onLeave);

		let raf = 0;
		const tick = () => {
			stats.begin();
			const rect = viewport.getBoundingClientRect();
			const side = Math.min(rect.width, rect.height);
			const pxPerUnit = side / (CIRCLE_RADIUS * 2);
			const mouse = mouseRef.current;
			const nodes = layer.children;

			for (let i = 0; i < seeds.length; i++) {
				const seed = seeds[i]!;
				const el = nodes[i] as HTMLDivElement | undefined;
				if (!el) continue;

				let x = seed.x;
				let y = seed.y;
				if (mouse.active) {
					const d = cursorDisplacement(
						seed.x,
						seed.y,
						mouse.x,
						mouse.y,
						displaceRadius,
						displaceStrength
					);
					x += d.dx;
					y += d.dy;
				}

				const size = dotSize(seed.radialT, minSize, maxSize);
				el.style.width = `${size}px`;
				el.style.height = `${size}px`;
				el.style.transform = `translate(-50%, -50%) translate(${x * pxPerUnit}px, ${-y * pxPerUnit}px)`;
			}
			stats.end();
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			viewport.removeEventListener('pointermove', onMove);
			viewport.removeEventListener('pointerleave', onLeave);
		};
	}, [seeds, minSize, maxSize, displaceRadius, displaceStrength, stats]);

	return (
		<ComparisonShell
			title="DOM — HTML / CSS / JS"
			subtitle="Każda kropka to osobny element DOM. Pozycje i rozmiary aktualizowane w JS co klatkę."
			activeHref="/comparison/dom"
		>
			<BodyPortal>
				<div data-leva-root>
					<Leva collapsed />
				</div>
			</BodyPortal>
			<div ref={viewportRef} className={styles.viewport}>
				<div
					ref={dotsRef}
					style={{
						position: 'absolute',
						left: '50%',
						top: '50%',
						width: 0,
						height: 0,
					}}
				>
					{seeds.map((seed, i) => (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								borderRadius: '50%',
								background: `hsl(${210 - seed.radialT * 40} 80% ${55 + seed.radialT * 20}%)`,
								willChange: 'transform',
								pointerEvents: 'none',
							}}
						/>
					))}
				</div>
			</div>
		</ComparisonShell>
	);
}
