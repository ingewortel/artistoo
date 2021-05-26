let CPM = require("../../build/artistoo-cjs.js")


/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. */
/** @file
<h1>Diffusion</h1>
<p>
 * Diffusion on a coarse grid. </p>
 * */




"use strict"

// Configuration
let conf = {
	w : 41,					// dimensions of the grid to build
	D : 0.1545706,			// Diffusion coefficient
	res : 10,				// 'Resolution' of the coarse grid
	zoom : 1,				// zoom for displaying the grid
	torus: [true,true],		// Should grid boundaries be connected?
	RUNTIME : 500
}

conf["m"]=Math.floor((conf.w-1)/2)		// midpoint of the grid

let grid, diffusiongrid, Cim, t = 0, s = 0, meter

// Setup the grid and needed objects
function setup(){
	grid = new CPM.Grid2D([conf.w,conf.w], conf.torus, "Float32")
	diffusiongrid = new CPM.CoarseGrid( grid, conf.res )
	Cim = new CPM.Canvas( diffusiongrid , {zoom:conf.zoom} )
}

// Place something on the grid
function initializeGrid(){
	grid.setpix( [conf.m,conf.m], 10000 )
}


// Perform one diffusionstep
function diffusionStep(){
	grid.diffusion( conf.D*0.01 )
}

// Produce output, like drawing on the canvas and logging stats
function output(){
	Cim.clear("FFFFFF")
	Cim.drawField( diffusiongrid )
	// eslint-disable-next-line
	console.log( t, s, 4 * 6.2 * 1E-5 * (t/10) )
}

// Run everything needed for a single step (output and computation),
// and update the current time
function step(){
	diffusionStep()
	output()
	t++
}

// Starts up the simulation
function initialize(){
	setup()
	initializeGrid()
	run()
}

// all steps
function run(){
	while( t < conf.RUNTIME ){
		step() 
	}
}
initialize()
