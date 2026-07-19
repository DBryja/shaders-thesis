import Link from 'next/link';

import styles from './shared/comparison.module.css';

const VARIANTS = [
	{
		href: '/comparison/dom',
		title: '1. DOM (HTML / CSS / JS)',
		desc: 'Każda kropka to element DOM. Najdroższy koszt layoutu i stylów przy rosnącej liczbie węzłów.',
	},
	{
		href: '/comparison/canvas',
		title: '2. Canvas 2D',
		desc: 'Jedna bitmapa, rysowanie łuków w JS. Brak narzutu DOM, ale nadal CPU-bound.',
	},
	{
		href: '/comparison/shaders',
		title: '3. Shaders (WebGL)',
		desc: 'Te same kropki na GPU — równoległe obliczenia pozycji i rozmiaru w vertex shaderze.',
	},
] as const;

export default function ComparisonHubPage() {
	return (
		<div className={styles.hub}>
			<div className={styles.hubInner}>
				<h1 className={styles.hubTitle}>Circle dots — DOM vs Canvas vs Shaders</h1>
				<p className={styles.hubLead}>
					Ten sam efekt: kropki wypełniające koło (większe bliżej środka) + displacement od kursora.
					Na każdej stronie: <strong>Run suite</strong> odpala ten sam cykl (idle 1s → hover 1s → idle
					1s) dla listy count i zapisuje FPS do localStorage / CSV.
				</p>
				<ul className={styles.hubList}>
					{VARIANTS.map(v => (
						<li key={v.href}>
							<Link href={v.href} className={styles.hubCard}>
								<p className={styles.hubCardTitle}>{v.title}</p>
								<p className={styles.hubCardDesc}>{v.desc}</p>
							</Link>
						</li>
					))}
				</ul>
				<p className={styles.hubLead} style={{ marginTop: '2rem' }}>
					Osobne badanie optymalizacji GLSL:{' '}
					<Link href="/comparison-shaders" style={{ color: '#e4e4e7' }}>
						comparison-shaders → branching vs branchless
					</Link>
				</p>
			</div>
		</div>
	);
}
