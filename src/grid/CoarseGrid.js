/* This class encapsulates a lower-resolution grid and makes it
   visible as a higher-resolution grid. Only exact subsampling by
   a constant factor per dimension is supported. 
	*/

class CoarseGrid {
	constructor( grid, upscale = 3 ){
		this.extents = new Array( grid.extents.length )
		for( let i = 0 ; i < grid.extents.length ; i++ ){
			this.extents[i] = upscale * grid.extents[i]
		}
		this.grid = grid
		this.upscale = upscale
	}

	pixt( p ){
		// 2D bilinear interpolation
		let l = ~~(p[0] / this.upscale)
		let r = l+1
		if( r > this.grid.extents[0] ){
			r = this.grid.extents[0]
		}
		let t = ~~(p[1] / this.upscale)
		let b = t+1
		if( b > this.grid.extents[1] ){
			b = this.grid.extents[1]
		}

		let f_lt = this.grid.pixt([l,t])
		let f_rt = this.grid.pixt([r,t])
		let f_lb = this.grid.pixt([l,b])
		let f_rb = this.grid.pixt([r,b])

		let h = (p[0] % this.upscale) / this.upscale
		let f_x_b = f_lb * (1-h) + f_rb * h 
		let f_x_t = f_lt * (1-h) + f_rt * h

		let v = (p[1] % this.upscale) / this.upscale
		return f_x_t*(1-v) + f_x_b * v
	}

	/*gradient( p ){
		let ps = new Array( p.length )
		for( let i = 0 ; i < p.length ; i ++ ){
			ps[i] = ~~(p[i]/this.upscale)
		}
		return this.grid.gradient( ps )
	}*/
}

export default CoarseGrid
