'use strict';

var keyboard;

var scene;
var camera;
var renderer;

var bodies;
var playerShip;

function start() {
    
    keyboard = new THREEx.KeyboardState();
    
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    renderer.setClearColor(0x333F47, 1);
    
    bodies = [];
   
    // Add light.
    var light = new THREE.PointLight(0x999999, 1, 70);
    light.position.set(25, 25, 25);
    scene.add(light);
    light = new THREE.PointLight(0x447788, 1, 30);
    light.position.set(0, 0, 25);
    scene.add(light);

    playerShip = new PlayerShip(0.1);
    playerShip.position.set(0,0,8);
    scene.add(playerShip);
    bodies.push(playerShip);

    const asteroidsPerEdge = 4;
    const asteroidsSpan = 8;
    for (var i = 0.0; i < asteroidsPerEdge; i++) {
        for (var j = 0.0; j < asteroidsPerEdge; j++) {
            for (var k = 0.0; k < asteroidsPerEdge; k++) {
                var asteroid = new Asteroid(0.5);
                asteroid.position.set(
                    ((i / asteroidsPerEdge) * asteroidsSpan) - (asteroidsSpan / 2),
                    ((j / asteroidsPerEdge) * asteroidsSpan) - (asteroidsSpan / 2),
                    ((k / asteroidsPerEdge) * asteroidsSpan) - (asteroidsSpan / 2)    
                );
                scene.add(asteroid);
                bodies.push(asteroid);
            }
        }
    }
  
    render();
};

function render() {
    requestAnimationFrame(render);

    checkKeyboard();

    checkForCollisions(1/60);
    
    updateBodies(1/60);

    updateCamera();
    
    renderer.render(scene, camera);
};

function checkKeyboard() {
    const thrust = 0.1;
    var accelerationX = 0;
    var accelerationY = 0;
    var accelerationZ = 0;

    if (keyboard.pressed('left')) {
        accelerationX = -thrust;
    }
    else if (keyboard.pressed('right')) {
        accelerationX = thrust;
    }

    if (keyboard.pressed('up')) {
        accelerationY = thrust;
    }
    else if (keyboard.pressed('down')) {
        accelerationY = -thrust;
    }
    
    if (keyboard.pressed('return')) {
        accelerationZ = thrust / 15;
    }
    else if (keyboard.pressed('shift')) {
        accelerationZ = -thrust / 15;
    }
    
    // TODO: Apply pitch and roll properly.
    playerShip.rotation.x -= accelerationY / 5;
    playerShip.rotation.z -= accelerationX / 5;
    
    // Apply thrust in direction the ship is facing.
    var thrustDirection = new THREE.Vector3(0,0,1);
    var centredShip = playerShip.clone();
    centredShip.position.set(0,0,0);
    centredShip.worldToLocal(thrustDirection);
    playerShip.velocity.add(thrustDirection.normalize().multiplyScalar(accelerationZ));
}

function checkForCollisions(dt) {
    var testedBodies = [];
    for (let body of bodies) {
        for (let otherBody of bodies) {
            if (body !== otherBody && _.contains(testedBodies, otherBody)) {
                if (checkForCollision(dt, body, otherBody)) {
                    body.reactToCollision(otherBody);
                }
            }
        }
        testedBodies.push(body);
    }
}

function checkForCollision(dt, body1, body2) {
    // The distance between two points, (x1,y1,z1) and (x2,y2,z2) is:
    //   ((x2-x1)^2 + (y2-y1)^2 + (z2+z1)^2) ^ 0.5
    //
    // If a point is moving with velocity v, then at time t', its position is:
    //   position_t' = position_t0 + (t' * velocity)
    //
    // Combining these two formulae and multiplying out gives the following.    
    //
    // If two points p1 and p2 are travelling in a straight line then the
    // distance between them over time is:
    //   distance = at^2 + bt + c
    // where:
    //   a is the sum of the square of the difference in velocities
    //   b is (-2 * sum of (difference in velocity * difference in position))
    //   c is sum of the square of the difference in positions
    //   t is time since the spheres were at their start position
    //
    // Also, if these points are the centres of spheres, then when this
    // distance is equal to the sum of the spheres' radii, then the spheres'
    // surfaces are in contact at a single point, i.e. a collision.
    //
    // So collisions occur when:
    //   at^2 + bt + c = r1 + r2
    // or:
    //   at^2 + bt + (c - (r1 + r2)) = 0
    // which can be solved as a quadratic equation.

    const MAX_SPEED = 10;
    const MAX_SPEED_SQUARED = MAX_SPEED * MAX_SPEED;
    var p1 = body1.position.clone();
    var p2 = body2.position.clone();
    var r1 = body1.radius;
    var r2 = body2.radius;

    // Distance from centre of p1 to p2
    var relativePosition = p2.sub(p1);

    // Rough quick check that collision is possible during dt
    var dtMaxDistanceSquare = MAX_SPEED_SQUARED * dt;
    var relativePositionLengthSq = relativePosition.lengthSq();
    var collisionIsPossible = relativePositionLengthSq < dtMaxDistanceSquare;
    if (!collisionIsPossible) {
        return false;
    }

    var surfaceDistanceSquared = relativePositionLengthSq - Math.pow(r1 + r2, 2);

    // Change in relative position between centres' of p1 and p2, during dt
    var v1 = body1.velocity.clone();
    var v2 = body2.velocity.clone();
    var relativeVelocity = v1.sub(v2);
    var relativeMoveDistanceSquared = dt * relativeVelocity.lengthSq();

    // Given velocities and positions, is it possible inside dt for p1 and p2 to collide?
    if (surfaceDistanceSquared < relativeMoveDistanceSquared) {
        // Find a, b and c for the quadratic equation solution.

        // a is the sum of the square of the difference in velocities
        var a = relativeVelocity.lengthSq();

        // b is (-2 * sum of (difference in velocity * difference in position))
        var velocityByDistanceSum = relativeVelocity.dot(relativePosition);
        var b = -2 * velocityByDistanceSum;

        // c is sum of the square of the difference in positions
        var radiiSumSquared = Math.pow(r1 + r2, 2);
        var c = relativePosition.lengthSq() - radiiSumSquared;

        // x = (-b  +-  sqrt(b^2 - 4ac))  /  2a
        var twoa = 2 * a;
        if (twoa > 0.00000001) {
            var bsquared = Math.pow(b,2);
            var fourac = 4 * a * c;
            var bsquaredminusfourac = bsquared - fourac;
            if (bsquared >= fourac) {
                var x = ((-b) + Math.sqrt(bsquaredminusfourac)) / twoa;
                if (x >= 0 && x <= dt) {
                    //console.log('collision');
                    return true;
                }
                else {
                    x = ((-b) - Math.sqrt(bsquaredminusfourac)) / twoa;
                    if (x >= 0 && x <= dt) {
                        //console.log('collision');
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

function updateBodies(dt) {
    for (let body of bodies) {
        body.position.add(body.velocity.clone().multiplyScalar(dt));
    }
}

function updateCamera() {
    camera.position.x = playerShip.position.x;
    camera.position.y = playerShip.position.y;
    camera.position.z = playerShip.position.z + 1;
}