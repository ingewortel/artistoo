/* globals CPM, sim */

/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. */
/** @file
 * <h1>Cancer Invasion</h1>
 * <p>T cells (red) infiltrating a growing tumor (black) in an epidermal monolayer (gray).</p>
 **/


/* START METHODS OBJECT Do not remove this line */
/* 	The following functions are defined below and will be added to
	the simulation object. If Custom-methods above is set to false,
	this object is ignored and not used in the html/node files. */
let custommethods = {
	initializeGrid : initializeGrid,
	postMCSListener : postMCSListener,
	divideCancerCells : divideCancerCells,
	killTooSmallCells : killTooSmallCells,
	homeTCells : homeTCells,
	killTCells : killTCells
}
/* END METHODS OBJECT Do not remove this line */

/* ================= ADD MORE CONSTRAINTS ===================== */

/* START ADDCONSTRAINTS Do not remove this line */

let Cdir = new CPM.AttractionPointConstraint({
	LAMBDA_ATTRACTIONPOINT : [0,0,50,0,0],
	ATTRACTIONPOINT : [[NaN,NaN], [NaN,NaN], [sim.C.extents[1]/2,sim.C.extents[1]/2], [NaN,NaN],[NaN,NaN] ] 
})

sim.C.add( Cdir )

/* END ADDCONSTRAINTS Do not remove this line */


/* ================= WRITE CUSTOM METHODS ===================== */

/* START METHODS DEFINITION Do not remove this line */

/* The following custom methods will be added to the simulation object*/
function initializeGrid(){

	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }

	// Seed epidermal cell layer
	let step = 12
	for( var i = 1 ; i < this.C.extents[0] ; i += step ){
		for( var j = 1 ; j < this.C.extents[1] ; j += step ){
			this.gm.seedCellAt( 1, [i,j] )
		}
	}
	// Seed 1 cancer cell
	this.gm.seedCellAt( 3, [this.C.extents[1]/2, this.C.extents[1]/2] )
}

function postMCSListener(){
	//console.log( "1 " + C.cellKind(479) )
	this.divideCancerCells()
	//console.log( "2 " + C.cellKind(479) )
	this.killTooSmallCells()
	//console.log( "3 " + C.cellKind(479) )
	this.homeTCells()
	this.killTCells()
}

function homeTCells(){
	let current_t_cells = 0
	for( let i of this.C.cellIDs() ){
		if( this.C.cellKind(i) == 2 ){
			current_t_cells++
		}
	}

	if( this.C.random() < homing_rate_t_cells && current_t_cells < max_nr_t_cells ){
		let found = false
		let p
		while( !found ){
			p = this.C.grid.i2p( this.C.borderpixels.sample() )
		
			if( this.C.cellKind( this.C.pixt(p) ) == 1 ){
				found = true
			}
		}
		this.gm.seedCellAt( 2, p )
		this.C.stat_values = {}
	}
}

function divideCancerCells(){
	
	let current_cancer = 0
	for( let i of this.C.cellIDs() ){
		if( this.C.cellKind( i ) == 3 ){
			current_cancer++
		}
	}
	
	let divrate = 3*cancer_cell_division_rate / current_cancer
	
	// Loop over the cellids to find cancer cells. Let them divide with a
	// probability( cancer cell division rate).
	for( let i of this.C.cellIDs() ){
		if( this.C.cellKind( i ) == 3 ){
			if( this.C.getVolume(i) > 0.8*this.C.getConstraint("VolumeConstraint").conf["V"][3] && this.C.random() < divrate ){
				lastnewdiv = this.gm.divideCell(i)
				lastdiv = i
				//console.log(newid)
				this.C.stat_values = {}
			}
		}
	}
	
}

function killTooSmallCells(){
	for( let i of this.C.cellIDs() ){
		if( this.C.cellKind(i) == 1 ){
			if( this.C.getVolume(i) < skin_cell_min_volume*this.C.getConstraint("VolumeConstraint").conf["V"][1] && this.C.random() < skin_cell_death_rate ){
				//let cp = C.getStat(CPM.PixelsByCell)[i]
				this.C.setCellKind( i, 4 )
				
				//Cm.changeKind( cp, 4 )
				//console.log(i)
				//Cm.killCell(i)
				this.C.stat_values = {}
			}
		}
	}
}

function killTCells(){
	for( let i of this.C.cellIDs() ){
		if( this.C.cellKind(i) == 2 ){
			if( this.C.random() < T_cell_death_rate ){
				this.gm.killCell(i)
				this.C.stat_values = {}
			}
		}
	}
}




/* END METHODS DEFINITION Do not remove this line */



/* ================= CONFIGURATION ===================== */

/* Do not remove this line: START CONFIGURATION */

let cid=0, J_TC_TUMOR = 40, cancer_cell_division_rate = 0.005, skin_cell_death_rate = 0.2,
	skin_cell_min_volume = 0.8, homing_rate_t_cells = 0.005, max_nr_t_cells = 15,
	lastnewdiv, lastdiv, T_cell_death_rate = 0.0002
	
/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/


let config = {

	// Grid settings
	ndim : 2,
	field_size : [300, 200],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		seed : 3,							// Seed for random number generation.
		T : 20,								// CPM temperature
		torus : [false,false],
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.

		
		// Adhesion parameters:
		J : [ 
			[0,20,20,20,20],
			[20,40,40,100,20], // epidermal cells
			[20,40,50,J_TC_TUMOR,20], // T cells
			[20,100,J_TC_TUMOR,100,20], // Cancer cells
			[20,20,20,20,20] ],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50,50,50,0],			// VolumeConstraint importance per cellkind
		V : [0,152,100,152,0],				// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P:[0,2,2,2,0],				// PerimeterConstraint importance per cellkind
		P: [0,145,105,145,0], 				// Target perimeter of each cellkind
		
		// ActivityConstraint parameters
		LAMBDA_ACT:[0,0,650,0,0],			// ActivityConstraint importance per cellkind
		MAX_ACT: [0,0,25,0,0],				// Activity memory duration per cellkind
		ACT_MEAN : "geometric"				// Is neighborhood activity computed as a
		// "geometric" or "arithmetic" mean?
								
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : {
	
		// Runtime etc
		BURNIN : 25,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		NRCELLS : [0,0,0,0],
		
		// Visualization
		CANVASCOLOR : "CCCCCC", //"eaecef",
		CELLCOLOR : ["CCCCCC","990000","000000","CCCCCC"],
		ACTCOLOR : [false,false,false,false],// Should pixel activity values be displayed?
		SHOWBORDERS : [true,true,true,true],		// Should cellborders be displayed?
		BORDERCOL : ["DDDDDD","DDDDDD","DDDDDD","DDDDDD"],
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/CancerInvasion",	// ... And save the image in this folder.
		EXPNAME : "CancerInvasion",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */
/* Do not remove this line: END CONFIGURATION */
