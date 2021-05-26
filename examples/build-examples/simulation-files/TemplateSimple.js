/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. */
/** @file
* <h1>Template File</h1>
 * <p>HTML code for the page here.</p>
 *  */

"use strict"

// Configuration
let conf = {
	w : 61,					// dimensions of the grid to build
	D : 0.1545706,			// Diffusion coefficient
	res : 10,				// 'Resolution' of the coarse grid
	zoom : 1,				// zoom for displaying the grid
	torus: [true,true],		// Should grid boundaries be connected?
	RUNTIME : 20
}

conf["m"]=(conf.w-1)/2		// midpoint of the grid

let grid, diffusiongrid, Cim, t = 0, s = 0

// Setup the grid and needed objects
function setup(){
	let w = conf.w
	grid = new CPM.Grid2D([conf.w,conf.w], conf.torus, "Float32")
	diffusiongrid = new CPM.CoarseGrid( grid, conf.res )
	Cim = new CPM.Canvas( diffusiongrid , {zoom:conf.zoom} )
}

// Place something on the grid
function initializeGrid(){
	grid.setpix( [conf.m,conf.m], 1 )
}


// Perform one diffusionstep
function diffusionStep(){

	let D = conf.D, s = 0, w = conf.w, m = conf.m

	grid.diffusion( D*0.01 )
	s = 0
	for( let x = 0 ; x < w ; x ++ ){
		for( let y = 0 ; y < w ; y ++ ){
			s += ((x-m)*(x-m)+(y-m)*(y-m))*(0.38*0.38/60./60.)*grid.pixt( [x,y] )
		}
	}
}

// Produce output, like drawing on the canvas and logging stats
function output(){
	Cim.drawField( diffusiongrid )
	console.log( t, s, 4 * 6.2 * 1E-5 * (t/10) )
}

// Run everything needed for a single step (output and computation),
// and update the current time
function step(){
	diffusionStep()
	output()
	t++
	if( t < conf.RUNTIME ){ requestAnimationFrame( step ) }
}

// Starts up the simulation
function initialize(){
	setup()
	initializeGrid()
	step()
}


