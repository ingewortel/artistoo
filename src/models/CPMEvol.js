"use strict"

import CPM from "./CPM.js"
import Cell from "../cells/Cell.js"

/** The core CPM class. Can be used for two- or three-dimensional simulations.
*/
class CPMEvol extends CPM {

	/** The constructor of class CA.
	 * @param {GridSize} field_size - the size of the grid of the model.
	 * @param {object} conf - configuration options; see below. In addition,
	 * the conf object can have parameters to constraints added to the CPM.
	 * See the different {@link Constraint} subclasses for options. For some
	 * constraints, adding its parameter to the CPM conf object automatically
	 * adds the constraint; see {@link AutoAdderConfig} to see for which
	 * constraints this is supported.
	 * @param {boolean[]} [conf.torus=[true,true,...]] - should the grid have
	 * linked borders?
	 * @param {number} [conf.T] - the temperature of this CPM. At higher
	 * temperatures, unfavourable copy attempts are more likely to be accepted.
	 * @param {number} [conf.seed] - seed for the random number generator. If
	 * left unspecified, a random number from the Math.random() generator is
	 * used to make one.
	 * */
	constructor( field_size, conf ){
		super( field_size, conf )
		this.post_setpix_listeners.push(this.cellDeath.bind(this))
		this.cells =[new Cell(conf, 0, -1, this)]
		
		this.cellclasses = conf["CELLS"]
	}

	/** Completely reset; remove all cells and set time back to zero. Only the
	 * constraints and empty cell remain. */
	reset(){
		super.reset()
		this.cells = [this.cells[0]] // keep empty declared
	}

	/* eslint-disable no-unused-vars*/
	cellDeath( i, t_old, t_new){
		if (this.cellvolume[t_old] === undefined && t_old !== 0){
			delete this.cells[t_old]
		} 
	}

	/** Get the {@link Cell} of the cell with {@link CellId} t. 
	@param {CellId} t - id of the cell to get kind of.
	@return {Cell} the cellkind. */
	getCell ( t ){
		return this.cells[t]
	}

	/* ------------- MANIPULATING CELLS ON THE GRID --------------- */
	/** Initiate a new {@link CellId} for a cell of {@link CellKind} "kind", and create elements
	   for this cell in the relevant arrays (cellvolume, t2k, cells (if these are tracked)).
	   @param {CellKind} kind - cellkind of the cell that has to be made.
	   @return {CellId} of the new cell.*/
	makeNewCellID ( kind ){
		let newid = super.makeNewCellID(kind)
		this.cells[newid] =new this.cellclasses[kind](this.conf, kind, newid, this.mt )
		return newid
	}

	/** Calls a birth event in a new daughter Cell object, and hands 
	 * the other daughter (as parent) on to the Cell.
	   @param {CellId} childId - id of the newly created Cell object
	   @param {CellId} parentId - id of the other daughter (that kept the parent id)*/
	birth (childId, parentId){
		this.cells[childId].birth(this.cells[parentId] )
	}
}
 
export default CPMEvol
