

import Stat from "./Stat.js"
import BorderPixelsByCell from "./PixelsByCell.js"
import CPM from "../models/CPM.js"

/** This stat computes a list of all cell ids of the cells that border to "cell" and 
	belong to a different cellid, also giving the interface length for each contact. 
	@experimental 
	@example
	* let CPM = require("path/to/build")
	* 
	* // Set up a CPM and manipulator
	* let C = new CPM.CPM( [300,300], {
	* 	T:20, 
	* 	torus:[false,false],
	* 	J:[[0,20],[20,10]], 
	* 	V:[0,200], 
	* 	LAMBDA_V:[0,2]
	* })
	* let gm = new CPM.GridManipulator( C )
	* 
	* // Seed a cells, run a little, then divide it
	* gm.seedCell(1)
	* for( let t = 0; t < 50; t++ ){
	* 	C.timeStep()
	* }
	* gm.divideCell(1)
	* 
	* // Get neighborlist
	* console.log(  C.getStat( CPM.CellNeighborList ) )	
	*/	
class CellNeighborList extends Stat {


	/** The set model function of CellNeighborList requires an object of type CPM.
	@param {CPM} M The CPM to compute bordering cells for.*/
	set model( M ){
		if( M instanceof CPM ){
			/** The CPM to compute borderpixels for.
			@type {CPM} */
			this.M = M
		} else {
			throw( "The stat CellNeighborList is only implemented for CPMs, where cellborderpixels are stored!" )
		}
		
	}

	/** The getNeighborsOfCell method of CellNeighborList computes a list of all pixels
		that border to "cell" and belong to a different cellid.
		@param {CellId} cellid the unique cell id of the cell to get neighbors from.
		@param {CellArrayObject} cellborderpixels object produced by {@link BorderPixelsByCell}, with keys for each cellid
		and as corresponding value the border pixel indices of their pixels.
		@returns {CellObject} a dictionairy with keys = neighbor cell ids, and 
		values = number of neighbor cellpixels at the border.
	*/
	getNeighborsOfCell( cellid, cellborderpixels ){
				
		let neigh_cell_amountborder = { }
		let cbp = cellborderpixels[cellid]
		
		//loop over border pixels of cell
		for ( let cellpix = 0; cellpix < cbp.length; cellpix++ ) {

			//get neighbouring pixels of borderpixel of cell
			let neighbours_of_borderpixel_cell = this.M.neigh( cbp[cellpix] )

			//don't add a pixel in cell more than twice
			//loop over neighbouring pixels and store the parent cell if it is different from
			//cell, add or increment the key corresponding to the neighbor in the dictionairy
			for ( let neighborpix of neighbours_of_borderpixel_cell ) {
				
				let neighbor_id = this.M.pixt( neighborpix )

				if (neighbor_id != cellid) {
					neigh_cell_amountborder[neighbor_id] = neigh_cell_amountborder[neighbor_id]+1 || 1
				}
			}
		}
		return neigh_cell_amountborder

	
	}
	
	/** The compute method of CellNeighborList computes for each cell on the grid 
		a list of all pixels at its border that belong to a different cellid.
		@returns {CellObject} a dictionairy with keys = cell ids, and 
		values = an object produced by {@link getNeighborsOfCell} (which has keys for each
		neighboring cellid and values the number of contacting pixels for that cell).
	*/
	compute(){
		
		let cellborderpixels = this.M.getStat( BorderPixelsByCell )
		let neighborlist = {}
		
		// the this.M.cellIDs() iterator returns non-background cellids on the grid.
		for( let i of this.M.cellIDs() ){
			neighborlist[i] = this.getNeighborsOfCell( i, cellborderpixels )
		}
		
		return neighborlist

	}
}

export default CellNeighborList
