'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

import styles from '../../comparison/shared/comparison.module.css';

const VARIANTS = [
	{ href: '/comparison-shaders/branching', label: 'Branching' },
	{ href: '/comparison-shaders/branchless', label: 'Branchless' },
] as const;

type Props = {
	title: string;
	subtitle: string;
	activeHref: (typeof VARIANTS)[number]['href'];
	children: ReactNode;
};

export function ShaderStudyShell({ title, subtitle, activeHref, children }: Props) {
	return (
		<div className={styles.shell}>
			<header className={styles.header}>
				<div className={styles.meta}>
					<p className={styles.eyebrow}>
						<Link href="/comparison-shaders">Shader optimization</Link>
					</p>
					<h1 className={styles.title}>{title}</h1>
					<p className={styles.subtitle}>{subtitle}</p>
				</div>
				<nav className={styles.nav} aria-label="Shader study variants">
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
