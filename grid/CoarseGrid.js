/* This class encapsulates a lower-resolution grid and makes it
   visible as a higher-resolution grid. Only exact subsampling by
   a constant factor per dimension is supported. 
	*/

class CoarseGrid {
	constructor( grid, upscale = 2 ){
		this.extents = new Array( grid.extents.length )
		for( let i = 0 ; i < grid.extents.length ; i++ ){
			this.extents[i] = upscale * grid.extents[i]
		}
		this.grid = grid
		this.upscale = upscale
	}

	pixt( p ){
		let ps = new Array( p.length )
		for( let i = 0 ; i < p.length ; i ++ ){
			ps[i] = ~~(p[i]/this.upscale)
		}
		return this.grid.pixt(ps)
	}

	gradient( p ){
		let ps = new Array( p.length )
		for( let i = 0 ; i < p.length ; i ++ ){
			ps[i] = ~~(p[i]/this.upscale)
		}
		return this.grid.gradient( ps )
	}
}

export default CoarseGrid
