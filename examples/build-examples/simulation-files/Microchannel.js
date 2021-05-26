/* globals CPM */

/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. */
/** @file
 * <h1>Microchannel</h1>
 * <p>Act cells moving in a microchannel.</p>
 **/

/* ================= DECLARE CUSTOM METHODS ===================== */

/* START METHODS OBJECT Do not remove this line */
/* 	The following functions are defined below and will be added to
	the simulation object.*/
let custommethods = {
	initializeGrid : initializeGrid,
	buildChannel : buildChannel,
	drawBelow : drawBelow
}

/* END METHODS OBJECT Do not remove this line */

/* ================= WRITE CUSTOM METHODS ===================== */

/* START METHODS DEFINITION Do not remove this line */

/* The following custom methods will be added to the simulation object
below. */

function drawBelow(){
	this.Cim.drawPixelSet( this.channelvoxels, "AAAAAA" ) 
}

function initializeGrid(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	let nrcells = this.conf["NRCELLS"], cellkind, i
	this.buildChannel()
		
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
	
function buildChannel(){
		
	
	this.channelvoxels = this.gm.makePlane( [], 1, 0 )
	let gridheight = this.C.extents[1]
	this.channelvoxels = this.gm.makePlane( this.channelvoxels, 1, gridheight-1 )
		
	this.C.add( new CPM.BorderConstraint({
		BARRIER_VOXELS : this.channelvoxels
	}) )
		
}

/* END METHODS DEFINITION Do not remove this line */



/* ================= CONFIGURATION ===================== */

/* Do not remove this line: START CONFIGURATION */
/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let config = {

	// Grid settings
	ndim : 2,
	field_size : [300, 15],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,false],						// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
		
		// Adhesion parameters:
		J : [ [NaN,20], [20,5] ],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,30],				// VolumeConstraint importance per cellkind
		V : [0,500],					// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P : [0,2],				// PerimeterConstraint importance per cellkind
		P : [0,300],					// Target perimeter of each cellkind
		
		// ActivityConstraint parameters
		LAMBDA_ACT : [0,500],			// ActivityConstraint importance per cellkind
		MAX_ACT : [0,40],				// Activity memory duration per cellkind
		ACT_MEAN : "geometric"				// Is neighborhood activity computed as a
		// "geometric" or "arithmetic" mean?
								
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [3],					// Number of cells to seed for all
		// non-background cellkinds.
		// Runtime etc
		BURNIN : 100,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["000000"],
		ACTCOLOR : [true],					// Should pixel activity values be displayed?
		SHOWBORDERS : [false],				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,					// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/Microchannel",// ... And save the image in this folder.
		EXPNAME : "Microchannel",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}

/*	---------------------------------- */
/* Do not remove this line: END CONFIGURATION */
