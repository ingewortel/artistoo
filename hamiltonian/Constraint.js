
class Constraint {
	get CONSTRAINT_TYPE() {
		throw("You need to implement the 'CONSTRAINT_TYPE' getter for this constraint!")
	}
	constructor( conf ){
		this.conf = conf
	}
	set CPM(C){
		this.C = C
	}
}

export default Constraint
