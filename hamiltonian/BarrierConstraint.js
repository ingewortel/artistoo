/** 
 * Allows a "barrier" celltype from and into which copy attempts are forbidden. 
 */

import HardConstraint from "./HardConstraint.js"

class BarrierConstraint extends HardConstraint {
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
	
		// Fulfilled = false when either src or tgt pixel is of the barrier cellkind	
		if( this.conf["IS_BARRIER"][this.C.cellKind( src_type ) ] ){
			return false
		}

		if( this.conf["IS_BARRIER"][this.C.cellKind( tgt_type ) ] ){
			return false
		}

		return true
	}
}

export default BarrierConstraint
