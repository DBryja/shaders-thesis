const loadOnceCache: Map<string, Promise<unknown>> = new Map();

export function loadOnce<T>(src: string, loader: (src: string) => Promise<T>): Promise<T> {
	if (loadOnceCache.has(src)) {
		return loadOnceCache.get(src)! as Promise<T>;
	}

	const promise = loader(src);

	loadOnceCache.set(src, promise);

	return promise;
}
