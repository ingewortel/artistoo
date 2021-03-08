let CPM = require("../../build/artistoo-cjs.js")


/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let config = {

	// Grid settings
	ndim : 2,
	field_size : [500, 13],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [false,false],				// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.

		
		// Adhesion parameters:
		J : [ [NaN,20,0], [20,100,200], [0,200,0] ],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,5,NaN],				// VolumeConstraint importance per cellkind
		V : [0,500,NaN],					// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P : [0,2,NaN],				// PerimeterConstraint importance per cellkind
		P : [0,360,NaN],					// Target perimeter of each cellkind
		
		// BarrierConstraint parameters
		IS_BARRIER : [false, false, true ],
		
		// ActivityConstraint parameters
		LAMBDA_ACT : [0,700,NaN],			// ActivityConstraint importance per cellkind
		MAX_ACT : [0,50,NaN],				// Activity memory duration per cellkind
		ACT_MEAN : "geometric"				// Is neighborhood activity computed as a
		// "geometric" or "arithmetic" mean?
								
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [3,0],					// Number of cells to seed for all
		// non-background cellkinds.
		// Runtime etc
		BURNIN : 500,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["000000","AAAAAA"],
		ACTCOLOR : [true,false],			// Should pixel activity values be displayed?
		SHOWBORDERS : [false,false],				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/NoTorusDemo",	// ... And save the image in this folder.
		EXPNAME : "NoTorusDemo",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */


let sim = new CPM.Simulation( config, {} )






/* The following custom methods will be added to the simulation object*/
function initializeGrid(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	let nrcells = this.conf["NRCELLS"], cellkind, i
	this.buildBorder()
		
	// Seed the right number of cells for each cellkind
	for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
			
		for( i = 0; i < nrcells[cellkind]; i++ ){
			// first cell always at the midpoint. Any other cells
			// randomly.				
			if( i == 0 ){
				this.gm.seedCellAt( cellkind+1, this.C.midpoint )
			} else {
				this.gm.seedCell( cellkind+1 )
			}
		}
	}
}
	
function buildBorder(){
		
	let bordervoxels
		
	bordervoxels = this.gm.makePlane( [], 0, 0 )
	bordervoxels = this.gm.makePlane( bordervoxels, 0, this.C.extents[0]-1)
	bordervoxels = this.gm.makePlane( bordervoxels, 1, 0 )
	bordervoxels = this.gm.makePlane( bordervoxels, 1, this.C.extents[1]-1)
	
	this.gm.changeKind( bordervoxels, 2)
		
}



sim.run()
