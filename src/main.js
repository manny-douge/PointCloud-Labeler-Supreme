import * as THREE from '../lib/three.module.js';
import * as INIT from './init.module.js';
import * as PC_GUI from './pc_gui.module.js';


// Set global three state for SCENE
const SCENE = new THREE.Scene();
SCENE.background = new THREE.Color( 0xc0c0c0 );

const CAMERA = INIT.CAMERA;
const RENDERER = INIT.RENDERER;
const CONTROLS = INIT.CONTROLS;
const STATS = INIT.STATS;
const GUI = PC_GUI.GUI; 


//START LABELER PROTOTYPING  =================================

let light = new THREE.PointLight( 0xfffffff );
light.position.set( 0, 250, 0 );
SCENE.add( light );
let positions = [5, 5, 5]; 
let geometry = new THREE.BufferGeometry(); 
geometry.setAttribute( 'position', 
                    new THREE.Float32BufferAttribute( positions, 3 ) );
const material = new THREE.PointsMaterial( { color: 0x888888 } );
const points = new THREE.Points( geometry, material );
SCENE.add( points );

//END LABELER PROTOTYPING   ==================================

function scene_update() {
    console.log("Update");
}

function tick() {
    requestAnimationFrame( tick );

    scene_update();

    //Must be called after each update to the cameras transform
    CONTROLS.update();

    RENDERER.render( SCENE, CAMERA ); 

    STATS.update();
}

// Start app cycle
tick();
