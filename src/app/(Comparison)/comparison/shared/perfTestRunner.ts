import {
	type FpsPhaseStats,
	type PerfCycleResult,
	type PerfEffect,
	type PerfStudy,
	savePerfResult,
	summarizeFps,
} from './perfResults';

export type PerfEffectAdapter = {
	study: PerfStudy;
	effect: PerfEffect;
	getCount: () => number;
	setCount: (count: number) => void;
	/** Element that listens for pointermove / pointerleave (viewport or canvas). */
	getPointerTarget: () => HTMLElement | null;
};

const PHASE_MS = 1000;
const SETTLE_MS = 600;

function wait(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function nextFrame(): Promise<number> {
	return new Promise(resolve => requestAnimationFrame(t => resolve(t)));
}

async function sampleFps(durationMs: number): Promise<FpsPhaseStats> {
	const samples: number[] = [];
	let last = await nextFrame();
	const end = last + durationMs;
	while (performance.now() < end) {
		const now = await nextFrame();
		const dt = now - last;
		last = now;
		if (dt > 0 && dt < 1000) samples.push(1000 / dt);
	}
	return summarizeFps(samples);
}

function dispatchPointer(
	el: HTMLElement,
	type: 'pointermove' | 'pointerenter' | 'pointerleave' | 'pointerdown' | 'pointerup',
	clientX: number,
	clientY: number
) {
	el.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			composed: true,
			pointerId: 1,
			pointerType: 'mouse',
			isPrimary: true,
			clientX,
			clientY,
			button: 0,
			buttons: type === 'pointerleave' || type === 'pointerup' ? 0 : 0,
		})
	);
}

/** Two full circles across the board — identical path for every effect. */
async function runHoverMotion(el: HTMLElement, durationMs: number): Promise<FpsPhaseStats> {
	const rect = el.getBoundingClientRect();
	const cx = rect.left + rect.width / 2;
	const cy = rect.top + rect.height / 2;
	const radius = Math.min(rect.width, rect.height) * 0.28;

	dispatchPointer(el, 'pointerenter', cx, cy);
	dispatchPointer(el, 'pointermove', cx + radius, cy);

	const samples: number[] = [];
	let last = await nextFrame();
	const start = last;
	const end = start + durationMs;

	while (performance.now() < end) {
		const now = await nextFrame();
		const dt = now - last;
		last = now;
		if (dt > 0 && dt < 1000) samples.push(1000 / dt);

		const t = Math.min(1, (now - start) / durationMs);
		const angle = t * Math.PI * 4; // 2 revolutions
		const x = cx + Math.cos(angle) * radius;
		const y = cy + Math.sin(angle) * radius;
		dispatchPointer(el, 'pointermove', x, y);
	}

	dispatchPointer(el, 'pointerleave', cx, cy);
	return summarizeFps(samples);
}

export type CycleProgress = {
	count: number;
	phase: 'set-count' | 'settle' | 'idle1' | 'hover' | 'idle2' | 'done';
	index: number;
	total: number;
};

export async function runPerfCycle(
	adapter: PerfEffectAdapter,
	count: number,
	onProgress?: (p: CycleProgress) => void,
	index = 0,
	total = 1
): Promise<PerfCycleResult> {
	const report = (phase: CycleProgress['phase']) => onProgress?.({ count, phase, index, total });

	report('set-count');
	adapter.setCount(count);
	await wait(0);
	await nextFrame();
	await nextFrame();

	report('settle');
	await wait(SETTLE_MS);

	const target = adapter.getPointerTarget();
	if (!target) throw new Error('Brak pointer target — efekt nie jest gotowy.');

	// Ensure idle (no hover) before measuring
	const rect = target.getBoundingClientRect();
	dispatchPointer(target, 'pointerleave', rect.left + rect.width / 2, rect.top + rect.height / 2);
	await nextFrame();

	report('idle1');
	const idle1 = await sampleFps(PHASE_MS);

	report('hover');
	const hover = await runHoverMotion(target, PHASE_MS);

	report('idle2');
	const idle2 = await sampleFps(PHASE_MS);

	report('done');

	const result: PerfCycleResult = {
		id: `${Date.now()}-${adapter.effect}-${count}`,
		timestamp: new Date().toISOString(),
		study: adapter.study,
		effect: adapter.effect,
		count,
		settleMs: SETTLE_MS,
		phaseMs: PHASE_MS,
		idle1,
		hover,
		idle2,
	};

	savePerfResult(result);
	return result;
}

export async function runPerfSuite(
	adapter: PerfEffectAdapter,
	counts: number[],
	onProgress?: (p: CycleProgress) => void,
	signal?: { cancelled: boolean }
): Promise<PerfCycleResult[]> {
	const results: PerfCycleResult[] = [];
	for (let i = 0; i < counts.length; i++) {
		if (signal?.cancelled) break;
		const count = counts[i]!;
		results.push(await runPerfCycle(adapter, count, onProgress, i, counts.length));
	}
	return results;
}

export function parseCountList(input: string): number[] {
	return input
		.split(/[,;\s]+/)
		.map(s => Number(s.trim()))
		.filter(n => Number.isFinite(n) && n > 0)
		.map(n => Math.round(n));
}
