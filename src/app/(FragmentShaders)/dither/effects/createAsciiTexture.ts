import * as THREE from 'three';

/** Dark → light density (same charset as @react-three/postprocessing ASCII). */
const DEFAULT_CHARACTERS = " .:,'-^=*+?!|0#X%WM@";

export function createAsciiTexture(
	characters: string = DEFAULT_CHARACTERS,
	font = 'arial',
	fontSize = 64
): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	const size = 1024;
	const columns = 16;
	const cell = size / columns;

	canvas.width = size;
	canvas.height = size;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Could not create 2D canvas context for ASCII atlas');
	}

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, size, size);
	ctx.font = `${fontSize}px ${font}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#ffffff';

	for (let i = 0; i < characters.length; i++) {
		const char = characters[i] ?? ' ';
		const x = i % columns;
		const y = Math.floor(i / columns);
		ctx.fillText(char, x * cell + cell / 2, y * cell + cell / 2);
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.generateMipmaps = false;
	texture.minFilter = THREE.NearestFilter;
	texture.magFilter = THREE.NearestFilter;
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.colorSpace = THREE.NoColorSpace;
	texture.needsUpdate = true;
	texture.userData.charactersCount = characters.length;

	return texture;
}

export { DEFAULT_CHARACTERS };
