/** This base class defines a general grid and provides grid methods that do not depend on
the coordinate system used. This class is never used on its own, as it does not yet 
contain methods for neighborhood computation etc (which depend on the coordinate system). 
Coordinate system-dependent methods are implemented in extensions
of the Grid class, for example Grid2D and Grid3D. */
class Grid {

	/** The grid constructor.
	@param {GridSize} field_size array of field size in each dimension. E.g. [100,200] for
	a grid that is 100 pixels wide and 200 pixels high. Entries must be positive integer
	numbers.
	@param {boolean} [torus=true] - should the borders of the grid be linked, so that a cell moving
	out on the left reappears on the right? */
	constructor( field_size, torus = true ){
		/** field_size array of field size in each dimension. E.g. [100,200] for
		a grid that is 100 pixels wide and 200 pixels high. Entries must be positive integer
		numbers.
		@type {GridSize}*/
		this.extents = field_size
		
		/** Should the borders of the grid be linked, so that a cell moving
		out on the left reappears on the right? 
		@type {boolean}*/
		this.torus = torus
		
		
		/* These are used for rapid conversion between array and index coordinates,
		but not documented as they should not be used from outside.*/
		/** @ignore */
		this.X_BITS = 1+Math.floor( Math.log2( this.extents[0] - 1 ) )
		/** @ignore */
		this.Y_BITS = 1+Math.floor( Math.log2( this.extents[1] - 1 ) )
		/** @ignore */
		this.Y_MASK = (1 << this.Y_BITS)-1
		
		/** Array coordinates to the middle pixel on the grid.
		@type {ArrayCoordinate}
		*/
		this.midpoint = this.extents.map( i => Math.round((i-1)/2) )
	}

	/** The neigh method returns the neighborhood of a pixel p.
	This function uses array coordinates as input and output arguments, but
	internally calls a method 'neighi' which computes neighborhoods using
	index-coordinates. Since neighbordhoods depend on the coordinate system,
	the 'neighi' method is defined in the extension class for that specific coordinate system.
	@param {ArrayCoordinate} p array coordinates of a specific pixel
	@param {boolean} torus are borders of the grid linked so that a cell leaving on the
	right re-enters the grid on the left?
	@return {ArrayCoordinate[]} an array of neighbors of pixel p, where each element contains the array
	coordinates of the neighbor in question.*/
	neigh(p, torus = this.torus){
		let g = this
		return g.neighi( this.p2i(p), torus ).map( function(i){ return g.i2p(i) } )
	}

	/** The setpix method changes the value of a pixel p on the grid to t.
	@param {ArrayCoordinate} p array coordinates of the pixel to change the value of
	@param {number} t the value to assign to this pixel. This can be integers or 
	floating point numbers, depending on the grid subclass used (see eg Grid2D).
	This method acts on the private array this._pixels, which must be defined
	in the grid subclass.*/
	setpix( p, t ){
		this._pixels[this.p2i(p)] = t
	}

	/** The setpixi method changes the value of a pixel i on the grid to t.
	@param {IndexCoordinate} i index coordinates of the pixel to change the value of
	@param {number} t the value to assign to this pixel. This can be integers or 
	floating point numbers, depending on the grid subclass used (see eg Grid2D).
	This method acts on the private array this._pixels, which must be defined
	in the grid subclass.*/
	setpixi( i, t ){
		this._pixels[i] = t
	}

	/** The pixt method finds the current value of a pixel p on the grid.
	@param {ArrayCoordinate} p array coordinates of the pixel to find the value of
	@return {number} t the value of p on the grid. This can be integers or 
	floating point numbers, depending on the grid subclass used (see eg Grid2D).
	This method acts on the private array this._pixels, which must be defined
	in the grid subclass.*/
	pixt( p ){
		return this._pixels[this.p2i(p)]
	}

	/** The pixti method finds the current value of a pixel i on the grid.
	@param {IndexCoordinate} i index coordinates of the pixel to find the value of
	@return {number} t the value of i on the grid. This can be integers or 
	floating point numbers, depending on the grid subclass used (see eg Grid2D).
	This method acts on the private array this._pixels, which must be defined
	in the grid subclass.*/
	pixti( i ){
		return this._pixels[i]
	}

	/** A pixel on the grid.
	@typedef {Object[]} Pixel
	@property {ArrayCoordinate} Pixel[0] - pixel coordinate
	@property {number} Pixel[1] - pixel value
	*/
	
	/** A pixel on the grid.
	@typedef {Object[]} iPixel
	@property {IndexCoordinate} Pixel[0] - pixel coordinate
	@property {number} Pixel[1] - pixel value
	*/

	/** This iterator returns locations and values of all non-zero pixels.

		This method isn't actually called because the subclasses implement
		it themselves due to efficiency reasons. It serves as a template to
		document the functionality. 
		@return {Pixel} for each pixel, return an array [p,v] where p are
		the pixel's array coordinates on the grid, and v its value.*/
	* pixels() {
		for( let i of this.pixelsi() ){
			if( this._pixels[i] > 0 ){
				yield [this.i2p(i),this._pixels[i]] 
			}
		}
	}

	/** This iterator returns locations and values of all non-zero pixels.

		This method isn't actually called because the subclasses implement
		it themselves due to efficiency reasons. It serves as a template to
		document the functionality. 
		@abstrac
		@return {undefined} for each pixel, because this method should be implemented
		in a grid subclass.*/
	* pixelsi() {
		//throw("Iterator 'pixelsi' not implemented!")
		yield undefined
	}

	/** This method pre-allocates an array of the correct datatype to make
	a copy of the current pixel values. Values are not actually copied yet.
	@return {Uint16Array|Float32Array} an array with an element for each pixel.
	The datatype is determined by the datatype of this._pixels (implemented in the
	subclass), which can be either Uint16Array or Float32Array.*/
	pixelsbuffer() {
	
		/** For storing a copy of all pixel values; eg for synchronous updating of some
		sort.
		@type {Uint16Array|Float32Array}*/
		this._pixelsbuffer = []
	
		if( this._pixels instanceof Uint16Array ){
			this._pixelsbuffer = new Uint16Array(this._pixels.length)
		} else if( this._pixels instanceof Float32Array ){
			this._pixelsbuffer = new Float32Array(this._pixels.length)
		} else {
			throw("unsupported datatype: " + (typeof this._pixels))
		}
	}

	/** Template method to compute the gradient at location i on the grid
	(location given in index coordinates).
	This method throws an error, which is overwritten when a subclass 
	implements a gradienti method.
	@param {IndexCoordinate} i index coordinate of a pixel to compute the gradient at. 
	@see https://en.wikipedia.org/wiki/Gradient*/
	gradienti( i ){
		throw("method 'gradienti' not implemented! "+i)
	}

	/** Method to compute the gradient at location p on the grid
	(location given in array coordinates). It internally calls the gradienti
	method using index coordinates, which should be implemented in the grid
	subclass.
	@param {ArrayCoordinate} p array coordinates of a pixel p to compute the gradient at
	@return {number} the gradient at position p.
	@see https://en.wikipedia.org/wiki/Gradient*/
	gradient( p ){
		return this.gradienti( this.p2i( p ) )
	}

	/** Method to compute the laplacian at location p on the grid
	(location given in array coordinates). It internally calls the laplaciani
	method that does the same but uses index coordinates.
	@param {ArrayCoordinate} p array coordinates of a pixel p to compute the laplacian at
	@return {number} the laplacian at position p.
	@see https://en.wikipedia.org/wiki/Laplace_operator#Coordinate_expressions */
	laplacian( p ){
		return this.laplaciani( this.p2i( p ) )
	}

	/** Method to compute the laplacian at location i on the grid
	(location given in index coordinates). It internally uses the 
	neighNeumanni method to compute a Neumann neighborhood, which should
	be implemented in the grid subclass.
	@param {IndexCoordinate} i index coordinates of a pixel to compute the laplacian at
	@return {number} the laplacian at position p.
	@see https://en.wikipedia.org/wiki/Laplace_operator#Coordinate_expressions */
	laplaciani( i ){
		let L = 0, n = 0
		for( let x of this.neighNeumanni(i) ){
			L += this.pixti( x ); n ++
		} 
		return L - n * this.pixti( i )
	}

	/** Perform a diffusion step on the grid, updating the values of all pixels 
	according to Fick's second law of diffusion.
	@param {number} D diffusion coefficient 
	@see https://en.wikipedia.org/wiki/Diffusion#Fick's_law_and_equations
	@see https://en.wikipedia.org/wiki/Discrete_Laplace_operator#Mesh_Laplacians
	*/
	diffusion( D ){
		// For synchronous updating of the grid: compute updated values in a copy
		// of the current pixels
		if( ! this._pixelsbuffer ) this.pixelsbuffer()
		for( let i of this.pixelsi() ){
			// Diffusion: new value is current value + change.
			// the change is given by the diffusion coefficient D times the laplacian.
			this._pixelsbuffer[i] = this.pixti( i ) + D * this.laplaciani( i )
		}
		// swap the copy and the original
		[this._pixelsbuffer, this._pixels] = [this._pixels, this._pixelsbuffer]
	}

	
	/**
	 Function that updates a gridpoint depending on its current value and that of its
	 neighbors.
	 @typedef {function} updatePixelFunction
	 @param {ArrayCoordinate} p - pixel to update
	 @param {ArrayCoordinate[]} neighbors - coordinates of neighbors of p
	 @return {number} value - the updated value, based on the current value of p and
	 its neighbors.
	 */

	/** Apply a function to all pixel values on the grid. It acts on this._pixels,
	which is implemented in the grid subclass.
	@param {updatePixelFunction} f - the function to apply to each pixel. */
	applyLocally( f ){
		if( ! this._pixelsbuffer ) this.pixelsbuffer()
		for( let i of this.pixelsi() ){
			let p = this.i2p(i)
			this._pixelsbuffer[i] = f( p, this.neigh(p) ) 
		}
		[this._pixelsbuffer, this._pixels] = [this._pixels, this._pixelsbuffer]		
	}
	
	/** Multiply all pixel values on the grid with a constant factor r. 
	This method acts on this._pixels, which is implemented in the grid subclass.
	@param {number} r the multiplication factor. */
	multiplyBy( r ){
		for( let i of this.pixelsi() ){
			this._pixels[i] *= r 
		}
	}

}

export default Grid
