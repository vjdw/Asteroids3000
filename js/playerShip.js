'use strict';

class PlayerShip extends Body {
    constructor (radius) {
        super(
            new THREE.BoxGeometry(radius, radius, radius),
            new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.SmoothShading } )
        );
        
        this.radius = radius;
    }
}