/** A class containing (mostly static) utility functions for dealing with 2D 
 *  and 3D grids. */

import Grid from "./Grid.js"

class Grid2D extends Grid {
	constructor( field_size, torus=true ){
		super( field_size, torus )
		this.field_size = { x : field_size[0], y : field_size[1] }
		// Check that the grid size is not too big to store pixel ID in 32-bit number,
		// and allow fast conversion of coordinates to unique ID numbers.
		if( this.X_BITS + this.Y_BITS > 32 ){
			throw("Field size too large -- field cannot be represented as 32-bit number")
		}
		// Attributes per pixel:
		// celltype (identity) of the current pixel.
		this._pixels = new Uint16Array(this.p2i(field_size))
	}



	/*	Return array of indices of neighbor pixels of the pixel at 
		index i. The separate 2D and 3D functions are called by
		the wrapper function neighi, depending on this.ndim.

	*/
	neighisimple( i ){
		let p = this.i2p(i)
		let xx = []
		for( let d = 0 ; d <= 1 ; d ++ ){
			if( p[d] == 0 ){
				if( this.torus[d] ){
					xx[d] = [p[d],this.extents[d]-1,p[d]+1]
				} else {
					xx[d] = [p[d],p[d]+1]
				}
			} else if( p[d] == this.extents[d]-1 ){
				if( this.torus[d] ){
					xx[d] = [p[d],p[d]-1,0]
				} else {
					xx[d] = [p[d],p[d]-1]
				}
			} else {
				xx[d] = [p[d],p[d]-1,p[d]+1]
			}
		}

		let r = [], first=true
		for( let x of xx[0] ){
			for( let y of xx[1] ){
				if( first ){
					first = false 
				} else {
					r.push( this.p2i( [x,y] ) )
				}
			}
		}
		return r
	}

	neighi( i ){	
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
		// 
		// left border
		if( i < this.field_size.y ){
			if( this.torus ){
				add = this.field_size.x * this.dy
			}
			tl += add; l += add; bl += add 	
		}
		
		// right border
		if( i >= this.dy*( this.field_size.x - 1 ) ){
			if( this.torus ){
				add = -this.field_size.x * this.dy
			}
			tr += add; r += add; br += add
		}

		// top border
		if( i % this.dy == 0 ){
			if( this.torus ){
				add = this.field_size.y
			}
			tl += add; tm += add; tr += add	
		}
		
		// bottom border
		if( (i+1-this.field_size.y) % this.dy == 0 ){
			if( this.torus ){
				add = -this.field_size.y
			}
			bl += add; bm += add; br += add
		}
		if( !this.torus ){
			return [ tl, l, bl, tm, bm, tr, r, br ].filter( isFinite )
		} else {
			return [ tl, l, bl, tm, bm, tr, r, br ]
		}
	}
	p2i ( p ){
		return ( p[0] << this.Y_BITS ) + p[1]
	}
	i2p ( i ){
		return [i >> this.Y_BITS, i & this.Y_MASK]
	}
}

export default Grid2D 
