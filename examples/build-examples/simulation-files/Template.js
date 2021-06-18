/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. You can use HTML tags. */
/** @file
 * <h1>Template File</h1>
 * <p>HTML code for the page here.</p>
 * */
 
 /* 	================= DECLARE CUSTOM CLASSES ===================== */
/* 	If no custom classes are defined, you can remove the part 
    from START CLASS DEFINITION to END CLASS DEFINITION below.
*/

/* START CLASS DEFINITION Do not remove this line */
/* END CLASS DEFINITION Do not remove this line */

/* 	================= DECLARE CUSTOM METHODS ===================== */
/* 	If no custom methods are defined, the drawing/initialisation/output 
	functions of the CPM.Simulation class are used. 
	In that case, you need to remove the part between START METHODS OBJECT and 
	END METHODS OBJECT below, including both of those lines.
*/

/* START METHODS OBJECT Remove the part until END METHODS OBJECT if no custom methods are defined. */
/* 	The following functions are defined below and will be added to
	the simulation object. If Custom-methods above is set to false,
	this object is ignored and not used in the html/node files. */
let custommethods = {
	initializeGrid : initializeGrid,
	buildChannel : buildChannel
}
/* END METHODS OBJECT Do not remove this line */

/* ================= ADD MORE CONSTRAINTS ===================== */

/* Example of how to add a constraint. Put this code between the
lines with "START" and "END" below.
let pconstraint = new CPM.PersistenceConstraint( 
	{
		// PreferredDirectionConstraint parameters
		LAMBDA_DIR: [0,100,100], 				// PreferredDirectionConstraint importance per ck
		PERSIST: [0,.7,0.2]						// Weight of the persistent direction in the
												// computation of the new direction per cellkind
	} 
)
sim.C.add( pconstraint ) */
/* START ADDCONSTRAINTS Do not remove this line */

/* END ADDCONSTRAINTS Do not remove this line */



/* ================= WRITE CUSTOM METHODS ===================== */

/* START METHODS DEFINITION Do not remove this line */

/* The following custom methods will be added to the simulation object*/
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
		
	let channelvoxels
	
	channelvoxels = this.gm.makePlane( [], 1, 0 )
	let gridheight = this.C.extents[1]
	channelvoxels = this.gm.makePlane( channelvoxels, 1, gridheight-1 )
		
	this.gm.changeKind( channelvoxels, 2)
		
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
	field_size : [500, 12],
	
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
		J : [ [NaN,20,0], [20,100,5], [0,5,0] ],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,30,NaN],				// VolumeConstraint importance per cellkind
		V : [0,500,NaN],					// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P : [0,2,NaN],				// PerimeterConstraint importance per cellkind
		P : [0,360,NaN],					// Target perimeter of each cellkind
		
		// ActivityConstraint parameters
		LAMBDA_ACT : [0,200,NaN],			// ActivityConstraint importance per cellkind
		MAX_ACT : [0,30,NaN],				// Activity memory duration per cellkind
		ACT_MEAN : "geometric"				// Is neighborhood activity computed as a
		// "geometric" or "arithmetic" mean?
								
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
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["000000","AAAAAA"],
		ACTCOLOR : [true,false],			// Should pixel activity values be displayed?
		SHOWBORDERS : [false,false],				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/<myexp>",	// ... And save the image in this folder.
		EXPNAME : "<myexp>",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */
/* Do not remove this line: END CONFIGURATION */
