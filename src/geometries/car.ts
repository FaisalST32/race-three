import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';

const cubeGeometry = new THREE.BoxGeometry(1, 0.6, 2);
const meshNormalMaterial = new THREE.MeshPhongMaterial({
	wireframe: false,
	color: 0xffff00,
});

export const car = new THREE.Mesh(cubeGeometry, meshNormalMaterial);
const moveCar = (key: string, mesh: THREE.Mesh, render: Function) => {
	const speed = 0.4;
	let axis: 'z' | 'x' = 'x';
	let direction: -1 | 1 = 1;
	const originalPosition = mesh.position;
	switch (key.toUpperCase()) {
		case 'W':
			axis = 'z';
			direction = -1;
			mesh.translateZ(direction * speed);
			// mesh.position.z -= speed;w
			break;
		case 'S':
			axis = 'z';
			direction = 1;
			mesh.translateZ(direction * speed);
			// mesh.position.z += speed;
			break;
		default:
			return;
	}

	console.log({ direction, axis });

	// new TWEEN.Tween(mesh.position)
	// 	.to(
	// 		{
	// 			[axis]: originalPosition[axis] + speed * direction,
	// 		},
	// 		200
	// 	)
	// 	.easing(TWEEN.Easing.Linear.None)
	// 	.start();

	render();
};

const rotateCar = (key: string, mesh: THREE.Mesh, render: Function) => {
	const speed = 0.4;
	let axis: 'z' | 'x' = 'x';
	let direction: -1 | 1 = 1;
	const originalPosition = mesh.position;
	switch (key.toUpperCase()) {
		case 'A':
			axis = 'x';
			direction = -1;
			mesh.rotateY((-direction * Math.PI) / 30);
			// mesh.position.x -= speed;
			break;
		case 'D':
			axis = 'x';
			direction = 1;
			mesh.rotateY((-direction * Math.PI) / 30);
			// mesh.position.x += speed;
			break;

		default:
			return;
	}

	console.log({ direction, axis });

	// new TWEEN.Tween(mesh.position)
	// 	.to(
	// 		{
	// 			[axis]: originalPosition[axis] + speed * direction,
	// 		},
	// 		200
	// 	)
	// 	.easing(TWEEN.Easing.Linear.None)
	// 	.start();

	render();
};

export const attachWASDControls = (mesh: THREE.Mesh, render: Function) => {
	document.addEventListener('keydown', (e) => moveCar(e.key, mesh, render));
	document.addEventListener('keydown', (e) => rotateCar(e.key, mesh, render));
};
