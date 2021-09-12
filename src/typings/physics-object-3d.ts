import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class PhysicsObject3D extends THREE.Object3D {
	physicsBody: CANNON.Body;
}
