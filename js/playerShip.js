'use strict';

class PlayerShip extends Body {
    
    constructor (radius) {
        super(
            new THREE.BoxGeometry(radius, radius, radius),
            new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.SmoothShading } )
        );
        
        this.radius = radius;
        this.thrust = 1.5;
    }
    
    accelerateInDirection(dt, direction) {
        var velocityDelta = this.thrust * dt;
        direction.applyQuaternion(this.quaternion).multiplyScalar(velocityDelta);
        playerShip.velocity.add(direction);
    }
    
    accelerate(dt) {
        this.accelerateInDirection(dt, new THREE.Vector3(0,0,-1));
    }
    
    decelerate(dt) {
        this.accelerateInDirection(dt, new THREE.Vector3(0,0,1));
    }
}