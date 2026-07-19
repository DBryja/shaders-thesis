import * as THREE from 'three';

export type GradientStop = {
	color: string;
	position: number;
};

export function createGradientMap(stops: GradientStop[], width = 256): THREE.CanvasTexture {
	const height = 8;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Could not create 2D canvas context for gradient map');
	}

	const gradient = ctx.createLinearGradient(0, 0, width, 0);
	const sorted = [...stops].sort((a, b) => a.position - b.position);

	for (const stop of sorted) {
		gradient.addColorStop(THREE.MathUtils.clamp(stop.position, 0, 1), stop.color);
	}

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	const texture = new THREE.CanvasTexture(canvas);
	texture.generateMipmaps = false;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.needsUpdate = true;

	return texture;
}
