
import Stat from "./Stat.js"
import ConnectedComponentsByCell from "./ConnectedComponentsByCell.js"

/** This Stat computes the 'connectedness' of cells on the grid. 
	Keys are the {@link CellId} of all cells on the grid, corresponding values the
	connectedness of the corresponding cell. 
	
	@example
	* let CPM = require( "path/to/build" )
	*
	* // Make a CPM, seed a cell, and get the Connectedness
	* let C = new CPM.CPM( [100,100], { 
	* 	T:20,
	* 	J:[[0,20],[20,10]],
	* 	V:[0,200],
	* 	LAMBDA_V:[0,2]
	* } )
	* let gm = new CPM.GridManipulator( C )
	* gm.seedCell(1)
	* for( let t = 0; t < 100; t++ ){ C.timeStep() }
	* C.getStat( CPM.Connectedness )
*/
class Connectedness extends Stat {

	/** This method computes the connectedness of a specific cell. 
	@return {number} the connectedness value of this cell, a number between 0 and 1.
	*/
	connectednessOfCell( cellid ){
	
		let ccbc = this.M.getStat( ConnectedComponentsByCell )
		const v = ccbc[cellid]
	
		//let s = {}, r = {}, i, j
		let s = 0, r = 0
		
		for( let comp in Object.keys( v ) ){
			let volume = v[comp].length
			s += volume
		}
		for( let comp in Object.keys( v ) ){
			let volume = v[comp].length
			r += (volume/s)*(volume/s)
		}
		
		return r

	}

	/** The compute method of Connectedness creates an object with 
	connectedness of each cell on the grid.
	@return {CellObject} object with for each cell on the grid
	a connectedness value. 
	*/
	compute(){
		// initialize the object
		let connectedness = { }
		// The this.M.pixels() iterator returns coordinates and cellid for all 
		// non-background pixels on the grid. See the appropriate Grid class for
		// its implementation.
		for( let ci of this.M.cellIDs() ){
			connectedness[ci] = this.connectednessOfCell( ci )
		}
		return connectedness
	}
}

export default Connectedness
