/* 	
	Creates an object with the cellpixels of each cell on the grid. 
	Keys are the cellIDs of all cells on the grid, corresponding values are arrays
	containing the pixels belonging to that cell. Each element of that array contains
	the coordinate array p = [x,y] for that pixel.
*/
import Stat from "./Stat.js"

class PixelsByCell extends Stat {

	compute(){
		// initialize the object, and create keys with empty arrays for each cellid.
		let cellpixels = { }
		for( let i of this.M.cellIDs() ){
			cellpixels[i] = []
		}
		// The this.M.pixels() iterator returns coordinates and cellid for all 
		// non-background pixels on the grid. See the appropriate Grid class for
		// its implementation.
		for( let [p,i] of this.M.pixels() ){
			cellpixels[i].push( p )
		}
		return cellpixels
	}
}

export default PixelsByCell
