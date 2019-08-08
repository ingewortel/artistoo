/* This class contains methods that should be executed once per monte carlo step.
   Examples are cell division, cell death etc.
 */

import Stats from "./Stats.js"

function GridManipulator( C ){
	this.C = C
	this.Cs = new Stats( C )
}

GridManipulator.prototype = {

	/* this.cellpixels is an object with keys for every cell type (identity) in the grid.
	values contain pixel coordinates for all pixels belonging to that cell. */
	prepare: function(){
		this.cellpixels = this.Cs.cellpixels()
	},
	/* Kill a cell by setting its kind to 4 */
	killCell: function( t ){
		//console.log("killing cell "+t)
		/*var cp = this.cellpixels
		for( var j = 0 ; j < cp[t].length ; j ++ ){
			this.C.setpix( cp[t][j], 0 )
		}*/
		this.C.setCellKind( t, 4 )
	},
	/* With a given [probability], kill cells of kind [kind] that have a volume of
	less than [lowerbound] of their target volume. */
	killTooSmallCells : function( kind, probability, lowerbound ){
		var cp = this.cellpixels, C = this.C
		var ids = Object.keys(cp)

		// Loop over cells in the grid
		for( var i = 0 ;  i < ids.length ; i++ ){
			var t = ids[i]
			var k = C.cellKind(t)
			if( k == kind && ( C.getVolume( t ) < C.conf.V[kind]*lowerbound ) ){
				if( C.random() < probability ){
					this.killCell( t )
				}
			}
		}
	},

	/* Let cell t divide by splitting it along a line perpendicular to
	 * its major axis. */
	divideCell2D : function( id ){
		let cp = this.cellpixels, C = this.C, Cs = this.Cs
		let bxx = 0, bxy = 0, byy=0,
			com = Cs.getCentroidOf( id ), cx, cy, x2, y2, side, T, D, x0, y0, x1, y1, L2

		// Loop over the pixels belonging to this cell
		for( var j = 0 ; j < cp[id].length ; j ++ ){
			cx = cp[id][j][0] - com[0] // x position rel to centroid
			cy = cp[id][j][1] - com[1] // y position rel to centroid

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
		var nid = C.makeNewCellID( C.cellKind( id ) )

		// Loop over the pixels belonging to this cell
		//let sidea = 0, sideb = 0
		for( j = 0 ; j < cp[id].length ; j ++ ){
			// coordinates of current cell relative to center of mass
			x2 = cp[id][j][0]-com[0]
			y2 = cp[id][j][1]-com[1]

			// Depending on which side of the dividing line this pixel is,
			// set it to the new type
			side = (x1 - x0)*(y2 - y0) - (x2 - x0)*(y1 - y0)
			if( side > 0 ){
				//sidea ++
				C.setpix( cp[id][j], nid ) 
			} else {
				//sideb ++
			}
		}
		//console.log( sidea, sideb )
		return nid
	},

	/* With a given probability, let cells of kind [kind] divide. */
	divideCells2D: function( kind, probability, minvolume=10 ){
		var cp = this.cellpixels, C = this.C
		var ids = Object.keys(cp)		
		// loop over the cells
		for( var i = 0 ;  i < ids.length ; i++ ){
			var id = ids[i]
			var k = C.cellKind(id) 
			if( k == kind && ( C.getVolume( id ) >= minvolume ) && C.random() < probability ){
				this.divideCell2D( id )
			}
		}
	}
}

export default GridManipulator

