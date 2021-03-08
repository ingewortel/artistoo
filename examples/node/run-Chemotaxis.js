let CPM = require("../../build/artistoo-cjs.js")


/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/

let config = {

	// Grid settings
	ndim : 2,
	field_size : [600,600],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],						// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		D : 0.05,
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.

		
		// Adhesion parameters:
		J: [[0,20], [20,100]],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50],					// VolumeConstraint importance per cellkind
		V : [0,250]						// Target volume of each cellkind
		
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
		zoom : 1,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/Chemotaxis",	// ... And save the image in this folder.
		EXPNAME : "Chemotaxis",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */


let sim = new CPM.Simulation( config, {} )
sim.g = new CPM.Grid2D([sim.C.extents[0]/10,sim.C.extents[1]/10], config.torus, "Float32"),
sim.gi = new CPM.CoarseGrid( sim.g, 10 ),

sim.C.add( new CPM.ChemotaxisConstraint( {
	LAMBDA_CH: [0,5000],
	CH_FIELD : sim.gi }
) )





/* The following custom methods will be added to the simulation object*/
function initializeGrid(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	for( let i = 0 ; i < Math.PI*2 ; i += 0.4 ){
		this.gm.seedCellAt( 1, 
			[Math.round(this.C.extents[0]/2+this.C.extents[0]/3*Math.sin(i)),
				Math.round(this.C.extents[1]/2+this.C.extents[1]/3*Math.cos(i))] )
	}
}
function postMCSListener(){
	let center = [this.C.extents[0]/10/2,this.C.extents[1]/10/2]
	this.g.setpix( center, 10000+this.g.pixt(center) )
	for( let i = 1 ; i <= 10 ; i ++ ){
		this.g.diffusion( this.C.conf["D"] )
	}
	this.g.multiplyBy( 0.9 )
}

function drawCanvas(){
	
	// Add the canvas if required
	if( !this.helpClasses["canvas"] ){ this.addCanvas() }
	this.Cim.drawField( this.gi )
	this.Cim.drawCellBorders( -1, "000000" )
		
}



sim.run()
