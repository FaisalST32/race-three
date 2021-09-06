import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import { attachWASDControls, car } from './geometries/car';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createCones } from './geometries/cones';
import { createHorizontalPlane } from './geometries/horizontal-plane';
import Stats from 'three/examples/jsm/libs/stats.module';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

const fog = new THREE.Fog(0xcccccc, 1, 200);
scene.fog = fog;

const axes = new THREE.AxesHelper(10);
scene.add(axes);

// add the car
car.position.y = 0.5;
car.castShadow = true;
scene.add(car);
// attachWASDControls(car, render);

// add the camera
const camera = new THREE.PerspectiveCamera(
	50,
	window.innerWidth / window.innerHeight,
	0.1,
	2000
);

camera.position.z = 15;
camera.position.y = 10;

// add the cones
const cones = createCones({
	planeLength: 30,
	planeWidth: 24,
	count: 100,
	maxConeHeight: 1,
	maxConeRadius: 0.4,
});

scene.add(...cones);

// add directional light with shadow
const light = new THREE.DirectionalLight();
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 100;
light.shadow.camera.right = 100;
light.shadow.camera.left = -100;
light.shadow.camera.top = 100;
light.shadow.camera.bottom = -100;
light.position.z = 60;
light.position.y = 20;
scene.add(light);

// key listeners
let keysHeld: any = {};

document.addEventListener(
	'keydown',
	(e: KeyboardEvent) => (keysHeld[e.key.toUpperCase()] = true)
);
document.addEventListener(
	'keyup',
	(e: KeyboardEvent) => delete keysHeld[e.key.toUpperCase()]
);

let keyListeners: Function[] = [];

keyListeners.push((keys: any) => {
	if (!keys.D && !keys.A) {
		return;
	}
	const speed = 0.4;
	let axis: 'z' | 'x' = 'x';
	let direction: -1 | 1 = 1;
	const originalPosition = car.position;
	switch (true) {
		case keys.A:
			axis = 'x';
			direction = -1;
			car.rotateY((-direction * Math.PI) / 30);
			// mesh.position.x -= speed;
			break;
		case keys.D:
			axis = 'x';
			direction = 1;
			car.rotateY((-direction * Math.PI) / 30);
			// mesh.position.x += speed;
			break;

		default:
			return;
	}
});

keyListeners.push((keys: any) => {
	if (!keys.W && !keys.S) {
		return;
	}
	const speed = 0.4;
	let axis: 'z' | 'x' = 'x';
	let direction: -1 | 1 = 1;
	const originalPosition = car.position;
	switch (true) {
		case keys.W:
			axis = 'z';
			direction = -1;
			car.translateZ(direction * speed);
			// mesh.position.z -= speed;w
			break;
		case keys.S:
			axis = 'z';
			direction = 1;
			car.translateZ(direction * speed);
			// mesh.position.z += speed;
			break;
		default:
			return;
	}
});

const helper = new THREE.CameraHelper(light.shadow.camera);
scene.add(helper);

const plane = createHorizontalPlane(1000, 800);
scene.add(plane);

const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', render);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const stats = Stats();
document.body.appendChild(stats.dom);

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}

function animate() {
	// controls.maxDistance = 10;
	keyListeners.forEach((listener) => listener(keysHeld));
	console.log({ keysHeld });
	controls.target.copy(car.position);
	controls.update();
	TWEEN.update();
	requestAnimationFrame(animate);
	render();
	stats.update();
}

function render() {
	renderer.render(scene, camera);
}

animate();
