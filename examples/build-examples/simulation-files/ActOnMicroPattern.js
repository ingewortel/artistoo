/* 	================= DESCRIPTION ===================== */
/** @file
 * <h1>Migrating on a micro-patterned surface</h1>
 * <p> Act cell on a patterned substrate, where part of the background (dark gray) has better
 * adhesion and therefore a larger &lambda;<sub>act</sub> (adhesion to the substrate
 * is needed to generate the friction forces needed for actin-driven cell migration). 
 * The simulation shows an act cell on a patterned line, and the rotation observed when 
 * two cells are placed together on a small patterned square. 
 * </p> 
 **/

/* 	================= DECLARE CUSTOM METHODS ===================== */
/* 	If no custom methods are defined, the drawing/initialisation/output 
	functions of the CPM.Simulation class are used. */


/* START METHODS OBJECT Do not remove this line */
/* 	The following functions are defined below and will be added to
	the simulation object. If Custom-methods above is set to false,
	this object is ignored and not used in the html/node files. */
let custommethods = {
	initializeGrid : initializeGrid,
	drawCanvas : drawCanvas
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

let bgvoxels = [ [],[] ]
bgvoxels[1] = microPattern()
sim.bgvoxels = bgvoxels
	
//sim.C.add( new CPM.AdhesionMultiBackground( sim.C.conf ) )
sim.C.add( new CPM.ActivityMultiBackground(
{
	BACKGROUND_VOXELS : bgvoxels,
	LAMBDA_ACT_MBG : [[0,0],[0,0],[200,1000]],	// ActivityConstraint importance per cellkind
	MAX_ACT : [0,0,40],							// Activity memory duration per cellkind
	ACT_MEAN : "geometric"						// Is neighborhood activity computed as a
												// "geometric" or "arithmetic" mean?
}
) )


/* END ADDCONSTRAINTS Do not remove this line */



/* ================= WRITE CUSTOM METHODS ===================== */

/* START METHODS DEFINITION Do not remove this line */

/* The following custom methods will be added to the simulation object*/
function initializeGrid(){
	
		// add the initializer if not already there
		if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
		let nrcells = this.conf["NRCELLS"], cellkind, i
		
		let midpoint = this.C.midpoint
		
		this.gm.seedCellAt( 2, [ midpoint[0]-5, midpoint[1] ] )
		this.gm.seedCellAt( 2, [ midpoint[0]+5, midpoint[1] ] )
		this.gm.seedCellAt( 2, [ midpoint[0], 55 ] )
		this.gm.seedCellAt( 2, [ midpoint[0]+10, 55 ])


	}
function drawCanvas(){
	
		// Add the canvas if required
		if( !this.helpClasses["canvas"] ){ this.addCanvas() }
	
		// Clear canvas and draw stroma border
		this.Cim.clear( this.conf["CANVASCOLOR"] )
		
		
		// Draw each cellkind appropriately
		let cellcolor=this.conf["CELLCOLOR"], actcolor=this.conf["ACTCOLOR"], 
			nrcells=this.conf["NRCELLS"], cellkind, cellborders = this.conf["SHOWBORDERS"]
			
		// to draw alternative bg
		this.Cim.getImageData()
		for( let bgkind = 1; bgkind < this.bgvoxels.length; bgkind++ ){
			this.Cim.col( "AAAAAA" )
			for( let p of this.bgvoxels[bgkind] ){
					this.Cim.pxfi( p )				
			}
		}
		this.Cim.putImageData()

		
		for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		
			// draw the cells of each kind in the right color
			if( cellcolor[ cellkind ] != -1 ){
				this.Cim.drawCells( cellkind+1, cellcolor[cellkind] )
			}
			
			// Draw borders if required
			if(  cellborders[ cellkind  ]  ){
				let bordercol = "000000"
				if( this.conf.hasOwnProperty("BORDERCOL") ){
					bordercol = this.conf["BORDERCOL"][cellkind]
				}
				this.Cim.drawOnCellBorders( cellkind+1, bordercol )
			}
			
			// if there is an activity constraint, draw activity values depending on color.
			if( actcolor[ cellkind ] ){
					this.Cim.drawActivityValues( cellkind + 1 )//, this.constraints["ActivityConstraint"] )
			}			
			

		}
		
		
	}

	
function microPattern(){
		
		let patternvoxels = []
		
		// Adhesive line
		let startheight = 50
		
		for( let x = 0; x < sim.C.extents[0];x++){
			for( let y = startheight; y < startheight + 10; y++ ){
				patternvoxels.push( [x,y] )
			}
		}
		
		// Small adhesive square
		let w = 30, h = 30, startx = sim.C.midpoint[0]-w/2, starty = sim.C.midpoint[1]-h/2
		for( let x = startx; x < startx + w; x++ ){
			for( let y = starty; y < starty + h ; y++ ){
				patternvoxels.push( [x,y] )
			}
		}

		return patternvoxels		
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
	field_size : [200,200],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],				// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 40,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
				
		// Adhesion parameters:
		J: [[0,0,100], 
			[0,0,100],
			[100,100,110]],
			
		BACKGROUND_VOXELS : [ [], [] ],
		
		// VolumeConstraint parameters
		LAMBDA_V: [0,0,5],					// VolumeConstraint importance per cellkind
		V: [0,0,500],							// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P: [0,0,1],					// PerimeterConstraint importance per cellkind
		P : [0,0,250],						// Target perimeter of each cellkind
		
		// ActivityConstraint parameters
		//LAMBDA_ACT : [0,0,400],				// ActivityConstraint importance per cellkind
		//MAX_ACT : [0,0,40],					// Activity memory duration per cellkind
		//ACT_MEAN : "geometric"				// Is neighborhood activity computed as a
												// "geometric" or "arithmetic" mean?

	},
	
	// Simulation setup and configuration
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [0,1],					// Number of cells to seed for all
											// non-background cellkinds.
		// Runtime etc
		BURNIN : 500,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["AAAAAA","000000"],
		ACTCOLOR : [false,true],					// Should pixel activity values be displayed?
		SHOWBORDERS : [false,false],				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,					// Should a png image of the grid be saved
											// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/ActOnMicroPattern",	// ... And save the image in this folder.
		EXPNAME : "ActOnMicroPattern",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */
/* Do not remove this line: END CONFIGURATION */
