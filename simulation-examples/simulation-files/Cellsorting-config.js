// Configuration file
let config = {

	// Grid settings
	ndim : 2,
	field_size : [210,210],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : true,						// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 15,								// CPM temperature
		constraints : [						// List the constraints to activate
			"Adhesion", 
			"VolumeConstraint"
		],

		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
		nCellKinds : 2,
		
		// Adhesion parameters:
		J : [ [NaN, 12, 6], [12, 6, 16], [6, 16, 6] ],
		
		// VolumeConstraint parameters
			// VolumeConstraint importance per cellkind
			// Target volume of each cellkind
		LAMBDA_V : [0,2,2],
		V : [0,25,25]		

		
	},
	
	// Simulation setup and configuration
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [1,1],					// Number of cells to seed for all
											// non-background cellkinds.
	
		// Runtime etc
		BURNIN : 500,
		RUNTIME : 1000,
		RUNTIME_BROWSER : 20000,
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["000000","FF0000"],
		ACTCOLOR : [true,false],			// Should pixel activity values be displayed?
		SHOWBORDERS : true,				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,					// Should a png image of the grid be saved
											// during the simulation?
		IMGFRAMERATE : 5,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img",				// ... And save the image in this folder.
		EXPNAME : "Cellsorting",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}

if( typeof module !== "undefined" ){
	module.exports = config
}
