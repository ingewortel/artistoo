/** 
 * Forbids that cells exceed or fall below a certain size range. 
 */

import HardConstraint from "./HardConstraint.js"

class HardVolumeRangeConstraint extends HardConstraint {
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
		// volume gain of src cell
		if( src_type != 0 && this.C.getVolume(src_type) + 1 > 
			this.conf["LAMBDA_VRANGE_MAX"][this.C.cellKind(src_type)] ){
			return false
		}
		// volume loss of tgt cell
		if( tgt_type != 0 && this.C.getVolume(tgt_type) - 1 < 
			this.conf["LAMBDA_VRANGE_MIN"][this.C.cellKind(tgt_type)] ){
			return false
		}
		return true
	}
}

export default HardVolumeRangeConstraint
