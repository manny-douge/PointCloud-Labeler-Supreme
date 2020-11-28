import * as INIT from './init.module.js';
import * as DataImporter from './data_importer.module.js';

//SET UP GUI
const GUI = new dat.GUI();

//Create object so we can bind our params to
let parameters = {
    import_param: DataImporter.import_data,
    File: "No file currently loaded.",
    Mode: "VIEWING",
};

//
GUI.add( parameters, 'import_param' ).name("Import JSON");
GUI.add( parameters, 'File' ).listen();
GUI.add( parameters, 'Mode' ).name("Mode").listen();

function change_mode(is_labeling) {
    let text = ( is_labeling ) ? "LABELING" : "VIEWING";
    parameters['Mode'] = text;
}

export { GUI, parameters, change_mode };
