/* 	================= DESCRIPTION ===================== */
/** @file
 * <h1>Ising Model</h1>
 * <p> The Ising model: a classic example of a CPM with only one "cell",
 * and only an adhesion constraint. Because there is no volume constraint,
 * the cell eventually either disappears or takes over the entire grid -
 * because that minimizes the adhesion penalty. </p>
 **/

/* 	================= DECLARE CUSTOM METHODS ===================== */

/* START METHODS OBJECT Do not remove this line */
/* 	The following functions are defined below and will be added to
	the simulation object.*/
let custommethods = {
	initializeGrid : initializeGrid,
	logStats : logStats,
	postMCSListener : postMCSListener
}
/* END METHODS OBJECT Do not remove this line */

/* ================= WRITE CUSTOM METHODS ===================== */

/* START METHODS DEFINITION Do not remove this line */

/* The following custom methods will be added to the simulation object*/
function initializeGrid(){

	// Create a cell (other than background)
	this.cid = this.C.makeNewCellID(1)
	let cid = this.cid 
		
	// For all non-stromaborder pixels in the grid: assign it randomly
	// to either background or cell.
	for( let i = 1 ; i < this.C.extents[0] ; i ++ ){
		for( let j = 1 ; j < this.C.extents[1] ; j ++ ){	
			if( this.C.random() < 0.49 ){
				this.C.setpix( [ i,j ], cid )
			} else {
				if( this.C.pixt( [i,j] ) ){
					this.C.setpix( [i,j], 0 )
				}
			}
		}
	}
}
	
// Computing and logging stats.
// Centroids are not really meaningful here so we'll log volume.
function logStats(){
		
	// compute volume of all non-background		
	for( let cid of this.C.cellIDs() ){
		
		let volume = this.C.getVolume( cid )
			
		// eslint-disable-next-line no-console
		console.log( this.time + "\t" + cid + "\t" + 
				this.C.cellKind(cid) + "\t" + volume )
			
	}
}

// Add a postMCSListener to reinitialize the grid when one of the cells disappears
function postMCSListener(){
		
	for( let cid of this.C.cellIDs() ){
		let vol = this.C.getVolume(cid)
		if( vol<=1 || vol==(this.C.extents[0]-1)*(this.C.extents[1]-1) ){
			this.initializeGrid()
		}
	}
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
	field_size : [300,300],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],						// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 0.01,								// CPM temperature
		
		// Constraint parameters. 	
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
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/IsingModel",	// ... And save the image in this folder.
		EXPNAME : "IsingModel",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */
/* Do not remove this line: END CONFIGURATION */
