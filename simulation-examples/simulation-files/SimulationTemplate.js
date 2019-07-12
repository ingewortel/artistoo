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
class SimulationTemplate extends CPM.Simulation {
	constructor( config ){
		
		super( config )
		
	}

	
	// Implement some method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){
	
		// add the GridManipulator if not already there and if you need it
		if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	
		// CHANGE THE CODE BELOW TO FIT YOUR SIMULATION
	
		let nrcells = this.conf["NRCELLS"], cellkind, i
		this.buildChannel()
		
		// Seed the right number of cells for each cellkind
		for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
			
			for( i = 0; i < nrcells[cellkind]; i++ ){
				// first cell always at the midpoint. Any other cells
				// randomly.				
				if( i == 0 ){
					this.gm.seedCellAt( cellkind+1, this.C.midpoint )
				} else {
					this.gm.seedCell( cellkind+1 )
				}
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
	module.exports = SimulationTemplate
}