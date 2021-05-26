import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"


/** 
 * Implements the volume constraint of Potts models. 
 * 
 * This constraint is typically used together with {@link Adhesion}.
 * 
 * See {@link VolumeConstraint#constructor} for the required parameters.
 *
 * @example
 * // Build a CPM and add the constraint
 * let CPM = require( "path/to/build" )
 * let C = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,20],[20,10]]
 * })
 * C.add( new CPM.VolumeConstraint( {
 * 	V : [0,500],
 * 	LAMBDA_V : [0,5] 	
 * } ) )
 * 
 * // Or add automatically by entering the parameters in the CPM
 * let C2 = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,20],[20,10]],
 * 	V : [0,500],
 * 	LAMBDA_V : [0,5]
 * })
 */
class VolumeConstraint extends SoftConstraint {


	/** The constructor of the VolumeConstraint requires a conf object with parameters.
	@param {object} conf - parameter object for this constraint
	@param {PerKindNonNegative} conf.LAMBDA_V - strength of the constraint per cellkind.
	@param {PerKindNonNegative} conf.V - Target volume per cellkind.
	*/
	constructor( conf ){
		super( conf )
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "LAMBDA_V", "KindArray", "NonNegative" )
		checker.confCheckParameter( "V", "KindArray", "NonNegative" )
	}

	/** Method to compute the Hamiltonian for this constraint. 
	 @param {IndexCoordinate} sourcei - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} targeti - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {number} the change in Hamiltonian for this copy attempt and this constraint.*/ 
	deltaH( sourcei, targeti, src_type, tgt_type ){
		// volume gain of src cell
		let deltaH = this.volconstraint( 1, src_type ) - 
			this.volconstraint( 0, src_type )
		// volume loss of tgt cell
		deltaH += this.volconstraint( -1, tgt_type ) - 
			this.volconstraint( 0, tgt_type )
		return deltaH
	}
	/* ======= VOLUME ======= */

	/** The volume constraint term of the Hamiltonian for the cell with id t.
	@param {number} vgain - Use vgain=0 for energy of current volume, vgain=1 
		for energy if cell gains a pixel, and vgain = -1 for energy if cell loses a pixel.
	@param {CellId} t - the cellid of the cell whose volume energy we are computing.
	@return {number} the volume energy of this cell.
	*/
	volconstraint ( vgain, t ){
		const l = this.cellParameter("LAMBDA_V", t)
		// the background "cell" has no volume constraint.
		if( t == 0 || l == 0 ) return 0
		const vdiff = this.cellParameter("V", t) - (this.C.getVolume(t) + vgain)
		return l*vdiff*vdiff
	}
}

export default VolumeConstraint
