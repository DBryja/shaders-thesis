'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

import styles from './comparison.module.css';

const VARIANTS = [
	{ href: '/comparison/dom', label: 'DOM' },
	{ href: '/comparison/canvas', label: 'Canvas' },
	{ href: '/comparison/shaders', label: 'Shaders' },
] as const;

type ComparisonShellProps = {
	title: string;
	subtitle: string;
	activeHref: (typeof VARIANTS)[number]['href'];
	children: ReactNode;
};

export function ComparisonShell({ title, subtitle, activeHref, children }: ComparisonShellProps) {
	return (
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
	);
}
