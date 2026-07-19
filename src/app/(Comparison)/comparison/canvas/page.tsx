'use client';

import { Leva, useControls } from 'leva';
import { useEffect, useMemo, useRef, useState } from 'react';

import BodyPortal from '@/components/BodyPortal';

import { ComparisonShell } from '../shared/ComparisonShell';
import styles from '../shared/comparison.module.css';
import { cursorDisplacement, dotSize, generateCircleDots } from '../shared/generateDots';
import { useRegisterPerfEffect } from '../shared/PerfTestProvider';
import { useStatsMonitor } from '../shared/useStatsMonitor';

const CIRCLE_RADIUS = 1;

function CanvasDotsStage() {
	const [count, setCount] = useState(2000);
	const { minSize, maxSize, displaceRadius, displaceStrength } = useControls('Canvas Dots', {
		count: {
			value: 2000,
			min: 100,
			max: 50000,
			step: 100,
			onChange: setCount,
		},
		minSize: { value: 1.5, min: 0.5, max: 10, step: 0.5, label: 'Min size (px)' },
		maxSize: { value: 12, min: 2, max: 24, step: 0.5, label: 'Max size (px)' },
		displaceRadius: { value: 0.35, min: 0.05, max: 1, step: 0.01, label: 'Cursor radius' },
		displaceStrength: { value: 0.22, min: 0, max: 0.8, step: 0.01, label: 'Cursor strength' },
	});


	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mouseRef = useRef({ x: 0, y: 0, active: false });
	const stats = useStatsMonitor();
	const seeds = useMemo(() => generateCircleDots(count, CIRCLE_RADIUS), [count]);

	useRegisterPerfEffect({
		study: 'dom-canvas-shaders',
		effect: 'canvas',
		getCount: () => count,
		setCount: n => setCount(n),
		getPointerTarget: () => canvasRef.current,
	});

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const resize = () => {
			const { width, height } = canvas.getBoundingClientRect();
			canvas.width = Math.max(1, Math.floor(width * dpr));
			canvas.height = Math.max(1, Math.floor(height * dpr));
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(canvas);

		const onMove = (e: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
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
		canvas.addEventListener('pointermove', onMove);
		canvas.addEventListener('pointerleave', onLeave);

		let raf = 0;
		const tick = () => {
			stats.begin();
			const rect = canvas.getBoundingClientRect();
			const w = rect.width;
			const h = rect.height;
			const side = Math.min(w, h);
			const pxPerUnit = side / (CIRCLE_RADIUS * 2);
			const ox = w / 2;
			const oy = h / 2;
			const mouse = mouseRef.current;

			ctx.clearRect(0, 0, w, h);

			for (let i = 0; i < seeds.length; i++) {
				const seed = seeds[i]!;
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
				const hue = 210 - seed.radialT * 40;
				const light = 55 + seed.radialT * 20;
				ctx.beginPath();
				ctx.arc(ox + x * pxPerUnit, oy - y * pxPerUnit, size / 2, 0, Math.PI * 2);
				ctx.fillStyle = `hsl(${hue} 80% ${light}%)`;
				ctx.fill();
			}

			stats.end();
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			canvas.removeEventListener('pointermove', onMove);
			canvas.removeEventListener('pointerleave', onLeave);
		};
	}, [seeds, minSize, maxSize, displaceRadius, displaceStrength, stats]);

	return (
		<>
			<BodyPortal>
				<div data-leva-root>
					<Leva collapsed />
				</div>
			</BodyPortal>
			<canvas ref={canvasRef} className={styles.viewport} />
		</>
	);
}

export default function CanvasDotsPage() {
	return (
		<ComparisonShell
			title="Canvas 2D"
			subtitle="Jedna bitmapa — kropki rysowane przez CanvasRenderingContext2D w pętli rAF."
			activeHref="/comparison/canvas"
			effect="canvas"
		>
			<CanvasDotsStage />
		</ComparisonShell>
	);
}
