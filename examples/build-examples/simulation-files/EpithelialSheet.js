/* globals CPM */

/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. */
/** @file
 * <h1>Epithelial sheet dynamics</h1>
 * <p> Motility wave propagation in cell migration as described 
 * in <a href="https://doi.org/10.1038/s41598-020-63506-6">10.1038/s41598-020-63506-6:</a>.
 * Cells start in a space where they are tightly squeezed together, and will push each
 * other outwards to the right as the simulation progresses.</p>
 * */

"use strict"

// Configuration
let conf = {
	RUNTIME : 1000,

	// Basic CPM parameters
	torus : [false,false],				// Should the grid have linked borders?
	seed : 1,							// Seed for random number generation.
	T : 50,								// CPM temperature
		
	// Constraint parameters. 
	// Mostly these have the format of an array in which each element specifies the
	// parameter value for one of the cellkinds on the grid.
	// First value is always cellkind 0 (the background) and is often not used.
				
	// Adhesion parameters:
	J : [ [NaN,0], 
		[0,-2] // epidermal cells
	],
		
	// VolumeConstraint parameters
	LAMBDA_V : [0,70],	// VolumeConstraint importance per cellkind
	V : [0,100],		// Target volume of each cellkind

	LAMBDA_P : [0,3],	// VolumeConstraint importance per cellkind
	P : [0,0],			// Target perimeter of each cellkind
}

let C, Cim, t = 0
 
let pconstraint


// Setup the grid and needed objects
function setup(){
	C = new CPM.CPM([1000,300], conf)

	pconstraint = new CPM.PersistenceConstraint( {
		// PersistenceConstraint parameters
		LAMBDA_DIR: [0,10000], 				// PersistenceConstraint importance per ck
		PERSIST: [0,.7]						// Weight of the persistent direction in the
		// computation of the new direction per cellkind
	} )
	C.add( pconstraint )

	Cim = new CPM.Canvas( C , {zoom:1} )
}

// Place something on the grid
function initializeGrid(){
	for( let i = 5 ; i < C.extents[0]/2 ; i += 8 ){
		for( let j = 5 ; j < C.extents[1]; j += 8 ){
			C.setpix( [i,j], C.makeNewCellID(1) )
		}
	}
}


// Run everything needed for a single step (output and computation),
// and update the current time
function step(){
	if( !running ) return
	C.timeStep()
	if( t % 5 == 0 ){
		Cim.clear( "EEEEEE" )
		Cim.drawCells( 1, "000000" )
		Cim.drawCellBorders( 1, "FFFFFF" )
		output()
	}
	t++
}


// output function 
function output(){
	let cellpixels = C.getStat( CPM.PixelsByCell )
	for( let cid of Object.keys( cellpixels ) ){
		console.log( t + "\t" + cid + "\t" + cellpixels[cid].length ) // eslint-disable-line
	}
}


let running = true

// Starts up the simulation
function initialize(){
	if( typeof document !== "undefined" ){
		document.documentElement.onclick = function(){ running = !running }
	}

	setup()
	initializeGrid()
	run()
}

