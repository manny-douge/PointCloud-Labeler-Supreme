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
CAMERA.aspect = window.innerWidth / window.innerHeight;

//Initialize renderer no fallback or warning yet TODO: ADD FALLBACK
const RENDERER = new THREE.WebGLRenderer( {antialias: true});

// Smaller sizes = lower resolution = better performance
RENDERER.setSize( window.innerWidth, window.innerHeight );

//Set id so we can add specific events for it later
RENDERER.domElement.id = "RENDERER";

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
const STATS_FPS = new Stats();
STATS_FPS.domElement.style.cssText = "position:absolute;top:45px;left:3px;";
document.body.appendChild( STATS_FPS.dom );

//Display memory
const STATS_MEMORY = new Stats();
STATS_MEMORY.domElement.style.cssText = "position:absolute;top:45px;left:84px;";
STATS_MEMORY.showPanel(2);
document.body.appendChild( STATS_MEMORY.dom );


export { SCENE, CONTROLS, CAMERA, RENDERER, STATS_FPS, STATS_MEMORY };
