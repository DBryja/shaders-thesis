import { RepeatWrapping, UVMapping, VideoTexture } from 'three';

export async function loadVideoTexture(src: string, autoplay = false) {
	return new Promise<VideoTexture>((resolve, reject) => {
		const v = document.createElement('video');
		v.muted = true;
		v.playsInline = true;
		v.loop = true;
		v.autoplay = autoplay;

		const t = new VideoTexture(v, UVMapping, RepeatWrapping, RepeatWrapping);

		v.addEventListener(
			'canplay',
			() => {
				if (autoplay) {
					v.play();
				}
				resolve(t);
			},
			{ once: true }
		);
		v.addEventListener('error', err => reject(err), { once: true });

		v.src = src;

		v.load();
	});
}
