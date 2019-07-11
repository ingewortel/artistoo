
import Stat from "./Stat.js"

class PixelsByCell extends Stat {
	compute(){
		let cellpixels = { }
		for( let i of this.M.cellIDs() ){
			cellpixels[i] = []
		}
		for( let [p,i] of this.M.pixels() ){
			cellpixels[i].push( p )
		}
		return cellpixels
	}
}

export default PixelsByCell
