import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"


/**Implements bias of motion in the direction of a supplied "attraction point".
 * This constraint computes the cosine of the angle alpha between the direction
 * of the copy attempt (from source to target pixel), and the direction from the
 * source to the attraction point. This cosine is 1 if these directions are
 * aligned, 0 if they are perpendicular, and 1 if they are opposite.
 * We take the negative (so that deltaH is negative for a copy attempt in the
 * right direction), and modify the strength of this bias using the lambda
 * parameter. The constraint only acts on copy attempts *from* the cell that
 * is responding to the field; it does not take into account the target pixel
 * (except for its location to determine the direction of the copy attempt).
 *
 * The current implementation works for torus grids as long as the grid size in
 * each dimension is larger than a few pixels.
 *
 * Automatic adding of this constraint via the conf object is currently not
 * supported, so you will have to add this constraint using the
 * {@link CPM#add} method.
 *
 * @example
 * // Build a CPM and add the constraint
 * let CPM = require( "path/to/build" )
 * let C = new CPM.CPM( [200,200], { T : 20 } )
 * C.add( new CPM.AttractionPointConstraint( {
 * 	LAMBDA_ATTRACTIONPOINT : [0,100],
 * 	ATTRACTIONPOINT: [[0,0],[100,100]],
 * } ) )
 *
 * // We can even add a second one at a different location
 * C.add( new CPM.AttractionPointConstraint( {
 * 	LAMBDA_ATTRACTIONPOINT : [0,100],
 * 	ATTRACTIONPOINT: [50,50],
 * } ) )
 */
class AttractionPointConstraint extends SoftConstraint {

	/** The constructor of an AttractionPointConstraint requires a conf object
	 * with two parameters.
	 * @param {object} conf - parameter object for this constraint
	 * @param {PerKindNonNegative} conf.LAMBDA_ATTRACTIONPOINT - strength of
	 * the constraint per cellkind.
	 * @param {ArrayCoordinate} conf.ATTRACTIONPOINT coordinate of the
	 * attraction point.
	*/
	constructor( conf ){
		super( conf )		
	}
	
	/** This method checks that all required parameters are present in the
	 * bject supplied to the constructor, and that they are of the right format.
	 * It throws an error when this is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "LAMBDA_ATTRACTIONPOINT",
			"KindArray", "NonNegative" )
		
		// Custom check for the attractionpoint
		checker.confCheckPresenceOf( "ATTRACTIONPOINT" )
		let pt = this.conf["ATTRACTIONPOINT"]
		if( !checker.isCoordinate(pt) ){
			throw( "ATTRACTIONPOINT must be a coordinate array with the same " +
				"dimensions as the grid!" )
		}
	}

	/** Method to compute the Hamiltonian for this constraint.
	 * @param {IndexCoordinate} src_i - coordinate of the source pixel that
	 * tries to copy.
	 * @param {IndexCoordinate} tgt_i - coordinate of the target pixel the
	 * source is trying to copy into.
	 * @param {CellId} src_type - cellid of the source pixel.
	 * @param {CellId} tgt_type - cellid of the target pixel. This argument is
	 * not actually used but is given for consistency with other soft
	 * constraints; the CPM always calls this method with four arguments.
	 * @return {number} the change in Hamiltonian for this copy attempt and
	 * this constraint. */
	/* eslint-disable no-unused-vars*/
	deltaH( src_i, tgt_i, src_type, tgt_type ){

		// deltaH is only non-zero when the source pixel belongs to a cell with
		// an attraction point, so it does not act on copy attempts where the
		// background would invade the cell.
		let l = this.cellParameter("LAMBDA_ATTRACTIONPOINT", src_type )
		if( !l ){
			return 0
		}

		// To assess whether the copy attempt lies in the direction of the
		// attraction point, we must take into account whether the grid has
		// wrapped boundaries (torus; see below).
		let torus = this.C.conf.torus

		// tgt is the attraction point; p1 is the source location and p2 is
		// the location of the target pixel.
		let tgt = this.cellParameter("ATTRACTIONPOINT", src_type )
		let p1 = this.C.grid.i2p( src_i ), p2 = this.C.grid.i2p( tgt_i )

		// To bias a copy attempt p1 -> p2 in the direction of vector 'dir'.
		// r will contain the dot product of the copy attempt vector and the
		// vector pointing from the source pixel to the attraction point.
		// The copy attempt vector always has length one, but the vector to the
		// attraction point has a variable length that will be stored in ldir
		// (actually, we store the squared length).
		let r = 0., ldir = 0.

		// loops over the coordinates x,y,(z)
		for( let i = 0; i < p1.length ; i++ ){

			// compute the distance between the target and the current position
			// in this dimension, and add it in squared form to the total.
			let dir_i = tgt[i] - p1[i]
			ldir += dir_i * dir_i

			// similarly, the distance between the source and target pixel in this
			// dimension (direction of the copy attempt is from p1 to p2)
			let dx = p2[i] - p1[i]

			// we may have to correct for torus if a copy attempt crosses the
			// boundary.
			let si = this.C.extents[i]
			if( torus[i] ){
				// If distance is greater than half the grid size, correct the
				// coordinate.
				if( dx > si/2 ){
					dx -= si
				} else if( dx < -si/2 ){
					dx += si
				}
			}

			// direction of the gradient; add contribution of the current
			// dimension to the dot product.
			r += dx * dir_i 
		}

		// divide dot product by squared length of directional vector to obtain
		// cosine of the angle between the copy attempt direction and the
		// direction to the attraction point. This cosine is 1 if they are
		// perfectly aligned, 0 if they are perpendicular, and negative
		// if the directions are opposite. Since we want to reward copy attempts
		// in the right direction, deltaH is the negative of this (and
		// multiplied by the lambda weight factor).
		return - r * l / Math.sqrt( ldir )
	}
}

export default AttractionPointConstraint
