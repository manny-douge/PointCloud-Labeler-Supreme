import * as THREE from '../lib/three.module.js';
import { SelectionHelper } from '../src/SelectionHelper.js';
import * as INIT from './init.module.js';
import * as DataManager from './data_manager.module.js';
import * as PC_GUI from './pc_gui.module.js';

const SCENE = INIT.SCENE;
const RENDERER = INIT.RENDERER;
const CAMERA = INIT.CAMERA;
const GUI = PC_GUI.GUI; 
const CONTROLS = INIT.CONTROLS;

const DEFAULT_POINT_SIZE = 0.02;
const LABELED_POINT_MUL = 3;
const DEFAULT_POINT_COLOR = new THREE.Color( 0x778899 );   //GRAY
const LABELED_POINT_COLOR = new THREE.Color( 0xFF0000 );  //ORANGE
const SELECTED_POINT_COLOR = new THREE.Color( 0xDFA602 ); //RED

const SCENE_STATE = Object.assign( { 
    VIEWING: "VIEWING",
    LABELING: "LABELING",    //Orbit controls disasbled in labeling state 
} );

let IS_LABELING = false;

//TODO: CHOOSE ONE STATE VAR OR BOOLEAN FOR STATE
let CURRENT_STATE = SCENE_STATE.VIEWING;
let DATA_WAS_LOADED = false;
let current_row = 0;
let pointcloud_data = null; 
let labeled_points = [];
let current_selected_points = [];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let intersects, intersected_pt_index, intersected_pts = [];
let points;
let selection_box =  { startPoint: new THREE.Vector2(), endPoint: new THREE.Vector2()  }
let helper = new SelectionHelper( selection_box, RENDERER, 'selectBox' );
let animation_interval = null;

function init() {
    console.log( "Init PCL Scene" );

	//How big are the points we're looking for ?
	raycaster.params.Points.threshold = DEFAULT_POINT_SIZE;

	//Let there be light !1! 
    let light = new THREE.PointLight( 0xfffffff );
    light.position.set( 0, 250, 0 );
    SCENE.add( light );

    let canvas = document.getElementById( "RENDERER" );
    canvas.addEventListener( 'pointermove', onDocumentMouseMove, false );
    canvas.addEventListener( 'pointermove', onBoundingBoxMove );
    canvas.addEventListener( 'pointerup', onBoundingBoxStop );
    document.addEventListener( 'keydown', onKeyDown);
}

function onKeyDown( event ) {
    //console.log( `Key: ${event.code}` );;
    if( event.code == "Space" ) {
        //If they press space, toggle between label and view mode
        IS_LABELING = !( IS_LABELING );
        PC_GUI.change_mode(IS_LABELING);

        //In labeling mode, disable camera controls
        CONTROLS.enabled = !( IS_LABELING ); 

        //In labeling mode, enable selectionhelper 
        helper.enabled = IS_LABELING; 

    }
}

function onBoundingBoxMove( event ) {
	//console.log( `BB move: ${selection_box.collection.length}` );
	if( helper.isDown ) {
		//for ( let i = 0; i < selection_box.collection.length; i ++ ) {
		//	selection_box.collection[ i ].material.emissive.set( 0x000000 );
		//}

		selection_box.endPoint.set(
			( event.clientX / window.innerWidth ) * 2 - 1,
			- ( event.clientY / window.innerHeight ) * 2 + 1,
			0.5 );

		//const allSelected = selection_box.select();
		//
		//for ( let i = 0; i < allSelected.length; i ++ ) {
		//	allSelected[ i ].material.emissive.set( 0xffffff );
		//}
	}
}

function onBoundingBoxStop( event ) {

    if( IS_LABELING ) {
        console.log( `BB stop: 
                st_point_helper: ${ JSON.stringify( helper.scene_start_point ) } 
                end_point_helper: ${ JSON.stringify( helper.scene_end_point ) }` );
        raycast_bounding_box(); 
    }
}

function onDocumentMouseMove( event ) {
    event.preventDefault();

    mouse.x = ( event.clientX/ window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY/ window.innerHeight) * 2 + 1;
	//console.log( `MX: ${mouse.x} MY: ${mouse.y}` );
}

// Create the size buffer that will be linked to the "size" attribute
// declared in the HTML shader element, moving forward,
// to update the size of any point we will access this buffer after we
// set the geometries attribute, here we have 3 values per point.
// R, G, B for 1 point. so we have RGB (3) * (1 point) pieces of data for each
// point 
function createColorBuffer() {
    let colorbuff = new Float32Array( pointcloud_data.length * 3 );

	let pcl_len = pointcloud_data.length;
    for(let i = 0; i < pcl_len*3; i += 3) {
		//Set red value for point i
        colorbuff[ i ] = DEFAULT_POINT_COLOR.r;

		//Set green value for point i
        colorbuff[ i + 1 ] = DEFAULT_POINT_COLOR.g;

		//Set blue value for point i
        colorbuff[ i + 2 ] = DEFAULT_POINT_COLOR.b;
    }

    return colorbuff;
}

// Create the size buffer that will be linked to the "size" attribute
// declared in the HTML shader element, moving forward,
// to update the size of any point we will access this buffer after we
// set the geometries attribute  
function createSizeBuffer() {
    let sizebuff = new Float32Array( pointcloud_data.length );

	let pcl_len = pointcloud_data.length;
    for(let i = 0; i < pcl_len; i++) {
        sizebuff[i] = DEFAULT_POINT_SIZE;
    }
    return sizebuff;
}

function render_pointcloud() {
   	
	//Basic empty circle sprite used for each point  
    let sprite = new THREE.TextureLoader().load( '../sprites/circle.png' );
	
	//Initial buffer containing all the data required each points size
    let size_buffer = createSizeBuffer();

	//Initial buffer containing all the data required each points color 
    let color_buffer = createColorBuffer();

	//This section links attribues defined in the HTML Shaders 
	//(vertexShader and fragmentShader elements) to variables
	//that will be injected into the shader (as buffers) to be updated
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute 
                                                     ( pointcloud_data, 3 ) );
    geometry.setAttribute( 'customColor', new THREE.Float32BufferAttribute 
                                                     ( color_buffer, 3 ) );
    geometry.setAttribute( 'size', new THREE.Float32BufferAttribute 
                                                     ( size_buffer, 1 ) );

	//TODO: add shader and shadermaterial links for the boys
	const material = new THREE.ShaderMaterial( {
		uniforms: {
			color: { value: DEFAULT_POINT_COLOR },
			pointTexture: { value: sprite } 
		},
		vertexShader: document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
		transparent: true,
        alphaTest: 0.05,
	} );

	//Create pointcloud from explicit geometry and material
    points = new THREE.Points( geometry, material );
    SCENE.add( points );

	//X, Y, and Z axes lines to the scene to help with orientation
    SCENE.add( new THREE.AxesHelper( 20 ) );
}

function play_animation() {
    animation_interval = setInterval( function() {
        forward();
    }, 100);
}

function forward() {
    //Delete old pointcloud 
    SCENE.remove( points );
    
    //Move to next row of data set technically next pointcloud
    current_row = (current_row + 1) % DataManager.pc_data.length;

    //Set new row to current pointcloud data 
    pointcloud_data = DataManager.pc_data[current_row];

    render_pointcloud();

    //highlight labeled points 
    change_point_color( labeled_points[current_row], LABELED_POINT_COLOR);
    change_point_size( labeled_points[current_row], DEFAULT_POINT_SIZE * LABELED_POINT_MUL );
    //Update row GUI YIKES!
    //TODO: Definitely gotta do some major decoupling here 
    PC_GUI.parameters.Rows = `${current_row} of ${DataManager.pc_data.length}`; 
}

function backward() {
    //Delete old pointcloud 
    SCENE.remove( points );
    
    //Move to next row of data set technically next pointcloud
    current_row = (current_row == 0) ? current_row : current_row - 1;

    //Set new row to current pointcloud data 
    pointcloud_data = DataManager.pc_data[current_row];

    render_pointcloud();

    //highlight labeled points 
    change_point_color( labeled_points[current_row], LABELED_POINT_COLOR);
    change_point_size( labeled_points[current_row], DEFAULT_POINT_SIZE * LABELED_POINT_MUL );

    //Update row GUI YIKES!
    //TODO: Definitely gotta do some major decoupling here 
    PC_GUI.parameters.Rows = `${current_row} of ${DataManager.pc_data.length}`; 
}

function stop_animation() {
    if(animation_interval) {
        clearInterval(animation_interval);
    }
    animation_interval = null;
}

function data_did_load() {
    //Abstract call here to pub sub model for other modules as well
    //No reason pcl_scene should be talking directly to GUI
    //update gui with file info 
    PC_GUI.parameters.File = DataManager.pc_metadata.filename;
    PC_GUI.parameters.Rows = `0 of ${DataManager.pc_data.length}`; 

    //Grab data from data importer 
    pointcloud_data = DataManager.pc_data[current_row];    

    //make labeled point bins
    labeled_points = []
    pointcloud_data.map( row => labeled_points.push([]) );

    render_pointcloud(); 
	
    //selection_box = new SelectionBox( CAMERA, points );
	//begin update
	DATA_WAS_LOADED = true;
}

function change_point_size( points_to_update, size ) {
    let size_attr = points.geometry.getAttribute( 'size' );

    var points_intersected = [].concat( points_to_update || [] );
    for( let i = 0; i < points_intersected.length; i++ ) {
        let pt_index = points_intersected[i];

        //Update size for point 
        size_attr.array[ pt_index ] = size;
    }

    //Tell GSLS shader to update colors on next render 
    size_attr.needsUpdate = true;	
}

function change_point_color( points_to_update, color ) {
    let color_attr = points.geometry.getAttribute( 'customColor' );

    var points_intersected = [].concat( points_to_update || [] );
    for( let i = 0; i < points_intersected.length; i++ ) {
        let pt_index = points_intersected[i];

        let colorIdx = pt_index * 3;
        
        //Set red value for point
        color_attr.array[ colorIdx ] = color.r;

        //Set green value for point
        color_attr.array[ colorIdx + 1 ] = color.g;

        //Set blue value for point
        color_attr.array[ colorIdx + 2 ] = color.b; 
    }

    //Tell GSLS shader to update colors on next render 
    color_attr.needsUpdate = true;	
}

function get_point_indices() {
    //create list of indices for all points 
    let pointcloud_data_indices = [];
    for(let i = 0; i < pointcloud_data.length; i++) {
        pointcloud_data_indices.push( i );
    }
     
    return pointcloud_data_indices;
}

function label_selected() {
    let labeled_copy = [];
    //make deep copy of currently selected 
    current_selected_points.map( idx => labeled_copy.push( idx ) );
    labeled_points[current_row] = labeled_copy;

    change_point_color( labeled_points[current_row], LABELED_POINT_COLOR);
    change_point_size( labeled_points[current_row], DEFAULT_POINT_SIZE * LABELED_POINT_MUL );

    //reset current selection 
    current_selected_points = [];
}

function clear_all() {
    labeled_points[current_row] = [];
    let all_indices = get_point_indices();
    change_point_color( all_indices, DEFAULT_POINT_COLOR );
    change_point_size( all_indices, DEFAULT_POINT_SIZE );
    current_selected_points = [];
}

function clear_selected() {
    let selected_indices = current_selected_points;
    change_point_color( selected_indices, DEFAULT_POINT_COLOR );
    change_point_size( selected_indices, DEFAULT_POINT_SIZE );
    current_selected_points= [];
}

function raycast_bounding_box() {
    console.log( `Shooting bounding box rays` );
    
	//just for bounding box, we want to catch all the points
    //we can, so set a big threshold for the mean time
	raycaster.params.Points.threshold = DEFAULT_POINT_SIZE * 2;

    //Get bounding box dimensions from helper
    let bb_start_pt = helper.scene_start_point;
    let bb_end_pt   = helper.scene_end_point;
    console.log( `Before correction: s_x:${ bb_start_pt.x} s_y: ${bb_start_pt.y}
                    e_x:${ bb_end_pt.x} e_y: ${bb_end_pt.y}` );
    //Before we can run the for loop shooting rays in the bounding box
    //we need to correct the bounding box based on where the start
    //points begin and end points end. depending on how someone
    //makes a bounding box you can end up in any of the four quadrants
    //of a coordinate system, the next code segment corrects this
    //so we can use 1 for loop for all 4 quadrants

    //Set up some point copies in advance 
    let temp_start = Object.assign( bb_start_pt );
    let temp_end   = Object.assign( bb_end_pt );

    // handles 2nd quadrant
    if( bb_end_pt.x < bb_start_pt.x && bb_end_pt.y < bb_start_pt.y) { 
        bb_start_pt = new THREE.Vector2( bb_end_pt.x, bb_end_pt.y );
        bb_end_pt   = new THREE.Vector2( temp_start.x, temp_start.y );
    } else if( bb_end_pt.x < bb_start_pt.x ) { // handles 3rd quadrant
        bb_start_pt = new THREE.Vector2( bb_end_pt.x, bb_start_pt.y );
        bb_end_pt   = new THREE.Vector2( temp_start.x, bb_end_pt.y );
    } else if( bb_end_pt.y < bb_start_pt.y) { //Handles 4th quadrant
        bb_start_pt = new THREE.Vector2( bb_start_pt.x, bb_end_pt.y );
        bb_end_pt   = new THREE.Vector2( bb_end_pt.x, temp_start.y );
    } 
    //console.log( `after correction: s_x:${ bb_start_pt.x} s_y: ${bb_start_pt.y}
     //               e_x:${ bb_end_pt.x} e_y: ${bb_end_pt.y}` );
    //array of indexes of the points hit for now
    //current_selected_points 
    
    //let start_x = bb_start_pt.x;
    let end_x   = bb_end_pt.x;
    let end_y   = bb_end_pt.y;
    let smp_rate = DEFAULT_POINT_SIZE; 
    //iterate over subset of bounding boxes and shoot rays
    for( let start_y = bb_start_pt.y; start_y < end_y; start_y += smp_rate) {
        for( let start_x = bb_start_pt.x; start_x < end_x; start_x += smp_rate) {
            //console.log( `start_x: ${start_x} start_y:${start_y}` );
            //shoot rays from current point
            let curr_pt = new THREE.Vector2( start_x, start_y );
            raycaster.setFromCamera( curr_pt, CAMERA );
            let intersects = raycaster.intersectObject( points );

            //Add new intersected pts to array so we can highlight them
            //later 
            intersects.map( pt => current_selected_points.push( pt.index ) ); 
        }        
    }
    
    //highlight all points hit 
    change_point_color( current_selected_points, SELECTED_POINT_COLOR);

    //enlarge all points hit 
    change_point_size( current_selected_points, DEFAULT_POINT_SIZE * LABELED_POINT_MUL );

    //set raycaster threshold back to normal
	raycaster.params.Points.threshold = DEFAULT_POINT_SIZE;

    console.log( `Done box ray cast, points_hit length: ${current_selected_points.length}` );
    return current_selected_points;
}

function highlight_points_under_mouse() {
    raycaster.setFromCamera( mouse, CAMERA );
    intersects = raycaster.intersectObject( points );

	//Check if hit something 
    if( intersects.length > 0 ) {
        if ( intersected_pt_index != intersects[0].index ) {
			//console.log( `Raycast hit ${intersects.length}` );
            if( intersected_pts.length > 0) {
                //unhighlight old points 
                change_point_color( intersected_pts, DEFAULT_POINT_COLOR ); 
                change_point_size( intersected_pts, DEFAULT_POINT_SIZE ); 
                intersected_pts = [];
            }
            
            //Add new intersected pts to array so we can highlight them
            //later 
            intersects.map( pt => intersected_pts.push( pt.index ) ); 
            
            let new_size = DEFAULT_POINT_SIZE * LABELED_POINT_MUL; 
            change_point_size( intersected_pts, new_size ); 

			//Color Idx * 3 is the actual index of the point in the 
			//pointcloud, this is because the color is stored as
			//r0,g0,b0,r1,g1,b1,...rn,gn,bn.
			//x0,y0,z0,x1,y1,z1,...xn,yn,zn.
			//So point i's red value will be stored in color_buffer[i * 3]
            change_point_color( intersected_pts, SELECTED_POINT_COLOR);
        }
    } else if ( intersected_pt_index !== null && intersected_pts.length > 0 )  {

        //If we didnt hit anything set last point size & color
        //back to defualt  
        change_point_size( intersected_pts, DEFAULT_POINT_SIZE );

        //Set color attribuets back to normal
        change_point_color( intersected_pts, DEFAULT_POINT_COLOR );

        //intersected_pt_index = null;
        intersected_pts = [];
    }
}

function update() {
    //Dont update if data hasnt loaded yet
    //or is in the middle labeling
	if(DATA_WAS_LOADED == false ) {
		return;
	}
    
    highlight_points_under_mouse();
}

export { init, update, data_did_load, clear_all, clear_selected, 
            label_selected, play_animation, stop_animation, forward, backward };
