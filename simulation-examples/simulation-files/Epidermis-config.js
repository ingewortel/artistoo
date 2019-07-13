// Configuration file
let config = {

	// Grid settings
	ndim : 2,
	field_size : [250,250],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : true,						// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		constraints : [						// List the constraints to activate
			"Adhesion", 
			"VolumeConstraint", 
			"PerimeterConstraint" 
		],
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
		
		nCellKinds : 1,
				
		// Adhesion parameters:
		J : [ [NaN,20], 
			[20,100] // epidermal cells
		],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50],					// VolumeConstraint importance per cellkind
		V : [0,152],						// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P : [0,2],					// PerimeterConstraint importance per cellkind
		P : [0,145] 						// Target perimeter of each cellkind

	},
	
	// Simulation setup and configuration
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [3,0],					// Number of cells to seed for all
											// non-background cellkinds.
		// Runtime etc
		BURNIN : 500,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "CCCCCC",
		CELLCOLOR : [-1],
		ACTCOLOR : 	[false],			// Should pixel activity values be displayed?
		SHOWBORDERS : [true],				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,					// Should a png image of the grid be saved
											// during the simulation?
		IMGFRAMERATE : 5,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img",				// ... And save the image in this folder.
		EXPNAME : "Epidermis",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}

if( typeof module !== "undefined" ){
	module.exports = config
}
