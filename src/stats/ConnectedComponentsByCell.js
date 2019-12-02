
import Stat from "./Stat.js"
import PixelsByCell from "./PixelsByCell.js"

/** This Stat creates an object with the connected components of each cell on the grid. 
	Keys are the {@link CellId} of all cells on the grid, corresponding values are objects
	where each element is a connected component. Each element of that array contains 
	the {@link ArrayCoordinate} for that pixel.
	
	@example
	* let CPM = require( "path/to/build" )
	*
	* // Make a CPM, seed a cell, and get the ConnectedComponentsByCell
	* let C = new CPM.CPM( [100,100], { 
	* 	T:20,
	* 	J:[[0,20],[20,10]],
	* 	V:[0,200],
	* 	LAMBDA_V:[0,2]
	* } )
	* let gm = new CPM.GridManipulator( C )
	* gm.seedCell(1)
	* gm.seedCell(1)
	* for( let t = 0; t < 100; t++ ){ C.timeStep() }
	* C.getStat( CPM.ConnectedComponentsByCell )
*/
class ConnectedComponentsByCell extends Stat {

	/** This method computes the connected components of a specific cell. 
		@param {CellId} cellid the unique cell id of the cell to get connected components of.
		@returns {object} object of cell connected components. These components in turn consist of the pixels 
	(specified by {@link ArrayCoordinate}) belonging to that cell.
	*/
	connectedComponentsOfCell( cellid ){
	
		const cbp = this.M.getStat( PixelsByCell )
		const cbpi = cbp[cellid]
		let M = this.M
	
	
		let visited = {}, k=0, pixels = []
		let labelComponent = function(seed, k){
			let q = [seed]
			visited[q[0]] = 1
			pixels[k] = []
			while( q.length > 0 ){
				let e = q.pop()
				pixels[k].push( M.grid.i2p(e) )
				let ne = M.grid.neighi( e )
				for( let i = 0 ; i < ne.length ; i ++ ){
					if( M.pixti( ne[i] ) == cellid &&
						!(ne[i] in visited) ){
						q.push(ne[i])
						visited[ne[i]]=1
					}
				}
			}
		}
		for( let i = 0 ; i < cbpi.length ; i ++ ){
			let pi = this.M.grid.p2i( cbpi[i] )
			if( !(pi in visited) ){
				labelComponent( pi, k )
				k++
			}
		}
		return pixels
	}

	/** The compute method of ConnectedComponentsByCell creates an object with 
	connected components of the border of each cell on the grid.
	@return {CellObject} object with for each cell on the grid
	an object of components. These components in turn consist of the pixels 
	(specified by {@link ArrayCoordinate}) belonging to that cell.
	*/
	compute(){
		// initialize the object
		let components = { }
		// The this.M.pixels() iterator returns coordinates and cellid for all 
		// non-background pixels on the grid. See the appropriate Grid class for
		// its implementation.
		for( let ci of this.M.cellIDs() ){
			components[ci] = this.connectedComponentsOfCell( ci )
		}
		return components
	}
}

export default ConnectedComponentsByCell
