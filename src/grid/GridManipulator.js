

import PixelsByCell from "../stats/PixelsByCell.js"
import CentroidsWithTorusCorrection from "../stats/CentroidsWithTorusCorrection.js"
import Centroids from "../stats/Centroids.js"
import Grid2D from "./Grid2D.js"
import Grid3D from "./Grid3D.js"


/** This class contains methods that should be executed once per
 * Monte Carlo Step. Examples are cell division, cell death etc.
 *
 * It also contains methods to seed new cells in certain shapes and
 * configurations. Methods are written for CPMs, but some of the methods
 * may also apply to other models of class ({@link GridBasedModel}, e.g.
 * the cell seeding methods) or even a general grid ({@link Grid}, e.g.
 * the {@link makeLine} and {@link assignCellPixels} methods).
 *
 * @example
 * // Build CPM and attach a gridmanipulator
 * let C = new CPM.CPM( [100,100], {T:20, J:[[0,20],[20,10]]} )
 * let gm = new CPM.GridManipulator( C )
 */
class GridManipulator {
	/** Constructor of class GridManipulator.
	 *
	 * @param {CPM|GridBasedModel|Grid} C - the model whose grid
	 * you wish to manipulate.
	 * Methods are written for CPMs, but some of the methods may also
	 * apply to other models of class ({@link GridBasedModel}, e.g.
	 * the cell seeding methods) or even a general grid ({@link Grid}, e.g.
	 * the {@link makeLine} and {@link assignCellPixels} methods).
	*/
	constructor( C ){
		/** The model whose grid we are manipulating.
		 * @type {CPM|GridBasedModel|Grid}*/
		this.C = C
	}
	
	/** @experimental
	 */
	killCell( cellID ){

		for( let [p,i] of this.C.pixels() ){
			if( i == cellID ){
				this.C.setpix( p, 0 )
			}
		}

		// update stats
		if ("PixelsByCell" in this.C.stat_values) {
			delete this.C.stat_values["PixelsByCell"][cellID]
		}
	}
	

	
	/** Seed a new cell at a random position. Return 0 if failed, ID of new
	 * cell otherwise.
	 * Try a specified number of times, then give up if grid is too full. 
	 * The first cell will always be seeded at the midpoint of the grid.
	 *
	 * See also {@link seedCellAt} to seed a cell on a predefined position.
	 *
	 * @param {CellKind} kind - what kind of cell should be seeded? This
	 * determines the CPM parameters that will be used for that cell.
	 * @param {number} [max_attempts = 10000] - number of tries allowed. The
	 * method will attempt to seed a cell at a random position, but this will
	 * fail if the position is already occupied. After max_attempts fails,
	 * it will not try again. This can happen if the grid is very full.
	 * @return {CellId} - the {@link CellId} of the newly seeded cell, or 0
	 * if the seeding has failed.
	 *
	 * @example
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
		while( this.C.pixt( p ) !== 0 && max_attempts-- > 0 ){
			for( let i = 0 ; i < p.length ; i ++ ){
				p[i] = this.C.ran(0,this.C.extents[i]-1)
			}
		}
		if( this.C.pixt(p)  !== 0 ){
			return 0 // failed
		}
		const newID = this.C.makeNewCellID( kind )
		this.C.setpix( p, newID )
		return newID
	}
	/**  Seed a new cell of celltype "kind" onto position "p".
	 * This succeeds regardless of whether there is already a cell there.
	 * See also {@link seedCell} to seed a cell on a random position.
	 *
	 * @param {CellKind} kind - what kind of cell should be seeded?
	 * This determines the CPM parameters that will be used for that cell.
	 * @param {ArrayCoordinate} p - position to seed the cell at.
	 * @return {CellId} - the {@link CellId} of the newly seeded cell, or 0
	 * if the seeding has failed.
	 *
	 * @example
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
		this.C.grid.checkOnGrid(p)
		this.C.setpix( p, newid )
		return newid

	}
	
	/**  Seed "n" cells of celltype "kind" at random points lying within a
	 * circle surrounding "center" with radius "radius".
	 *
	 * See also {@link seedCell} to seed a cell on a random position in
	 * the entire grid, and {@link seedCellAt} to seed a cell at a specific
	 * position.
	 * @param {CellKind} kind - what kind of cell should be seeded? This
	 * determines the CPM parameters that will be used for that cell.
	 * @param {number} n - the number of cells to seed (must be integer).
	 * @param {ArrayCoordinate} center - position on the grid where the center
	 * of the circle should be.
	 * @param {number} radius - the radius of the circle to seed cells in.
	 * @param {number} max_attempts - the maximum number of attempts to seed a
	 * cell. Seeding can fail if the randomly chosen position is outside the
	 * circle, or if there is already a cell there. After max_attempts the
	 * method will stop trying and throw an error.
	 *
	 * @example
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
			if( --max_attempts === 0 ){
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

	/** Helper method to return an entire plane or line of pixels; can be used
	 * in conjunction with {@link assignCellPixels} to assign all these pixels
	 * to a given CellId at once. (See also {@link makeBox} and
	 * {@link makeCircle}).
	 * The method takes an existing array of coordinates (which can be
	 * empty) and adds the pixels of the specified plane to it.
	 * See {@link assignCellPixels} for a method that sets such a pixel set to a
	 * new value.
	 *
	 * The plane is specified by fixing one coordinate (x,y,or z) to a
	 * fixed value, and letting the others range from their min value 0 to
	 * their max value. In 3D, this returns a plane.
	 *
	 * @param {number} dimension - the dimension to fix the coordinate of:
	 * 0 = x, 1 = y, 2 = z. (E.g. for a straight vertical line, we fix the
	 * x-coordinate).
	 * @param {number} coordinateValue - the value of the coordinate in the
	 * fixed dimension; location of the plane. (E.g. for our straight vertical
	 * line, the x-value where the line should be placed).
	 * @param {ArrayCoordinate[]} [pixels] - (Optional) existing array of pixels;
	 * if given, the line will be added to this set.
	 * @return {ArrayCoordinate[]} the updated array of pixels.
	 *
	 * @example
	 * let C = new CPM.CPM( [10,10], {T:20, J:[[0,20],[20,10]]} )
	 * let gm = new CPM.GridManipulator( C )
	 * let myLine = gm.makeLine( 0, 2 )
	 * gm.assignCellPixels( myLine, 1 )
	 */
	makeLine ( dimension, coordinateValue, pixels ) {

		pixels = pixels || []

		let x,y,z
		let minC = [0,0,0]
		let maxC = [0,0,0]
		for( let dim = 0; dim < this.C.ndim; dim++ ){
			maxC[dim] = this.C.extents[dim]-1
		}
		minC[dimension] = coordinateValue
		maxC[dimension] = coordinateValue

		// For every coordinate x,y,z, loop over all possible values from min to max.
		// one of these loops will have only one iteration because min = max = coordvalue.
		for( x = minC[0]; x <= maxC[0]; x++ ){
			for( y = minC[1]; y<=maxC[1]; y++ ){
				for( z = minC[2]; z<=maxC[2]; z++ ){
					if( this.C.ndim === 3 ){
						pixels.push( [x,y,z] )
					} else {
						//console.log(x,y)
						pixels.push( [x,y] )
					}
				}
			}
		}

		return pixels
	}

	/** Deprecated method, please use {@link makeLine} instead. Old method
	 * just links to the new method for backwards-compatibility.
	 *
	 * @param {number} dim - the dimension to fix the coordinate of:
	 * 0 = x, 1 = y, 2 = z. (E.g. for a straight vertical line, we fix the
	 * x-coordinate).
	 * @param {number} coordinateValue - the value of the coordinate in the
	 * fixed dimension; location of the plane. (E.g. for our straight vertical
	 * line, the x-value where the line should be placed).
	 * @param {ArrayCoordinate[]} [pixels] - (Optional) existing array of pixels;
	 * if given, the line will be added to this set.
	 * @return {ArrayCoordinate[]} the updated array of pixels.
 	 */
	makePlane( pixels, dim, coordinateValue ){
		return this.makeLine( dim, coordinateValue, pixels )
	}

	/** Helper method to return a rectangle (or in 3D: box) of pixels; can be used
	 * in conjunction with {@link assignCellPixels} to assign all these pixels
	 * to a given CellId at once. (See also {@link makeLine} and
	 * {@link makeCircle}).
	 * The method takes an existing array of coordinates (which can be
	 * empty) and adds the pixels of the specified rectangle/box to it.
	 * See {@link assignCellPixels} for a method that sets such a pixel set to a
	 * new value.
	 *
	 * The box/rectangle is specified by its bottom left corner (x,y,z)
	 * and size (dx, dy, dz).
	 *
	 * @param {ArrayCoordinate[]} bottomLeft - the coordinate of the bottom
	 * left corner of the rectangle/box.
	 * @param {number[]} boxSize - the size of the rectangle in each dimension:
	 * [dx,dy,dz].
	 * @param {ArrayCoordinate[]} [pixels] - (Optional) existing array of pixels;
	 * if given, the line will be added to this set.
	 * @return {ArrayCoordinate[]} the updated array of pixels.
	 *
	 * @example
	 * let C = new CPM.CPM( [10,10], {T:20, J:[[0,20],[20,10]]} )
	 * let gm = new CPM.GridManipulator( C )
	 * let rect = gm.makeBox( [50,50], [10,10] )
	 * gm.assignCellPixels( rect, 1 )
	 */
	makeBox( bottomLeft, boxSize, pixels ){

		// this array will contain all positions in the circle (/sphere)
		// for radius = 1, just return the array with a single element:
		// the center pixel
		pixels = pixels || []

		// check that box dimensions do not exceed dimensions of the grid
		for( let d = 0; d < this.C.grid.ndim; d++ ){
			if( boxSize[d] > this.C.grid.extents[d] ){
				throw( "GridManipulator.makeBox: You are trying to make a " +
					"box that exceeds grid dimensions!" )
			}
		}

		// find pixels inside the box, and correct them for torus if required
		const p = bottomLeft
		for( let xx = 0; xx < boxSize[0]; xx++ ){
			for( let yy = 0; yy < boxSize[1]; yy++ ){

				let pNew = [p[0]+xx,p[1]+yy]
				if( this.C.grid.ndim === 3 ){

					for( let zz = 0; zz <= boxSize[2]; zz++ ){
						pNew.push(p[2]+zz)
						// correct for torus
						const pCorr = this.C.grid.correctPosition( pNew )
						if( typeof pCorr !== "undefined" ){ pixels.push( pCorr ) }
					}

				} else {
					const pCorr = this.C.grid.correctPosition( pNew )
					if( typeof pCorr !== "undefined"  ){ pixels.push( pCorr ) }
				}
			}
		}

		return pixels

	}

	/** Helper method to return a circle (in 3D: sphere) of pixels; can be used
	 * in conjunction with {@link assignCellPixels} to assign all these pixels
	 * to a given CellId at once. (See also {@link makeLine} and
	 * {@link makeBox}).
	 * The method takes an existing array of coordinates (which can be
	 * empty) and adds the pixels of the specified circle/sphere to it.
	 * See {@link assignCellPixels} for a method that sets such a pixel set to a
	 * new value.
	 *
	 * The circle/sphere is specified by its center (x,y,z)
	 * and radius.
	 *
	 * @param {ArrayCoordinate[]} center - the coordinate of the center
	 * of the circle/sphere.
	 * @param {number} radius - the radius of the circle/sphere.
	 * @param {ArrayCoordinate[]} [pixels] - (Optional) existing array of pixels;
	 * if given, the circle/sphere pixels will be added to this set.
	 * @return {ArrayCoordinate[]} the updated array of pixels.
	 *
	 * @example
	 * let C = new CPM.CPM( [10,10], {T:20, J:[[0,20],[20,10]]} )
	 * let gm = new CPM.GridManipulator( C )
	 * let circ = gm.makeCircle( [50,50], 10 )
	 * gm.assignCellPixels( circ, 1 )
	 */
	makeCircle( center, radius, pixels = [] ){


		// the positions to return depends on the Grid geometry. currently support only
		// square 2D/3D lattices.
		if( !( this.C.grid instanceof Grid2D ) && !( this.C.grid instanceof Grid3D ) ){
			throw( "In makeCircle: radius > 1 only supported for grids of " +
				"class Grid2D or Grid3D. Please set radius=1 to continue." )
		}

		// find the pixels	inside the radius
		const p = center
		for( let xx = -radius; xx <= radius; xx++ ){
			for( let yy = -radius; yy <= radius; yy++ ){

				let pNew = [p[0]+xx,p[1]+yy]
				if( this.C.grid.ndim === 3 ){

					for( let zz = - radius; zz <= radius; zz++ ){
						pNew.push(p[2]+zz)
						if( Math.sqrt( xx*xx + yy*yy + zz*zz ) <= radius ){
							const pCorr = this.C.grid.correctPosition( pNew )
							if(  typeof pCorr !== "undefined"  ){ pixels.push( pCorr ) }
						}
					}

				} else {
					if( Math.sqrt( xx*xx + yy*yy ) <= radius ){
						const pCorr = this.C.grid.correctPosition( pNew )
						if(  typeof pCorr !== "undefined"  ){ pixels.push( pCorr ) }
					}

				}
			}
		}


		return pixels

	}


	/** Helper method that assigns all pixels in a given array to a
	 * cell of a given cellkind: changes the pixels defined by voxels
	 * (array of coordinates p) into the given cellKind and a corresponding
	 * cellID.
	 *
	 * @param {ArrayCoordinate[]} voxels - Array of pixels to change.
	 * @param {CellKind} cellkind - cellkind to change these pixels into.
	 * @param {CellId} [newID] - (Optional) id of the cell to assign the
	 * 	pixels to; if this is unspecified, a new cellID is generated for this
	 * 	purpose.
	 * 	@example
	 * 	let C = new CPM.CPM( [10,10], {T:20, J:[[0,20],[20,10]]} )
	 * 	let gm = new CPM.GridManipulator( C )
	 * 	let myLine = gm.makeLine( 0, 2 )
	 * 	gm.assignCellPixels( myLine, 1 )
	 **/
	assignCellPixels ( voxels, cellkind, newID ){

		newID = newID || this.C.makeNewCellID( cellkind )
		for( let p of voxels ){
			this.C.setpix( p, newID )
		}
		
	}

	/** Abrogated; this is now {@link assignCellPixels}. **/
	changeKind( voxels, cellkind, newid ){
		this.assignCellPixels( voxels, cellkind, newid )
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
		// console.log( id )
		// create a new ID for the second cell
		
		let nid = C.makeNewCellID( C.cellKind( id ))
		if (C.hasOwnProperty("cells")){
			C.birth( nid, id )
		}
		
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

	/** @experimental 
	 * Let cell "id" divide by splitting it along a line perpendicular to
	 * its major axis, with Torus enabled. Watch out that this can give
	 * rise to weird artefacts when cells span more than half the grid in
	 * a wrapped direction.
	 
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
	divideCellTorus( id ){
		let C = this.C
		if( C.ndim != 2 ){
			throw("The divideCell method is only implemented for 2D lattices yet!")
		}
		let cp = C.getStat( PixelsByCell )[id], com = C.getStat( CentroidsWithTorusCorrection )[id]
		let bxx = 0, bxy = 0, byy=0, T, D, x1, y1, L2

		// Loop over the pixels belonging to this cell
		let si = this.C.extents, pixdist = {}, c = new Array(2)
		for( let j = 0 ; j < cp.length ; j ++ ){
			for ( let dim = 0 ; dim < 2 ; dim ++ ){
				c[dim] = cp[j][dim] - com[dim]
				if( C.conf.torus[dim] && j > 0 ){
					// If distance is greater than half the grid size, correct the
					// coordinate.
					if( c[dim] > si[dim]/2 ){
						c[dim] -= si[dim]
					} else if( c[dim] < -si[dim]/2 ){
						c[dim] += si[dim]
					}
				}
			}
			pixdist[j] = [...c]
			bxx += c[0]*c[0]
			bxy += c[0]*c[1]
			byy += c[1]*c[1]
		}

		// This code computes a "dividing line", which is perpendicular to the longest
		// axis of the cell.
		if( bxy == 0 ){
			x1 = 1
			y1 = 0
		} else {
			T = bxx + byy
			D = bxx*byy - bxy*bxy
			//L1 = T/2 + Math.sqrt(T*T/4 - D)
			L2 = T/2 - Math.sqrt(T*T/4 - D)
			x1 = L2 - byy
			y1 = bxy
		}
		// console.log( id )
		// create a new ID for the second cell
		let nid = C.makeNewCellID( C.cellKind( id ) )
		
		for( let j = 0 ; j < cp.length ; j ++ ){
			//  x0 and y0 can be omitted as the div line is relative to the centroid (0, 0)
			if( x1*pixdist[j][1]-pixdist[j][0]*y1 > 0 ){
				C.setpix( cp[j], nid ) 
			}
		}
		
		if (C.hasOwnProperty("cells")){
			C.birth(nid, id)
		}
		// console.log()
		
		
		C.stat_values = {} // remove cached stats or this will crash!!!
		return nid
	}
}




export default GridManipulator 

