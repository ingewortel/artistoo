/** 
 * Forbids that cells exceed or fall below a certain size range. 
 */

import HardConstraint from "./HardConstraint.js"

class HardVolumeRangeConstraint extends HardConstraint {	
	get CONSTRAINT_TYPE() {
		return "none"
	}
	/* eslint-disable */
	setpixListener( i, t_old, t ){
		console.log( i, t_old, t )
	}
	afterMCSListener( ){
		console.log( "the time is now: ", this.C.time )
	}
}

export default HardVolumeRangeConstraint
