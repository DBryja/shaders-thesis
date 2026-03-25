import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';

import { findMeshByName } from './findMeshByName';

export function wrapWithBbox(root: Object3D, targetName: string, boxName?: string, wireframe = false) {
	const targetObject = findMeshByName(root, targetName);

	if (!targetObject) {
		console.warn(`No mesh named '${targetName}' found.`);
		return;
	}

	if (targetObject.userData.__wrap) {
		return { 
			box: targetObject.userData.__wrap.box as Mesh, 
			group: targetObject.userData.__wrap.group as Group, 
			inner: targetObject.userData.__wrap.inner as Group, 
			targetObject,
		};
	}

	const parent = targetObject.parent;
	const group = new Group();
	const inner = new Group();
	group.name = `${targetObject.name}_GROUP`;
	inner.name = `${targetObject.name}_INNER`;

	if (parent) {
		parent.add(group);
		parent.remove(targetObject);
	}
	group.position.copy(targetObject.position);
	group.rotation.copy(targetObject.rotation);
	group.scale.copy(targetObject.scale);

	targetObject.position.set(0, 0, 0);
	targetObject.rotation.set(0, 0, 0);
	targetObject.scale.set(1, 1, 1);

	group.add(inner);
	inner.add(targetObject);

	const bbox = new Box3().setFromObject(targetObject);
	const size = new Vector3();
	bbox.getSize(size);
	const center = new Vector3();
	bbox.getCenter(center);

	const boxGeo = new BoxGeometry(size.x, size.y, size.z);
	const boxMat = new MeshBasicMaterial({
		color: 0xff00ff,
		wireframe: wireframe,
		transparent: true,
		opacity: wireframe ? 1 : 0,
	});
	const box = new Mesh(boxGeo, boxMat);
	box.name = boxName ?? `${targetObject.name}_BOUNDS`;

	box.position.copy(center.sub(group.position));
	inner.add(box);

	targetObject.userData.__wrap = {
		box,
		group,
		inner,
	};

	return { box, group, inner, targetObject };
}