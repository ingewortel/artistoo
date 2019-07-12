
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
let CPMbuild

/* This allows using the code in either the browser or with nodejs. */
if( !isBrowser ){
	CPMbuild = require( "../../build/cpm-cjs.js")
	let CPM
} else {
	CPMbuild = CPM
}

CPM = CPMbuild


class Microchannel extends CPM.Simulation {
//class Microchannel {
	constructor( config ){
		
		super( config )
		
	}

	
	// Method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){
	
		// add the initializer if not already there
		if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
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
	
	buildChannel(){
		
		let channelvoxels
	
		channelvoxels = this.gm.makePlane( [], 1, 0 )
		let gridheight = this.C.extents[1]
		channelvoxels = this.gm.makePlane( channelvoxels, 1, gridheight-1 )
		
		this.gm.changeKind( channelvoxels, 2)
		
	}

	
}

/* This allows using the code in either the browser or with nodejs. */
if( typeof module !== "undefined" ){
	module.exports = Microchannel
}



//export default Simulation
