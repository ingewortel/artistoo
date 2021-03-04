/** This base class defines a general grid and provides grid methods that do
 * not depend on the coordinate system used. This class is never used on its
 * own, as it does not yet contain methods for neighborhood computation etc
 * (which depend on the coordinate system).
 * Coordinate system-dependent methods are implemented in extensions of the
 * Grid class, for example Grid2D and Grid3D. */
class Grid {

	/** The grid constructor.
	 * @param {GridSize} field_size array of field size in each dimension.
	 * E.g. [100,200] for a grid that is 100 pixels wide and 200 pixels high.
	 * Entries must be positive integer numbers.
	 * @param {boolean[]} [torus=[true,true,...]] - should the borders of the
	 * grid be linked, so that a cell moving out on the left reappears on the
	 * right? Should be an array specifying whether the torus holds in each
	 * dimension; eg [true,false] for a torus in x but not y dimension.
	 * Warning: setting the torus to false can give artifacts if not done
	 * properly, see {@link Grid#torus}.*/
	constructor( field_size, torus ){
	
		torus = torus || []
	
		/** field_size array of field size in each dimension. E.g. [100,200]
		 * for a grid that is 100 pixels wide and 200 pixels high. Entries must
		 * be positive integer numbers.
		 * @type {GridSize}*/
		this.extents = field_size
		
		/** Number of dimensions of the grid.
		 * @type {number}*/
		this.ndim = this.extents.length
		
		
		if( torus.length === 0 ){
			for( let d = 0; d < this.ndim; d++ ){
				torus.push( true )
			}
		} else if ( torus.length !== this.ndim ){
			throw( "Torus should be specified for each dimension, or not " +
				"at all!" )
		}
		/** Should the borders of the grid be linked, so that a cell moving
		 * out on the left reappears on the right? Warning: setting to false
		 * can give artifacts if done incorrectly. If torus is set to false,
		 * artifacts arise because
		 * cells at the border have fewer neighbors. Cells will then stick to
		 * the grid borders where they have fewer neighbors to get adhesion and/or
		 * perimeter penalties from. You will need to specify how to handle the
		 * borders explicitly; see the examples/ folder for details on how to
		 * do this.
		 * Torus can be specified for
		 * each dimension separately.
		 * @type {boolean[]}*/
		this.torus = torus

		/** Array with values for each pixel stored at the position of its
		 * 	{@link IndexCoordinate}. E.g. the value of pixel with coordinate
		 * 	i is stored as this._pixels[i]. This should be implemented in
		 * 	the grid subclass; see e.g. {@link Grid2D#_pixelArray}.
		 * 	Note that this array is accessed indirectly via the
		 * {@link _pixels} set- and get methods.
		 * 	@private
		 * 	*/
		this._pixelArray = undefined
		this.datatype = undefined
		
		/* These are used for rapid conversion between array and index
		coordinates, but not documented as they should not be used from outside.
		*/
		/** @ignore */
		this.X_BITS = 1+Math.floor( Math.log2( this.extents[0] - 1 ) )
		/** @ignore */
		this.Y_BITS = 1+Math.floor( Math.log2( this.extents[1] - 1 ) )
		/** @ignore */
		this.Y_MASK = (1 << this.Y_BITS)-1
		
		/** Array coordinates to the middle pixel on the grid.
		 * @type {ArrayCoordinate}
		 * */
		this.midpoint = this.extents.map( i => Math.round((i-1)/2) )
	}

	/**
	 * Return the array this._pixelArray, which should be set in the grid
	 * subclass.
	 * @returns {Uint16Array|Float32Array}
	 * @private
	 */
	get _pixels(){
		if ( this._pixelArray !== undefined ){
			return this._pixelArray
		}
		throw("A private array this._pixelArray needs to be generated in every " +
			" Grid subclass! See its documentation for details.")
	}

	/**
	 * Set or update the private this._pixelArray.
	 * @param {Uint16Array|Float32Array} pixels - array of pixels to set.
	 * @private
	 */
	set _pixels( pixels ){
		//noinspection JSValidateTypes
		this._pixelArray = pixels
	}

	/** Method to check if a given {@link ArrayCoordinate} falls within the
	 * bounds of this grid. Returns an error if this is not the case.
	 * @param {ArrayCoordinate} p - the coordinate to check.
	 */
	checkOnGrid( p ){
		for( let d = 0; d < p.length; d++ ){
			if( p[d] < 0 || p[d] >= this.extents[d] ){
				throw("You are trying to access a coordinate that does not seem" +
					"to lie on the grid! I am expecting values between 0 and " +
					"the grid dimension specified in field_size. (If this is your" +
					"own grid implementation and this assumption is not valid," +
					"please overwrite the liesOnGrid() function in your own" +
					"grid class).")
			}
		}
	}
	
	
	/** Method to correct an {@link ArrayCoordinate} outside the grid dimensions when
	 * the grid is wrapped (torus = true). If the coordinate falls inside the grid,
	 * it is returned unchanged. If it falls outside the grid and the grid is periodic
	 * in that dimension, a corrected coordinate is returned. If the pixel falls outside
	 * the grid which is not periodic in that dimension, the function returns
	 * 'undefined'.
	 * @param {ArrayCoordinate} p - the coordinate of the pixel to correct
	 * @return {ArrayCoordinate} the corrected coordinate.
	 */
	correctPosition( p ){
	
		let pnew = []
		let ignore = false // ignore pixels that fall off the grid when non-periodic grid
	
		// Loop over the x, y, (z) dimensions
		for( let d = 0; d < this.ndim; d++ ){
	
			// If position is outside the grid dimensions, action depends on whether
			// grid is periodic or not (torus)
			if( p[d] < 0 ){
				// If there is a torus in this dimension, correct the position and return.
				// otherwise just ignore it.
				if( this.torus[d] ){
					pnew.push( p[d] + this.extents[d] )
				} else {
					ignore = true
				}
			} else if ( p[d] >= this.extents[d] ){
				if( this.torus[d] ){
					pnew.push( p[d] - this.extents[d] )
				} else {
					ignore = true
				}
			} else {
				pnew.push( p[d] )
			}
		}
	
		if( !ignore ){ 
			return pnew
		} else {
			return undefined
		}
	
	}

	/** Method for conversion from an {@link ArrayCoordinate} to an
	 * {@link IndexCoordinate}.
	 * This method should be implemented in the subclass, see
	 * {@link Grid2D#p2i} for an example.
	 * @abstract
	 * @param {ArrayCoordinate} p - the coordinate of the pixel to convert
	 * @return {IndexCoordinate} the converted coordinate.
	 */
	//eslint-disable-next-line no-unused-vars
	p2i ( p ){
		throw( "A p2i method should be implemented in every Grid subclass!")
	}

	/** Method for conversion from an {@link IndexCoordinate} to an
	 * {@link ArrayCoordinate}.
	 * This method should be implemented in the subclass, see
	 * {@link Grid2D#i2p} for an example.
	 * @abstract
	 * @param {IndexCoordinate} i - the coordinate of the pixel to convert
	 * @return {ArrayCoordinate} the converted coordinate.
	 */
	//eslint-disable-next-line no-unused-vars
	i2p ( i ){
		throw( "An i2p method should be implemented in every Grid subclass!")
	}

	/** Method returning the (Moore) neighborhood of a pixel based on its
	 * {@link IndexCoordinate}.
	 * This method should be implemented in the subclass, see
	 * {@link Grid2D#neighi} for an example.
	 * @abstract
	 * @param {IndexCoordinate} i - the coordinate of the pixel to get neighbors
	 * for.
	 * @param {boolean[]} torus are borders of the grid linked so that a cell
	 * leaving on the right re-enters the grid on the left?
	 * @return {IndexCoordinate[]} an array of neighbors.
	 */
	//eslint-disable-next-line no-unused-vars
	neighi ( i, torus = this.torus ){
		throw( "A neighi method should be implemented in every Grid subclass!")
	}

	/** The neigh method returns the neighborhood of a pixel p. This function
	 * uses array coordinates as input and output arguments, but internally
	 * calls a method 'neighi' which computes neighborhoods using index-
	 * coordinates. Since neighborhoods depend on the coordinate system, the
	 * 'neighi' method is defined in the extension class for that specific
	 * coordinate system.
	 * @param {ArrayCoordinate} p array coordinates of a specific pixel
	 * @param {boolean[]} torus are borders of the grid linked so that a cell
	 * leaving on the right re-enters the grid on the left?
	 * @return {ArrayCoordinate[]} an array of neighbors of pixel p, where each
	 * element contains the array coordinates of the neighbor in question.
	 * */
	neigh(p, torus = this.torus){
		let g = this
		return g.neighi( this.p2i(p), torus ).map( function(i){
			return g.i2p(i)
		} )
	}

	/** Check if a value is valid on this type of grid.
	 * This function forbids trying to set forbidden (negative/float) values
	 * on an integer grid, which could cause bugs if the setpix(i) methods try
	 * to set such a value unnoticed.
	 * @private
	 * @param {number} t - the value that would be stored on the grid.
	 * @param {number} [tol=1e-6] - numeric tolerance for comparing a number
	 * with its rounded version, to check if it is integer (e.g. setting
	 * a value 1.5 on an integer grid would throw an error, but setting
	 * 1.000000000001 would not if the tolerance is 1e-6.
	 * @return {void} - return without problem or throw an error when an
	 * incorrect value is set.
	 * */
	_isValidValue ( t, tol = 1e-6 ) {
		if( this.datatype === "Uint16" ){
			if( t < 0 || Math.abs( t - Math.round(t) ) > tol  ){
				throw( "You cannot set a negative or floating point number to a Uint16 grid!" )
			}
		}
	}

	/** The setpix method changes the value of a pixel p on the grid to t.
	 * @param {ArrayCoordinate} p array coordinates of the pixel to change the
	 * value of
	 * @param {number} t the value to assign to this pixel. This can
	 * be integers or floating point numbers, depending on the grid subclass
	 * used (see eg Grid2D). */
	setpix( p, t ){
		this._isValidValue(t)
		this._pixels[this.p2i(p)] = t
	}

	/** The setpixi method changes the value of a pixel i on the grid to t.
	 * @param {IndexCoordinate} i index coordinates of the pixel to change the
	 * value of
	 * @param {number} t the value to assign to this pixel. This can be integers
	 * or floating point numbers, depending on the grid subclass used
	 * (see eg Grid2D).
	 * */
	setpixi( i, t ){
		this._isValidValue(t)
		this._pixels[i] = t
	}

	/** The pixt method finds the current value of a pixel p on the grid.
	 * @param {ArrayCoordinate} p array coordinates of the pixel to find the
	 * value of
	 * @return {number} t the value of p on the grid. This can be integers or
	 * floating point numbers, depending on the grid subclass used (see eg
	 * Grid2D).
	 */
	pixt( p ){
		return this._pixels[this.p2i(p)]
	}

	/** The pixti method finds the current value of a pixel i on the grid.
	 * @param {IndexCoordinate} i index coordinates of the pixel to find the
	 * value of
	 * @return {number} t the value of i on the grid. This can be integers or
	 * floating point numbers, depending on the grid subclass used (see eg
	 * Grid2D).
	*/
	pixti( i ){
		return this._pixels[i]
	}

	/** A pixel on the grid.
	 * @typedef {Object[]} Pixel
	 * @property {ArrayCoordinate} Pixel[0] - pixel coordinate
	 * @property {number} Pixel[1] - pixel value
	 * */
	
	/* /** A pixel on the grid.
	 * @typedef {Object[]} iPixel
	 * @property {IndexCoordinate} Pixel[0] - pixel coordinate
	 * @property {number} Pixel[1] - pixel value
	 * */

	/** This iterator returns locations and values of all non-zero pixels.
	 * This method isn't actually called because the subclasses implement
	 * it themselves due to efficiency reasons. It serves as a template to
	 * document the functionality.
	 * @abstract
	 * @return {Pixel} for each pixel, return an array [p,v] where p are
	 * the pixel's array coordinates on the grid, and v its value.*/
	//eslint-disable-next-line require-yield
	* pixels() {
		//noinspection JSValidateTypes
		throw("Iterator 'pixels' not implemented!")

		/*
		// example code:
		for( let i of this.pixelsi() ){
			if( this._pixels[i] > 0 ){
				yield [this.i2p(i),this._pixels[i]]
			}
		}*/
	}

	/** This iterator returns locations all pixels including background.
	 * This method isn't actually called because the subclasses implement
	 * it themselves due to efficiency reasons. It serves as a template to
	 * document the functionality.
	 * @abstract
	 * @return {IndexCoordinate} for each pixel, because this method should be
	 * implemented in a grid subclass.
	 * */
	//eslint-disable-next-line require-yield
	* pixelsi() {
		throw("Iterator 'pixelsi' not implemented!")
		//yield undefined
	}

	/** This method pre-allocates an array of the correct datatype to make
	 * a copy of the current pixel values. Values are not actually copied yet.
	 * @return {Uint16Array|Float32Array} an array with an element for each
	 * pixel. The datatype is determined by the datatype of this._pixels
	 * (implemented in the subclass), which can be either Uint16Array or
	 * Float32Array. */
	pixelsBuffer() {

		/** For storing a copy of all pixel values; eg for synchronous updating
		 * of some sort.
		 * @type {Uint16Array|Float32Array}*/
		this._pixelsbuffer = new Uint16Array(this._pixels.length)
	
		if( this._pixels instanceof Uint16Array ){
			this._pixelsbuffer = new Uint16Array(this._pixels.length)
		} else if( this._pixels instanceof Float32Array ){
			this._pixelsbuffer = new Float32Array(this._pixels.length)
		} else {
			throw("unsupported datatype: " + (typeof this._pixels))
		}
	}

	/** Template method to compute the gradient at location i on the grid
	 * (location given in index coordinates).
	 * This method throws an error, which is overwritten when a subclass
	 * implements a gradienti method.
	 * @param {IndexCoordinate} i index coordinate of a pixel to compute the
	 * gradient at.
	 * @return {number[]} the gradient
	 * @see https://en.wikipedia.org/wiki/Gradient*/
	//eslint-disable-next-line no-unused-vars
	gradienti( i ){
		throw("method 'gradienti' not implemented! ")
	}

	/** Method to compute the gradient at location p on the grid (location
	 * given in array coordinates). It internally calls the gradienti
	 * method using index coordinates, which should be implemented in the grid
	 * subclass.
	 * @param {ArrayCoordinate} p array coordinates of a pixel p to compute
	 * the gradient at
	 * @return {number} the gradient at position p.
	 * @see https://en.wikipedia.org/wiki/Gradient*/
	gradient( p ){
		//noinspection JSValidateTypes
		return this.gradienti( this.p2i( p ) )
	}

	/** Method to compute the laplacian at location p on the grid
	 * (location given in array coordinates). It internally calls the laplaciani
	 * method that does the same but uses index coordinates.
	 * @param {ArrayCoordinate} p array coordinates of a pixel p to compute the
	 * laplacian at
	 * @return {number} the laplacian at position p.
	 * @see https://en.wikipedia.org/wiki/Laplace_operator#Coordinate_expressions */
	laplacian( p ){
		return this.laplaciani( this.p2i( p ) )
	}

	/**
	 * A method to compute the Neumann neighborhood should be implemented in the
	 * Grid subclass if the laplacian (see below) is used.
	 * This mock function ensures that an error is thrown when there is no
	 * method called neighNeumanni in the grid subclass.
	 * @abstract
	 * @see https://en.wikipedia.org/wiki/Von_Neumann_neighborhood
	 * @param {IndexCoordinate} i - location of the pixel to get neighbors of.
	 * @param {boolean[]} [torus=[true,true]] - does the grid have linked
	 * borders? Defaults to the setting on this grid, see {@link torus}
	 * @return {IndexCoordinate[]} - an array of coordinates for all the neighbors of i.
	 */
	//eslint-disable-next-line no-unused-vars,require-yield
	* neighNeumanni ( i, torus = this.torus ){
		throw( "Trying to call the method neighNeumanni, but you haven't " +
			"implemented this method in the Grid subclass you are using!")
	}

	/** Method to compute the laplacian at location i on the grid (location
	 * given in index coordinates). It internally uses the neighNeumanni method
	 * to compute a Neumann neighborhood, which should be implemented in the
	 * grid subclass. It then uses the finite difference method (see link) with
	 * h = 1.
	 * @param {IndexCoordinate} i index coordinates of a pixel to compute the
	 * laplacian at
	 * @return {number} the laplacian at position p.
	 * @see https://en.wikipedia.org/wiki/Laplace_operator#Coordinate_expressions
	 * @see https://en.wikipedia.org/wiki/Discrete_Laplace_operator#Finite_differences
	 * */
	laplaciani( i ){
		let L = 0, n = 0

		// For now: forbid computing a laplacian on an integer grid as it makes
		// no sense and could happen by accident if you forget to specify the
		// datatype.
		// If this is too strict, we can set an option to overrule this error.
		// This way you still get to see it if you try this by accident.
		if( this.datatype === "Uint16" ){
			throw("Diffusion/laplacian methods do not work on a Uint16 grid! " +
				"Consider setting datatype='Float32'.")
		}

		//noinspection JSUnresolvedFunction
		for( let x of this.neighNeumanni(i) ){
			L += this.pixti( x ); n ++
		} 
		return L - n * this.pixti( i )
	}

	/** Perform a diffusion step on the grid, updating the values of all pixels
	 * according to Fick's second law of diffusion.
	 * @param {number} D diffusion coefficient
	 * @see https://en.wikipedia.org/wiki/Diffusion#Fick's_law_and_equations
	 * @see https://en.wikipedia.org/wiki/Discrete_Laplace_operator#Mesh_Laplacians
	 * */
	diffusion( D ){
		// For synchronous updating of the grid: compute updated values in a copy
		// of the current pixels
		if( ! this._pixelsbuffer ) this.pixelsBuffer()
		for( let i of this.pixelsi() ){
			// Diffusion: new value is current value + change.
			// the change is given by the diffusion coefficient D times the laplacian.
			this._pixelsbuffer[i] = this.pixti( i ) + D * this.laplaciani( i )
		}
		// swap the copy and the original
		[this._pixelsbuffer, this._pixels] = [this._pixels, this._pixelsbuffer]
	}

	
	/** Function that updates a gridpoint depending on its current value and
	 * that of its neighbors.
	 * @typedef {function} updatePixelFunction
	 * @param {ArrayCoordinate} p - pixel to update
	 * @param {ArrayCoordinate[]} neighbors - coordinates of neighbors of p
	 * @return {number} value - the updated value, based on the current value
	 * of p and its neighbors.
	 */

	/** Apply a function to all pixel values on the grid. It acts on
	 * this._pixels, which is implemented in the grid subclass.
	 * @param {updatePixelFunction} f - the function to apply to each pixel. */
	applyLocally( f ){
		if( ! this._pixelsbuffer ) this.pixelsBuffer()
		for( let i of this.pixelsi() ){
			let p = this.i2p(i)
			this._pixelsbuffer[i] = f( p, this.neigh(p) ) 
		}
		[this._pixelsbuffer, this._pixels] = [this._pixels, this._pixelsbuffer]
	}
	
	/** Multiply all pixel values on the grid with a constant factor r.
	 * This method acts on this._pixels, which is implemented in the grid
	 * subclass.
	 * @param {number} r the multiplication factor. */
	multiplyBy( r ){
		for( let i of this.pixelsi() ){
			this._pixels[i] *= r
		}
	}

}

export default Grid
