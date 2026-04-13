import Link from 'next/link';

type RouteGroup = {
	group: string;
	routes: { name: string; href: string }[];
};

const routeGroups: RouteGroup[] = [
	{
		group: 'Main',
		routes: [
			{ name: 'Home', href: '/' },
			{ name: 'Base', href: '/base' },
		],
	},
	{
		group: 'Vertex Shaders',
		routes: [{ name: 'Hover Image Distortion', href: '/hover-image-distortion' }],
	},
	{
		group: 'Fragment Shaders',
		routes: [{ name: 'Flowing Gradient', href: '/flowing-gradient' }],
	},
];

export default function Header() {
	return (
		<aside
			id="header"
			className="group shadow-md shadow-stone-800 rounded-r-lg fixed left-0 top-0 z-10 flex h-full w-64 -translate-x-60 flex-col bg-neutral-900 text-white transition-transform duration-300 hover:translate-x-0"
		>
			<nav className="flex h-full flex-col gap-2 p-4 text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none">
				{routeGroups.map(group => (
					<details key={group.group} className="group/text text-xs text-neutral-200">
						<summary className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-neutral-800">
							<span className="text-xs">
								<span aria-hidden className="inline group-open/text:hidden">
									+
								</span>
								<span aria-hidden className="hidden group-open/text:inline">
									−
								</span>
								<span className="sr-only">Toggle {group.group}</span>
							</span>
							<span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
								{group.group}
							</span>
						</summary>
						<div className="mt-1 flex flex-col gap-1 pl-4">
							{group.routes.map(route => (
								<Link
									key={route.href}
									href={route.href}
									className="flex items-center gap-2 rounded-md px-2 py-1 text-neutral-300 hover:bg-neutral-800 hover:text-white"
								>
									<span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
										{route.name}
									</span>
								</Link>
							))}
						</div>
					</details>
				))}
			</nav>
		</aside>
	);
}
