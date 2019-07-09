
class Stat {
	// Although Stats do have a 'conf' object, they should not 
	// really be configurable in the sense that they should always
	// provide an expected output. The 'conf' object is mainly intended
	// to provide an option to configure logging / debugging output. That
	// is not implemented yet.
	constructor( conf ){
		this.conf = conf || {}
	}
	set model( M ){
		this.M = M
	}
	compute(){
		throw("compute method not implemented for subclass of Stat")
	}
}

export default Stat


