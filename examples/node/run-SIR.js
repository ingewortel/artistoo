let CPM = require("../../build/artistoo-cjs.js")

/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. */
/** @file
 * <h1>SIR model of infection epidemiology</h1>
 * <p>Susceptible-Infected-Resistant (SIR) model. Click on canvas to interrupt/restart simulation.</p>
 * <p>Infection rate: <input type="text" value="0.1" size="4" maxlength="4" onkeyup="r_i=parseFloat(this.value)||0.1"/></p>
 * <p>Recovery rate: <input type="text" value="0.01" size="4" maxlength="4" onkeyup="r_r=parseFloat(this.value)||0.01"/></p>
 * <p><button onclick="initialize()">run</button></p>
 * */

let C, zoom=2, Cim, w=200, meter, t = 0
let conf = { RUNTIME : 1000 }

var r_i = 0.1, r_r = 0.01

function draw(){
	// Clear the canvas (in the backgroundcolor white), and redraw:
	Cim.clear( "FFFFFF" )

	// The cell in red
	Cim.drawCellsOfId( 1, "AA0000" )
	Cim.drawCellsOfId( 2, "AAAAAA" )
}


let running = 1
function toggleAnim(){
	running = 1 - running
	if( running == 1 ){
		run()
	}
}


function seedGrid(){
	// seed infection in the middle
	C.setpix( C.midpoint, 1 )
}

function initialize(){
	// Create a new CA, canvas, and stats object
	C = new CPM.CA( [w,w], {
		UPDATE_RULE : function( p, N ){
			let t = this.pixt(p)
			if(t == 0){ // Susceptible
				for( let pn of N ){
					if( this.pixt(pn) == 1 && C.random() < r_i ){
						return 1
					}
				}
			} else if( t==1 && C.random() < r_r ){
				return 2
			}
			return t
		}
	})

	if( !Cim ){
		Cim = new CPM.Canvas( C, {zoom:zoom} )
	} else {
		Cim.C = C
	}
	Cim.el.onclick = toggleAnim
	// Start simulation
	seedGrid()
	running = 1
	run()
}

function output(){
	let cellpixels = C.getStat( CPM.PixelsByCell )
	for( let cid of Object.keys( cellpixels ) ){
		// eslint-disable-next-line
		console.log( t + "\t" + cid + "\t" + cellpixels[cid].length )
	}
}

function step(){
	if( running ){
		// Update the grid with one MCS
		C.timeStep()
		draw()
		output()
		t++
	}
}

// all steps
function run(){
	while( t < conf.RUNTIME ){
		step() 
	}
}
initialize()
