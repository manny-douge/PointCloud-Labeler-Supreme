import * as THREE from '../lib/three.module.js';
import * as INIT from './init.module.js';
import * as PC_GUI from './pc_gui.module.js';
import * as PointCloudScene from './pointcloud_scene.module.js';


// Set global state for scene  
const SCENE = INIT.SCENE;
const CAMERA = INIT.CAMERA;
const RENDERER = INIT.RENDERER;
const CONTROLS = INIT.CONTROLS;
const STATS = INIT.STATS;
const GUI = PC_GUI.GUI; 


//START LABELER PROTOTYPING  =================================

PointCloudScene.init();

//END LABELER PROTOTYPING   ==================================

function tick() {
    requestAnimationFrame( tick );
    
    //PCL Scene update 
    PointCloudScene.update();

    //Must be called after each update to the cameras transform
    //Gives us free pan, rotate, zoom
    CONTROLS.update();

    //Render scene 
    RENDERER.render( SCENE, CAMERA ); 

    //Displays stats like fps and performance
    STATS.update();
}

// Start app cycle
tick();
