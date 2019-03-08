/** A class containing (mostly static) utility functions for dealing with 2D 
 *  and 3D grids. */

import Grid from "./Grid.js"

class Grid3D extends Grid {
	constructor( field_size, torus = true ){
		super( field_size, torus )
		this.field_size = { x : field_size[0],
			y : field_size[1],
			z : field_size[2] }
		// Check that the grid size is not too big to store pixel ID in 32-bit number,
		// and allow fast conversion of coordinates to unique ID numbers.
		this.Z_BITS = 1+Math.floor( Math.log2( this.field_size.z - 1 ) )
		if( this.X_BITS + this.Y_BITS + this.Z_BITS > 32 ){
			throw("Field size too large -- field cannot be represented as 32-bit number")
		}
		this.Z_MASK = (1 << this.Z_BITS)-1
		this.dz = 1 << ( this.Y_BITS + this.Z_BITS )
		this._pixels = new Uint16Array(this.p2i(field_size))
	}
	/* 	Convert pixel coordinates to unique pixel ID numbers and back.
		Depending on this.ndim, the 2D or 3D version will be used by the 
		wrapper functions p2i and i2p. Use binary encoding for speed. */
	p2i( p ){
		return ( p[0] << ( this.Z_BITS + this.Y_BITS ) ) + 
			( p[1] << this.Z_BITS ) + 
			p[2]
	}
	i2p( i ){
		return [i >> (this.Y_BITS + this.Z_BITS), 
			( i >> this.Z_BITS ) & this.Y_MASK, i & this.Z_MASK ]
	}
	neighi( i ){
		let p = this.i2p(i)

		let xx = []
		for( let d = 0 ; d <= 2 ; d ++ ){
			if( p[d] == 0 ){
				if( this.torus ){
					xx[d] = [p[d],this.extents[d]-1,p[d]+1]
				} else {
					xx[d] = [p[d],p[d]+1]
				}
			} else if( p[d] == this.extents[d]-1 ){
				if( this.torus ){
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
				for( let z of xx[2] ){
					if( first ){
						first = false 
					} else {
						r.push( this.p2i( [x,y,z] ) )
					}
				}
			}
		}
		return r
	}
}

export default Grid3D 
