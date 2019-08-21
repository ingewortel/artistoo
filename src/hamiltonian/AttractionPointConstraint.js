import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"


/** Implements a global bias direction of motion.
	This constraint computes the *unnormalized* dot product 
	between copy attempt vector and target direction vector.

	Supply the target direction vector in normalized form, or 
	use the length of the vector to influence the strength 
	of this bias.

	Works for torus grids, if they are "big enough".
	Automatic adding is currently not supported, so you'll have to add it
	using the {@link CPM#add} method.
	
	 * @example
	 * // Build a CPM and add the constraint
	 * let CPM = require( "path/to/build" )
	 * let C = new CPM.CPM( [200,200], { T : 20 } )
	 * C.add( new CPM.AttractionPointConstraint( {
	 * 	LAMBDA_ATTRACTIONPOINT : [0,100],
	 * 	ATTRACTIONPOINT: [100,100],
	 * } ) )
	 * 
	 * // We can even add a second one at a different location
	 * C.add( new CPM.AttractionPointConstraint( {
	 * 	LAMBDA_ATTRACTIONPOINT : [0,100],
	 * 	ATTRACTIONPOINT: [50,50],
	 * } ) )
 */

class AttractionPointConstraint extends SoftConstraint {

	/** The constructor of an AttractionPointConstraint requires a conf object with 
	two parameters.
	@param {object} conf - parameter object for this constraint
	@param {PerKindNonNegative} conf.LAMBDA_ATTRACTIONPOINT - strength of the constraint per cellkind.
	@param {ArrayCoordinate} conf.ATTRACTIONPOINT coordinate of the attractionpoint.
	*/
	constructor( conf ){
		super( conf )		
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "LAMBDA_ATTRACTIONPOINT", "KindArray", "NonNegative" )
		
		// Custom check for the attractionpoint
		checker.confCheckPresenceOf( "ATTRACTIONPOINT" )
		let pt = this.conf["ATTRACTIONPOINT"]
		if( !checker.isCoordinate(pt) ){
			throw( "ATTRACTIONPOINT must be a coordinate array with the same dimensions as the grid!" )
		}
	}

	/** Method to compute the Hamiltonian for this constraint. 
	 @param {IndexCoordinate} src_i - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} tgt_i - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. This argument is not actually
	 used but is given for consistency with other soft constraints; the CPM always calls
	 this method with four arguments.
	 @return {number} the change in Hamiltonian for this copy attempt and this constraint.*/ 
	/* eslint-disable no-unused-vars*/
	deltaH( src_i, tgt_i, src_type, tgt_type ){
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
			if( torus[i] ){
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
