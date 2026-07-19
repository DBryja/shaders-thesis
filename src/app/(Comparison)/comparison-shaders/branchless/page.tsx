'use client';

import { DemoCanvas } from '@/components/DemoCanvas';

import { RippleField } from '../shared/RippleField';
import { ShaderStudyShell } from '../shared/ShaderStudyShell';
import fragmentShader from './shaders/ripple.frag';
import vertexShader from './shaders/ripple.vert';

export default function BranchlessPage() {
	return (
		<ShaderStudyShell
			title="Branchless"
			subtitle="Te same obliczenia bez rozgałęzień: mix, clamp, smoothstep, inversesqrt — bez discard w fragmencie."
			activeHref="/comparison-shaders/branchless"
		>
			<DemoCanvas orbit={false} lights={false} camera={{ position: [0, 0, 2.5], fov: 50 }}>
				<color attach="background" args={['#07070a']} />
				<RippleField controlsFolder="Branchless" vertexShader={vertexShader} fragmentShader={fragmentShader} />
			</DemoCanvas>
		</ShaderStudyShell>
	);
}
