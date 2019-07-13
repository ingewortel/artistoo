// Configuration file
let config = {

	// Grid settings
	ndim : 2,
	field_size : [200,200],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : false,						// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		constraints : [						// List the constraints to activate
			"Adhesion", 
			"VolumeConstraint", 
			"PerimeterConstraint",
			"PreferredDirectionConstraint"
		],
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
		
		nCellKinds : 2,
				
				
						


		// Adhesion parameters:
		J: [[0,20,20], 
			[20,20,20], 
			[20,20,20]],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50,50],					// VolumeConstraint importance per cellkind
		V : [0,500,200],						// Target volume of each cellkind
		
		LAMBDA_P : [0,2,2],
		P : [0,280,140],
		
		// PreferredDirectionConstraint parameters
		LAMBDA_DIR: [0,100,100], 				// PreferredDirectionConstraint importance per ck
		PERSIST: [0,.7,0.2]						// Weight of the persistent direction in the
											// computation of the new direction per cellkind
		
	},
	
	// Simulation setup and configuration
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [30,30],					// Number of cells to seed for all
											// non-background cellkinds.
		// Runtime etc
		BURNIN : 0,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["00FF00","0000FF"],
		ACTCOLOR : [false,false],					// Should pixel activity values be displayed?
		SHOWBORDERS : [true,true],				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
											// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img",				// ... And save the image in this folder.
		EXPNAME : "ManyCellsPrefDir",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}

if( typeof module !== "undefined" ){
	module.exports = config
}
