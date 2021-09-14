import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';

export class PhysicsObject3D {
	constructor(object3D: THREE.Object3D) {
		this.object = object3D;
	}
	id?: string;
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

	updateFromObject() {
		if (!this.object || !this.body) {
			return;
		}

		this.body.position.set(
			this.object.position.x,
			this.object.position.y,
			this.object.position.z
		);

		this.body.quaternion.set(
			this.object.quaternion.x,
			this.object.quaternion.y,
			this.object.quaternion.z,
			this.object.quaternion.w
		);
	}

	updateFromPositionAndQuaternion(
		position: { x: number; y: number; z: number },
		quaternion: { x: number; y: number; z: number; w: number }
	) {
		this.body.position.set(position.x, position.y, position.z);
		this.body.quaternion.set(
			quaternion.x,
			quaternion.y,
			quaternion.z,
			quaternion.w
		);
		this.updateFromPhysicsBody();
	}

	private updateFromPhysicsBodyWithTween() {
		if (!this.body) {
			return;
		}

		new TWEEN.Tween(this.object.position)
			.to(
				{
					x: this.body.position.x,
					y: this.body.position.y,
					z: this.body.position.z,
				},
				50
			)
			.onStart(() => {
				new TWEEN.Tween(this.object.quaternion)
					.to(
						{
							x: this.body.quaternion.x,
							y: this.body.quaternion.y,
							z: this.body.quaternion.z,
							w: this.body.quaternion.w,
						},
						50
					)
					.start();
			})
			.start();
	}
}
