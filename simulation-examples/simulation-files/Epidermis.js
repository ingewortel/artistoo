/* This trick allows using the code in either the browser or with nodejs. */
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
let CPMbuild
if( !isBrowser ){
	CPMbuild = require( "../../build/cpm-cjs.js")
	let CPM
} else {
	CPMbuild = CPM
}
CPM = CPMbuild


/* Write an extension of the existing simulation class */
class Epidermis extends CPM.Simulation {
	constructor( config ){
		
		super( config )
		
	}

	
	// Implement some method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){

	
		// Seed epidermal cell layer
		let step = 12
		for( var i = 1 ; i < this.C.extents[0] ; i += step ){
			for( var j = 1 ; j < this.C.extents[1] ; j += step ){
				this.C.setpix( [i,j], this.C.makeNewCellID(1) )
			}
		}


	}
	
	/*
	WRITE YOUR OWN CODE HERE.
	
	Functions you may wish to customize are:
		- drawCanvas()
		- logStats()
		- initializeGrid()
	See the base simulation class source code (simulation/Simulation.js) for
	example implementations to start from.
	*/
	

	
}

/* This allows using the code in either the browser or with nodejs. */
if( typeof module !== "undefined" ){
	module.exports = Epidermis
}
