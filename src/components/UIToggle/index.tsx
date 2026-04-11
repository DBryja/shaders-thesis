import cn from 'classnames';

import styles from './UIToggle.module.css';

function EyeIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={styles.eyeOn}
		>
			<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

function EyeOffIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={styles.eyeOff}
		>
			<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
			<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
			<path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
			<line x1="2" x2="22" y1="2" y2="22" />
		</svg>
	);
}

export default function UIToggle() {
	return (
		<label
			className={cn(
				styles.toggle,
				'fixed bottom-4 right-4 z-20 rounded-full bg-neutral-800 p-3 text-white shadow-lg hover:bg-neutral-700'
			)}
			aria-label="Toggle UI visibility"
		>
			<EyeOffIcon />
			<EyeIcon />
			<input type="checkbox" className="hidden" id="ui-toggle" />
		</label>
	);
}
