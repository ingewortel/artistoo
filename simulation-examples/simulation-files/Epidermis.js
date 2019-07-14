/* Include CPM in nodejs. It is already included in the browser. */
if( typeof CPM === 'undefined' ){
	var CPM = require( "../../build/cpm-cjs.js")
}

/* Write an extension of the existing simulation class */
class Epidermis extends CPM.Simulation {
	// Implement some method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){
		// Seed epidermal cell layer
		let step = 12
	
		for( let i = 1 ; i < this.C.extents[0] ; i += step ){
			for( let j = 1 ; j < this.C.extents[1] ; j += step ){
				this.C.setpix( [i,j], this.C.makeNewCellID(1) )
			}
		}
	}
}

/* This allows using the code in either the browser or with nodejs. */
if( typeof module !== "undefined" ){
	module.exports = Epidermis
}

