import { GLTF, GLTFLoader } from 'three-stdlib';

export async function loadGltf(src: string) {
	return new Promise<GLTF>((resolve, reject) => {
		const loader = new GLTFLoader();

		loader.load(
			src,
			m => {
				resolve(m);
			},
			undefined,
			reject
		);
	});
}
