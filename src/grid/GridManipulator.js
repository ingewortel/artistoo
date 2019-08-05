/* This class contains methods that should be executed once per monte carlo step.
   Examples are cell division, cell death etc.
 */

import PixelsByCell from "../stats/PixelsByCell.js"
import Centroids from "../stats/Centroids.js"

class GridManipulator {
	constructor( C ){
		this.C = C
	}
	/* Seed a new cell at a random position. Return 0 if failed, ID of new cell otherwise.
	 * Try a specified number of times, then give up if grid is too full. 
	 * The first cell will always be seeded at the midpoint of the grid. */
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
	/* Seed a new cell of celltype "kind" onto position "p".*/
	seedCellAt( kind, p ){
		const newid = this.C.makeNewCellID( kind )
		this.C.setpix( p, newid )
		return newid
	}
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
			if( d < radius*radius ){
				this.seedCellAt( kind, p )
				n--
			}
		}
	}
	/* Add an entire plane to an array of pixel coordinates. This array is given 
	as first argument but can be empty. The plane is specified by setting the x/y/z
	coordinate (coded by coord = 0/1/2 for x/y/z) to a fixed value [coordvalue], while
	letting the other coordinates range from their min value 0 to their max value. */
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
	/* Convert all pixels in a given array to a specific cellkind:
	   changes the pixels defined by voxels (array of coordinates p) into
	   the given cellkind. */
	changeKind ( voxels, cellkind ){
		
		let newid = this.C.makeNewCellID( cellkind )
		for( let p of voxels ){
			this.C.setpix( p, newid )
		}
		
	}

	/* Let cell t divide by splitting it along a line perpendicular to
	 * its major axis. */
	divideCell( id ){
		let C = this.C
		if( C.ndim != 2 || C.conf.torus ){
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
		for( let j = 0 ; j < cp.length ; j ++ ){
			// coordinates of current cell relative to center of mass
			x2 = cp[j][0]-com[0]
			y2 = cp[j][1]-com[1]

			// Depending on which side of the dividing line this pixel is,
			// set it to the new type
			side = (x1 - x0)*(y2 - y0) - (x2 - x0)*(y1 - y0)
			if( side > 0 ){
				//sidea ++
				C.setpix( cp[j], nid ) 
				//pix_nid.push( cp[j] )
			} else {
				//pix_id.push( cp[j] )
				//sideb ++
			}
		}
		//cp[id] = pix_id
		//cp[nid] = pix_nid
		C.stat_values = {} // remove cached stats or this will crash!!!
		//console.log( sidea, sideb )
		return nid
	}
}


export default GridManipulator 

