
class SoftConstraint {
	get CONSTRAINT_TYPE() {
		return "soft"
	}
	constructor( conf ){
		this.conf = conf
	}
	set CPM(C){
		this.C = C
	}
	// eslint-disable-next-line no-unused-vars
	deltaH( src_i, tgt_i, src_type, tgt_type ){
		throw("You need to implement the 'deltaH' method for this constraint!")
	}
}

export default SoftConstraint
