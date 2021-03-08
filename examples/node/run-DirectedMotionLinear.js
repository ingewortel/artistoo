let CPM = require("../../build/artistoo-cjs.js")


/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let config = {

	// Grid settings
	ndim : 2,
	field_size : [200,200],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],						// Should the grid have linked borders?
		seed : 2,							// Seed for random number generation.
		T : 20,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.

		
		// Adhesion parameters:
		J : [ 
		 	[0,20],
			[20,1000]
		],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50],				// VolumeConstraint importance per cellkind
		V : [0,152]						// Target volume of each cellkind

	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [3,0],					// Number of cells to seed for all
		// non-background cellkinds.
		// Runtime etc
		BURNIN : 20,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "EEEEEE",
		CELLCOLOR : ["000000"],
		SHOWBORDERS : [true],				// Should cellborders be displayed?
		BORDERCOL : ["666666"],
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/DirectedMotionLinear",	// ... And save the image in this folder.
		EXPNAME : "DirectedMotionLinear",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */


let sim = new CPM.Simulation( config, {} )
let Cdir =  new CPM.PreferredDirectionConstraint({
	LAMBDA_DIR : [0,50], 
	DIR : [[0,0],[1,1]]
})
sim.C.add( Cdir )





/* The following custom methods will be added to the simulation object*/
function initializeGrid(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	// Seed 1 cell
	for( let i = 0 ; i < this.C.extents[0] ; i += 30 ){
		for( let j = 0 ; j < this.C.extents[1] ; j += 30 ){
			this.gm.seedCellAt( 1, [i,j] )
		}
	}
	
}
	
function postMCSListener(){
	let pdc = this.C.getConstraint("PreferredDirectionConstraint")
	if( ( this.time + 1 ) % 2 == 0 ){
		pdc.conf.DIR[1] = [Math.cos(this.time/200),Math.sin(this.time/200)]
		this.drawCanvas()
	}
}



sim.run()
