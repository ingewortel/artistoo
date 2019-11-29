
import Stat from "./Stat.js"

/** This Stat creates an object with the cellpixels of each cell on the grid. 
	Keys are the {@link CellId} of all cells on the grid, corresponding values are arrays
	containing the pixels belonging to that cell. Each element of that array contains
	the {@link ArrayCoordinate} for that pixel.
	
	@example
	* let CPM = require( "path/to/build" )
	*
	* // Make a CPM, seed a cell, and get the PixelsByCell
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
	* C.getStat( CPM.PixelsByCell )
*/
class PixelsByCell extends Stat {

	/** The compute method of PixelsByCell creates an object with cellpixels of each
	cell on the grid.
	@return {CellArrayObject} object with for each cell on the grid
	an array of pixels (specified by {@link ArrayCoordinate}) belonging to that cell.
	*/
	compute(){
		// initialize the object
		let cellpixels = { }
		// The this.M.pixels() iterator returns coordinates and cellid for all 
		// non-background pixels on the grid. See the appropriate Grid class for
		// its implementation.
		for( let [p,i] of this.M.pixels() ){
			if( !cellpixels[i] ){
				cellpixels[i] = [p]
			} else {
				cellpixels[i].push( p )
			}
		}
		return cellpixels
	}
}

export default PixelsByCell
