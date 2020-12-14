import * as PointCloudScene from './pointcloud_scene.module.js';

//variable containing pointcloud json data 
let imported_data = null;
let imported_metadata = null;
let exported_data = null;

//Grab reference to our hidden open file button 
const open_file_button = document.getElementById( "OpenFile" );

// Link onchange of open file button to load_file
// After the file browser is opened and the file is selected,
// onChange will be called with this function
open_file_button.onchange = load_file; 

function open_file_browser() {

    //Click hidden file button in body
    open_file_button.click();
}

function strip_intensity_and_ring() {

    for (let p of imported_data) {
        intensity.push( p.pop() );
        ring.push( p.pop() );
    }

    console.log( `First point len after ${imported_data[0].length}` );
    console.log( `Intensity len: ${intensity.length}` );
}

function load_file() {

    if ('files' in open_file_button) {

        let fileReader = new FileReader();

        fileReader.addEventListener( 'load', (event) => { 
            //TODO: Add error handling if data can't be read
            //Once data is read as text, parse it into JSON 
            //imported_data = JSON.parse( event.target.result )[0];
            imported_data = JSON.parse( event.target.result );
            
            let file_meta  = open_file_button.files[0];
            imported_metadata = {
                filename: file_meta.name,
                modified: file_meta.lastModifiedData,
                size: file_meta.size,
            }

            //Clean data here if 
            //clean();

            //Print for good measure, 
            //console.log( JSON.stringify( imported_data ) );

            //Tell PointCloudScene that data is ready PogU !!!
            PointCloudScene.data_did_load(); 
        } );
        
        fileReader.readAsText( open_file_button.files[0] );
    }
}

function package_data() {
    let labeled = PointCloudScene.labeled_points;
    console.log(`Labeled length: ${labeled.length}`);
    
    let export_json  = [];

    //reduce literal label of points to 1 or 0
    //1 noting that a human exists in this frame
    //0 noting opposite
    labeled.map( ele => {
        if(ele.length == 0) {
            export_json.push(0)
        } else {
            export_json.push(1);
        }
    }); 
    return export_json;
}

function export_data() {
    let export_json = JSON.stringify(package_data());

    let blob1 = new Blob([export_json], { type: "text/plain;charset=utf-8" });
    let url = window.URL || window.webkitURL;
    let link = url.createObjectURL(blob1);
    let a = document.createElement("a");
    a.download = "labeled_rows.json";
    a.href = link;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}



export { open_file_browser, export_data, imported_data, imported_metadata };
