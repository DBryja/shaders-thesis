'use client';

import { getImageProps, type StaticImageData } from 'next/image';
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

function getOptimizedImage(url: string): string {
	const currentDomain = process.env.NEXT_PUBLIC_URL || 'localhost:3000';
	const img = getImageProps({ src: url, width: 600, height: 338, alt: '' });

	return `${currentDomain}${img.props.src}`;
}

export default function Page() {
	const HIDE_FRAME_DELAY_MS = 220;
	const repeatedWorks = [...works, ...works, ...works];
	const distortionRef = useRef<DistortionHandle | null>(null);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [isFrameVisible, setIsFrameVisible] = useState(false);
	const prevPosRef = useRef<{ x: number; y: number; t: number } | null>(null);
	const decayRafRef = useRef<number | null>(null);
	const hideTimeoutRef = useRef<number | null>(null);
	const lastTickRef = useRef(0);
	const currentForceRef = useRef<{ direction: { x: number; y: number }; strength: number }>({
		direction: { x: 0, y: 0 },
		strength: 0,
	});
	const images = works.map(work => getOptimizedImage(work.image.src));

	useEffect(() => {
		const DECAY_PER_SECOND = 4.2;
		lastTickRef.current = performance.now();

		const tick = (now: number) => {
			const dt = Math.max(0, (now - lastTickRef.current) / 1000);
			lastTickRef.current = now;

			const current = currentForceRef.current;
			if (current.strength > 0.0001) {
				const nextStrength = Math.max(0, current.strength - DECAY_PER_SECOND * dt);
				currentForceRef.current = {
					direction: current.direction,
					strength: nextStrength,
				};
				distortionRef.current?.setForce(current.direction, nextStrength);
			}

			decayRafRef.current = window.requestAnimationFrame(tick);
		};

		decayRafRef.current = window.requestAnimationFrame(tick);
		return () => {
			if (decayRafRef.current) {
				window.cancelAnimationFrame(decayRafRef.current);
			}
			if (hideTimeoutRef.current) {
				window.clearTimeout(hideTimeoutRef.current);
			}
		};
	}, []);

	const applyForce = (direction: { x: number; y: number }, strength: number) => {
		currentForceRef.current = { direction, strength };
		distortionRef.current?.setForce(direction, strength);
	};

	const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
		if (!isFrameVisible || activeIndex == null) return;

		const x = event.clientX;
		const y = event.clientY;

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
				// Aktualizuje impuls od ruchu kursora.
				applyForce({ x: dirX, y: dirY }, strength);
			}
		}

		prevPosRef.current = { x, y, t: now };
	};

	const handleItemEnter = (index: number) => {
		if (hideTimeoutRef.current) {
			window.clearTimeout(hideTimeoutRef.current);
			hideTimeoutRef.current = null;
		}
		setActiveIndex(index % works.length);
		setIsFrameVisible(true);
	};

	const scheduleFrameHide = () => {
		setIsFrameVisible(false);
		prevPosRef.current = null;

		if (hideTimeoutRef.current) {
			window.clearTimeout(hideTimeoutRef.current);
		}

		hideTimeoutRef.current = window.setTimeout(() => {
			setActiveIndex(null);
		}, HIDE_FRAME_DELAY_MS);
	};

	if (images.length === 0) {
		return null;
	}

	return (
		<section className={styles.page} onMouseMove={handleMouseMove}>
			<DistortedImage
				ref={distortionRef}
				images={images}
				activeIndex={activeIndex}
				className={`${styles.frameCanvas} ${isFrameVisible ? styles.frameCanvasVisible : ''}`}
			/>
			<ul className={styles.workList} onMouseLeave={scheduleFrameHide}>
				{repeatedWorks.map((work, index) => (
					<li key={index} className={styles.workItem} onMouseEnter={() => handleItemEnter(index)}>
						<h2 className={styles.workTitle}>{work.title}</h2>
						<p className={styles.workDescription}>{work.description}</p>
						<span className={styles.workYear}>{work.year}</span>
					</li>
				))}
			</ul>

			<p className={styles.credit}>
				INSPIRED BY:{' '}
				<a
					href="https://www.awwwards.com/inspiration/shader-image-distortion-gabriel-veres"
					target="_blank"
					rel="noopener noreferrer"
					className={styles.creditLink}
				>
					https://www.awwwards.com/inspiration/shader-image-distortion-gabriel-veres
				</a>
			</p>
		</section>
	);
}
