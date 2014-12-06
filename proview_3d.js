// Create a new instance of the viewer
var iv = new iview('iview');

// Set the default options
var options = {};
options["camera"] = "perspective";
options["background"] = "white";
options["primaryStructure"] = "lines";
options["secondaryStructure"] = "cylinder & plate";
options["colorBy"] = "spectrum";
options["ligands"] = "nothing";
options["waters"] = "nothing";
options["ions"] = "nothing";
options["selectedRes"] = [];
//options["labels"] = "yes";
iv.rebuildScene(options);
iv.render();

// Highlight res based off what's selected in the dataset
function highlight3D(res_array){
    if(res_array.length){
        iv.options.colorBy = 'highlight';
        iv.options.selectedRes = res_array;
        iv.rebuildScene();
        iv.render();
    } else {
        clearHighlight3D();
    }
}

// Clear any highlighting
function clearHighlight3D(){
    iv.options.colorBy = options['colorBy'];
    iv.options.selectedRes = [];
    iv.rebuildScene();
    iv.render();
}

// Load the PDB when a new file is uploaded
$("#pdbInput").change(function() {

    var file = this.files[0];
    if (file === undefined) return;

    var reader = new FileReader();
    reader.onload = function () {

        // Reset the current visualization
        clearHighlight3D();

        // Load in the new PDB
        iv.loadPDB(reader.result);
    };
    reader.readAsText(file);
});

// Load the example file if it's available
$.get("pdb/3KFN.pdb",function(pdb){
    iv.loadPDB(pdb);
})
