import Grid2D from "./Grid2D.js"

/** A class containing (mostly static) utility functions for dealing with 2D
 *  hexagonal grids. Extends the Grid2D class but implements functions specific
 *  to the 2D hexagonal grid (such as neighborhoods).
 *
 */

class HexGrid2D extends Grid2D {

	/** Constructor of the HexGrid2D object.
	 * @param {GridSize} extents - the size of the grid in each dimension
	 * @param {boolean[]} [torus=[true,true]] - should the borders of the grid
	 * be linked, so that a cell moving out on the left reappears on the right?
	 * Should be an array specifying whether the torus holds in each dimension;
	 * eg [true,false] for a torus in x but not y dimension.
	 * @param {string} [datatype="Uint16"] - What datatype are the values
	 * associated with each pixel on the grid? Choose from "Uint16" or
	 * "Float32". */
	constructor( extents, torus=[true,true], datatype="Uint16" ){
		super( extents, torus, datatype )
	}

	/**	Iterator yielding the {@link IndexCoordinate}s of neighbor
	 * pixels of the pixel at coordinate i. This function takes the 2D
	 * neighborhood, excluding the pixel itself. Note that for a hexagonal
	 * grid, the neighNeumanni and neighi methods (which normally represent
	 * the Neumann and Moore neighborhoods, respectively) are equivalent.
	 * @param {IndexCoordinate} i - location of the pixel to get neighbors of.
	 * @param {boolean[]} [torus=[true,true]] - does the grid have linked
	 * borders? Defaults to the setting on this grid, see {@link torus}
	 * @return {IndexCoordinate[]} - yield one by one the coordinates for all the
	 * neighbors of i.
	 */
	* neighNeumanni( i, torus = this.torus ){

		let nbh = this.neighi( i, torus )
		for( let n of nbh ){
			yield n
		}

	}
	/**	Return array of {@link IndexCoordinate}s of neighbor
	 * pixels of the pixel at coordinate i. This function takes the 2D
	 * neighborhood, excluding the pixel itself. Note that for a hexagonal
	 * grid, the neighNeumanni and neighi methods (which normally represent
	 * the Neumann and Moore neighborhoods, respectively) are equivalent.
	 * @param {IndexCoordinate} i - location of the pixel to get neighbors of.
	 * @param {boolean[]} [torus=[true,true]] - does the grid have linked
	 * borders? Defaults to the setting on this grid, see {@link torus}
	 * @return {IndexCoordinate[]} - an array of coordinates for all the
	 * neighbors of i.
	 */
	neighi( i, torus = this.torus ){

		let p = this.i2p(i)

		// normal computation of neighbor indices top and bottom
		let t = [p[0],p[1]-1], b = [p[0],p[1]+1]

		// in the other dimension, it depends on whether the first
		// coordinate is even or odd
		let rowShift = 0
		if( p[0] % 2 !== 0 ){
			rowShift = -1
		}
		// neighbors left top, left bottom, right top, right bottom
		let lt = [ p[0]-1, p[1]+rowShift ], lb = [ p[0]-1, p[1]+1+rowShift ],
			rt = [ p[0]+1, p[1]+rowShift ], rb = [ p[0]+1, p[1]+1+rowShift ]

		let nbh = [ lt, lb, rt, rb, t, b ]
		let nbhFiltered = []


		for( let n of nbh ){

			// if pixel is part of one of the borders, adjust the
			// indices accordingly
			// if torus is false, don't return any neighbors that cross
			// the border.

			// left border
			if( n[0] < 0 ){
				if( torus[0] ){
					n[0] += this.extents[0]
				} else {
					continue
				}
			}

			// right border
			if( n[0] >= this.extents[0] ){
				if( torus[0] ){
					n[0] -= this.extents[0]
				} else {
					continue
				}
			}

			// top border
			if( n[1] < 0 ){
				if( torus[1] ){
					n[1] += this.extents[1]
				} else {
					continue
				}
			}

			// bottom border
			if( n[1] >= this.extents[1] ) {
				if (torus[1]) {
					n[1] -= this.extents[1]
				} else {
					continue
				}
			}

			nbhFiltered.push( this.p2i( n ) )

		}


		return nbhFiltered
	}
}

export default HexGrid2D
