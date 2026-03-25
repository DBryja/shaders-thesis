export function loadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const _img = new Image();
		_img.onload = () => resolve(_img);
		_img.onerror = reject;
		_img.src = src;
	});
}
