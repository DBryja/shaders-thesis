'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

import styles from './comparison.module.css';
import { type PerfEffect } from './perfResults';
import { PerfTestProvider } from './PerfTestProvider';

const VARIANTS = [
	{ href: '/comparison/dom', label: 'DOM', effect: 'dom' as const },
	{ href: '/comparison/canvas', label: 'Canvas', effect: 'canvas' as const },
	{ href: '/comparison/shaders', label: 'Shaders', effect: 'shaders' as const },
] as const;

type ComparisonShellProps = {
	title: string;
	subtitle: string;
	activeHref: (typeof VARIANTS)[number]['href'];
	effect: PerfEffect;
	children: ReactNode;
};

export function ComparisonShell({ title, subtitle, activeHref, effect, children }: ComparisonShellProps) {
	return (
		<PerfTestProvider study="dom-canvas-shaders" effect={effect}>
			<div className={styles.shell}>
				<header className={styles.header}>
					<div className={styles.meta}>
						<p className={styles.eyebrow}>
							<Link href="/comparison">DOM · Canvas · Shaders</Link>
						</p>
						<h1 className={styles.title}>{title}</h1>
						<p className={styles.subtitle}>{subtitle}</p>
					</div>
					<nav className={styles.nav} aria-label="Comparison variants">
						{VARIANTS.map(v => (
							<Link
								key={v.href}
								href={v.href}
								className={v.href === activeHref ? styles.navActive : styles.navLink}
							>
								{v.label}
							</Link>
						))}
					</nav>
				</header>
				<div className={styles.stage}>{children}</div>
			</div>
		</PerfTestProvider>
	);
}
