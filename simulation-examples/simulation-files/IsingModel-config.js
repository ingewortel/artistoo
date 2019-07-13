// Configuration file
let config = {

	// Grid settings
	ndim : 2,
	field_size : [400,400],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : true,						// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 0.01,								// CPM temperature
		constraints : [						// List the constraints to activate
			"Adhesion"
		],
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
		
		nCellKinds : 1,
				
		// Adhesion parameters:
		J : [ [NaN,20], [20,100] ]
	},
	
	// Simulation setup and configuration
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [3],					// Number of cells to seed for all
											// non-background cellkinds.
		// Runtime etc
		BURNIN : 0,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["AA0000"],
		ACTCOLOR : [false],			// Should pixel activity values be displayed?
		SHOWBORDERS : [false],				// Should cellborders be displayed?
		zoom : 1,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,					// Should a png image of the grid be saved
											// during the simulation?
		IMGFRAMERATE : 5,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img",				// ... And save the image in this folder.
		EXPNAME : "myexp",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}

if( typeof module !== "undefined" ){
	module.exports = config
}
