let CPM = require("../../build/artistoo-cjs.js")


/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let config = {

	// Grid settings
	ndim : 2,
	field_size : [250,250],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],						// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.

		
		// Adhesion parameters:
		J : [ [0,20], [20,0] ],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50],				// VolumeConstraint importance per cellkind
		V : [0,500],					// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P : [0,2],				// PerimeterConstraint importance per cellkind
		P : [0,340],					// Target perimeter of each cellkind
		
		// ActivityConstraint parameters
		LAMBDA_ACT : [0,140],			// ActivityConstraint importance per cellkind
		MAX_ACT : [0,20],				// Activity memory duration per cellkind
		ACT_MEAN : "geometric"				// Is neighborhood activity computed as a
		// "geometric" or "arithmetic" mean?
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [20,0],					// Number of cells to seed for all
		// non-background cellkinds.
		// Runtime etc
		BURNIN : 50,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["000000"],
		ACTCOLOR : [true],			// Should pixel activity values be displayed?
		SHOWBORDERS : [false],				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/CollectiveMigration",	// ... And save the image in this folder.
		EXPNAME : "CollectiveMigration",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */


let sim = new CPM.Simulation( config, {} )






/* The following custom methods are used for control buttons on the html page.*/

function startsim(){
	if( !sim.running ){
		sim.running = true
	}
}
function stopsim(){
	sim.running = false
}
function seedCell( k ){
	sim.gm.seedCell(k)
}
function seedCells( ncells ){
	for( let i = 0; i < ncells; i++ ){
		seedCell( 1 )
	}
}
function killCell(){
	let t
	let cells = Object.keys( sim.C.getStat( CPM.PixelsByCell ) )
	if( cells.length > 0 ){
		t = cells.pop()
		for( let cp of sim.C.cellPixels() ){
			if( cp[1] == t ){
				sim.C.setpix( cp[0], 0 )
			}
		}
	}
	sim.C.stat_values = {}

}
function killAllCells(){
	let cells = Object.keys( sim.C.getStat( CPM.PixelsByCell ) )
	if( cells.length == 0 ) return
	for( let cp of sim.C.cellPixels() ){
		sim.C.setpix( cp[0], 0 )
	}
}



sim.run()
