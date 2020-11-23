import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { TrackballControls } from "https://threejs.org/examples/jsm/controls/TrackballControls.js";
import Stats from "https://threejs.org/examples/jsm/libs/stats.module.js"; 

//Set up SCENE 
const SCENE = new THREE.Scene();
SCENE.background = new THREE.Color( 0xc0c0c0 );

// Setup Persp Camera, arguments are FOV, aspect ratio, near clip, far cli p
const CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth/
                                      window.innerHeight, 1, 1000 )
//CAMERA.position.set( 1000, 50, 1500);
CAMERA.position.z = 5;

//Initialize renderer no fallback or warning yet TODO: ADD FALLBACK
const RENDERER = new THREE.WebGLRenderer( {antialias: true});

// Smaller sizes = lower resolution = better performance
RENDERER.setSize( window.innerWidth, window.innerHeight );

//Append render to the index body
document.body.appendChild( RENDERER.domElement );

//Set up controllers for dragging and panning
//const CONTROLS = new OrbitControls( CAMERA, RENDERER.domElement );
const CONTROLS = new TrackballControls( CAMERA, RENDERER.domElement );

//Setup default clamps
//CONTROLS.maxPolarAngle = Math.PI * 0.8;
CONTROLS.minDistance = 1;
CONTROLS.maxDistance = 5000;
//CONTROLS.autoRotate = true;
CONTROLS.rotateSpeed = 1.0;
CONTROLS.zoomSpeed = 1.2;
CONTROLS.panSpeed = 0.8;


//Displays stats, FPS, etc...
const STATS = new Stats();
document.body.appendChild( STATS.dom );


export { SCENE, CONTROLS, CAMERA, RENDERER, STATS };
