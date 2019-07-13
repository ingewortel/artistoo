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
class EpidermisWithTCells extends CPM.Simulation {
	constructor( config ){
		
		super( config )
		
	}

	
	// Implement some method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){
	
		// add the GridManipulator if not already there and if you need it
		if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	
		let i = (this.C.extents[0]*this.C.extents[1]/145.)	
		let cellids = []

		while( i-- > 0 ){
			cellids.push( this.gm.seedCell(1) )
		}
		i = 50
		while( i-- > 0 ){
			this.C.monteCarloStep()
		}
		i = 50*(this.C.extents[0]/1000)
		while( i-- > 0 ){
			this.C.setCellKind( cellids.pop(), 2 )
			//Ci.seedCell(2)
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
	module.exports = EpidermisWithTCells
}
