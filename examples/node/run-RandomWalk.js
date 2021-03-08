let CPM = require("../../build/artistoo-cjs.js")


/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let config = {

	// Grid settings
	ndim : 2,
	field_size : [100,100],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [false,false],				// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 4,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
			
		LAMBDA_VRANGE_MIN : [0,1],			// MIN/MAX volume for the hard volume constraint
		LAMBDA_VRANGE_MAX : [0,2]
	},
	
	// Simulation setup and configuration
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [1],						// Number of cells to seed for all
		// non-background cellkinds.
		// Runtime etc
		BURNIN : 500,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["FF0000"],
		ACTCOLOR : [false],					// Should pixel activity values be displayed?
		SHOWBORDERS : [true],				// Should cellborders be displayed?
		zoom : 4,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : false,					// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/RandomWalk",	// ... And save the image in this folder.
		EXPNAME : "RandomWalk",				// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */


let sim = new CPM.Simulation( config, {} )

let hardvolconstraint = new CPM.HardVolumeRangeConstraint( sim.C.conf )
sim.C.add( hardvolconstraint )
sim.initializeGrid()
sim.runBurnin()








sim.run()
