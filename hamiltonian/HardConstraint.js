import Constraint from "./Constraint.js"

class HardConstraint extends Constraint {
	get CONSTRAINT_TYPE() {
		return "hard"
	}
	/*constructor( conf ){
		this.conf = conf
	}*/
	set CPM(C){
		this.C = C
	}
	// eslint-disable-next-line no-unused-vars
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
		throw("You need to implement the 'fulfilled' method for this constraint!")
	}
}

export default HardConstraint
