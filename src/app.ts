import * as THREE from 'three';
import { attachWASDControls, car } from './geometries/car';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createCones } from './geometries/cones';
import { createHorizontalPlane } from './geometries/horizontal-plane';
import Stats from 'three/examples/jsm/libs/stats.module'

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

const fog = new THREE.Fog(0xcccccc, 1, 200);
scene.fog = fog;

const axes = new THREE.AxesHelper(10);

// scene.add(car);
scene.add(axes);
// attachWASDControls(car, render);
const camera = new THREE.PerspectiveCamera(
	50,
	window.innerWidth / window.innerHeight,
	0.1,
	2000
);

camera.position.z = 60;
camera.position.y = 20;

const cones = createCones({
	planeLength: 100,
	planeWidth: 80,
	count: 100,
	maxConeHeight: 10,
	maxConeRadius: 4,
});

scene.add(...cones);

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

const stats = Stats()
document.body.appendChild(stats.dom)

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}

function animate() {
	requestAnimationFrame(animate);
	stats.update();
}

function render() {
	renderer.render(scene, camera);
}

render();
