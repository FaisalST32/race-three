import * as THREE from 'three';
// import { THREE } from 'enable3d';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
// import { attachWASDControls, car } from './geometries/car';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createCones } from './geometries/cones';
import { createHorizontalPlane } from './geometries/horizontal-plane';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import CannonDebugRenderer from './physics/cannonDebugRenderer';
import * as CANNON from 'cannon-es';
// @ts-ignore
// import * as AmmoPhysics from 'ammo.js/builds/ammo';
// import { createConvexHullPhysicsShape } from './physics/physics.utils';

// import { AmmoPhysics } from 'three/examples/jsm/physics/AmmoPhysics';

// console.log(Ammo);
// window.Ammo = Ammo;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

const fog = new THREE.Fog(0xcccccc, 1, 200);
scene.fog = fog;

// const axes = new THREE.AxesHelper(10);
// scene.add(axes);

//physics
// let Ammo = await AmmoPhysics();
// let physics: AmmoPhysics = await (AmmoPhysics as any)();
// let cubeMesh = new THREE.Mesh(Th)

// console.log(Ammo);
let physicsWorld = new CANNON.World();
physicsWorld.gravity.set(0, -20, 0);
physicsWorld.broadphase = new CANNON.NaiveBroadphase();
physicsWorld.defaultContactMaterial.friction = 0;
const groundMaterial = new CANNON.Material('groundMaterial');
const wheelMaterial = new CANNON.Material('wheelMaterial');
const ballMaterial = new CANNON.Material('ballMaterial');
const wheelGroundContactMaterial = new CANNON.ContactMaterial(
	wheelMaterial,
	groundMaterial,
	{
		friction: 0,
		restitution: 1,
		// contactEquationStiffness: 1000,
	}
);

const ballGroundContactMaterial = new CANNON.ContactMaterial(
	ballMaterial,
	groundMaterial,
	{
		friction: 0.4,
		restitution: 0.4,
		// contactEquationStiffness: 1000,
	}
);
physicsWorld.addContactMaterial(wheelGroundContactMaterial);
physicsWorld.addContactMaterial(ballGroundContactMaterial);

const PLANE_ID = 1;
const CAR_ID = 2;
const BALL_ID = 3;

// const cannonDebugRenderer = new CannonDebugRenderer(scene, physicsWorld);

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
light.shadow.camera.far = 200;
light.shadow.camera.right = 150;
light.shadow.camera.left = -150;
light.shadow.camera.top = 150;
light.shadow.camera.bottom = -150;
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
				// physics.addMesh(mesh as THREE.Mesh, 1);
				// mesh.receiveShadow = true;
			}
		});
		car.castShadow = true;
		car.position.y = 1;
		scene.add(car);
		car.userData.physicsBody = addCarPhysics(
			car.children[0].children[0] as THREE.Mesh
		);

		// addVehicle();
		// physics.addMesh(car as THREE.Mesh, 1);
	},
	(xhr: { loaded: number; total: number }) => {
		console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
	},
	(error: any) => {
		console.log('An error happened');
	}
);

let spheres: THREE.Mesh[] = [];

function dropSphere() {
	const radius = Math.random() * 2 + 1;

	const colors = [0xff0000, 0x00ff00, 0x0000ff, 0x000000, 0xffffff];
	const color = colors[Math.floor(Math.random() * 5)];

	const sphere = new THREE.Mesh(
		new THREE.SphereGeometry(radius),
		new THREE.MeshLambertMaterial({ color })
	);

	const y = Math.random() * 20;
	const z = Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1);
	const x = Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1);
	sphere.position.set(x, y, z);
	sphere.castShadow = true;
	scene.add(sphere);

	const sphereBody = new CANNON.Body({
		mass: 20,
		material: ballMaterial,
	});
	sphereBody.id = BALL_ID;
	sphereBody.addShape(new CANNON.Sphere(radius));
	sphereBody.position.set(x, y, z);
	physicsWorld.addBody(sphereBody);
	sphere.userData.physicsBody = sphereBody;
	spheres.push(sphere);
}

// const helper = new THREE.CameraHelper(light.shadow.camera);
// scene.add(helper);
let carBody: CANNON.Body;
let isCarOnGround: boolean = false;
function addCarPhysics(mesh: THREE.Mesh) {
	carBody = new CANNON.Body({
		mass: 1000,
		// velocity: new CANNON.Vec3(0, 0, -20),
		material: wheelMaterial,
		// angularVelocity: new CANNON.Vec3(0, 0, 1),
	});
	carBody.id = CAR_ID;
	// const vehicle = new CANNON.RaycastVehicle({
	// 	chassisBody: carBody
	// })
	// carBody.velocity = new CANNON.Vec3(0, 0, 1);
	carBody.addShape(
		new CANNON.Box(new CANNON.Vec3(0.8, 0.6, 1.8)),
		new CANNON.Vec3(0, 0.55, 0)
	);
	// carBody.addShape(
	// 	new CANNON.Box(new CANNON.Vec3(0.025, 0.2, 0.2)),
	// 	new CANNON.Vec3(0.4, -0.3, 0.9)
	// );
	// carBody.addShape(
	// 	new CANNON.Box(new CANNON.Vec3(0.025, 0.2, 0.2)),
	// 	new CANNON.Vec3(0.4, -0.3, -0.9)
	// );
	// carBody.addShape(
	// 	new CANNON.Box(new CANNON.Vec3(0.025, 0.2, 0.2)),
	// 	new CANNON.Vec3(-0.4, -0.3, 0.9)
	// );
	// carBody.addShape(
	// 	new CANNON.Box(new CANNON.Vec3(0.025, 0.2, 0.2)),
	// 	new CANNON.Vec3(-0.4, -0.3, -0.9)
	// );
	carBody.position.set(0, 1, 0);
	// carBody
	carBody.fixedRotation = true;
	carBody.angularDamping = 0.99;
	carBody.linearDamping = 0.95;
	physicsWorld.addBody(carBody);
	// console.log(carBody.quaternion);

	keyListeners.push((keys: any) => {
		if (!isCarOnGround) return;
		if (!keys.W && !keys.S) {
			return;
		}
		const speed = 20;
		const direction = keys.W ? -1 : 1;
		// let newVelocity = new THREE.Vector3(
		// 	currentVelocity.x,
		// 	currentVelocity.y,
		// 	direction * speed
		// ).normalize();

		// let newVelocity = new CANNON.Vec3(0, 0, direction * speed);
		// newVelocity = carBody.quaternion.vmult(newVelocity);
		// carBody.velocity.set(newVelocity.x, newVelocity.y, newVelocity.z);

		const currentVelocity = carBody.velocity.clone();
		const localVelocity = new CANNON.Vec3(0, 0, direction * speed);
		// const finalVelocity = currentVelocity.vadd(localVelocity);
		carBody.quaternion.normalize().vmult(localVelocity, carBody.velocity);

		// carBody.velocity.set(
		// 	normalizedVelocity.x,
		// 	// TODO: Figure out a better way to incorporate gravity
		// 	Math.min(normalizedVelocity.y, 0),
		// 	normalizedVelocity.z
		// );
	});

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
				carBody.angularVelocity.y = -direction * Math.PI;
				break;
			case keys.D:
				direction = 1;
				carBody.angularVelocity.y = -direction * Math.PI;
				break;

			default:
				return;
		}
	});

	keyListeners.push((keys: any) => {
		if (!keys[' '] || !isCarOnGround) {
			return;
		}
		console.log('impulsing');
		var accelerationDirection = new CANNON.Vec3(0, 0, -10000);
		var accelerationImpulse = carBody.quaternion.vmult(accelerationDirection);
		carBody.applyImpulse(accelerationImpulse);
	});
	return carBody;
}

physicsWorld.addEventListener('beginContact', (e: any) => {
	const { bodyA, bodyB }: { bodyA: CANNON.Body; bodyB: CANNON.Body } = e;
	if (
		(bodyA?.id === PLANE_ID || bodyA?.id === CAR_ID) &&
		(bodyB?.id === PLANE_ID || bodyB?.id === CAR_ID) &&
		bodyA?.id !== bodyB?.id
	) {
		// console.log('beginContact', { bodyA, bodyB });
		isCarOnGround = true;
	}
});
physicsWorld.addEventListener('endContact', (e: any) => {
	const { bodyA, bodyB }: { bodyA: CANNON.Body; bodyB: CANNON.Body } = e;
	if (bodyA?.id === BALL_ID || bodyB?.id === BALL_ID) return;
	if (
		(bodyA?.id === PLANE_ID || bodyA?.id === CAR_ID) &&
		(bodyB?.id === PLANE_ID || bodyB?.id === CAR_ID) &&
		bodyA?.id !== bodyB?.id
	) {
		// console.log('endContact', { bodyA, bodyB });
		isCarOnGround = false;
	}
});

const plane = createHorizontalPlane(100, 100);

scene.add(plane);

const planeShape = new CANNON.Box(new CANNON.Vec3(50, 0.5, 50));
const planeBody = new CANNON.Body({
	mass: 0,
	material: groundMaterial,
});
planeBody.id = PLANE_ID;
planeBody.addShape(planeShape);
// planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
planeBody.position.y = -0.5;
physicsWorld.addBody(planeBody);

// physics.addMesh(plane, 0);

// const gridHelper = new THREE.GridHelper(100, 50, 0xff0000, 0x00ff00);
// scene.add(gridHelper);

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);

// controls.addEventListener('change', render);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2.5;
controls.maxDistance = 50;
controls.minDistance = 40;
// controls.maxAzimuthAngle = Math.PI / 3;
// controls.minAzimuthAngle = Math.PI / 3;

const stats = Stats();
document.body.appendChild(stats.dom);

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}

setInterval(dropSphere, 2000);

let clock = new THREE.Clock();
function animate() {
	requestAnimationFrame(animate);

	let delta = Math.min(clock.getDelta(), 0.1);
	physicsWorld.step(delta);

	// const carBody: CANNON.Body = car?.userData?.physicsBody;

	if (car && carBody) {
		if (carBody.position.y < -2) {
			carBody.position.set(0, 1, 0);
			carBody.quaternion.set(0, 0, 0, 1);
		}

		car.position.set(
			carBody.position.x,
			carBody.position.y,
			carBody.position.z
		);

		car.quaternion.set(
			carBody.quaternion.x,
			carBody.quaternion.y,
			carBody.quaternion.z,
			carBody.quaternion.w
		);

		controls.target.copy(car.position);
		keyListeners.forEach((listener) => listener(keysHeld));
	}

	for (let i = 0; i < spheres.length; i++) {
		const sphere = spheres[i];
		const sphereBody: CANNON.Body = sphere.userData.physicsBody;
		if (sphereBody.position.y < -5) {
			physicsWorld.removeBody(sphereBody);
			scene.remove(sphere);
			spheres[i] = null as unknown as THREE.Mesh;
			continue;
		}
		sphere.position.set(
			sphereBody.position.x,
			sphereBody.position.y,
			sphereBody.position.z
		);
		sphere.quaternion.set(
			sphereBody.quaternion.x,
			sphereBody.quaternion.y,
			sphereBody.quaternion.z,
			sphereBody.quaternion.w
		);
	}
	spheres = spheres.filter(Boolean);

	// console.log(car.position, carBody.position);
	controls.update();
	TWEEN.update();
	// cannonDebugRenderer.update();
	render();
	stats.update();
}

function render() {
	renderer.render(scene, camera);
}

animate();
