
import Constraint from "./Constraint.js"

class SoftConstraint extends Constraint {
	get CONSTRAINT_TYPE() {
		return "soft"
	}
	// eslint-disable-next-line no-unused-vars
	deltaH( src_i, tgt_i, src_type, tgt_type ){
		throw("You need to implement the 'deltaH' method for this constraint!")
	}
}

export default SoftConstraint
