/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. */
/** @file 
<h1>Demo: the torus property</h1>
<p>
The torus property of the Grid class allows you to choose if the grid boundaries are
linked, but setting them to false may give artifacts if not done properly. Cells will
stick to the border because at the border, they have fewer neighbors to get adhesion and/or
perimeter constraint penalties from. To avoid this, it is best to add a border of 
barrier pixels to the edges of the grid. This forbids cells from copying in to the
outermost pixels, and allows you to specify the adhesion with the border specifically.
In this example, the border is made repellant by setting its adhesive penalty
with the cell much higher than that of the background.

<br>
Note that this would also work when you do not set the torus property to false, since the
barrier layer prevents the cells from crossing the grid borders. However, changing the 
torus setting is important for some internal computations (such as computing centroids).
Especially if the grid is small (as it is here in the y dimension), these computations
can go wrong if torus is not properly specified. It is therefore best practice to always
set torus to false if cells cannot cross the grid border.
</p>
 **/

/* 	================= DECLARE CUSTOM METHODS ===================== */

/* START METHODS OBJECT Do not remove this line */
/* 	The following functions are defined below and will be added to
	the simulation object. If Custom-methods above is set to false,
	this object is ignored and not used in the html/node files. */
let custommethods = {
	initializeGrid : initializeGrid,
	buildBorder : buildBorder
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
	this.buildBorder()
		
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
	
function buildBorder(){
		
	let bordervoxels
		
	bordervoxels = this.gm.makePlane( [], 0, 0 )
	bordervoxels = this.gm.makePlane( bordervoxels, 0, this.C.extents[0]-1)
	bordervoxels = this.gm.makePlane( bordervoxels, 1, 0 )
	bordervoxels = this.gm.makePlane( bordervoxels, 1, this.C.extents[1]-1)
	
	this.gm.changeKind( bordervoxels, 2)
		
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
	field_size : [500, 13],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [false,false],				// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.

		
		// Adhesion parameters:
		J : [ [NaN,20,0], [20,100,200], [0,200,0] ],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,5,NaN],				// VolumeConstraint importance per cellkind
		V : [0,500,NaN],					// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P : [0,2,NaN],				// PerimeterConstraint importance per cellkind
		P : [0,360,NaN],					// Target perimeter of each cellkind
		
		// BarrierConstraint parameters
		IS_BARRIER : [false, false, true ],
		
		// ActivityConstraint parameters
		LAMBDA_ACT : [0,700,NaN],			// ActivityConstraint importance per cellkind
		MAX_ACT : [0,50,NaN],				// Activity memory duration per cellkind
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
		SAVEPATH : "output/img/NoTorusDemo",	// ... And save the image in this folder.
		EXPNAME : "NoTorusDemo",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */
/* Do not remove this line: END CONFIGURATION */
