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
class Cellsorting extends CPM.Simulation {
	constructor( config ){
		
		super( config )
		
	}

	
	// Implement some method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){
	
		// add the GridManipulator if not already there and if you need it
		if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
		this.gm.seedCellsInCircle( 1, 500, this.C.midpoint, this.C.extents[0]/3 )
		this.gm.seedCellsInCircle( 2, 500, this.C.midpoint, this.C.extents[0]/3 )



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
	module.exports = Cellsorting
}
