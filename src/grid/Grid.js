
class Grid {
	constructor( field_size, torus = true ){
		this.extents = field_size
		this.torus = torus
		this.X_BITS = 1+Math.floor( Math.log2( this.extents[0] - 1 ) )
		this.Y_BITS = 1+Math.floor( Math.log2( this.extents[1] - 1 ) )
		this.Y_MASK = (1 << this.Y_BITS)-1
		this.midpoint = this.extents.map( i => Math.round((i-1)/2) )
	}

	neigh(p, torus = this.torus){
		let g = this
		return g.neighi( this.p2i(p), torus ).map( function(i){ return g.i2p(i) } )
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

	/* Return locations of all non-zero pixels.

		This method isn't actually called because the subclasses implement
		it themselves due to efficiency reasons. It serves as a template to
		document the functionality. */
	* pixels() {
		for( let i of this.pixelsi() ){
			if( this._pixels[i] > 0 ){
				yield [this.i2p(i),this._pixels[i]] 
			}
		}
	}

	* pixelsi() {
		//throw("Iterator 'pixelsi' not implemented!")
		yield undefined
	}

	pixelsbuffer() {
		if( this._pixels instanceof Uint16Array ){
			this._pixelsbuffer = new Uint16Array(this._pixels.length)
		} else if( this._pixels instanceof Float32Array ){
			this._pixelsbuffer = new Float32Array(this._pixels.length)
		} else {
			throw("unsupported datatype: " + (typeof this._pixels))
		}
	}

	gradienti( i ){
		throw("method 'gradienti' not implemented! "+i)
	}

	gradient( p ){
		return this.gradienti( this.p2i( p ) )
	}

	laplacian( p ){
		return this.laplaciani( this.p2i( p ) )
	}

	laplaciani( i ){
		let L = 0, n = 0
		for( let x of this.neighNeumanni(i) ){
			L += this.pixti( x ); n ++
		} 
		return L - n * this.pixti( i )
	}

	diffusion( D ){
		if( ! this._pixelsbuffer ) this.pixelsbuffer()
		for( let i of this.pixelsi() ){
			this._pixelsbuffer[i] = this.pixti( i ) + D * this.laplaciani( i )
		}
		[this._pixelsbuffer, this._pixels] = [this._pixels, this._pixelsbuffer]
	}

	applyLocally( f ){
		if( ! this._pixelsbuffer ) this.pixelsbuffer()
		for( let i of this.pixelsi() ){
			let p = this.i2p(i)
			this._pixelsbuffer[i] = f( p, this.neigh(p) ) 
		}
		[this._pixelsbuffer, this._pixels] = [this._pixels, this._pixelsbuffer]		
	}

	multiplyBy( r ){
		for( let i of this.pixelsi() ){
			this._pixels[i] *= r 
		}
	}

}

export default Grid
