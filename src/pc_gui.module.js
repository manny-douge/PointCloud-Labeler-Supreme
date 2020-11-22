import * as INIT from './init.module.js';
import * as DataImporter from './data_importer.module.js';

//SET UP GUI
const GUI = new dat.GUI();

//Create object so we can bind our params to
let parameters = {
    import_param: DataImporter.import_data,
};

//
GUI.add( parameters, 'import_param' ).name("Import JSON");

export { GUI };
