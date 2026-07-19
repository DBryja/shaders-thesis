import * as THREE from 'three';

/** Dark → light density (same charset as the previous @react-three/postprocessing ASCII). */
const DEFAULT_CHARACTERS = " .:,'-^=*+?!|0#X%WM@";

const ATLAS_SIZE = 1024;
const COLUMNS = 16;

/**
 * Builds a 16×16 glyph atlas as a CanvasTexture.
 * Layout / wrapping match the emilwidlund ASCII effect so UV math in dither.frag stays valid.
 */
export function createAsciiTexture(
	characters: string = DEFAULT_CHARACTERS,
	font = 'arial',
	fontSize = 64
): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	const cell = ATLAS_SIZE / COLUMNS;

	canvas.width = ATLAS_SIZE;
	canvas.height = ATLAS_SIZE;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Could not create 2D canvas context for ASCII atlas');
	}

	// Transparent background — glyph luminance lives in .r; empty cells stay 0.
	ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
	ctx.font = `${fontSize}px ${font}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#ffffff';

	for (let i = 0; i < characters.length; i++) {
		const char = characters[i] ?? ' ';
		const x = i % COLUMNS;
		const y = Math.floor(i / COLUMNS);
		ctx.fillText(char, x * cell + cell / 2, y * cell + cell / 2);
	}

	const texture = new THREE.CanvasTexture(
		canvas,
		THREE.UVMapping,
		THREE.RepeatWrapping,
		THREE.RepeatWrapping,
		THREE.NearestFilter,
		THREE.NearestFilter
	);
	texture.generateMipmaps = false;
	texture.colorSpace = THREE.NoColorSpace;
	texture.needsUpdate = true;
	texture.userData.charactersCount = characters.length;

	return texture;
}

export { DEFAULT_CHARACTERS };
