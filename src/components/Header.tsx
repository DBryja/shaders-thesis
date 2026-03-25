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
		<header className="mb-8 flex items-center justify-between border-b border-neutral-200 p-6">
			<Link href="/" className="text-sm tracking-wide text-neutral-100 hover:text-blue-400">
				Shader Thesis
			</Link>
			<nav className="flex items-center gap-4 text-sm text-neutral-100">
				{routes.map(route => (
					<Link key={route.href} href={route.href} className="hover:text-blue-400">
						{route.name}
					</Link>
				))}
			</nav>
		</header>
	);
}
