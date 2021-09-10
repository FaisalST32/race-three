export function createConvexHullPhysicsShape(coords: number[], Ammo: any) {
	const shape = new Ammo.btConvexHullShape();
	const tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
	for (let i = 0, il = coords.length; i < il; i += 3) {
		tempBtVec3_1.setValue(coords[i], coords[i + 1], coords[i + 2]);
		const lastOne = i >= il - 3;
		shape.addPoint(tempBtVec3_1, lastOne);
	}

	return shape;
}
