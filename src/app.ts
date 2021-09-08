import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
// import { attachWASDControls, car } from './geometries/car';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createCones } from './geometries/cones';
import { createHorizontalPlane } from './geometries/horizontal-plane';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

const fog = new THREE.Fog(0xcccccc, 1, 200);
scene.fog = fog;

// const axes = new THREE.AxesHelper(10);
// scene.add(axes);

let car: THREE.Object3D;
// add the car
// car.position.y = 0.5;
// car.castShadow = true;
// scene.add(car);
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

// scene.add(...cones);

// add directional light with shadow
const light = new THREE.DirectionalLight();
light.castShadow = true;
light.shadow.mapSize.width = 8192;
light.shadow.mapSize.height = 8192;
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

// load a car
const gltfLoader = new GLTFLoader();
gltfLoader.load(
	'models/car.glb',
	(gltf) => {
		car = gltf.scene;
		car.traverse((mesh) => {
			if ((mesh as THREE.Mesh).isMesh) {
				mesh.castShadow = true;
				// mesh.receiveShadow = true;
			}
		});
		car.castShadow = true;
		scene.add(car);
		keyListeners.push((keys: any) => {
			const isCarMoving = keys.W || keys.S;
			if (!isCarMoving) return;
			if (!keys.D && !keys.A) {
				return;
			}
			let direction: -1 | 1 = 1;
			switch (true) {
				case keys.A:
					direction = -1;
					car.rotateY((-direction * Math.PI) / 50);
					break;
				case keys.D:
					direction = 1;
					car.rotateY((-direction * Math.PI) / 50);
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
			let direction: -1 | 1 = 1;
			switch (true) {
				case keys.W:
					direction = -1;
					car.translateZ(direction * speed);
					break;
				case keys.S:
					direction = 1;
					car.translateZ(direction * speed);
					break;
				default:
					return;
			}
		});
	},
	(xhr: { loaded: number; total: number }) => {
		console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
	},
	(error: any) => {
		console.log('An error happened');
	}
);

// const helper = new THREE.CameraHelper(light.shadow.camera);
// scene.add(helper);

const plane = createHorizontalPlane(100, 100);
scene.add(plane);

// const gridHelper = new THREE.GridHelper(100, 50, 0xff0000, 0x00ff00);
// scene.add(gridHelper);

const renderer = new THREE.WebGLRenderer();

// controls.addEventListener('change', render);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2.1;

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
	// controls.maxDistance = 20;
	keyListeners.forEach((listener) => listener(keysHeld));
	if (car) {
		controls.target.copy(car.position);
	}
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
