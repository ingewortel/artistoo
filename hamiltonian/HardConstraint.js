
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
}

export default HardConstraint
