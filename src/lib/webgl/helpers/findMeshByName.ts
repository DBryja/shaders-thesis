import { Object3D } from 'three';

export function findMeshByName(root: Object3D, name: string): Object3D | null {
	let targetMesh: Object3D | null = null;

	root.traverse((child) => {
		if (child instanceof Object3D && child.name === name) {
			targetMesh = child;
		}
	});

	return targetMesh;
}