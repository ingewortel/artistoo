/** A class containing (mostly static) utility functions for dealing with 2D 
 *  and 3D grids. */

import Grid from "./Grid.js"

class Grid2D extends Grid {
	constructor( extents, torus=true, datatype="Uint16" ){
		super( extents, torus )
		this.X_STEP = 1 << this.Y_BITS // for neighborhoods based on pixel index
		this.Y_MASK = this.X_STEP-1
		// Check that the grid size is not too big to store pixel ID in 32-bit number,
		// and allow fast conversion of coordinates to unique ID numbers.
		if( this.X_BITS + this.Y_BITS > 32 ){
			throw("Field size too large -- field cannot be represented as 32-bit number")
		}
		// Attributes per pixel:
		// celltype (identity) of the current pixel.
		if( datatype == "Uint16" ){
			this._pixels = new Uint16Array(this.p2i(this.extents))
		} else if( datatype == "Float32" ){
			this._pixels = new Float32Array(this.p2i(this.extents))
		} else {
			throw("unsupported datatype: " + datatype)
		}
	}

	* pixelsi() {
		let ii = 0, c = 0
		for( let i = 0 ; i < this.extents[0] ; i ++ ){
			for( let j = 0 ; j < this.extents[1] ; j ++ ){
				yield ii
				ii ++
			}
			c += this.X_STEP
			ii = c
		}
	}

	* pixels() {
		let ii = 0, c = 0
		// Loop over coordinates [i,j] on the grid
		// For each pixel with cellid != 0 (so non-background pixels), 
		// return an array with in the first element the pixel 
		// coordinates p = [i,j], and in the second element the cellid of this pixel.
		for( let i = 0 ; i < this.extents[0] ; i ++ ){
			for( let j = 0 ; j < this.extents[1] ; j ++ ){
				if( this._pixels[ii] > 0 ){
					yield [[i,j], this._pixels[ii]]
				}
				ii ++
			}
			c += this.X_STEP
			ii = c
		}
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

	* neighNeumanni( i, torus = this.torus ){
		// normal computation of neighbor indices (top left-middle-right, 
		// left, right, bottom left-middle-right)
		let t = i-1, l = i-this.X_STEP, r = i+this.X_STEP, b = i+1
		
		// if pixel is part of one of the borders, adjust the 
		// indices accordingly
		// if torus is false, return NaN for all neighbors that cross
		// the border.

		// left border
		if( i < this.extents[1] ){
			if( torus ){
				l += this.extents[0] * this.X_STEP
				yield l
			} 
		} else {
			yield l
		}
		// right border
		if( i >= this.X_STEP*( this.extents[0] - 1 ) ){
			if( torus ){
				r -= this.extents[0] * this.X_STEP
				yield r
			}
		} else {
			yield r
		}
		// top border
		if( i % this.X_STEP == 0 ){
			if( torus ){
				t += this.extents[1]
				yield t
			} 
		} else {
			yield t
		}
		// bottom border
		if( (i+1-this.extents[1]) % this.X_STEP == 0 ){
			if( torus ){
				b -= this.extents[1]
				yield b
			} 
		} else {
			yield b
		}
	}

	neighi( i, torus = this.torus ){	
		// normal computation of neighbor indices (top left-middle-right, 
		// left, right, bottom left-middle-right)
		let tl, tm, tr, l, r, bl, bm, br
		
		tl = i-1-this.X_STEP; tm = i-1; tr = i-1+this.X_STEP
		l = i-this.X_STEP; r = i+this.X_STEP
		bl = i+1-this.X_STEP; bm = i+1; br = i+1+this.X_STEP
		
		// if pixel is part of one of the borders, adjust the 
		// indices accordingly
		let add = NaN // if torus is false, return NaN for all neighbors that cross
		// the border.
		// 
		// left border
		if( i < this.extents[1] ){
			if( torus ){
				add = this.extents[0] * this.X_STEP
			}
			tl += add; l += add; bl += add 	
		}
		
		// right border
		if( i >= this.X_STEP*( this.extents[0] - 1 ) ){
			if( torus ){
				add = -this.extents[0] * this.X_STEP
			}
			tr += add; r += add; br += add
		}

		// top border
		if( i % this.X_STEP == 0 ){
			if( torus ){
				add = this.extents[1]
			}
			tl += add; tm += add; tr += add	
		}
		
		// bottom border
		if( (i+1-this.extents[1]) % this.X_STEP == 0 ){
			if( torus ){
				add = -this.extents[1]
			}
			bl += add; bm += add; br += add
		}
		if( !torus ){
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
	gradienti( i ){
		let t = i-1, b = i+1, l = i-this.X_STEP, r = i+this.X_STEP, torus = this.torus
		
		let dx=0
		if( i < this.extents[1] ){ // left border
			if( torus ){
				l += this.extents[0] * this.X_STEP
				dx = ((this._pixels[r]-this._pixels[i])+
					(this._pixels[i]-this._pixels[l]))/2
			} else {
				dx = this._pixels[r]-this._pixels[i]
			}
		} else { 
			if( i >= this.X_STEP*( this.extents[0] - 1 ) ){ // right border
				if( torus ){
					r -= this.extents[0] * this.X_STEP
					dx = ((this._pixels[r]-this._pixels[i])+
						(this._pixels[i]-this._pixels[l]))/2
				} else {
					dx = this._pixels[i]-this._pixels[l]
				}
			} else {
				dx = ((this._pixels[r]-this._pixels[i])+
					(this._pixels[i]-this._pixels[l]))/2
			}
		}

		let dy=0
		if( i % this.X_STEP == 0 ){ // top border
			if( torus ){
				t += this.extents[1]
				dy = ((this._pixels[b]-this._pixels[i])+
					(this._pixels[i]-this._pixels[t]))/2
			}	else {
				dy = this._pixels[b]-this._pixels[i]
			}
		} else { 
			if( (i+1-this.extents[1]) % this.X_STEP == 0 ){ // bottom border
				if( torus ){
					b -= this.extents[1]
					dy = ((this._pixels[b]-this._pixels[i])+
						(this._pixels[i]-this._pixels[t]))/2
				} else {
					dy = this._pixels[i]-this._pixels[t]
				}
			} else {
				dy = ((this._pixels[b]-this._pixels[i])+
					(this._pixels[i]-this._pixels[t]))/2
			}
		}
		return [
			dx, dy
		]
	}
}

export default Grid2D 
