import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class PhysicsObject3D {
	constructor(object3D: THREE.Object3D) {
		this.object = object3D;
	}

	object: THREE.Object3D;
	body: CANNON.Body;

	updateFromPhysicsBody() {
		if (!this.body) {
			return;
		}

		this.object.position.set(
			this.body.position.x,
			this.body.position.y,
			this.body.position.z
		);

		this.object.quaternion.set(
			this.body.quaternion.x,
			this.body.quaternion.y,
			this.body.quaternion.z,
			this.body.quaternion.w
		);
	}
}
