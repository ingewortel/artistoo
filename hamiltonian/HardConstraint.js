
class HardConstraint {
	get CONSTRAINT_TYPE() {
		return "hard"
	}
	constructor( conf ){
		this.conf = conf
	}
	set CPM(C){
		this.C = C
	}
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
		throw("You need to implement the 'fulfilled' method for this constraint!")
	}
}

export default HardConstraint
