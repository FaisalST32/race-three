import * as THREE from 'three';

export type ConeOptionsType = {
	planeLength: number;
	planeWidth: number;
	count: number;
	maxConeHeight?: number;
	maxConeRadius?: number;
};

export const createCones = (options: ConeOptionsType): THREE.Mesh[] => {
	const cones: THREE.Mesh[] = [];
	const maxConeRadius =
		options.maxConeRadius ||
		Math.floor(
			((options.planeLength + options.planeWidth) * 2) / options.count
		);
	const minConeRadius = 1;
	const maxConeHeight = options.maxConeHeight || maxConeRadius * 2;
	const minConeHeight = 1;
	const material = new THREE.MeshPhongMaterial({ flatShading: false });
	for (let i = 0; i < options.count; i++) {
		const coneRadius = Math.max(Math.random() * maxConeRadius, minConeRadius);
		const coneHeight = Math.max(Math.random() * maxConeHeight, minConeHeight);
		const cone = new THREE.ConeGeometry(coneRadius, coneHeight, 20);
		const mesh = new THREE.Mesh(cone, material);
		mesh.position.x =
			Math.random() * options.planeLength - options.planeLength / 2;
		mesh.position.z =
			Math.random() * options.planeWidth - options.planeWidth / 2;
		mesh.position.y = coneHeight / 2;
		mesh.castShadow = true;
		cones.push(mesh);
	}
	return cones;
};
