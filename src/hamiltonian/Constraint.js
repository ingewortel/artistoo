/** This base class defines a general CPM constraint and provides methods that do not 
depend on the specific constraint used. This class is never used on its own, 
as it does not yet contain the actual definition of a constraint (such as a deltaH method).

In general, we distinguish between two types of constraint:

- a {@link HardConstraint} is a hard rule that *must* be fulfilled in order for a copy
attempt to succeed;
- a {@link SoftConstraint} is an energy term in the Hamiltonian that can make a copy 
attempt either more or less energetically favourable, but does not by itself determine
whether a copy attempt will succeed. An unfavourable outcome may be outbalanced by 
favourable energies from other terms, and even a copy attempt net unfavourable 
energy (deltaH > 0) may succeed with a success chance P = exp(-DeltaH/T). 

See the subclasses {@link SoftConstraint} and {@link HardConstraint} for details. Each
implemented constraint is in turn a subclass of one of these two.
*/
class Constraint {

	/** This method is actually implemented in the subclass.
	@abstract
	*/
	get CONSTRAINT_TYPE() {
		throw("You need to implement the 'CONSTRAINT_TYPE' getter for this constraint!")
	}
	
	/** Get the parameters of this constraint from the conf object. 
	@return {object} conf - configuration settings for this constraint, containing the
	relevant parameters.
	*/
	get parameters(){
		return this.conf
	}

	/** Get a cellid or cellkind-specific parameter for a constraint. 
	 * This function is here to document its functionality, but it is 
	 * always overwritten by the constructor (via "set CPM") to point
	 * to another function. This is normally  @function  paramOfKind,
	 * which retrieves the parameter from the conf object for the current {@link cellKind}.
	 * If CPMEvol is used this is instead redirected to @function  paramOfCell,
	 * which looks whether the parameter is overwritten in an @object Cell
	 * and otherwise returns @function paramOfKind
	 * @abstract
	 * 
	 * @param {string} param - name of parameter in conf object
	 * @param {CellId} cid - Cell Id of cell in question, if id-specific parameter is not present, cellkind of cid is used
	@return {any} parameter - the requested parameter
	*/
	/* eslint-disable no-unused-vars */
	cellParameter(param, cid){
		throw( "this is a template function that should never actually be called as it is overwritten to point to paramOfCell() or paramOfKind().")
	}

	/**
	 * Get a cellId specific parameter, only used if CPMEvol is used: 
	 * looks whether the requested parameter is overwritten in an @object Cell
	 * and otherwise returns @function paramOfKind
	 * 
	 * @param {string} param - name of parameter in conf object
	 * @param {CellId} cid - Cell Id of cell in question, if id-specific parameter is not present, cellkind of cid is used
	@return {any} parameter - the requested parameter
	*/
	paramOfCell(param, cid){
		if (this.C.cells[cid][param] !== undefined){
			return this.C.cells[cid][param]
		}
		return this.paramOfKind(param,cid)
	}

	/** Returns a cellKind specfic variable: 
	 * Assumes that the parameter is indexable by cellkind.
	 *
	 * @param {string} param - name of parameter in conf object
	 * @param {CellId} cid - Cell Id of cell in question, if id-specific parameter is not present, cellkind of cid is used
	@return {any} parameter - the requested parameter
	*/
	paramOfKind(param, cid){
		return this.conf[param][this.C.cellKind(cid)]
	}
	
	/** The constructor of a constraint takes a configuration object.
	This method is usually overwritten by the actual constraint so that the entries
	of this object can be documented.
	@param {object} conf - configuration settings for this constraint, containing the
	relevant parameters.
	@abstract*/
	constructor( conf ){
		/** Configuration object for this constraint.
		@type {object}*/
		this.conf = conf
	}
	/** This function attaches the relevant CPM to this constraint, so that information
	about this cpm can be requested from the constraint. If the cpm is of type CPMEvol,
	the cellParameter call is redirected to check for CellId-specific parameters.
	@todo Check why some constraints overwrite this? Because that disables the automatic
	usage of a confChecker() when it is implemented. 
	@param {CPM} C - the CPM to attach to this constraint.*/
	/*eslint-disable*/
	set CPM(C){
		/** CPM on which this constraint acts.
		@type {CPM}*/
		this.C = C
		this.cellParameter = this.paramOfKind
		if (C.constructor.name === "CPMEvol"){
			this.cellParameter = this.paramOfCell
		}
		if( typeof this.confChecker === "function" ){
			this.confChecker()
		}
	}
	/** The optional confChecker method should verify that all the required conf parameters
	are actually present in the conf object and have the right format. It is implemented in
	the subclass that specifies the actual constraint.
	@abstract */
	confChecker( ){
	}

}

export default Constraint
