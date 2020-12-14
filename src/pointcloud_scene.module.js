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

var IS_LABELING = false;
var DATA_WAS_LOADED = false;

//Current row of the dataset that we are viewing
let current_row = 0;

//Local reference to imported pointcloud data from dataimporter
let pointcloud_data = null; 

//Stores labeled points as list of lists
let labeled_points = [];

//Points currently selected by a bounding box drag
let currently_selected_points = new Set();

//Renderable object holding our points
let pointcloud = null;

//Geometry representing an effecient representation of the points 
let pointcloud_geometry = null;


let raycaster = new THREE.Raycaster();
let intersects, intersected_pt_index, intersected_pts = [];

let mouse = new THREE.Vector2();
let selection_helper = new SelectionHelper( RENDERER, 'selectBox' );
let animation_interval = null;

function init() {

	//How big are the points we're looking for ?
	raycaster.params.Points.threshold = DEFAULT_POINT_SIZE;

	//Let there be light 
    let light = new THREE.PointLight( 0xfffffff );
    light.position.set( 0, 250, 0 );
    SCENE.add( light );

    //Setup events for shortcuts and raycaster for selections
    let canvas = document.getElementById( "RENDERER" );
    canvas.addEventListener( 'pointermove', onDocumentMouseMove, false );
    canvas.addEventListener( 'pointerup', onBoundingBoxStop );
    document.addEventListener( 'keydown', onKeyDown);
}

//Entry point, function called from data importer once data is ready
function data_did_load() {
    cleanup_scene();
    stop_animation();

    //Abstract call here to pub sub model for scene and other modules as well
    //No reason pcl_scene should be talking directly to update GUI
    //update gui with file info 
    PC_GUI.parameters.File = DataManager.imported_metadata.filename;
    PC_GUI.parameters.Rows = `0 of ${DataManager.imported_data.length}`; 

    //Grab data from data importer 
    pointcloud_data = DataManager.imported_data[current_row];    

    //make labeled point bins
    labeled_points = []; 
    DataManager.imported_data.map( row => labeled_points.push([]) );

    build_pointcloud(); 
	
    //selection_box = new SelectionBox( CAMERA, points );
	//begin update
	DATA_WAS_LOADED = true;
}

function onKeyDown( event ) {

    //console.log( `Key: ${event.code}` );;
    if( event.code == "Space" ) {

        //If they press space, toggle between label and view mode
        IS_LABELING = !( IS_LABELING );
        PC_GUI.change_mode(IS_LABELING);

        //In labeling mode, disable camera controls
        CONTROLS.enabled = !( IS_LABELING ); 

        //In labeling mode, enable selection box
        selection_helper.enabled = IS_LABELING; 
    }
}

function onBoundingBoxStop( event ) {

    if( IS_LABELING ) {

        //console.log( `BB stop: 
        //       st_point_helper: ${ JSON.stringify( selection_helper.scene_start_point ) } 
        //        end_point_helper: ${ JSON.stringify( selection_helper.scene_end_point ) }` );
        raycast_bounding_box(); 
    }
}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    //Calculate + store mouse pos
    mouse.x = ( event.clientX/ window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY/ window.innerHeight) * 2 + 1;
	//console.log( `MX: ${mouse.x} MY: ${mouse.y}` );
}

// Create the color buffer that will be linked to the "customColor" attribute
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
// set the pointcloud_geometries attribute  
function createSizeBuffer() {

    let sizebuff = new Float32Array( pointcloud_data.length );

	let pcl_len = pointcloud_data.length;
    for(let i = 0; i < pcl_len; i++) {
        sizebuff[i] = DEFAULT_POINT_SIZE;
    }
    return sizebuff;
}

function build_pointcloud() {

	//Basic empty circle sprite used for each point  
    let sprite = new THREE.TextureLoader().load( '../sprites/circle.png' );
	
	//Initial buffer containing all the data required each points size
    let size_buffer = createSizeBuffer();

	//Initial buffer containing all the data required each points color 
    let color_buffer = createColorBuffer();

	//This section links attribues defined in the HTML Shaders 
	//(vertexShader and fragmentShader elements) to variables
	//that will be injected into the shader (as buffers) to be updated
    pointcloud_geometry = new THREE.BufferGeometry();
    pointcloud_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute 
                                                     ( pointcloud_data, 3 ) );
    pointcloud_geometry.setAttribute( 'customColor', new THREE.Float32BufferAttribute 
                                                     ( color_buffer, 3 ) );
    pointcloud_geometry.setAttribute( 'size', new THREE.Float32BufferAttribute 
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
    pointcloud = new THREE.Points( pointcloud_geometry, material );
    SCENE.add( pointcloud );

	//X, Y, and Z axes lines to the scene to help with orientation
    SCENE.add( new THREE.AxesHelper( 20 ) );
}

//Move forward one row of the data in the dataset and update scene 
function render_row(new_row) {

    if(new_row < 0 || new_row >= DataManager.imported_data.length) {
        console.error(`Row ${new_row} out of bounds, cannot render`);
        return;
    }

    cleanup_scene();

    //Set new row to current pointcloud data 
    pointcloud_data = DataManager.imported_data[new_row];

    build_pointcloud();

    //highlight and enlarge labeled points if any
    change_point_color( labeled_points[new_row], LABELED_POINT_COLOR);
    change_point_size( labeled_points[new_row], DEFAULT_POINT_SIZE * LABELED_POINT_MUL );

    //Update row GUI YIKES!
    //TODO: Definitely gotta do some major decoupling here 
    PC_GUI.parameters.Rows = `${new_row} of ${DataManager.imported_data.length}`; 
}

//Move to next row of data set technically next pointcloud
function render_next_row() {

    current_row = (current_row + 1) % DataManager.imported_data.length;
    render_row(current_row);

}

//Move to next row of data set technically next pointcloud
function render_prev_row() {

    current_row = (current_row == 0) ? current_row : current_row - 1;
    render_row(current_row)

}

function play_animation() {
    stop_animation();

    animation_interval = setInterval( function() {
        render_next_row();
    }, 100);

}

function cleanup_scene() {
    if(pointcloud) {
        SCENE.remove(pointcloud);
        pointcloud = null;
    }
   
    // Must be called when geometry will be removed while app is running
    if(pointcloud_geometry) {

        pointcloud_geometry.dispose();
        pointcloud_geometry = null;

    }
}


function stop_animation() {

    if(animation_interval) {
        clearInterval(animation_interval);
    }
    animation_interval = null;
}


function change_point_size( points_to_update, size ) {

    let size_attr = pointcloud_geometry.getAttribute( 'size' );

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

    let color_attr = pointcloud_geometry.getAttribute( 'customColor' );

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
    //currently_selected_points.map( idx => labeled_copy.push( idx ) );
    labeled_points[current_row] = Array.from(currently_selected_points);

    change_point_color( labeled_points[current_row], LABELED_POINT_COLOR);
    change_point_size( labeled_points[current_row], DEFAULT_POINT_SIZE * LABELED_POINT_MUL );

    //reset current selection 
    currently_selected_points = new Set(); 
}

function clear_all() {

    let all_indices = get_point_indices();

    change_point_color( all_indices, DEFAULT_POINT_COLOR );
    change_point_size( all_indices, DEFAULT_POINT_SIZE );

    currently_selected_points = new Set();
    labeled_points[current_row] = [];
}

function clear_selected() {
    let selected = Array.from(currently_selected_points);

    change_point_color( selected, DEFAULT_POINT_COLOR );
    change_point_size( selected, DEFAULT_POINT_SIZE );
    currently_selected_points = new Set();
}

function raycast_bounding_box() {

    console.log( `Shooting bounding box rays` );
    
	//just for bounding box, we want to catch all the points
    //we can, so set a big threshold for the mean time
	raycaster.params.Points.threshold = DEFAULT_POINT_SIZE * 2;

    //Get bounding box dimensions from selection_helper
    let bb_start_pt = selection_helper.scene_start_point;
    let bb_end_pt   = selection_helper.scene_end_point;

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
            let intersects = raycaster.intersectObject( pointcloud );

            //Add new intersected pts to array so we can highlight them
            //later 
            intersects.map( pt => currently_selected_points.add( pt.index ) ); 
        }        
    }

    let selected = Array.from(currently_selected_points); 

    //highlight all points hit 
    change_point_color( selected, SELECTED_POINT_COLOR);

    //enlarge all points hit 
    change_point_size( selected, DEFAULT_POINT_SIZE * LABELED_POINT_MUL );

    //set raycaster threshold back to normal
	raycaster.params.Points.threshold = DEFAULT_POINT_SIZE;

    console.log( `Done box ray cast, points selected total: ${selected.length}` );

    return selected;
}

function highlight_points_under_mouse() {

    raycaster.setFromCamera( mouse, CAMERA );
    intersects = raycaster.intersectObject( pointcloud );

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

        change_point_color( intersected_pts, DEFAULT_POINT_COLOR );

        intersected_pts = [];
    }
}

function update() {
    //Dont update if data hasnt loaded yet
	if(DATA_WAS_LOADED == false ) {
		return;
	}
    
    highlight_points_under_mouse();
}

export { init, update, data_did_load, clear_all, clear_selected, labeled_points,
            label_selected, play_animation, stop_animation, render_next_row, render_prev_row};
