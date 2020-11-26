import * as THREE from '../lib/three.module.js';
import { SelectionBox } from '../lib/SelectionBox.js';
import { SelectionHelper } from '../lib/SelectionHelper.js';
import * as INIT from './init.module.js';
import * as DataImporter from './data_importer.module.js';

const SCENE = INIT.SCENE;
const RENDERER = INIT.RENDERER;
const CAMERA = INIT.CAMERA;

const DEFAULT_POINT_SIZE = 0.02;
const LABELED_POINT_MUL = 3;
const DEFAULT_POINT_COLOR = new THREE.Color( 0x778899 );
const LABELED_POINT_COLOR = new THREE.Color( 0xFF0000 );

let DATA_WAS_LOADED = false;
let pointcloud_data = null; 
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let intersects, intersected_pt_index;
let points;
let selection_box = new SelectionBox( CAMERA, SCENE );
let helper = new SelectionHelper( selection_box, RENDERER, 'selectBox' );

function init() {
    console.log( "Init PCL Scene" );

	//How big are the points we're looking for ?
	raycaster.params.Points.threshold = DEFAULT_POINT_SIZE;

	//Let there be light !1! 
    let light = new THREE.PointLight( 0xfffffff );
    light.position.set( 0, 250, 0 );
    SCENE.add( light );

    window.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'pointerdown', onBoundingBoxStart, false );
    document.addEventListener( 'pointermove', onBoundingBoxMove, false );
    document.addEventListener( 'pointerup', onBoundingBoxStop, false );
}

function onBoundingBoxStart() {
	console.log( "Bounding box start" );
	for ( const item of selection_box.collection ) {
		item.material.emissive.set( 0x000000 );

	}

	selection_box.startPoint.set(
		( event.clientX / window.innerWidth ) * 2 - 1,
		- ( event.clientY / window.innerHeight ) * 2 + 1,
		0.5 );
}

function onBoundingBoxMove() {

	if( helper.isDown ) {
		for ( let i = 0; i < selection_box.collection.length; i ++ ) {
			selection_box.collection[ i ].material.emissive.set( 0x000000 );
		}

		selection_box.endPoint.set(
			( event.clientX / window.innerWidth ) * 2 - 1,
			- ( event.clientY / window.innerHeight ) * 2 + 1,
			0.5 );

		const allSelected = selection_box.select();
		
		console.log( `Points in SelectionBox ${allSelected.length}` );
		for ( let i = 0; i < allSelected.length; i ++ ) {
			allSelected[ i ].material.emissive.set( 0xffffff );
		}
	}
}

function onBoundingBoxStop() {
	console.log( "Bounding box stop" );
	selection_box.endPoint.set(
		( event.clientX / window.innerWidth ) * 2 - 1,
		- ( event.clientY / window.innerHeight ) * 2 + 1,
		0.5 );

	const allSelected = selection_box.select();
	console.log( `BoundingBoxStop: Points SelectionBox ${allSelected.length}` );

	for ( let i = 0; i < allSelected.length; i ++ ) {

		allSelected[ i ].material.emissive.set( 0xffffff );
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
	} );

	//Create pointcloud from explicit geometry and material
    points = new THREE.Points( geometry, material );
    SCENE.add( points );

	//X, Y, and Z axes lines to the scene to help with orientation
    SCENE.add( new THREE.AxesHelper( 20 ) );
}

function data_did_load() {
    //Grab data from data importer 
    pointcloud_data = DataImporter.pc_data;    

    render_pointcloud(); 
	
	//begin update
	DATA_WAS_LOADED = true;
}

function update() {
	//Not time to update yet....
	if(DATA_WAS_LOADED == false) {
		return;
	}
    console.log( "PointCloud Scene Update" );

    raycaster.setFromCamera( mouse, CAMERA );
    intersects = raycaster.intersectObject( points );

    let pt_geometry = points.geometry;
	let size_attr = points.geometry.getAttribute( 'size' );
	let color_attr = points.geometry.getAttribute( 'customColor' );

	//Check if hit something 
    if( intersects.length > 0 ) {
        if ( intersected_pt_index != intersects[0].index ) {
			//Set point to it's original point size             
            size_attr.array[intersected_pt_index] = DEFAULT_POINT_SIZE;

			//Get index of point in pointcloud that raycast hit 
			intersected_pt_index = intersects[0].index;

			//Expand point hit by raycast  
            size_attr.array[intersected_pt_index] = DEFAULT_POINT_SIZE * LABELED_POINT_MUL;

			//Tell GSLS shader to update colors on next render 
			size_attr.needsUpdate = true;


			//Color Idx * 3 is the actual index of the point in the 
			//pointcloud, this is because the color is stored as
			//r0,g0,b0,r1,g1,b1,...rn,gn,bn.
			//x0,y0,z0,x1,y1,z1,...xn,yn,zn.
			//So point i's red value will be stored in color_buffer[i * 3]
			let colorIdx = intersected_pt_index * 3;
			
			//Set red value for point
            color_attr.array[ colorIdx ] = LABELED_POINT_COLOR.r;

			//Set green value for point
            color_attr.array[ colorIdx + 1 ] = LABELED_POINT_COLOR.g;

			//Set blue value for point
            color_attr.array[ colorIdx + 2 ] = LABELED_POINT_COLOR.b; 

			//Tell GSLS shader to update colors on next render 
			color_attr.needsUpdate = true;	
        }
    } else if ( intersected_pt_index !== null ) {
		//If we didnt hit anything set the last point hit back to normal
        size_attr.array[intersected_pt_index] = DEFAULT_POINT_SIZE;
		size_attr.needsUpdate = true;

		//TODO: Set default color back to normal here 
		//color_attr.needsUpdate = true;	
        intersected_pt_index = null;
    }
}

export { init, update, data_did_load };
