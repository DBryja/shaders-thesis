let checkResult: boolean | null = null;

export function isWebgl2Supported() {
	if (checkResult !== null || typeof document === 'undefined') {
		return checkResult;
	}

	checkResult = !!document.createElement('canvas').getContext('webgl2');

	return checkResult;
}
