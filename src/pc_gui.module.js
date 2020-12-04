import * as INIT from './init.module.js';
import * as DataManager from './data_manager.module.js';
import { clear_all, clear_selected, label_selected, 
        play_animation, stop_animation, forward,
        backward } from './pointcloud_scene.module.js';

//SET UP GUI
const GUI = new dat.GUI();

//Create object so we can bind our params to
let parameters = {
    import_data: DataManager.import_data,
    File: "No file currently loaded.",
    Mode: "VIEWING",
    Rows: "? of ?",
    clear_all: clear_all, 
    clear_selected: clear_selected, 
    label_selected: label_selected, 
    export_data: DataManager.export_data,
    Play: play_animation,
    Stop: stop_animation,
    Forward: forward,
    Backward: backward,
};

// bind each button to a parameter from the above file
// .listen indicates that changes to the parameter should propagate to UI
GUI.add( parameters, 'import_data' ).name("Import JSON");
GUI.add( parameters, 'File' ).listen();
GUI.add( parameters, 'Mode' ).name("Mode").listen();
GUI.add( parameters, 'Rows' ).name("Rows").listen();

var label_utils_folder = GUI.addFolder( 'Point Utilities' );

label_utils_folder.add( parameters, 'clear_all' ).name( "Clear all points" );
label_utils_folder.add( parameters, 'clear_selected' ).name( "Clear selected points" );
label_utils_folder.add( parameters, 'label_selected' ).name( "Label selected points" );

var animator_folder = GUI.addFolder( 'Animator' );
animator_folder.add( parameters, 'Play' ).name( "Play all rows" );
animator_folder.add( parameters, 'Stop' ).name( "Stop" );
animator_folder.add( parameters, 'Forward' ).name( "Forward 1 row" );
animator_folder.add( parameters, 'Backward' ).name( "Backward 1 row" );

var scene_utils_folder = GUI.addFolder( 'Scene Utilities' );
scene_utils_folder.add( parameters, 'export_data' ).name( "Export JSON" );


function change_mode(is_labeling) {
    let text = ( is_labeling ) ? "LABELING" : "VIEWING";
    parameters['Mode'] = text;
}

export { GUI, parameters, change_mode };
