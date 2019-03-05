/** A class containing (mostly static) utility functions for dealing with 2D 
 *  and 3D grids. */

class Grid3D {
	constructor( field_size ){
		this.field_size = field_size
		// Check that the grid size is not too big to store pixel ID in 32-bit number,
		// and allow fast conversion of coordinates to unique ID numbers.
		this.X_BITS = 1+Math.floor( Math.log2( this.field_size.x - 1 ) )
		this.Y_BITS = 1+Math.floor( Math.log2( this.field_size.y - 1 ) )
		this.Z_BITS = 1+Math.floor( Math.log2( this.field_size.z - 1 ) )

		if( this.X_BITS + this.Y_BITS + this.Z_BITS > 32 ){
			throw("Field size too large -- field cannot be represented as 32-bit number")
		}
		
		this.X_MASK = (1 << this.X_BITS)-1
		this.Y_MASK = (1 << this.Y_BITS)-1
		this.Z_MASK = (1 << this.Z_BITS)-1

		this.dy = 1 << this.Y_BITS // for neighborhoods based on pixel index
		this.dz = 1 << ( this.Y_BITS + this.Z_BITS )

		this.midpoint = 
			[	Math.round((this.field_size.x-1)/2),
				Math.round((this.field_size.y-1)/2),
				Math.round((this.field_size.z-1)/2) ]
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
	neighi( i, torus = true ){
	
		const dy = this.dy, dz = this.dz
		const fsx = this.field_size.x, fsy = this.field_size.y, fsz = this.field_size.z
		
		// normal computation of neighbor indices.
		// first letter: U(upper), M(middle), B(bottom) layer
		// second letter: l(left), m(middle), r(right)
		// third letter: t(top), c(center), b(bottom)
		
		let Ult, Umt, Urt, Ulc, Umc, Urc, Ulb, Umb, Urb,
			Mlt, Mmt, Mrt, Mlc, /*Mmc*/ Mrc, Mlb, Mmb, Mrb,
			Blt, Bmt, Brt, Blc, Bmc, Brc, Blb, Bmb, Brb
		
		Ult = i-1-dz-dy; Umt = i-1-dz; Urt = i-1-dz+dy
		Ulc = i-1-dy; Umc = i-1; Urc = i-1+dy
		Ulb = i-1+dz-dy; Umb = i-1+dz; Urb = i-1+dz+dy
		
		Mlt = i-dz-dy; Mmt = i-dz; Mrt = i-dz+dy
		Mlc = i-dy; /*Mmc = i */ Mrc = i+dy
		Mlb = i+dz-dy; Mmb = i+dz; Mrb = i+dz+dy
		
		Blt = i+1-dz-dy; Bmt = i+1-dz; Brt = i+1-dz+dy
		Blc = i+1-dy; Bmc = i+1; Brc = i+1+dy
		Blb = i+1+dz-dy; Bmb = i+1+dz; Brb = i+1+dz+dy
		
		// Additions for up/down/left/right/front/back border "faces"
		let add = NaN // if torus is false, return NaN for all neighbors that cross
		// the border.
		
		// back border
		if( i < dz ){
			if( torus ){
				add = fsy*dz
			}
			Ult += add; Umt += add; Urt += add 
			Mlt += add; Mmt += add; Mrt += add
			Blt += add; Bmt += add; Brt += add
		}
		
		// front border
		if( i >= dz*( fsy-1 ) ){
			if( torus ){
				add = -fsy*dz
			}
			Ulb += add; Umb += add; Urb += add
			Mlb += add; Mmb += add; Mrb += add
			Blb += add; Bmb += add; Brb += add		
		}
		
		// left border
		if( i%dz < dy ){
			if( torus ){
				add = fsx*dy
			}
			Ult += add; Ulc += add; Ulb += add
			Mlt += add; Mlc += add; Mlb += add
			Blt += add; Blc += add; Blb += add
		}
		
		// right border
		if( i%dz >= dy*( fsx-1 ) ){
			if( torus ){
				add = -fsx*dy
			}
			Urt += add; Urc += add; Urb += add
			Mrt += add; Mrc += add; Mrb += add
			Brt += add; Brc += add; Brb += add
		}
		
		// upper border
		if( ( i%dz )%dy == 0 ){
			if( torus ){
				add = fsz
			}
			Ult += add; Umt += add; Urt += add
			Ulc += add; Umc += add;	Urc += add
			Ulb += add; Umb += add; Urb += add
		}
		
		// down border
		if( ( i%dz )%dy == (fsz-1) ){
			if( torus ){
				add = -fsz
			}
			Blt += add; Bmt += add; Brt += add
			Blc += add; Bmc += add; Brc += add
			Blb += add; Bmb += add; Brb += add
		}
		
		return [
			Ult, Ulc, Ulb,
			Umt, Umc, Umb,
			Urt, Urc, Urb,
			
			Mlt, Mlc, Mlb,
			Mmt, Mmb,
			Mrt, Mrc, Mrb,
			
			Blt, Blc, Blb,
			Bmt, Bmc, Bmb,
			Brt, Brc, Brb		
		
		]
	}
}

export default Grid3D 
