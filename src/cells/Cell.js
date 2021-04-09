
class Cell {
	
	/** The constructor of class Cell.
	 * @param {object} conf - configuration settings of the simulation, containing the
	 * relevant parameters. Note: this should include all constraint parameters.
	 * @param {CellKind} kind - the cellkind of this cell, the parameters of kind are used 
	 * when parameters are not explicitly overwritten
	 * @param {object} mt - the Mersenne Twister object of the CPM, to draw random 
	 * numbers within the seeding of the entire simulation 
	 * @param {CellId} id - the CellId of this cell (its key in the CPM.cells), unique identifier
	 * */
	constructor (conf, kind, id, mt){
		this.conf = conf
		this.kind = kind
		this.mt = mt 
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

}

export default Cell







