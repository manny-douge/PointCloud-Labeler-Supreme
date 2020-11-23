import * as THREE from '../lib/three.module.js';
import * as INIT from './init.module.js';
import * as DataImporter from './data_importer.module.js';

const SCENE = INIT.SCENE;
const CAMERA = INIT.CAMERA;

let pointcloud_data = null; 
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let intersects, INTERSECTED;
let points;

function init() {
    console.log( "Init PCL Scene" );
    let light = new THREE.PointLight( 0xfffffff );
    light.position.set( 0, 250, 0 );
    SCENE.add( light );

    window.addEventListener( 'mousemove', onDocumentMouseMove, false);
}

function onDocumentMouseMove( event ) {
    event.preventDefault();

    mouse.x = ( event.clientX/ window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY/ window.innerHeight) * 2 + 1;
}

function createColorBuffer() {
    let colorbuff = [];

    for(let i = 0; i < pointcloud_data.length; i++) {
        colorbuff.push(0.3, 0.6, 1.0);
    }
    return colorbuff;
}
function createSizeBuffer() {
    let sizebuff = [];

    for(let i = 0; i < pointcloud_data.length; i++) {
        sizebuff.push(0.2);
    }
    return sizebuff;
}

function render_pointcloud() {
    //alert( "Rendering pointcloud..." ); 
    
    let sprite = new THREE.TextureLoader().load( '../sprites/circle.png' );
    let sizebuff = createSizeBuffer();
    let colorbuff = createColorBuffer();

    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute 
                                                            ( pointcloud_data, 3 ) );
    geometry.setAttribute( 'size', new THREE.Float32BufferAttribute 
                                                            ( sizebuff, 1 ) );
    geometry.setAttribute( 'customColor', new THREE.Float32BufferAttribute 
                                                            ( colorbuff, 3 ) );

    const material = new THREE.PointsMaterial( { 
        //uniforms: {
          //  color: { value: new THREE.Color( 0x848484 ) },
         //   pointTexture: { value: sprite },
        //},
        //alphaTest: 0.9,
        size: 0.02, 
        color: 0x848484, 
        map: sprite,
        alphaTest: 0.5,
        transparent: true,
        } );
    material.color.setHSL( 0.8, 0.3, 0.5 );

    points = new THREE.Points( geometry, material );
    SCENE.add( points );
    SCENE.add( new THREE.AxesHelper( 20 ) );

}

function data_did_load() {
    //Grab data from data importer 
    pointcloud_data = DataImporter.pc_data;    

    render_pointcloud(); 
}

function update() {
    if(pointcloud_data == null || points == null) {
        return;
    }

    console.log( "PointCloud Scene Update" );
    
    let geometry = points.geometry;
    let attributes = geometry.attributes;

    raycaster.setFromCamera( mouse, CAMERA );

    intersects = raycaster.intersectObject( points );

    if( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[0].index ) {
            
            //attributes.size.array[INTERSECTED] = 0.02
            var newColor = new THREE.Color();
            newColor.setRGB( 1, 1, 1 );

            INTERSECTED = intersects[0].index;
            points.geometry.colors[INTERSECTED] = newColor;
            points.geometry.colorsNeedUpdate = true;
           //attributes.size.array[INTERSECTED] = 0.02 * 1.25
           //attributes.size.needsUpdate = true;
        }
    } else if ( INTERSECTED !== null ) {
        attributes.size.array[INTERSECTED] = 0.02;
        attributes.size.needsUpdate = true;
        INTERSECTED = null;
    }
}

export { init, update, data_did_load };
