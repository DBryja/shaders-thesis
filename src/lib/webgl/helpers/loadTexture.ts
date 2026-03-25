import { RepeatWrapping, Texture, TextureLoader } from 'three';

export async function loadTexture(src: string) {
	return new Promise<Texture>((resolve, reject) => {
		const loader = new TextureLoader();

		loader.load(
			src,
			t => {
				t.wrapS = RepeatWrapping;
				t.wrapT = RepeatWrapping;
				resolve(t);
			},
			undefined,
			reject
		);
	});
}
