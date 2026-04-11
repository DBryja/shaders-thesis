// INSPO: https://www.awwwards.com/inspiration/shader-image-distortion-gabriel-veres
'use client';

import styles from './page.module.css';

interface WorkItem {
	title: string;
	description: string;
	year: number;
	image: string;
}

const works: WorkItem[] = [
	{
		title: 'Work 1',
		description: 'Description of work 1.',
		year: 2020,
		image: './design-1.jpeg',
	},
	{
		title: 'Work 2',
		description: 'Description of work 2.',
		year: 2021,
		image: './design-2.jpeg',
	},
	{
		title: 'Work 3',
		description: 'Description of work 3.',
		year: 2022,
		image: './design-3.jpeg',
	},
	{
		title: 'Work 4',
		description: 'Description of work 4.',
		year: 2023,
		image: './design-4.jpeg',
	},
];

export default function Page() {
	const repeatedWorks = [...works, ...works, ...works];

	return (
		<section className="mx-auto h-full flex w-full max-w-2xl flex-col mt-10 items-center justify-center">
			<canvas className="absolute"></canvas>
			<ul className={styles.workList}>
				{repeatedWorks.map((work, index) => (
					<li key={index} className={styles.workItem}>
						<h2 className={styles.workTitle}>{work.title}</h2>
						<p className={styles.workDescription}>{work.description}</p>
						<span className={styles.workYear}>{work.year}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
