/** 
 * Implements the adhesion constraint of Potts models. 
 */

import SoftConstraint from "./SoftConstraint.js"

class VolumeConstraint extends SoftConstraint {
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

	/* The volume constraint term of the Hamiltonian for the cell with id t.
	   Use vgain=0 for energy of current volume, vgain=1 for energy if cell gains
	   a pixel, and vgain = -1 for energy if cell loses a pixel. 
	*/
	volconstraint ( vgain, t ){
		const k = this.C.cellKind(t), l = this.conf["LAMBDA_V"][k]
		// the background "cell" has no volume constraint.
		if( t == 0 || l == 0 ) return 0
		const vdiff = this.conf["V"][k] - (this.C.getVolume(t) + vgain)
		return l*vdiff*vdiff
	}
}

export default VolumeConstraint
