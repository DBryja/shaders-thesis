'use client';

import { useEffect, useMemo, useRef } from 'react';
import Stats from 'stats.js';

type StatsApi = {
	begin: () => void;
	end: () => void;
	update: () => void;
};

/** Mounts stats.js (FPS / MS / MB). Callbacks are stable across renders. */
export function useStatsMonitor(enabled = true): StatsApi {
	const statsRef = useRef<Stats | null>(null);

	useEffect(() => {
		if (!enabled) return;

		const stats = new Stats();
		stats.showPanel(0);
		stats.dom.style.position = 'fixed';
		stats.dom.style.left = '4.5rem';
		stats.dom.style.top = '0.75rem';
		stats.dom.style.zIndex = '10000';
		document.body.appendChild(stats.dom);
		statsRef.current = stats;

		return () => {
			stats.dom.remove();
			statsRef.current = null;
		};
	}, [enabled]);

	return useMemo<StatsApi>(
		() => ({
			begin: () => statsRef.current?.begin(),
			end: () => statsRef.current?.end(),
			update: () => statsRef.current?.update(),
		}),
		[]
	);
}
