'use strict';

class Body extends THREE.Mesh {
    constructor (geometry, material) {
        super(geometry, material);

        this.velocity = new THREE.Vector3(0,0,0);

        this.impulse = function(impulse) {
            this.velocity.add(impulse);
        };
    }
    
    reactToCollision(otherBody) {
        var combinedVelocity = this.velocity.clone().sub(otherBody.velocity);

        var offset = otherBody.position.clone().sub(this.position);
        var unitOffset = offset.normalize();
        var impulse = unitOffset.multiplyScalar(unitOffset.dot(combinedVelocity));

        otherBody.impulse(impulse);
        this.impulse(impulse.negate());
    }
}