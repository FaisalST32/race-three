import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createHorizontalPlane } from './geometries/horizontal-plane';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import CannonDebugRenderer from './physics/cannonDebugRenderer';
import * as CANNON from 'cannon-es';
import { PhysicsObject3D } from './typings/physics-object-3d';

// let debug = process.env.NODE_ENV !== 'production';
let debug = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

const fog = new THREE.Fog(0xcccccc, 1, 200);
scene.fog = fog;

if (debug) {
	const axes = new THREE.AxesHelper(10);
	scene.add(axes);
}

let gameStarted = false;
let score = 0;
let timer = 60;

// setup physics

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

let cannonDebugRenderer: CannonDebugRenderer;
if (debug) {
	cannonDebugRenderer = new CannonDebugRenderer(scene, physicsWorld);
}

// add the camera
const camera = new THREE.PerspectiveCamera(
	50,
	window.innerWidth / window.innerHeight,
	0.1,
	2000
);

camera.position.z = 15;
camera.position.y = 10;

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

if (debug) {
	const helper = new THREE.CameraHelper(light.shadow.camera);
	scene.add(helper);
}

// key listeners
let keyListeners: Function[] = [];
let keysHeld: any = {};
document.addEventListener(
	'keydown',
	(e: KeyboardEvent) => (keysHeld[e.key.toUpperCase()] = true)
);
document.addEventListener(
	'keyup',
	(e: KeyboardEvent) => delete keysHeld[e.key.toUpperCase()]
);
document.getElementById('start-button')?.addEventListener('click', startGame);

// load a car
const gltfLoader = new GLTFLoader();

let car: PhysicsObject3D;

function loadCar(): Promise<PhysicsObject3D> {
	return new Promise((res, rej) => {
		gltfLoader.load(
			'models/car.glb',
			(gltf) => {
				const carObj = gltf.scene as THREE.Object3D;
				carObj.traverse((mesh) => {
					if ((mesh as THREE.Mesh).isMesh) {
						mesh.castShadow = true;
					}
				});
				carObj.castShadow = true;
				carObj.position.y = 1;
				scene.add(carObj);
				const car = new PhysicsObject3D(carObj);
				res(car);
			},
			(xhr: { loaded: number; total: number }) => {
				console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
			},
			(error: any) => {
				console.log('An error happened');
				rej(error);
			}
		);
	});
}

loadCar().then((carLoaded) => {
	car = carLoaded;
	gameLoaded();
});

// add car physics
function addCarPhysics(target: PhysicsObject3D) {
	const carBody = new CANNON.Body({
		mass: 1000,
		material: wheelMaterial,
	});
	carBody.id = CAR_ID;
	carBody.addShape(
		new CANNON.Box(new CANNON.Vec3(0.8, 0.6, 1.8)),
		new CANNON.Vec3(0, 0.55, 0)
	);
	carBody.position.set(0, 1, 0);
	carBody.fixedRotation = true;
	carBody.angularDamping = 0.99;
	carBody.linearDamping = 0.95;
	physicsWorld.addBody(carBody);
	carBody.addEventListener('collide', (e: { body: CANNON.Body }) => {
		const { body }: { body: CANNON.Body } = e;
		if (body.id !== BALL_ID) return;
		const sphere = spheres.find((s) => s.body === body);
		if (!sphere) return;
		(
			(sphere.object as THREE.Mesh).material as THREE.MeshLambertMaterial
		).color = new THREE.Color(0x800080);
		sphere.object.userData.userSphere = true;
	});
	target.body = carBody;
}

let isCarOnGround: boolean = false;
function attachWASDControls(target: PhysicsObject3D) {
	// forward and reverse
	keyListeners.push((keys: any) => {
		if (!isCarOnGround) return;
		if (!keys.W && !keys.S) {
			return;
		}
		const speed = 20;
		const direction = keys.W ? -1 : 1;

		const localVelocity = new CANNON.Vec3(0, 0, direction * speed);
		target.body.quaternion
			.normalize()
			.vmult(localVelocity, target.body.velocity);
	});

	// turn
	keyListeners.push((keys: any) => {
		const isCarMoving = keys.W || keys.S || keys[' '];
		if (!isCarMoving) return;
		if (!keys.D && !keys.A) {
			return;
		}
		let direction: -1 | 1 = 1;
		switch (true) {
			case keys.A:
				direction = -1;
				target.body.angularVelocity.y = -direction * Math.PI;
				break;
			case keys.D:
				direction = 1;
				target.body.angularVelocity.y = -direction * Math.PI;
				break;

			default:
				return;
		}
	});

	// impulse
	keyListeners.push((keys: any) => {
		if (!keys[' '] || !isCarOnGround) {
			return;
		}
		var accelerationDirection = new CANNON.Vec3(0, 0, -2000);
		var accelerationImpulse = target.body.quaternion.vmult(
			accelerationDirection
		);
		target.body.applyImpulse(accelerationImpulse);
	});

	// torque (experimental)
	keyListeners.push((keys: any) => {
		if (!keys.ARROWLEFT && !keys.ARROWRIGHT) {
			return;
		}

		const isCarMoving =
			(keys.W || keys.S || keys[' '] || keys['Z']) && !(keys[' '] && keys['Z']);
		if (!isCarMoving) return;

		let torque: CANNON.Vec3;
		switch (true) {
			case keys.ARROWLEFT:
				torque = new CANNON.Vec3(0, 20000, 0);
				target.body.applyTorque(torque);
				break;
			case keys.ARROWRIGHT:
				torque = new CANNON.Vec3(0, -20000, 0);
				target.body.applyTorque(torque);
				break;

			default:
				return;
		}
	});

	// brake (experimental)
	keyListeners.push((keys: any) => {
		if (!keys.Z || !isCarOnGround) {
			return;
		}
		var decelerationDirection = new CANNON.Vec3(0, 0, 1000);
		var decelerationImpulse = target.body.quaternion.vmult(
			decelerationDirection
		);
		target.body.applyImpulse(decelerationImpulse);
	});
}

// add car contact listeners
physicsWorld.addEventListener('beginContact', (e: any) => {
	const { bodyA, bodyB }: { bodyA: CANNON.Body; bodyB: CANNON.Body } = e;
	if (
		(bodyA?.id === PLANE_ID || bodyA?.id === CAR_ID) &&
		(bodyB?.id === PLANE_ID || bodyB?.id === CAR_ID) &&
		bodyA?.id !== bodyB?.id
	) {
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
		isCarOnGround = false;
	}
});

// add falling spheres
let spheres: PhysicsObject3D[] = [];
function dropSphere() {
	const radius = Math.random() * 2 + 1;

	const colors = [0xff0000, 0x00ff00, 0x0000ff, 0x000000, 0xffffff];
	const color = colors[Math.floor(Math.random() * 5)];

	const sphereObj = new THREE.Mesh(
		new THREE.SphereGeometry(radius),
		new THREE.MeshLambertMaterial({ color })
	);

	const y = Math.random() * 20;
	const z = Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1);
	const x = Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1);
	sphereObj.position.set(x, y, z);
	sphereObj.castShadow = true;
	scene.add(sphereObj);

	const sphereBody = new CANNON.Body({
		mass: 20,
		material: ballMaterial,
	});
	sphereBody.id = BALL_ID;
	sphereBody.addShape(new CANNON.Sphere(radius));
	sphereBody.position.set(x, y, z);
	physicsWorld.addBody(sphereBody);
	const sphere = new PhysicsObject3D(sphereObj);
	sphere.body = sphereBody;
	spheres.push(sphere);
}

function gameLoaded() {
	document.querySelectorAll('.loading').forEach((el) => {
		(el as HTMLElement).style.visibility = 'hidden';
	});
	document.querySelectorAll('.on-load').forEach((el) => {
		(el as HTMLElement).style.visibility = 'visible';
	});
}

function startGame() {
	addCarPhysics(car);
	attachWASDControls(car);
	setInterval(dropSphere, 2000);
	document.querySelectorAll(':is(.loading, .on-load)').forEach((el) => {
		(el as HTMLElement).style.visibility = 'hidden';
	});
	document.querySelectorAll('.on-start').forEach((el) => {
		(el as HTMLElement).style.visibility = 'visible';
	});
	gameStarted = true;
	beginTimer();
}

function beginTimer() {
	const timerEl = document.getElementById('timer');
	const interval = setInterval(() => {
		timerEl!.innerHTML = `${timer--}`;
		if (timer === 0) {
			clearInterval(interval);
			endGame();
		}
	}, 1000);
}

function endGame() {
	timer = 60;
	document
		.querySelectorAll(':is(.loading, .on-load, .on-start)')
		.forEach((el) => {
			(el as HTMLElement).style.visibility = 'hidden';
		});

	document.getElementById('final-score')!.innerHTML = `${score}`;
	document.querySelectorAll('.on-end').forEach((el) => {
		(el as HTMLElement).style.visibility = 'visible';
	});
}

function scorePoint(points: number) {
	score += points;
	document.getElementById('score')!.innerHTML = `${score}`;
}

// add ground scene object
const plane = createHorizontalPlane(100, 100);
scene.add(plane);

// add ground physics object
const planeShape = new CANNON.Box(new CANNON.Vec3(50, 0.5, 50));
const planeBody = new CANNON.Body({
	mass: 0,
	material: groundMaterial,
});
planeBody.id = PLANE_ID;
planeBody.addShape(planeShape);
planeBody.position.y = -0.5;
physicsWorld.addBody(planeBody);

//add a renderer
const renderer = new THREE.WebGLRenderer({
	canvas: document.getElementById('game') as HTMLCanvasElement,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2.5;
controls.maxDistance = 50;
controls.minDistance = 40;

// add stats panel
const stats = Stats();
document.body.appendChild(stats.dom);

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}

let clock = new THREE.Clock();
function animate() {
	requestAnimationFrame(animate);
	if (!gameStarted) {
		return;
	}

	let delta = Math.min(clock.getDelta(), 0.1);
	physicsWorld.step(delta);

	// const carBody: CANNON.Body = car?.userData?.physicsBody;

	if (car) {
		if (car.body.position.y < -2) {
			car.body.position.set(0, 1, 0);
			car.body.quaternion.set(0, 0, 0, 1);
			scorePoint(-10);
		}

		car.updateFromPhysicsBody();
		controls.target.copy(car.object.position);
		keyListeners.forEach((listener) => listener(keysHeld));
	}

	for (let i = 0; i < spheres.length; i++) {
		const sphere = spheres[i];
		const sphereBody: CANNON.Body = sphere.body;
		if (sphereBody.position.y < -5) {
			if (sphere.object?.userData?.userSphere) {
				scorePoint(5);
			}
			physicsWorld.removeBody(sphereBody);
			scene.remove(sphere.object);
			spheres[i] = null as unknown as PhysicsObject3D;
			continue;
		}
		sphere.updateFromPhysicsBody();
	}
	spheres = spheres.filter(Boolean);

	controls.update();
	TWEEN.update();
	if (debug) {
		cannonDebugRenderer.update();
	}
	render();
	stats.update();
}

function render() {
	renderer.render(scene, camera);
}

animate();
