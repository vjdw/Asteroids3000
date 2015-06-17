'use strict';

class Asteroid extends Body {
    constructor (radius) {
        super(
            new THREE.SphereGeometry(radius, 32, 32),
            new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.SmoothShading } )
        );
        
        this.radius = radius;
    }
}