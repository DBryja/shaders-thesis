import Link from 'next/link';

export default function Home() {
	return (
		<section className="mx-auto flex w-full max-w-2xl flex-col gap-10">
			<div className="space-y-4">
				<h1 className="text-3xl font-semibold tracking-tight">Shader Thesis</h1>
				<p className="max-w-xl text-sm leading-7 text-neutral-100">
					Minimalistyczny zbior eksperymentow z shaderami i WebGL. Kazda kolejna strona bedzie pokazywac
					osobna technike albo etap rozwoju pracy.
				</p>
			</div>
		</section>
	);
}
