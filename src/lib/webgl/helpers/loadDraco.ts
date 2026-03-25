import { BufferGeometry, NormalBufferAttributes } from 'three';
import { DRACOLoader } from 'three-stdlib';

export async function loadDraco(src: string) {
	return new Promise<BufferGeometry<NormalBufferAttributes>>((resolve, reject) => {
		const loader = new DRACOLoader();

		loader.load(
			src,
			m => {
				resolve(m);
				loader.dispose();
			},
			undefined,
			err => {
				reject(err);
				loader.dispose();
			}
		);
	});
}
