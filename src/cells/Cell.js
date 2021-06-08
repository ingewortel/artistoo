
class Cell {
	
	/** The constructor of class Cell.
	 * @param {object} conf - configuration settings of the simulation, containing the
	 * relevant parameters. Note: this should include all constraint parameters.
	 * @param {CellKind} kind - the cellkind of this cell, the parameters of kind are used 
	 * when parameters are not explicitly overwritten
	 * @param {CPMEvol} C - the CPM - used among others to draw random numbers
	 * @param {CellId} id - the CellId of this cell (its key in the CPM.cells), unique identifier
	 * */
	constructor (conf, kind, id, C){
		this.conf = conf
		this.kind = kind
		this.C = C
		this.id = id

		/** The id of the parent cell, all seeded cells have parent -1, to overwrite this
		 * this.birth(parent) needs to be called 
		@type{number}*/
		this.parentId = -1
	}

	/** Adds parentId number, and can be overwritten to execute functionality on 
	 * birth events. 
	 @param {Cell} parent - the parent Cell object
	 */
	birth (parent){
		this.parentId = parent.id 
	}

	/**
	 * This is called upon death events. Can be redefined in subclasses
	 */
	death () {
	}

	/**
	 * Get the current volume of this cell
	 * @return {Number} volume of this cell
	 */
	get vol(){
		return this.C.getVolume(this.id)
	}

}

export default Cell







