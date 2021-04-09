import HardConstraint from "./HardConstraint.js"
import ParameterChecker from "./ParameterChecker.js"

/** 
 * This constraint allows a "barrier" celltype from and into which copy attempts are forbidden.
 * @example
 * // Build a CPM and add the constraint
 * let CPM = require( "path/to/build" )
 * let C = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,0,20],[0,0,5],[20,5,10]],
 * 	V : [0,0,500],
 * 	LAMBDA_V : [0,0,5],
 * })
 * C.add( new CPM.BarrierConstraint( {
 * 	IS_BARRIER : [false,true,false]
 * } ) )
 * 
 * // OR: add automatically by entering the parameters in the CPM
 * C = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,0,20],[0,0,5],[20,5,10]],
 * 	V : [0,0,500],
 * 	LAMBDA_V : [0,0,5],
 * 	IS_BARRIER : [false,true,false]
 * })
 * 
 * // Make a horizontal line barrier (cellkind 1 )
 * let cid = C.makeNewCellID( 1 )
 * for( let x = 0; x < 200; x++ ){
 * 	C.setpix( [x,95], cid )
 * }
 * // Seed a cell (cellkind2)
 * let gm = new CPM.GridManipulator( C )
 * gm.seedCell(2)
 */
class BarrierConstraint extends HardConstraint {

	/** The constructor of the BarrierConstraint requires a conf object with a single parameter.
	@param {object} conf - parameter object for this constraint.
	@param {PerKindBoolean} conf.IS_BARRIER - specify for each cellkind if it should be 
 	considered as a barrier. If so, all copy attempts into and from it are forbidden.
	*/
	constructor( conf ){
		super(conf)
	}

	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "IS_BARRIER", "KindArray", "Boolean" )
	}

	/** Method for hard constraints to compute whether the copy attempt fulfills the rule.
	 @param {IndexCoordinate} src_i - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} tgt_i - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {boolean} whether the copy attempt satisfies the constraint.*/ 
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
	
		// Fulfilled = false when either src or tgt pixel is of the barrier cellkind	
		if( this.cellParameter("IS_BARRIER", src_type ) ){
			return false
		}

		if( this.cellParameter("IS_BARRIER", tgt_type ) ){
			return false
		}

		return true
	}
}

export default BarrierConstraint
