
import Stat from "./Stat.js"
import CPM from "../models/CPM.js"

/**	This Stat creates a {@link CellArrayObject} with the border cellpixels of each cell on the grid. 
	Keys are the {@link CellId} of cells on the grid, corresponding values are arrays
	containing the pixels belonging to that cell. Coordinates are stored as {@link ArrayCoordinate}.
	
	@example
	* let CPM = require( "path/to/build" )
	*
	* // Make a CPM, seed a cell, and get the BorderPixelsByCell
	* let C = new CPM.CPM( [100,100], { 
	* 	T:20,
	* 	J:[[0,20],[20,10]],
	* 	V:[0,200],
	* 	LAMBDA_V:[0,2]
	* } )
	* C.setpix( [50,50], 1 )
	* C.getStat( CPM.BorderPixelsByCell )
*/
class BorderPixelsByCell extends Stat {

	/** The set model function of BorderPixelsByCell requires an object of type CPM.
	@param {CPM} M The CPM to compute cellborderpixels of.*/
	set model( M ){
		if( M instanceof CPM ){
			/** The CPM to compute borderpixels for.
			@type {CPM} */
			this.M = M
		} else {
			throw( "The stat BorderPixelsByCell is only implemented for CPMs, where cellborderpixels are stored!" )
		}
		
	}

	/** The compute method of BorderPixelsByCell creates an object with the borderpixels of
	each cell on the grid.
	@returns {CellArrayObject} An object with a key for each cell on the grid, and as
	corresponding value an array with all the borderpixels of that 
	cell. Each pixel is stored by its {@link ArrayCoordinate}.*/
	compute(){
		// initialize the object
		let cellborderpixels = { }
		
		// The this.M.cellBorderPixels() iterator returns coordinates and cellid for all 
		// non-background pixels on the grid. See the appropriate Grid class for
		// its implementation.
		for( let [p,i] of this.M.cellBorderPixels() ){
			if( !cellborderpixels[i] ){
				cellborderpixels[i] = [p]
			} else {
				cellborderpixels[i].push( p )
			}
		}
		return cellborderpixels
	}
}

export default BorderPixelsByCell
