let CPM = require("../../build/artistoo-cjs.js")
/* The description below is printed on the HTML page. */


/**
 * @file 
 * <h1>Game of Life</h1>
 * <p>Conway's <i>Game of Life</i>
 * with random initial conditions.</p>
 */

"use strict"

// Configuration
let conf = {
	gsize : [200,200],		// dimensions of the grid to build
	zoom : 3,				// zoom for displaying the grid
	torus: [true,true],			// Should grid boundaries be connected?
	RUNTIME : 1000
}

let C, Cim, meter, t = 0

// Setup the grid and needed objects
function setup(){
	C = new CPM.CA( [conf.gsize[0],conf.gsize[1]], {
		"UPDATE_RULE": 	function(p,N){
			let nalive = 0
			for( let pn of N ){
				nalive += (this.pixt(pn)==1)
			}	
			if( this.pixt(p) == 1 ){
				if( nalive == 2 || nalive == 3 ){
					return 1
				}
			} else {
				if( nalive == 3 ) return 1
			}
			return 0
		}
	})
	Cim = new CPM.Canvas( C, {zoom:conf.zoom} )
}

// Place something on the grid
function initializeGrid(){
	for( let x = 0 ; x < conf.gsize[0] ; x ++ ){
		for( let y = 0 ; y < conf.gsize[1] ; y ++ ){
			if( C.random() < 0.5 ){
				C.setpix( [x,y], 1 )
			}
		}
	}
}

// Produce output, like drawing on the canvas and logging stats
function output(){
	// Clear the canvas (in the backgroundcolor white), and redraw:
	Cim.clear( "FFFFFF" )
	// The cell in red
	Cim.drawCellsOfId( 1, "AA0000" )
}

// Run everything needed for a single step (output and computation),
// and update the current time
function step(){ //eslint-disable-line
	C.timeStep()
	output()
	t ++ 
}

// Starts up the simulation
function initialize(){ //eslint-disable-line
	setup()
	initializeGrid()
	run() //eslint-disable-line
}
// all steps
function run(){
	while( t < conf.RUNTIME ){
		step() 
	}
}
initialize()
