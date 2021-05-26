

import HardConstraint from "./HardConstraint.js"
import ParameterChecker from "./ParameterChecker.js"

/** 
 * This constraint forbids that cells exceed or fall below a certain size range. 
 * @example
 * // Build a CPM and add the constraint
 * let CPM = require( "path/to/build" )
 * let C = new CPM.CPM( [200,200], {T : 4})
 * C.add( new CPM.HardVolumeRangeConstraint( {
 * 	LAMBDA_VRANGE_MIN : [0,1],
 * 	LAMBDA_VRANGE_MAX : [0,2]
 * } ) )
 */
class HardVolumeRangeConstraint extends HardConstraint {

	/** The constructor of the HardVolumeRangeConstraint requires a conf object with two parameters.
	@param {object} conf - parameter object for this constraint.
	@param {PerKindNonNegative} conf.LAMBDA_VRANGE_MIN - minimum volume of each cellkind.
	@param {PerKindNonNegative} conf.LAMBDA_VRANGE_MAX - maximum volume of each cellkind.
	*/
	constructor( conf ){
		super(conf)
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "LAMBDA_VRANGE_MAX", "KindArray", "NonNegative" )
		checker.confCheckParameter( "LAMBDA_VRANGE_MIN", "KindArray", "NonNegative" )
	}

	/** Method for hard constraints to compute whether the copy attempt fulfills the rule.
	 @param {IndexCoordinate} src_i - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} tgt_i - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {boolean} whether the copy attempt satisfies the constraint.*/ 
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
		// volume gain of src cell
		if( src_type != 0 && this.C.getVolume(src_type) + 1 > 
			this.cellParameter("LAMBDA_VRANGE_MAX", src_type) ){
			return false
		}
		// volume loss of tgt cell
		if( tgt_type != 0 && this.C.getVolume(tgt_type) - 1 < 
			this.cellParameter("LAMBDA_VRANGE_MIN",tgt_type) ){
			return false
		}
		return true
	}
}

export default HardVolumeRangeConstraint
