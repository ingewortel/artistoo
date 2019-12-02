import Grid2D from "./Grid2D.js"

/** This class encapsulates a lower-resolution grid and makes it
   visible as a higher-resolution grid. Only exact subsampling by
   a constant factor per dimension is supported. 
   
   This class is useful when combining information of grids of
   different sizes. This is often the case for chemotaxis, where
   we let diffusion occur on a lower resolution grid to speed things up.
   This class then allows you to obtain chemokine information from the 
   low resolution chemokine grid using coordinates from the linked,
   higher resolution model grid.
   
   @example <caption>Linear interpolation on a low resolution chemokine grid</caption>
   * let CPM = require( "path/to/build" )
   * 
   * // Define a grid with float values for chemokine values, and set the middle pixel
   * let chemogrid = new CPM.Grid2D( [50,50], [true,true], "Float32" )
   * chemogrid.setpix( [99,99], 100 )
   * 
   * // Make a coarse grid at 5x as high resolution, which is then 500x500 pixels.
   * let coarsegrid = new CPM.CoarseGrid( chemogrid, 5 )
   * 
   * // Use interpolation. Pixels close to the midpoint won't have the exact same
   * // value of either 100 or 0, but something inbetween.
   * let p1 = [250,250], p2 = [250,251]
   * console.log( "p1 : " + coarsegrid.pixt(p1) + ", p2 : " + coarsegrid.pixt(p2) )
   * // p1 : 100, p2 : 80 
   * 
   * // Or draw it to see this. Compare these two:
   * let Cim1 = new CPM.Canvas( coarsegrid )
   * Cim1.drawField()
   * let Cim2 = new CPM.Canvas( chemogrid, {zoom:5} )
   * Cim2.drawField()
*/
class CoarseGrid extends Grid2D {
	/** The constructor of class CoarseGrid takes a low resolution grid as input
	and a factor 'upscale', which is how much bigger the dimensions of the high
	resolution grid are (must be a constant factor). 
	@param {Grid2D} grid the grid to scale up; currently only supports the {@link Grid2D} class.
	@param {number} upscale The (integer) factor to magnify the original grid with. */
	constructor( grid, upscale = 3 ){
	
		let extents = new Array( grid.extents.length )
		for( let i = 0 ; i < grid.extents.length ; i++ ){
			extents[i] = upscale * grid.extents[i]
		}
		super( extents, grid.torus, "Float32" )
	
		/** Size of the new grid in all dimensions.
		@type {GridSize} with a non-negative integer number for each dimension. */
		this.extents = extents
		/** The original, low-resolution grid. 
		@type {Grid2D}*/
		this.grid = grid
		
		/** The upscale factor (a positive integer number).
		@private
		@type {number} */
		this.upscale = upscale
	}

	/** The pixt method takes as input a coordinate on the bigger grid, and maps it
	to the corresponding value on the resized small grid via bilinear interpolation.
	This prevents artefacts from the lower resolution of the second grid: the 
	[upscale x upscale] pixels that map to the same pixel in the low resolution grid
	do not get the same value.
	@param {ArrayCoordinate} p array coordinates on the high resolution grid.
	@return {number} interpolated value from the low resolution grid at this position. */
	pixt( p ){
	
		// 2D bilinear interpolation. Find the 4 positions on the original, low resolution grid
		// that are closest to the requested position p: x-coordinate l,r (left/right) 
		// and y-coordinate t,b (top/bottom)
	
		let positions = this.positions(p) // [t,r,b,l,h,v]
		let t = positions[0], r = positions[1], b = positions[2], l = positions[3],
			h = positions[4], v = positions[5]

		// Get the values on those 4 positions
		let f_lt = this.grid.pixt([l,t])
		let f_rt = this.grid.pixt([r,t])
		let f_lb = this.grid.pixt([l,b])
		let f_rb = this.grid.pixt([r,b])

		// Average these weighted by their distance to the current pixel.
		let f_x_b = f_lb * (1-h) + f_rb * h 
		let f_x_t = f_lt * (1-h) + f_rt * h

		return f_x_t*(1-v) + f_x_b * v
	}
	
	/** This method takes as input a coordinate on the bigger grid, and 'adds' additional
	value to it by adding the proper amount to the corresponding positions on the low
	resolution grid.
	@param {ArrayCoordinate} p array coordinates on the high resolution grid.
	@param {number} value - value that should be added to this position.
	*/
	addValue( p, value ){
		
		// 2D bilinear interpolation, the other way around.
		// Find the 4 positions on the original, low res grid that are closest to the
		// requested position p
		
		let positions = this.positions(p) 
		let t = positions[0], r = positions[1], b = positions[2], l = positions[3],
			h = positions[4], v = positions[5]
			
		
		let v_lt = value * (1-h) * (1-v)
		let v_lb = value * (1-h) * v
		let v_rt = value * h * (1-v)
		let v_rb = value * h * v
		
		
		this.grid.setpix( [l,t], this.grid.pixt([l,t]) + v_lt )
		this.grid.setpix( [l,b], this.grid.pixt([l,b]) + v_lb )
		this.grid.setpix( [r,t], this.grid.pixt([r,t]) + v_rt )
		this.grid.setpix( [r,b], this.grid.pixt([r,b]) + v_rb )
		
	}
	/** @private 
	@ignore */
	positions( p ){
		// Find the 4 positions on the original, low resolution grid
		// that are closest to the requested position p: x-coordinate l,r (left/right) 
		// and y-coordinate t,b (top/bottom)
		let l = ~~(p[0] / this.upscale) // ~~ is a fast alternative for Math.floor
		let r = l+1
		
		let t = ~~(p[1] / this.upscale)
		let b = t+1
		
		// Find the horizontal/vertical distances of these positions to p
		let h = (p[0]%this.upscale)/this.upscale
		let v = (p[1]%this.upscale)/this.upscale
		
		// Correct grid boundaries depending on torus
		if( r > this.grid.extents[0] ){
			if( this.grid.torus[0] ){
				r = 0
			} else {
				r = this.grid.extents[0]
				h = 0.5
			}
		}
		
		if( b > this.grid.extents[1] ){
			if( this.grid.torus[1] ){
				b = 0
			} else {
				b = this.grid.extents[1]
				v = 0.5
			}
			
		}
		
		return [t,r,b,l,h,v]
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
