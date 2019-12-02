

import PixelsByCell from "../stats/PixelsByCell.js"
import Centroids from "../stats/Centroids.js"


/** This class contains methods that should be executed once per Monte Carlo Step.
 Examples are cell division, cell death etc.
 
 Methods are written for CPMs, but some of the methods may also apply to other
	models of class ({@link GridBasedModel}, e.g. the cell seeding methods) 
	or even a general grid ({@link Grid}, e.g. the {@link makePlane} and {@link changeKind} 
	methods).
	
 @example
 // Build CPM and attach a gridmanipulator 
 let C = new CPM.CPM( [100,100], {T:20, J:[[0,20],[20,10]]} )
 let gm = new CPM.GridManipulator( C )
 */
class GridManipulator {
	/** Constructor of class GridManipulator.
	@param {CPM|GridBasedModel|Grid} C - the model whose grid you wish to manipulate.
	Methods are written for CPMs, but some of the methods may also apply to other
	models of class ({@link GridBasedModel}, e.g. the cell seeding methods) 
	or even a general grid ({@link Grid}, e.g. the {@link makePlane} and {@link changeKind} 
	methods).
	*/
	constructor( C ){
		/** The model whose grid we are manipulating.
		@type {CPM|GridBasedModel|Grid}*/
		this.C = C
	}
	
	/** @experimental
	 */
	killCell( cellid ){
		let cp = this.C.getStat( PixelsByCell )
		let cpi = cp[cellid]
		
		for( let p of cpi ){
			this.C.setpixi( this.C.grid.p2i(p), 0 )
		}
		
		// update stats
		if( "PixelsByCell" in this.C.stat_values ){
			delete this.C.stat_values["PixelsByCell"][cellid]
		}
	}
	
	/** Seed a new cell at a random position. Return 0 if failed, ID of new cell otherwise.
	 * Try a specified number of times, then give up if grid is too full. 
	 * The first cell will always be seeded at the midpoint of the grid. 
	 
	 See also {@link seedCellAt} to seed a cell on a predefined position.
	 
	 @param {CellKind} kind - what kind of cell should be seeded? This determines the CPM
	 parameters that will be used for that cell.
	 @param {number} [max_attempts = 10000] - number of tries allowed. The method will
	 attempt to seed a cell at a random position, but this will fail if the position is 
	 already occupied. After max_attempts fails, it will not try again. This can happen
	 if the grid is very full.
	 @return {CellId} - the {@link CellId} of the newly seeded cell, or 0 if the seeding
	 has failed.
	 
	 @example
	 * // Build CPM and attach a gridmanipulator
	 * let C = new CPM.CPM( [100,100], {T:20, J:[[0,20],[20,10]]} )
	 * let gm = new CPM.GridManipulator( C )
	 *
	 * // Seed some cells
	 * gm.seedCell( 1 )
	 * gm.seedCell( 1 )
	 *
	 * // Check which pixels are nonzero. One is always the grid midpoint.
	 * for( let p of C.pixels() ){
	 * 	console.log( p )
	 * }
	 */
	seedCell( kind, max_attempts = 10000 ){
		let p = this.C.midpoint
		while( this.C.pixt( p ) != 0 && max_attempts-- > 0 ){
			for( let i = 0 ; i < p.length ; i ++ ){
				p[i] = this.C.ran(0,this.C.extents[i]-1)
			}
		}
		if( this.C.pixt(p) != 0 ){
			return 0 // failed
		}
		const newid = this.C.makeNewCellID( kind )
		this.C.setpix( p, newid )
		return newid
	}
	/**  Seed a new cell of celltype "kind" onto position "p".
		This succeeds regardless of whether there is already a cell there.
		
		See also {@link seedCell} to seed a cell on a random position.
		
		@param {CellKind} kind - what kind of cell should be seeded? This determines the CPM
		parameters that will be used for that cell.
		@param {ArrayCoordinate} p - position to seed the cell at. 
		@return {CellId} - the {@link CellId} of the newly seeded cell, or 0 if the seeding
		has failed.
		
	 @example
	 * // Build CPM and attach a gridmanipulator
	 * let C = new CPM.CPM( [100,100], {T:20, J:[[0,20],[20,10]]} )
	 * let gm = new CPM.GridManipulator( C )
	 *
	 * // Seed some cells
	 * gm.seedCellAt( 1, [2,4] )
	 * gm.seedCellAt( 1, [9,3] )
	 *
	 * // Check which pixels are nonzero. These should be the positions defined above.
	 * for( let p of C.pixels() ){
	 * 	console.log( p )
	 * }
	 */
	seedCellAt( kind, p ){
		const newid = this.C.makeNewCellID( kind )
		this.C.setpix( p, newid )
		return newid
	}
	
	/**  Seed "n" cells of celltype "kind" at random points lying within a circle 
		surrounding "center" with radius "radius". 
		
		See also {@link seedCell} to seed a cell on a random position in the entire grid,
		and {@link seedCellAt} to seed a cell at a specific position.
		
		@param {CellKind} kind - what kind of cell should be seeded? This determines the CPM
		parameters that will be used for that cell.
		@param {number} n - the number of cells to seed (must be integer).
		@param {ArrayCoordinate} center - position on the grid where the center of the
		circle should be.
		@param {number} radius - the radius of the circle to seed cells in.
		@param {number} max_attempts - the maximum number of attempts to seed a cell.
		Seeding can fail if the randomly chosen position is outside the circle, or if 
		there is already a cell there. After max_attempts the method will stop trying
		and throw an error.
		
	 @example
	 * // Build CPM and attach a gridmanipulator
	 * let C = new CPM.CPM( [100,100], {T:20, J:[[0,20],[20,10]]} )
	 * let gm = new CPM.GridManipulator( C )
	 *
	 * // Seed cells within a circle
	 * gm.seedCellsInCircle( 1, 10, [50,30], 20 )
	 *
	 * // Check which pixels are nonzero. These should be within the circle.
	 * for( let p of C.pixels() ){
	 * 	console.log( p )
	 * }
	 */
	seedCellsInCircle( kind, n, center, radius, max_attempts = 10000 ){
		if( !max_attempts ){
			max_attempts = 10*n
		}
		let C = this.C
		while( n > 0 ){
			if( --max_attempts == 0 ){
				throw("too many attempts to seed cells!")
			}
			let p = center.map( function(i){ return C.ran(Math.ceil(i-radius),Math.floor(i+radius)) } )
			let d = 0
			for( let i = 0 ; i < p.length ; i ++ ){
				d += (p[i]-center[i])*(p[i]-center[i])
			}
			if( d < radius*radius && this.C.pixt(p) == 0 ){
				this.seedCellAt( kind, p )
				n--
			}
		}
	}
	/** Helper method to set an entire plane or line of pixels to a certain CellId at once.
	The method takes an existing array of coordinates (which can be empty) and adds the pixels
	of the specified plane to it. See {@link changeKind} for a method that sets such a 
	pixel set to a new value.
	
	The plane is specified by fixing one coordinate (x,y,or z) to a fixed value, and
	letting the others range from their min value 0 to their max value.
	
	@param {ArrayCoordinate[]} voxels - Existing array of pixels; this can be empty [].
	@param {number} coord - the dimension to fix the coordinate of: 0 = x, 1 = y, 2 = z.
	@param {number} coordvalue - the value of the coordinate in the fixed dimension; location
	of the plane.
	@return {ArrayCoordinate[]} the updated array of pixels. 
	
	@example
	* let C = new CPM.CPM( [10,10], {T:20, J:[[0,20],[20,10]]} )
	* let gm = new CPM.GridManipulator( C )
	* let myline = gm.makePlane( [], 0, 2 )
	* gm.changeKind( myline, 1 )
	*/
	makePlane ( voxels, coord, coordvalue ){
		let x,y,z
		let minc = [0,0,0]
		let maxc = [0,0,0]
		for( let dim = 0; dim < this.C.ndim; dim++ ){
			maxc[dim] = this.C.extents[dim]-1
		}
		minc[coord] = coordvalue
		maxc[coord] = coordvalue

		// For every coordinate x,y,z, loop over all possible values from min to max.
		// one of these loops will have only one iteration because min = max = coordvalue.
		for( x = minc[0]; x <= maxc[0]; x++ ){
			for( y = minc[1]; y<=maxc[1]; y++ ){
				for( z = minc[2]; z<=maxc[2]; z++ ){
					if( this.C.ndim == 3 ){
						voxels.push( [x,y,z] )	
					} else {
						//console.log(x,y)
						voxels.push( [x,y] )
					}
				}
			}
		}

		return voxels
	}
	/** Helper method that converts all pixels in a given array to a specific cellkind:
	   changes the pixels defined by voxels (array of coordinates p) into
	   the given cellkind. 
	
	@param {ArrayCoordinate[]} voxels - Array of pixels to change.
	@param {CellKind} cellkind - cellkind to change these pixels into.
	   
	@example
	* let C = new CPM.CPM( [10,10], {T:20, J:[[0,20],[20,10]]} )
	* let gm = new CPM.GridManipulator( C )
	* let myline = gm.makePlane( [], 0, 2 )
	* gm.changeKind( myline, 1 )
	*/
	changeKind ( voxels, cellkind ){
		
		let newid = this.C.makeNewCellID( cellkind )
		for( let p of voxels ){
			this.C.setpix( p, newid )
		}
		
	}

	/** Let cell "id" divide by splitting it along a line perpendicular to
	 * its major axis. 
	 
	 @param {CellId} id - the id of the cell that needs to divide.
	 @return {CellId} the id of the newly generated daughter cell.
	   
		@example
		* let C = new CPM.CPM( [10,10], {
		* 	T:20, 
		*	J:[[0,20],[20,10]], 
		*	V:[0,200], 
		*	LAMBDA_V:[0,2] 
		* })
		* let gm = new CPM.GridManipulator( C )
		*
		* // Seed a single cell
		* gm.seedCell( 1 )
		* 
		* // Perform some Monte Carlo Steps before dividing the cell
		* for( let t = 0; t < 100; t++ ){
		* 	C.timeStep()
		* }
		* gm.divideCell( 1 )
		* 
		* // Check which pixels belong to which cell. Should be roughly half half.
		* C.getStat( PixelsByCell )
	 */
	divideCell( id ){
		let C = this.C
		let torus = C.conf.torus.indexOf(true) >= 0
		if( C.ndim != 2 || torus ){
			throw("The divideCell methods is only implemented for 2D non-torus lattices yet!")
		}
		let cp = C.getStat( PixelsByCell )[id], com = C.getStat( Centroids )[id]
		let bxx = 0, bxy = 0, byy=0, cx, cy, x2, y2, side, T, D, x0, y0, x1, y1, L2

		// Loop over the pixels belonging to this cell
		for( let j = 0 ; j < cp.length ; j ++ ){
			cx = cp[j][0] - com[0] // x position rel to centroid
			cy = cp[j][1] - com[1] // y position rel to centroid

			// sum of squared distances:
			bxx += cx*cx
			bxy += cx*cy
			byy += cy*cy
		}

		// This code computes a "dividing line", which is perpendicular to the longest
		// axis of the cell.
		if( bxy == 0 ){
			x0 = 0
			y0 = 0
			x1 = 1
			y1 = 0
		} else {
			T = bxx + byy
			D = bxx*byy - bxy*bxy
			//L1 = T/2 + Math.sqrt(T*T/4 - D)
			L2 = T/2 - Math.sqrt(T*T/4 - D)
			x0 = 0
			y0 = 0
			x1 = L2 - byy
			y1 = bxy
		}

		// create a new ID for the second cell
		let nid = C.makeNewCellID( C.cellKind( id ) )

		// Loop over the pixels belonging to this cell
		//let sidea = 0, sideb = 0
		//let pix_id = []
		//let pix_nid = []
		//let sidea = 0, sideb=0

		for( let j = 0 ; j < cp.length ; j ++ ){
			// coordinates of current cell relative to center of mass
			x2 = cp[j][0]-com[0]
			y2 = cp[j][1]-com[1]

			// Depending on which side of the dividing line this pixel is,
			// set it to the new type
			side = (x1 - x0)*(y2 - y0) - (x2 - x0)*(y1 - y0)
			if( side > 0 ){
				//sidea++
				C.setpix( cp[j], nid ) 
				// console.log( cp[j] + " " + C.cellKind( id ) )
				//pix_nid.push( cp[j] )
			} else {
				//pix_id.push( cp[j] )
				//sideb++

			}
		}
		//console.log( "3 " + C.cellKind( id ) )
		//cp[id] = pix_id
		//cp[nid] = pix_nid
		C.stat_values = {} // remove cached stats or this will crash!!!
		return nid
	}
}


export default GridManipulator 

