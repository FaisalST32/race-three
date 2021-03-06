import * as THREE from 'three';

export const createHorizontalPlane = (
	length: number,
	width: number
): THREE.Mesh => {
	const geometry = new THREE.PlaneGeometry(length, width, length, width);
	const material = new THREE.MeshPhongMaterial({ wireframe: false });
	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotateX(-Math.PI / 2);
	mesh.receiveShadow = true;
	return mesh;
};
