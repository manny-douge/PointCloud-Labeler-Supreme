import * as PointCloudScene from './pointcloud_scene.module.js';

//Grab reference to our hidden open file button 
const open_file_button = document.getElementById( "OpenFile" );

//variable containing pointcloud json data 
let pc_data = null;
let pc_metadata = null;
let intensity = [];
let ring = [];

function import_data() {
    //alert("Should import data... i guess?");

    //Click hidden file button in body
    open_file_button.click();
}

function clean() {
    //Strip intensity and ring from data 
    //strip_intensity_and_ring();
    
    //Flatten from list or (x, 3) matrix to (x, 1)
    //pc_data = pc_data.flat();

}

function strip_intensity_and_ring() {
    console.log( `First point len ${pc_data[0].length}` );
    for (let p of pc_data) {
        intensity.push( p.pop() );
        ring.push( p.pop() );
    }
    console.log( `First point len after ${pc_data[0].length}` );
    console.log( `Intensity len: ${intensity.length}` );
}

function load_file() {
    console.log( "Loading files here?" );
    if ('files' in open_file_button) {
        let file = open_file_button.files[0];
        console.log(  file   );
        let fileReader = new FileReader();
        fileReader.addEventListener( 'load', (event) => { 
            //TODO: Add error handling if data can't be read
            //Once data is read as text, parse it into JSON 
            //pc_data = JSON.parse( event.target.result )[0];
            pc_data = JSON.parse( event.target.result );
            
            pc_metadata = {
                filename: file.name,
                modified: file.lastModifiedData,
                size: file.size,
            }

            //clean data 
            clean();

            //Print for good measure, 
            //console.log( JSON.stringify( pc_data ) );

            //Tell PointCloudScene that data is ready PogU !!!
            PointCloudScene.data_did_load(); 
        } );

        fileReader.readAsText( file );
    }
}

function export_data() {
    console.log( `Should export data` );
}

//Dynamically link onchange attribute to module function
open_file_button.onchange = load_file; 

export { import_data, export_data, pc_data, pc_metadata };
