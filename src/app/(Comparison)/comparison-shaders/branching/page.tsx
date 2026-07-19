'use client';

import { DemoCanvas } from '@/components/DemoCanvas';

import { RippleField } from '../shared/RippleField';
import { ShaderStudyShell } from '../shared/ShaderStudyShell';
import fragmentShader from './shaders/ripple.frag';
import vertexShader from './shaders/ripple.vert';

export default function BranchingPage() {
	return (
		<ShaderStudyShell
			title="Branching (warunki)"
			subtitle="Ten sam ripple field: fale, pulse, repel + swirl. Zapis z if/else, pętlami i discard — identyczny wynik wizualny."
			activeHref="/comparison-shaders/branching"
			effect="branching"
		>
			<DemoCanvas orbit={false} lights={false} camera={{ position: [0, 0, 2.5], fov: 50 }}>
				<color attach="background" args={['#07070a']} />
				<RippleField
					effect="branching"
					controlsFolder="Branching"
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
				/>
			</DemoCanvas>
		</ShaderStudyShell>
	);
}
