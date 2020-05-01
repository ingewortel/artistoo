import Grid from "./Grid.js"

/** A class containing (mostly static) utility functions for dealing with 3D
 * 	grids. Extends the Grid class but implements functions specific to the 3D
 * 	grid (such as neighborhoods).
 *
 * @example <caption>Neighborhoods on a 3D grid</caption>
 *
 * let CPM = require("path/to/build")
 *
 * // Make a grid with a torus, and find the neighborhood of the upper left pixel [0,0,0]
 * let grid = new CPM.Grid3D( [100,100,100], [true,true,true] )
 * console.log( grid.neigh( [0,0,0] ) ) // returns coordinates of 26 neighbors (9+8+9)
 *
 * // Now try a grid without torus; the corner now has fewer neighbors.
 * let grid2 = new CPM.Grid3D( [100,100,100], [false,false,false] )
 * console.log( grid2.neigh( [0,0,0] ) ) // returns only 7 neighbors
 *
 * // Or try a torus in one dimension
 * let grid2 = new CPM.Grid3D( [100,100,100], [true,false,false] )
 * console.log( grid2.neigh( [0,0,0] ) )
 */
class Grid3D extends Grid {

	/** Constructor of the Grid3D object.
	 * @param {GridSize} extents - the size of the grid in each dimension
	 * @param {boolean[]} [torus = [true,true,true]] - should the borders of
	 * the grid be linked, so that a cell moving out on the left reappears on
	 * the right?
	 * Warning: setting the torus to false can give artifacts if not done
	 * properly, see {@link Grid#torus}.*/
	constructor( extents, torus = [true,true,true] ){
		super( extents, torus )
		// Check that the grid size is not too big to store pixel ID in 32-bit number,
		// and allow fast conversion of coordinates to unique ID numbers.
		/** @ignore */
		this.Z_BITS = 1+Math.floor( Math.log2( this.extents[2] - 1 ) )
		if( this.X_BITS + this.Y_BITS + this.Z_BITS > 32 ){
			throw("Field size too large -- field cannot be represented as 32-bit number")
		}
		/** @ignore */
		this.Z_MASK = (1 << this.Z_BITS)-1
		/** @ignore */
		this.Z_STEP = 1
		/** @ignore */
		this.Y_STEP = 1 << (this.Z_BITS)
		/** @ignore */
		this.X_STEP = 1 << (this.Z_BITS +this.Y_BITS)
		/** Array with values for each pixel stored at the position of its
		 * {@link IndexCoordinate}. E.g. the value of pixel with coordinate i
		 * is stored as this._pixelArray[i].
		 * 	Note that this array is accessed indirectly via the
		 * {@link _pixels} set- and get methods.
		 * @private
		 * @type {Uint16Array} */
		this._pixelArray = new Uint16Array(this.p2i(extents))
		this.datatype = "Uint16"
	}
	/** Method for conversion from an {@link ArrayCoordinate} to an
	 * {@link IndexCoordinate}.
	 *
	 * See also {@link Grid3D#i2p} for the backward conversion.
	 *
	 * @param {ArrayCoordinate} p - the coordinate of the pixel to convert
	 * @return {IndexCoordinate} the converted coordinate.
	 *
	 * @example
	 * let grid = new CPM.Grid3D( [100,100,100], [true,true,true] )
	 * let p = grid.i2p( 5 )
	 * console.log( p )
	 * console.log( grid.p2i( p ))
	 */
	p2i( p ){
		return ( p[0] << ( this.Z_BITS + this.Y_BITS ) ) + 
			( p[1] << this.Z_BITS ) + 
			p[2]
	}
	/** Method for conversion from an {@link IndexCoordinate} to an
	 * {@link ArrayCoordinate}.
	 *
	 * See also {@link Grid3D#p2i} for the backward conversion.
	 *
	 * @param {IndexCoordinate} i - the coordinate of the pixel to convert
	 * @return {ArrayCoordinate} the converted coordinate.
	 *
	 * @example
	 * let grid = new CPM.Grid3D( [100,100,100], [true,true,true] )
	 * let p = grid.i2p( 5 )
	 * console.log( p )
	 * console.log( grid.p2i( p ))
	 */
	i2p( i ){
		return [i >> (this.Y_BITS + this.Z_BITS), 
			( i >> this.Z_BITS ) & this.Y_MASK, i & this.Z_MASK ]
	}
	
	/** This iterator returns locations and values of all non-zero pixels.
	 * Whereas the {@link pixels} generator yields only non-background pixels
	 * and specifies both their {@link ArrayCoordinate} and value, this
	 * generator yields all pixels by {@link IndexCoordinate} and does not
	 * report value.
	 *
	 * @return {IndexCoordinate} for each pixel, return its
	 * {@link IndexCoordinate}.
	 *
	 *
	 * @example
	 * let CPM = require( "path/to/build" )
	 * // make a grid and set some values
	 * let grid = new CPM.Grid3D( [100,100,100], [true,true,true] )
	 * grid.setpixi( 0, 1 )
	 * grid.setpixi( 1, 5 )
	 *
	 * // iterator
	 * for( let i of grid.pixelsi() ){
	 * 	console.log( i )
	 * }
	 */
	* pixelsi() {
		let ii = 0, c = 0
		for( let i = 0 ; i < this.extents[0] ; i ++ ){
			let d = 0
			for( let j = 0 ; j < this.extents[1] ; j ++ ){
				for( let k = 0 ; k < this.extents[2] ; k ++ ){
					yield ii
					ii++
				}
				d += this.Y_STEP
				ii = c + d
			}
			c += this.X_STEP
			ii = c
		}
	}

	/** This iterator returns locations and values of all non-zero pixels.
	 * @return {Pixel} for each pixel, return an array [p,v] where p are
	 * the pixel's array coordinates on the grid, and v its value.
	 *
	 * @example
	 * let CPM = require( "path/to/build" )
	 * // make a grid and set some values
	 * let grid = new CPM.Grid3D( [100,100,100], [true,true,true] )
	 * grid.setpix( [0,0,0], 1 )
	 * grid.setpix( [0,0,1], 5 )
	 *
	 * // iterator
	 * for( let p of grid.pixels() ){
	 * 	console.log( p )
	 * }
	 */
	* pixels() {
		let ii = 0, c = 0
		for( let i = 0 ; i < this.extents[0] ; i ++ ){
			let d = 0
			for( let j = 0 ; j < this.extents[1] ; j ++ ){
				for( let k = 0 ; k < this.extents[2] ; k ++ ){
					//noinspection JSUnresolvedVariable
					let pixels = this._pixels
					if( pixels[ii] > 0 ){
						yield [[i,j,k], pixels[ii]]
					}
					ii++
				}
				d += this.Y_STEP
				ii = c + d
			}
			c += this.X_STEP
			ii = c
		}
	}

	/**	Return array of {@link IndexCoordinate} of the Moore neighbor pixels
	 * of the pixel at coordinate i. This function takes the 3D equivalent of
	 * the 2D Moore-8 neighborhood, excluding the pixel itself.
	 * @see https://en.wikipedia.org/wiki/Moore_neighborhood
	 * @param {IndexCoordinate} i - location of the pixel to get neighbors of.
	 * @param {boolean[]} [torus=[true,true,true]] - does the grid have linked
	 * borders? Defaults to the setting on this grid, see {@link torus}
	 * @return {IndexCoordinate[]} - an array of coordinates for all the
	 * neighbors of i.
	*/
	neighi( i, torus = this.torus ){
		let p = this.i2p(i)

		let xx = []
		for( let d = 0 ; d <= 2 ; d ++ ){
			if( p[d] === 0 ){
				if( torus[d] ){
					xx[d] = [p[d],this.extents[d]-1,p[d]+1]
				} else {
					xx[d] = [p[d],p[d]+1]
				}
			} else if( p[d] === this.extents[d]-1 ){
				if( torus[d] ){
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
