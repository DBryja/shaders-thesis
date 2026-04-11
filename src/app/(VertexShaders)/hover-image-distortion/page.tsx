// INSPO: https://www.awwwards.com/inspiration/shader-image-distortion-gabriel-veres
'use client';

import cn from 'classnames';
import Image, { type StaticImageData } from 'next/image';
import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';

import design1 from './images/design-1.jpeg';
import design2 from './images/design-2.jpeg';
import design3 from './images/design-3.png';
import design4 from './images/design-4.png';
import styles from './page.module.css';

interface WorkItem {
	title: string;
	description: string;
	year: number;
	image: StaticImageData;
}

const works: WorkItem[] = [
	{
		title: 'Work 1',
		description: 'Description of work 1.',
		year: 2020,
		image: design1,
	},
	{
		title: 'Work 2',
		description: 'Description of work 2.',
		year: 2021,
		image: design2,
	},
	{
		title: 'Work 3',
		description: 'Description of work 3.',
		year: 2022,
		image: design3,
	},
	{
		title: 'Work 4',
		description: 'Description of work 4.',
		year: 2023,
		image: design4,
	},
];

export default function Page() {
	const repeatedWorks = [...works, ...works, ...works];
	const sectionRef = useRef<HTMLElement | null>(null);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [rect, setRect] = useState<DOMRect | null>(null);

	useEffect(() => {
		if (sectionRef.current) {
			setRect(sectionRef.current.getBoundingClientRect());
		}
	}, []);

	const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
		if (!rect) return;
		setCursorPos({
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		});
	};

	const activeWork = activeIndex != null ? repeatedWorks[activeIndex] : null;

	return (
		<section
			ref={sectionRef}
			className="relative mx-auto h-full flex w-full max-w-2xl flex-col mt-10 items-center justify-center"
			onMouseMove={handleMouseMove}
		>
			{activeWork && (
				<div className={cn(styles.imageContainer)} style={{ left: cursorPos.x, top: cursorPos.y }}>
					<Image src={activeWork.image} alt={activeWork.title} fill sizes="400px" className={styles.image} />
				</div>
			)}
			<ul className={styles.workList} onMouseLeave={() => setActiveIndex(null)}>
				{repeatedWorks.map((work, index) => (
					<li key={index} className={styles.workItem} onMouseEnter={() => setActiveIndex(index)}>
						<h2 className={styles.workTitle}>{work.title}</h2>
						<p className={styles.workDescription}>{work.description}</p>
						<span className={styles.workYear}>{work.year}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
