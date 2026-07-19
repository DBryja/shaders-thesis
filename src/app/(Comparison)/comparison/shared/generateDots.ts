/** Vogel / sunflower packing — even disk distribution in [-radius, radius]. */
export type DotSeed = {
	x: number;
	y: number;
	/** 0 at center → 1 at rim; size = mix(max, min, t). */
	radialT: number;
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function generateCircleDots(count: number, radius = 1): DotSeed[] {
	const dots: DotSeed[] = new Array(count);
	for (let i = 0; i < count; i++) {
		const t = (i + 0.5) / count;
		const r = radius * Math.sqrt(t);
		const theta = i * GOLDEN_ANGLE;
		dots[i] = {
			x: Math.cos(theta) * r,
			y: Math.sin(theta) * r,
			radialT: r / radius,
		};
	}
	return dots;
}

export function packPositions(dots: DotSeed[]): Float32Array {
	const out = new Float32Array(dots.length * 3);
	for (let i = 0; i < dots.length; i++) {
		const d = dots[i]!;
		out[i * 3] = d.x;
		out[i * 3 + 1] = d.y;
		out[i * 3 + 2] = d.radialT;
	}
	return out;
}

export function dotSize(radialT: number, minSize: number, maxSize: number): number {
	return maxSize + (minSize - maxSize) * radialT;
}

/** Soft push away from cursor. Returns displacement in the same units as positions. */
export function cursorDisplacement(
	x: number,
	y: number,
	mouseX: number,
	mouseY: number,
	radius: number,
	strength: number
): { dx: number; dy: number } {
	const ox = x - mouseX;
	const oy = y - mouseY;
	const dist = Math.hypot(ox, oy);
	if (dist >= radius || dist < 1e-6) return { dx: 0, dy: 0 };
	const t = 1 - dist / radius;
	const force = t * t * strength;
	return { dx: (ox / dist) * force, dy: (oy / dist) * force };
}
