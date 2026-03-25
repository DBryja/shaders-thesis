import { Texture, VideoTexture } from 'three';

export function getTextureSize(texture: Texture | VideoTexture): [number, number] {
	if ((texture as VideoTexture).isVideoTexture) {
		const video = texture.image as HTMLVideoElement;
		return [video.videoWidth, video.videoHeight];
	}

	const image = texture.image as HTMLImageElement;
	return [image.naturalWidth, image.naturalHeight];
}
