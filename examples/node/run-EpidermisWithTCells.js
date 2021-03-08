let CPM = require("../../build/artistoo-cjs.js")


/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let config = {

	// Grid settings
	ndim : 2,
	field_size : [300,300],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],				// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
			
		// Adhesion parameters:
		J : [ [0,20,20], 
			[20,20,100], // epidermal cells
			[20,100,200] ],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,30,30],				// VolumeConstraint importance per cellkind
		V : [0,152,100],					// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P : [0,0,2],				// PerimeterConstraint importance per cellkind
		P : [0,0,130],					// Target perimeter of each cellkind
		
		// ActivityConstraint parameters
		LAMBDA_ACT : [0,0,500],			// ActivityConstraint importance per cellkind
		MAX_ACT : [0,0,60],				// Activity memory duration per cellkind
		ACT_MEAN : "geometric",				// Is neighborhood activity computed as a
		// "geometric" or "arithmetic" mean?

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
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["AAAAAA","FF0000"],
		ACTCOLOR : [true,false],			// Should pixel activity values be displayed?
		SHOWBORDERS : [true, true],				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,					// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/EpidermisWithTCells",				// ... And save the image in this folder.
		EXPNAME : "EpidermisWithTCells",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */


let sim = new CPM.Simulation( config, {} )





/* The following custom methods will be added to the simulation object
below. */
function initializeGrid(){
	
	// add the GridManipulator if not already there and if you need it
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	
	let i = (this.C.extents[0]*this.C.extents[1]/145.)	
	let cellids = []

	while( i-- > 0 ){
		cellids.push( this.gm.seedCell(1) )
	}
	i = 50
	while( i-- > 0 ){
		this.C.monteCarloStep()
	}
	i = 50*(this.C.extents[0]/1000)
	while( i-- > 0 ){
		this.C.setCellKind( cellids.pop(), 2 )
		//Ci.seedCell(2)
	}

}



sim.run()
