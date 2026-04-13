export type GradientDefaults = {
	timeMultiplier: number;
	noiseScale: number;
	flowX: number;
	flowY: number;
	contrast: number;
	gradientShift: number;
	vignette: number;
	saturation: number;
	colorDeep: string;
	colorMid: string;
	colorLight: string;
	reach: number;
};

export type GradientSlug = 'snowy' | 'metallic' | 'electric' | 'blob';

export const GRADIENT_ORDER: GradientSlug[] = ['snowy', 'metallic', 'electric', 'blob'];

export const GRADIENT_PRESETS: Record<
	GradientSlug,
	{
		label: string;
		background: string;
		defaults: GradientDefaults;
	}
> = {
	snowy: {
		label: 'Snowy',
		background: '#080d13',
		defaults: {
			timeMultiplier: 0.25,
			noiseScale: 0.6,
			flowX: 0.03,
			flowY: 0.04,
			contrast: 1.1,
			gradientShift: 0.25,
			vignette: 1.15,
			saturation: 0.82,
			colorDeep: '#0a0627',
			colorMid: '#669ace',
			colorLight: '#95c3e2',
			reach: 0.26,
		},
	},
	metallic: {
		label: 'Metallic',
		background: '#050a12',
		defaults: {
			timeMultiplier: 2.0,
			noiseScale: 6.0,
			flowX: 0.04,
			flowY: 0.025,
			contrast: 0.88,
			gradientShift: 0.08,
			vignette: 1.9,
			saturation: 0.76,
			colorDeep: '#030810',
			colorMid: '#1e4a78',
			colorLight: '#b8cfe8',
			reach: 0.26,
		},
	},
	electric: {
		label: 'Electric',
		background: '#060801',
		defaults: {
			timeMultiplier: 0.32,
			noiseScale: 0.4,
			flowX: 0.0,
			flowY: 0.04,
			contrast: 1.53,
			gradientShift: 0.04,
			vignette: 1.1,
			saturation: 0.37,
			colorDeep: '#0d1a02',
			colorMid: '#5cad0a',
			colorLight: '#f5ff4a',
			reach: 0.26,
		},
	},
	blob: {
		label: 'Blob',
		background: '#140812',
		defaults: {
			timeMultiplier: 0.5,
			noiseScale: 1.9,
			flowX: -0.2,
			flowY: -0.3,
			contrast: 0.35,
			gradientShift: -0.2,
			vignette: 1.0,
			saturation: 1.2,
			colorDeep: '#1a0630',
			colorMid: '#c73e1d',
			colorLight: '#ffd56a',
			reach: 0.28,
		},
	},
};

export function isGradientSlug(value: string): value is GradientSlug {
	return value in GRADIENT_PRESETS;
}
