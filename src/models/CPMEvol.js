"use strict"

import CPM from "./CPM.js"
import Cell from "../cells/Cell.js"

/** Extension of the CPM class that uses Cell objects to track internal state of Cells
 * Cell objects can override conf parameters, and track their lineage. 
*/
class CPMEvol extends CPM {

	/** The constructor of class CA.
	 * @param {GridSize} field_size - the size of the grid of the model.
	 * @param {object} conf - configuration options; see CPM base class.
	 *  
	 * @param {object[]} [conf.CELLS=[empty, CPM.Cell, CPM.StochasticCorrector]] - Array of objects of (@link Cell) 
	 * subclasses attached to the CPM. These define the internal state of the cell objects that are tracked
	 * */
	constructor( field_size, conf ){
		super( field_size, conf )

		/** Store the {@Cell} of each cell on the grid. 
		@example
		this.cells[1] // cell object of cell with cellId 1
		@type {Cell}
		*/
		this.cells =[new Cell(conf, 0, -1, this)]

		/** Store the constructor of each cellKind on the grid, in order
		 * 0th index currently unused - but this is explicitly left open for 
		 * further extension (granting background variable parameters through Cell)
		@type {CellObject}
		*/
		this.cellclasses = conf["CELLS"]

		/* adds cellDeath listener to record this if pixels change. */
		this.post_setpix_listeners.push(this.cellDeath.bind(this))
	}

	/** Completely reset; remove all cells and set time back to zero. Only the
	 * constraints and empty cell remain. */
	reset(){
		super.reset()
		this.cells = [this.cells[0]] // keep empty declared
	}

	/** The postSetpixListener of CPMEvol registers cell death.
	 * @listens {CPM#setpixi}  as this records when cels no longer contain any pixels.
	 * Note: CPM class already logs most of death, so it registers deleted entries.
	 * @param {IndexCoordinate} i - the coordinate of the pixel that is changed.
	 * @param {CellId} t_old - the cellid of this pixel before the copy
	 * @param {CellId} t_new - the cellid of this pixel after the copy.
	*/
	/* eslint-disable no-unused-vars*/
	cellDeath( i, t_old, t_new){
		if (this.cellvolume[t_old] === undefined && t_old !== 0){
			this.cells[t_old].death()
			delete this.cells[t_old]
		} 
	}

	/** Get the {@link Cell} of the cell with {@link CellId} t. 
	@param {CellId} t - id of the cell to get kind of.
	@return {Cell} the cell object. */
	getCell ( t ){
		return this.cells[t]
	}

	/* ------------- MANIPULATING CELLS ON THE GRID --------------- */
	/** Initiate a new {@link CellId} for a cell of {@link CellKind} "kind", and create elements
	   for this cell in the relevant arrays. Overrides super to also add a new Cell object to track.
	   @param {CellKind} kind - cellkind of the cell that has to be made.
	   @return {CellId} newid of the new cell.*/
	makeNewCellID ( kind ){
		let newid = super.makeNewCellID(kind)
		this.cells[newid] =new this.cellclasses[kind](this.conf, kind, newid, this)
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
