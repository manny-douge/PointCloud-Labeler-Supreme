import * as THREE from '../lib/three.module.js';
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import Stats from "https://threejs.org/examples/jsm/libs/stats.module.js";
import * from './init.module.js';
// Set global three state for SCENE
const SCENE = new THREE.Scene();
SCENE.background = new THREE.Color( 0xc0c0c0 );

// Setup Persp Camera, arguments are FOV, aspect ratio, near clip, far clip
const CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth/
                                    window.innerHeight, 1, 1000 )
//CAMERA.position.set( 1000, 50, 1500);
CAMERA.position.z = 5;

//Initialize renderer no fallback or warning yet TODO: ADD FALLBACK
const RENDERER = new THREE.WebGLRenderer( {antialias: true});

// Size to render our app at,
// Smaller sizes = lower resolution = better performance
RENDERER.setSize( window.innerWidth, window.innerHeight );

//Set up controllers for dragging and panning 
const CONTROLS = new OrbitControls( CAMERA, RENDERER.domElement );
CONTROLS.maxPolarAngle = Math.PI * 0.5;
CONTROLS.minDistance = 1;
CONTROLS.maxDistance = 5000;

//Append render to the index body 
document.body.appendChild( RENDERER.domElement );

const STATS = new Stats();
document.body.appendChild( STATS.dom );

function import_json() {
    alert("Ello gubna!");
}

//SET UP GUI
const gui = new dat.GUI();
let parameters = {
    import_param: import_json,
};

gui.add( parameters, 'import_param' ).name("Import JSON");

//GUI.add(
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
