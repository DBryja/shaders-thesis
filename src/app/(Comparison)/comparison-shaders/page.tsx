import Link from 'next/link';

import styles from '../comparison/shared/comparison.module.css';

const VARIANTS = [
	{
		href: '/comparison-shaders/branching',
		title: 'Branching — warunki',
		desc: 'Ripple field zapisany z if/else, zbędnymi pętlami i discard. Ten sam wynik, droższy control flow na GPU.',
	},
	{
		href: '/comparison-shaders/branchless',
		title: 'Branchless — bez rozgałęzień',
		desc: 'Identyczna matematyka przez mix / clamp / smoothstep / inversesqrt. Porównaj FPS przy tej samej liczbie kropek.',
	},
] as const;

export default function ComparisonShadersHubPage() {
	return (
		<div className={styles.hub}>
			<div className={styles.hubInner}>
				<h1 className={styles.hubTitle}>Shader optimization — branching vs branchless</h1>
				<p className={styles.hubLead}>
					Bardziej złożony efekt niż proste kropki: radialne fale, pulse, repel i swirl od kursora.
					Obie wersje muszą wyglądać tak samo — różni się tylko styl GLSL. Na każdej stronie:{' '}
					<strong>Run suite</strong> (idle → hover → idle, te same counts) + Download CSV.
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
					Porównanie silników renderu:{' '}
					<Link href="/comparison" style={{ color: '#e4e4e7' }}>
						comparison → DOM / Canvas / Shaders
					</Link>
				</p>
			</div>
		</div>
	);
}
