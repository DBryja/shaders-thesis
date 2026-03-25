import { BufferGeometry, Ray, Vector3 } from 'three';
import { randFloat } from 'three/src/math/MathUtils.js';

export function fillWithPoints(geometry: BufferGeometry, count: number) {
	const dummyTarget = new Vector3(); // to prevent logging of warnings from ray.at() method

	const ray = new Ray();

	geometry.computeBoundingBox();
	const bbox = geometry.boundingBox;

	if (!bbox) return null;

	const points: Vector3[] = [];

	const dir = new Vector3(1, 1, 1).normalize();

	let counter = 0;
	let iterations = count * 100;
	while (counter < count && iterations-- >= 0) {
		const v = new Vector3(
			randFloat(bbox.min.x, bbox.max.x),
			randFloat(bbox.min.y, bbox.max.y),
			randFloat(bbox.min.z, bbox.max.z)
		);
		if (isInside({ v, ray, geometry, dummyTarget, dir })) {
			points.push(v);
			counter++;
		}
	}

	return new BufferGeometry().setFromPoints(points);
}

export type IsInsideProps = {
	v: Vector3;
	ray: Ray;
	geometry: BufferGeometry;
	dummyTarget: Vector3;
	dir: Vector3;
};

export function isInside({ v, ray, geometry, dummyTarget, dir }: IsInsideProps) {
	ray.set(v, dir);
	let counter = 0;

	const pos = geometry.attributes.position;
	
	const faces = pos!.count / 3;

	const vA = new Vector3(),
		vB = new Vector3(),
		vC = new Vector3();
	for (let i = 0; i < faces; i++) {
		vA.fromBufferAttribute(pos!, i * 3 + 0);
		vB.fromBufferAttribute(pos!, i * 3 + 1);
		vC.fromBufferAttribute(pos!, i * 3 + 2);
		if (ray.intersectTriangle(vA, vB, vC, false, dummyTarget)) counter++;
	}

	return counter % 2 == 1;
}

export function getVolume(geometry: BufferGeometry) {
	if (!geometry.isBufferGeometry) {
		console.warn("'geometry' must be an indexed or non-indexed buffer geometry");
		return 0;
	}
	const isIndexed = geometry.index !== null;
	const position = geometry.attributes.position;
	let sum = 0;
	const p1 = new Vector3(),
		p2 = new Vector3(),
		p3 = new Vector3();
	if (!isIndexed) {
		const faces = position!.count / 3;
		for (let i = 0; i < faces; i++) {
			p1.fromBufferAttribute(position!, i * 3 + 0);
			p2.fromBufferAttribute(position!, i * 3 + 1);
			p3.fromBufferAttribute(position!, i * 3 + 2);
			sum += signedVolumeOfTriangle(p1, p2, p3);
		}
	} else {
		const index = geometry.index;
		if (index) {
			const faces = index.count / 3;
			for (let i = 0; i < faces; i++) {
				p1.fromBufferAttribute(position!, index.array[i * 3 + 0]!);
				p2.fromBufferAttribute(position!, index.array[i * 3 + 1]!);
				p3.fromBufferAttribute(position!, index.array[i * 3 + 2]!);
				sum += signedVolumeOfTriangle(p1, p2, p3);
			}
		}
	}
	return sum;
}

export function signedVolumeOfTriangle(p1: Vector3, p2: Vector3, p3: Vector3) {
	return p1.dot(p2.cross(p3)) / 6.0;
}
