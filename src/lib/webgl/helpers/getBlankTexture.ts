import { DataTexture, Texture } from 'three';

let blankTexture: Texture;

export function getBlankTexture(): Texture {
	if (!blankTexture) {
		const tex = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
		tex.needsUpdate = true;
		blankTexture = tex;
	}
	return blankTexture;
}
