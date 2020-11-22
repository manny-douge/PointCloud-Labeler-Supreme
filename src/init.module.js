import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import Stats from "https://threejs.org/examples/jsm/libs/stats.module.js"; 


// Setup Persp Camera, arguments are FOV, aspect ratio, near clip, far cli p
const CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth/
                                      window.innerHeight, 1, 1000 )
//CAMERA.position.set( 1000, 50, 1500);
CAMERA.position.z = 5;

//Initialize renderer no fallback or warning yet TODO: ADD FALLBACK
const RENDERER = new THREE.WebGLRenderer( {antialias: true});

// Smaller sizes = lower resolution = better performance
RENDERER.setSize( window.innerWidth, window.innerHeight );

//Set up controllers for dragging and panning
const CONTROLS = new OrbitControls( CAMERA, RENDERER.domElement );

//Setup default clamps
CONTROLS.maxPolarAngle = Math.PI * 0.5;
CONTROLS.minDistance = 1;
CONTROLS.maxDistance = 5000;

//Append render to the index body
document.body.appendChild( RENDERER.domElement );

//Displays stats, FPS, etc...
const STATS = new Stats();
document.body.appendChild( STATS.dom );


export { CONTROLS, CAMERA, RENDERER, STATS };
