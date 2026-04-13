import { notFound } from 'next/navigation';

import FlowingGradientHero from '../FlowingGradientHero';
import { GRADIENT_ORDER, isGradientSlug } from '../config';

export function generateStaticParams() {
	return GRADIENT_ORDER.map(slug => ({ slug }));
}

export default async function FlowingGradientVariantPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;

	if (!isGradientSlug(slug)) {
		notFound();
	}

	return <FlowingGradientHero slug={slug} />;
}
