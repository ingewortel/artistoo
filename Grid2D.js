/** A class containing (mostly static) utility functions for dealing with 2D 
 *  and 3D grids. */

class Grid2D {
	constructor( field_size ){
		this.field_size = { x : field_size[0], y : field_size[1] }
		// Check that the grid size is not too big to store pixel ID in 32-bit number,
		// and allow fast conversion of coordinates to unique ID numbers.
		this.X_BITS = 1+Math.floor( Math.log2( this.field_size.x - 1 ) )
		this.Y_BITS = 1+Math.floor( Math.log2( this.field_size.y - 1 ) )

		if( this.X_BITS + this.Y_BITS > 32 ){
			throw("Field size too large -- field cannot be represented as 32-bit number")
		}
		
		this.X_MASK = (1 << this.X_BITS)-1
		this.Y_MASK = (1 << this.Y_BITS)-1

		this.dy = 1 << this.Y_BITS // for neighborhoods based on pixel index

		this.midpoint = 			// middle pixel in the grid.
			[ 	Math.round((this.field_size.x-1)/2),
				Math.round((this.field_size.y-1)/2) ]
	}

	/*	Return array of indices of neighbor pixels of the pixel at 
		index i. The separate 2D and 3D functions are called by
		the wrapper function neighi, depending on this.ndim.

	*/
	neighi( i, torus = true ){	
		// normal computation of neighbor indices (top left-middle-right, 
		// left, right, bottom left-middle-right)
		let tl, tm, tr, l, r, bl, bm, br
		
		tl = i-1-this.dy; tm = i-1; tr = i-1+this.dy
		l = i-this.dy; r = i+this.dy
		bl = i+1-this.dy; bm = i+1; br = i+1+this.dy
		
		// if pixel is part of one of the borders, adjust the 
		// indices accordingly
		let add = NaN // if torus is false, return NaN for all neighbors that cross
		// the border.
		
		// left border
		if( i < this.field_size.y ){
			if( torus ){
				add = this.field_size.x * this.dy
			}
			tl += add; l += add; bl += add 	
		}
		
		// right border
		if( i >= this.dy*( this.field_size.x - 1 ) ){
			if( torus ){
				add = -this.field_size.x * this.dy
			}
			tr += add; r += add; br += add
		}

		// top border
		if( i % this.dy == 0 ){
			if( torus ){
				add = this.field_size.y
			}
			tl += add; tm += add; tr += add	
		}
		
		// bottom border
		if( (i+1-this.field_size.y) % this.dy == 0 ){
			if( torus ){
				add = -this.field_size.y
			}
			bl += add; bm += add; br += add
		}
		
		return [ tl, l, bl, tm, bm, tr, r, br ]
	}
	p2i ( p ){
		return ( p[0] << this.Y_BITS ) + p[1]
	}
	i2p ( i ){
		return [i >> this.Y_BITS, i & this.Y_MASK]
	}
}

export default Grid2D 
