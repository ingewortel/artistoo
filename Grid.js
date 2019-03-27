
class Grid {
	constructor( field_size, torus = true ){
		this.extents = field_size
		this.torus = torus
		this.X_BITS = 1+Math.floor( Math.log2( this.extents[0] - 1 ) )
		this.Y_BITS = 1+Math.floor( Math.log2( this.extents[1] - 1 ) )
		this.midpoint = this.extents.map( i => Math.round((i-1)/2) )
		this.Y_MASK = (1 << this.Y_BITS)-1
		this.dy = 1 << this.Y_BITS // for neighborhoods based on pixel index
	}

	setpix( p, t ){
		this._pixels[this.p2i(p)] = t
	}
	setpixi( i, t ){
		this._pixels[i] = t
	}

	pixt( p ){
		return this._pixels[this.p2i(p)]
	}

	pixti( i ){
		return this._pixels[i]
	}

	* pixels() {
		for( let i = 0 ; i < this._pixels.length ; i ++ ){
			if( this._pixels[i] != 0 ){
				yield [this.i2p(i),this._pixels[i]]
			}
		}
	}
}

export default Grid
