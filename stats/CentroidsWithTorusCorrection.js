
import Stat from "./Stat.js"
import PixelsByCell from "./PixelsByCell.js"

class CentroidsWithTorusCorrection.js extends Stat {
		set model( M ){
			this.M = M
		}
		constructor( conf ){
			super(conf)
			this.halfsize = new Array(C.ndim).fill(0)
			for( let i = 0 ; i < C.ndim ; i ++ ){
				this.halfsize[i] = C.extents[i]/2
			}
		}
		compute(){
			let cellpixels = this.model.getStat( PixelsByCell ) 
			const pixels = cellpixels[t]
			let cvec = new Array(this.M.ndim).fill(0)
			for( let dim = 0 ; dim < this.M.ndim ; dim ++ ){
				let mi = 0.
				const hsi = this.halfsize[dim], si = this.model.extents[dim]
				// compute mean per dimension with online algorithm
				for( let j = 0 ; j < pixels.length ; j ++ ){
					let dx = pixels[j][dim] - mi
					if( j > 0 ){
						if( dx > hsi ){
							dx -= si
						} else if( dx < -hsi ){
							dx += si
						}
					}
					mi += dx/(j+1)
				}
				if( mi < 0 ){
					mi += si
				} else if( mi > si ){
					mi -= si
				}
				cvec[dim] = mi
			}
		}
		return cvec


}

export default CentroidsWithTorusCorrection
