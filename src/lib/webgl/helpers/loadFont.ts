import { Font, FontLoader } from 'three-stdlib';

export async function loadFont(src: string) {
	return new Promise<Font>((resolve, reject) => {
		const loader = new FontLoader();

		loader.load(src, font => resolve(font), undefined, reject);
	});
}
