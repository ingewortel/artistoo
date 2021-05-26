/* globals CPM, sim */

/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. */
/** @file
 * <h1>Stochastic Correction</h1>
 *
 * <p><i>Contributed by: Oane Gros</i></p>
 *
 * <p>
 * Replicator and mutant RNA compete in vesicles, showing how noise on division can create selection on the vesicle level. Orange has noise in the allocation of internal products upon division, red does not.
 * </p>
 * <p><label class="switch">
 *		<input type="checkbox" name="colorby" oninput="changeColorBy()"  unchecked>
 *		<span class="slider round"></span>
 *		<label for="colorby"> Show Y amount</label>
 *	
 *	</label></p>
 **/
 
 
// external source files
/** @requires
 * #node :: ../node/colormap-cjs.js :: ColorMap
 * #html :: ./colormap.js
 **/

/* 	================= DECLARE CUSTOM METHODS ===================== */

/* START METHODS OBJECT Do not remove this line */
/* 	The following functions are defined below and will be added to
	the simulation object. If Custom-methods above is set to false,
	this object is ignored and not used in the html/node files. */
let custommethods = {
	postMCSListener : postMCSListener,
	initializeGrid : initializeGrid,
	drawCanvas : drawCanvas
 }
/* END METHODS OBJECT Do not remove this line */

/* ================= ADD MORE CONSTRAINTS ===================== */
/* START ADDCONSTRAINTS Do not remove this line */

sim.showYcolors = false

/* END ADDCONSTRAINTS Do not remove this line */

/* ================= WRITE CUSTOM METHODS ===================== */

/* START METHODS DEFINITION Do not remove this line */

/* The following custom methods will be added to the simulation object*/
function postMCSListener(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	for( let i of this.C.cellIDs() ){
		updateCell(this.C, this.C.cells[i])
		if( this.C.getVolume(i) > this.C.conf.division_volume[this.C.cellKind(i)] ){
			this.gm.divideCell(i)
		}
	}
}

// Models internal concentrations of RNA replicators, with a master sequence  (X) creating mutants (Y) with lower growth rate,
//  Y population is necessary for vesicle to survive.
function updateCell(C, cell){
	let vol = C.getVolume(cell.id)
	let X = cell.products[0]
	let Y = cell.products[1]
    let V = cell.V
    if ((cell.V - vol) < 10 && X > 0){
        V += C.conf.y_growth_contribution[cell.kind]*(Y/vol)/((Y/vol)+0.1)   
    }
    V -= C.conf.shrink_rate[cell.kind]
    cell.V = V
	
    let dy = C.conf.rY[cell.kind]*Y*(vol-X-Y)/vol*C.conf.speed_internal_dynamics[cell.kind]
    let newX = X + (1-C.conf.Q[cell.kind])*dy+( C.conf.rX[cell.kind]*X*(vol-X-Y)/vol - C.conf.d[cell.kind]*X )*C.conf.speed_internal_dynamics[cell.kind]
	let newY = Y + C.conf.Q[cell.kind]*dy - C.conf.d[cell.kind]*Y*C.conf.speed_internal_dynamics[cell.kind]
	newX = Math.max(0, newX)
	newY = Math.max(0, newY)
	cell.products = [newX, newY]
}

function initializeGrid(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
    
	let nrcells = this.conf["NRCELLS"], cellkind, i
		
	// Seed the right number of cells for each cellkind 
	for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		
		for( i = 0; i < nrcells[cellkind]; i++ ){
			// first cell always at the midpoint. Any other cells
			// randomly.				
			if( i == 0 ){
                this.gm.seedCellAt( cellkind+1, [this.C.midpoint[0]/2, this.C.midpoint[1] ] )
			} else {
				this.gm.seedCell( cellkind+1 )
			}
		}
	}
}


// Custom drawing function to draw the preferred directions.
function drawCanvas(){
	// Add the canvas if required
	if( !this.helpClasses["canvas"] ){ this.addCanvas() }

	// Clear canvas
	this.Cim.clear( this.conf["CANVASCOLOR"] || "FFFFFF" )
	let nrcells=this.conf["NRCELLS"], cellkind, cellborders = this.conf["SHOWBORDERS"]
	
	let colfun = getColor.bind(this)
	for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		this.Cim.drawCells( cellkind+1, colfun)
		// Draw borders if required
		if(  cellborders[ cellkind  ]  ){
			this.Cim.drawCellBorders( cellkind+1, "000000" )
		}
	}
}

const cmap = new ColorMap({
		colormap: 'viridis',
		nshades: 100,
		format: 'hex', 
		alpha: 1
})

function getColor (cid) {
	if (!this.showYcolors){
		return this.conf["CELLCOLOR"][this.C.cellKind(cid)-1]
	}
	let cell = this.C.cells[cid]
	let c = Math.floor(cell.products[1] *3) 
	if (c >= cmap.length){
		c = cmap.length - 1
	} else if (c < 0){
		c = 0
	}
	return cmap[c].substring(1)
}

function changeColorBy(){
	sim.showYcolors = !sim.showYcolors
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
	field_size : [150,150],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [false,false],				// Should the grid have linked borders?
		seed : 5,							// Seed for random number generation.
		T : 2,								// CPM temperature
		
		//This declaration of CELLS instantiates the CPMEvol model instead of the CPM model
		CELLS : ["empty", CPM.Divider, CPM.Divider], //The cell internal classes
        
        // used internally by StochasticCorrector subclass
		INIT_PRODUCTS : [ [40,40],
										   [40,40] ],
		INIT_V : [150, 150],
		NOISE : [0,10], 

		// only used in postMCSListener
        rX : [0, 1, 1],
        rY : [0, 0.8, 0.8],
        d : [0, 0.05, 0.05],
        speed_internal_dynamics : [0, 0.15, 0.15],
        Q : [0, 0.8, 0.8],

        division_volume : [0, 250, 250],
        shrink_rate : [0, 10, 10],
        y_growth_contribution : [0, 35, 35],

        
        // Adhesion parameters:
         J: [ [15,15,15], 
			[15,15,15], 
			[15,15,15] ],
		
		
		// VolumeConstraint parameters
		LAMBDA_V : [0, 1, 1],				// VolumeConstraint importance per cellkind
		V : [0,152, 152]					// Unused - are backup.
		
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : { 
	
		// Cells on the grid
		NRCELLS : [10, 10],						// Number of cells to seed for all
		// non-background cellkinds. 
		// Runtime etc
		BURNIN : 100,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "EEEEEE",
		CELLCOLOR : ["AA111A","FFA110"],
		SHOWBORDERS : [true, true],				// Should cellborders be displayed?
		BORDERCOL : ["666666", "666666"],				// color of the cell borders
		zoom : 3,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/StochasticCorrector",	// ... And save the image in this folder.
		EXPNAME : "StochasticCorrector",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */
/* Do not remove this line: END CONFIGURATION */
