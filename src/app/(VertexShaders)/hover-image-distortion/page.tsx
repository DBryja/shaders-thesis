// INSPO: https://www.awwwards.com/inspiration/shader-image-distortion-gabriel-veres
'use client';

import { type StaticImageData } from 'next/image';
import { type MouseEvent, useEffect, useRef, useState } from 'react';

import { DistortedImage, type DistortionHandle } from './components/DistortedImage';
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
	const distortionRef = useRef<DistortionHandle | null>(null);
	const [activeIndex, setActiveIndex] = useState<number | null>(0);
	const [, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const prevPosRef = useRef<{ x: number; y: number; t: number } | null>(null);
	const images = works.map((work) => work.image);

	const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
		const x = event.clientX;
		const y = event.clientY;
		setCursorPos({ x, y });

		const width = window.innerWidth || 1;
		const height = window.innerHeight || 1;
		const normX = x / width;
		const normY = y / height;
		distortionRef.current?.setCenter({ x: normX, y: normY });

		const now = performance.now();
		const prev = prevPosRef.current;
		if (prev) {
			const dx = x - prev.x;
			const dy = y - prev.y;
			const dist = Math.hypot(dx, dy);
			const dt = Math.max(now - prev.t, 16);

			if (dist > 0.0001) {
				const dirX = dx / dist;
				const dirY = dy / dist;
				const speed = dist / dt; // px / ms
				const strength = Math.min(speed * 0.8, 1);
				// Aktualizujemy siłę na shaderze bez re-renderu Reacta
				distortionRef.current?.setForce({ x: dirX, y: dirY }, strength);
			}
		}

		prevPosRef.current = { x, y, t: now };
	};

	return (
		<section
			className="relative mx-auto h-full flex w-full max-w-2xl flex-col mt-10 items-center justify-center"
			onMouseMove={handleMouseMove}
		>
			<DistortedImage ref={distortionRef} images={images} activeIndex={activeIndex} />
			<ul className={styles.workList} onMouseLeave={() => setActiveIndex(null)}>
				{repeatedWorks.map((work, index) => (
					<li
						key={index}
						className={styles.workItem}
						onMouseEnter={() => setActiveIndex(index % works.length)}
					>
						<h2 className={styles.workTitle}>{work.title}</h2>
						<p className={styles.workDescription}>{work.description}</p>
						<span className={styles.workYear}>{work.year}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
