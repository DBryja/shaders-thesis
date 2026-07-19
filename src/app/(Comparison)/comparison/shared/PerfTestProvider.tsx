'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

import styles from './comparison.module.css';
import {
	clearPerfResults,
	downloadPerfCsv,
	loadPerfResults,
	type PerfCycleResult,
	type PerfEffect,
	type PerfStudy,
} from './perfResults';
import {
	type CycleProgress,
	type PerfEffectAdapter,
	parseCountList,
	runPerfSuite,
} from './perfTestRunner';

const DEFAULT_COUNTS: Record<PerfEffect, string> = {
	dom: '500, 3000, 8000',
	canvas: '500, 3000, 8000, 30000, 50000',
	shaders: '500, 8000, 30000, 50000, 100000, 500000, 1000000',
	branching: '20000, 100000, 500000, 1000000',
	branchless: '20000, 100000, 500000, 1000000',
};

/** Module registry — works across R3F Canvas (no React context bridge needed). */
let activeAdapter: PerfEffectAdapter | null = null;

export function useRegisterPerfEffect(adapter: PerfEffectAdapter) {
	const adapterRef = useRef(adapter);
	adapterRef.current = adapter;

	useEffect(() => {
		const stable: PerfEffectAdapter = {
			study: adapter.study,
			effect: adapter.effect,
			getCount: () => adapterRef.current.getCount(),
			setCount: n => adapterRef.current.setCount(n),
			getPointerTarget: () => adapterRef.current.getPointerTarget(),
		};
		activeAdapter = stable;
		return () => {
			if (activeAdapter === stable) activeAdapter = null;
		};
	}, [adapter.study, adapter.effect]);
}

export function PerfTestProvider({
	study,
	effect,
	children,
}: {
	study: PerfStudy;
	effect: PerfEffect;
	children: ReactNode;
}) {
	const cancelRef = useRef({ cancelled: false });
	const [running, setRunning] = useState(false);
	const [progress, setProgress] = useState<CycleProgress | null>(null);
	const [results, setResults] = useState<PerfCycleResult[]>([]);
	const [countsInput, setCountsInput] = useState(DEFAULT_COUNTS[effect]);
	const [toast, setToast] = useState<string | null>(null);

	useEffect(() => {
		setResults(loadPerfResults());
		setCountsInput(DEFAULT_COUNTS[effect]);
	}, [effect]);

	const showToast = (msg: string) => {
		setToast(msg);
		window.setTimeout(() => setToast(null), 2200);
	};

	const onRun = async () => {
		if (running) return;
		const adapter = activeAdapter;
		if (!adapter || adapter.effect !== effect) {
			showToast('Efekt jeszcze się ładuje — spróbuj za chwilę');
			return;
		}

		const counts = parseCountList(countsInput);
		if (counts.length === 0) {
			showToast('Podaj listę count (np. 1000, 5000)');
			return;
		}

		cancelRef.current = { cancelled: false };
		setRunning(true);
		setProgress(null);
		try {
			await runPerfSuite(adapter, counts, setProgress, cancelRef.current);
			setResults(loadPerfResults());
			showToast(`Zapisano ${counts.length} cykl(i)`);
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'Błąd testu');
		} finally {
			setRunning(false);
			setProgress(null);
		}
	};

	const onCancel = () => {
		cancelRef.current.cancelled = true;
	};

	const onDownload = () => {
		const all = loadPerfResults();
		if (all.length === 0) {
			showToast('Brak wyników');
			return;
		}
		downloadPerfCsv(all);
		showToast(`CSV: ${all.length} wierszy`);
	};

	const onClear = () => {
		clearPerfResults();
		setResults([]);
		showToast('Wyczyszczono localStorage');
	};

	const progressLabel = progress
		? `${progress.index + 1}/${progress.total} · ${progress.count} dots · ${progress.phase}`
		: null;

	return (
		<>
			{children}
			<div className={styles.perfBar} data-perf-ignore>
				<div className={styles.perfMeta}>
					<span className={styles.perfBadge}>{effect}</span>
					<span className={styles.perfHint}>
						cykl: idle 1s → hover 1s → idle 1s · {study}
					</span>
					{running && progressLabel ? (
						<span className={styles.perfProgress}>{progressLabel}</span>
					) : (
						<span className={styles.perfCount}>{results.length} wyników</span>
					)}
				</div>
				<label className={styles.perfCounts}>
					<span>counts</span>
					<input
						value={countsInput}
						onChange={e => setCountsInput(e.target.value)}
						disabled={running}
						spellCheck={false}
					/>
				</label>
				<div className={styles.perfActions}>
					{running ? (
						<button type="button" className={styles.perfBtnDanger} onClick={onCancel}>
							Stop
						</button>
					) : (
						<button type="button" className={styles.perfBtn} onClick={onRun}>
							Run suite
						</button>
					)}
					<button type="button" className={styles.perfBtnGhost} onClick={onDownload} disabled={running}>
						Download CSV
					</button>
					<button type="button" className={styles.perfBtnGhost} onClick={onClear} disabled={running}>
						Clear
					</button>
				</div>
				{toast ? <div className={styles.perfToast}>{toast}</div> : null}
			</div>
		</>
	);
}
