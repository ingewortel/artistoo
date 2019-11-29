/** Base class for a statistic that can be computed on a GridBasedModel. 
This class by itself is not usable; see its subclasses for stats that are 
currently supported. */
class Stat {

	/** The constructor of class Stat takes a 'conf' object as argument.
	However, Stats should not really be configurable in the sense that they should always
	provide an expected output. The 'conf' object is mainly intended
	to provide an option to configure logging / debugging output. That
	is not implemented yet.	
	@param {object} conf configuration options for the Stat, which should change nothing
	about the return value produced by the compute() method but may be used for logging
	and debugging options.*/
	constructor( conf ){
		/** Configuration object for the stat, which should not change its value but
		may be used for logging and debugging options.
		@type {object}*/
		this.conf = conf || {}
	}
	
	/** Every stat is linked to a specific model.
	@param {GridBasedModel} M the model to compute the stat on.*/
	set model( M ){
	
		/** The model to compute the stat on.
		@type {GridBasedModel} */
		this.M = M
	}
	
	/** The compute method of the base Stat class throws an error, 
	enforcing that you have to implement this method when you build a new 
	stat class extending this base class. 
	@abstract */
	compute(){
		throw("compute method not implemented for subclass of Stat")
	}
}

export default Stat


