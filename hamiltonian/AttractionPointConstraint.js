
/* Implements a global bias direction of motion.
	This constraint computes the *unnormalized* dot product 
	between copy attempt vector and target direction vector.

	Supply the target direction vector in normalized form, or 
	use the length of the vector to influence the strength 
	of this bias.

	Works for torus grids, if they are "big enough".
	*/

import Constraint from "./Constraint.js"

class AttractionPointConstraint extends Constraint {
	get CONSTRAINT_TYPE() {
		return "soft"
	}
	deltaH( src_i, tgt_i, src_type ){
		let l = this.conf["LAMBDA_ATTRACTIONPOINT"][this.C.cellKind( src_type )]
		if( !l ){
			return 0
		}
		let torus = this.C.conf.torus
		let tgt = this.conf["ATTRACTIONPOINT"][this.C.cellKind( src_type )]
		let p1 = this.C.grid.i2p( src_i ), p2 = this.C.grid.i2p( tgt_i )
		// To bias a copy attempt p1 -> p2 in the direction of vector 'dir'.
		let r = 0., ldir = 0.
		// loops over the coordinates x,y,(z)
		for( let i = 0; i < p1.length ; i++ ){
			let dir_i = tgt[i] - p1[i]
			ldir += dir_i * dir_i
			let si = this.C.extents[i]
			// direction of the copy attempt on this coordinate is from p1 to p2
			let dx = p2[i] - p1[i]
			if( torus ){
				// If distance is greater than half the grid size, correct the
				// coordinate.
				if( dx > si/2 ){
					dx -= si
				} else if( dx < -si/2 ){
					dx += si
				}
			}
			// direction of the gradient
			r += dx * dir_i 
		}
		return - r * l / Math.sqrt( ldir )
	}
}

export default AttractionPointConstraint
