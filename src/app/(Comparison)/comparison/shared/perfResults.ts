export type PerfStudy = 'dom-canvas-shaders' | 'shader-optimization';

export type PerfEffect = 'dom' | 'canvas' | 'shaders' | 'branching' | 'branchless';

export type FpsPhaseStats = {
	avg: number;
	min: number;
	max: number;
	frames: number;
};

export type PerfCycleResult = {
	id: string;
	timestamp: string;
	study: PerfStudy;
	effect: PerfEffect;
	count: number;
	settleMs: number;
	phaseMs: number;
	idle1: FpsPhaseStats;
	hover: FpsPhaseStats;
	idle2: FpsPhaseStats;
};

const STORAGE_KEY = 'shaders-thesis:perf-cycle-results';

function round(n: number): number {
	return Math.round(n * 100) / 100;
}

export function summarizeFps(samples: number[]): FpsPhaseStats {
	if (samples.length === 0) return { avg: 0, min: 0, max: 0, frames: 0 };
	let min = Infinity;
	let max = -Infinity;
	let sum = 0;
	for (const s of samples) {
		min = Math.min(min, s);
		max = Math.max(max, s);
		sum += s;
	}
	return {
		avg: round(sum / samples.length),
		min: round(min),
		max: round(max),
		frames: samples.length,
	};
}

export function loadPerfResults(): PerfCycleResult[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as PerfCycleResult[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function savePerfResult(result: PerfCycleResult): PerfCycleResult[] {
	const next = [...loadPerfResults(), result];
	localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	return next;
}

export function clearPerfResults(): void {
	localStorage.removeItem(STORAGE_KEY);
}

export function perfResultsToCsv(results: PerfCycleResult[]): string {
	const header = [
		'timestamp',
		'study',
		'effect',
		'count',
		'settle_ms',
		'phase_ms',
		'idle1_fps_avg',
		'idle1_fps_min',
		'idle1_fps_max',
		'idle1_frames',
		'hover_fps_avg',
		'hover_fps_min',
		'hover_fps_max',
		'hover_frames',
		'idle2_fps_avg',
		'idle2_fps_min',
		'idle2_fps_max',
		'idle2_frames',
	].join(',');

	const rows = results.map(r =>
		[
			r.timestamp,
			r.study,
			r.effect,
			r.count,
			r.settleMs,
			r.phaseMs,
			r.idle1.avg,
			r.idle1.min,
			r.idle1.max,
			r.idle1.frames,
			r.hover.avg,
			r.hover.min,
			r.hover.max,
			r.hover.frames,
			r.idle2.avg,
			r.idle2.min,
			r.idle2.max,
			r.idle2.frames,
		].join(',')
	);

	return [header, ...rows].join('\n');
}

export function downloadPerfCsv(results: PerfCycleResult[], filename?: string): void {
	const csv = perfResultsToCsv(results);
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
	a.href = url;
	a.download = filename ?? `perf-cycles-${stamp}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}
