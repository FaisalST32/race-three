import * as THREE from 'three';

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const meshNormalMaterial = new THREE.MeshBasicMaterial({
	wireframe: true,
});

export const car = new THREE.Mesh(cubeGeometry, meshNormalMaterial);
const moveCar = (key: string, mesh: THREE.Mesh, render: Function) => {
	console.log(mesh);
	switch (key.toUpperCase()) {
		case 'W':
			mesh.position.y += 0.1;
			break;
		case 'S':
			mesh.position.y -= 0.1;
			break;
		case 'A':
			mesh.position.x -= 0.1;
			break;
		case 'D':
			mesh.position.x += 0.1;
			break;
	}
	render();
};

export const attachWASDControls = (mesh: THREE.Mesh, render: Function) => {
	document.addEventListener('keydown', (e) => moveCar(e.key, mesh, render));
};
