import Link from 'next/link';

const routes: { name: string; href: string }[] = [
	{
		name: 'Home',
		href: '/',
	},
	{
		name: 'Base',
		href: '/base',
	},
];

export default function Header() {
	return (
		<aside
			id="header"
			className="group fixed left-0 top-0 z-10 flex h-full w-16 flex-col bg-neutral-900 text-white transition-all duration-300 hover:w-48"
		>
			<nav className="flex flex-col gap-4 p-4 text-sm">
				{routes.map(route => (
					<Link
						key={route.href}
						href={route.href}
						className="flex items-center gap-4 rounded-md p-2 hover:bg-neutral-800"
					>
						<span className="w-8 text-center">
							{/* Placeholder for icon */}
							{route.name.charAt(0)}
						</span>
						<span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
							{route.name}
						</span>
					</Link>
				))}
			</nav>
		</aside>
	);
}
