

import Stat from "./Stat.js"
import PixelsByCell from "./PixelsByCell.js"

/**	This Stat computes the centroid of a cell. When the cell resides on a torus, the
	centroid may be well outside the cell, and other stats may be preferable (e.g.
	{@link CentroidsWithTorusCorrection}).
	
	@example
	* let CPM = require( "path/to/build" )
	*
	* // Make a CPM, seed two cells, run a little, and get their centroids
	* let C = new CPM.CPM( [100,100], { 
	* 	T:20,
	*	torus:[false,false],
	* 	J:[[0,20],[20,10]],
	* 	V:[0,200],
	* 	LAMBDA_V:[0,2]
	* } )
	* let gm = new CPM.GridManipulator( C )
	* gm.seedCell(1)
	* gm.seedCell(1)
	* for( let t = 0; t < 100; t++ ){ C.timeStep() }
	*
	* C.getStat( CPM.Centroids ) 
*/
class Centroids extends Stat {

	/** The set model method of class CentroidsWithTorusCorrection.
	@param {GridBasedModel} M - the model to compute centroids on. */
	set model( M ){
	
		/** The model to compute centroids on. 
		@type {GridBasedModel}*/
		this.M = M
		
		/* Check if the grid has a torus; if so, warn that this method may not be
		appropriate. */
		let torus = false
		for( let d = 0; d < this.M.ndim; d++ ){
			if( this.M.grid.torus[d] ){
				torus = true
				break
			}
		}
		
		if(torus){
			// eslint-disable-next-line no-console
			console.warn( "Your model grid has a torus, and the 'Centroids' stat is not compatible with torus! Consider using 'CentroidsWithTorusCorrection' instead." )
		}
		
		// Half the grid dimensions; if pixels with the same cellid are further apart,
		// we assume they are on the border of the grid and that we need to correct
		// their positions to compute the centroid.
		/** @ignore */
		this.halfsize = new Array( this.M.ndim).fill(0)
		for( let i = 0 ; i < this.M.ndim ; i ++ ){
			this.halfsize[i] = this.M.extents[i]/2
		}
	}
	/** @ignore */
	constructor( conf ){
		super(conf)
	}
	/** This method computes the centroid of a specific cell. 
		@param {CellId} cellid the unique cell id of the cell to get centroid of.
		@param {CellArrayObject} cellpixels object produced by {@link PixelsByCell}, 
		with keys for each cellid
		and as corresponding value the pixel coordinates of their pixels.
		@returns {ArrayCoordinate} coordinate of the centroid.
	*/
	computeCentroidOfCell( cellid, cellpixels  ){
	
		//let cellpixels = this.M.getStat( PixelsByCell ) 
	
		const pixels = cellpixels[ cellid ]
		
		// cvec will contain the x, y, (z) coordinate of the centroid.
		// Loop over the dimensions to compute each element separately.
		let cvec = new Array(this.M.ndim).fill(0)
		for( let dim = 0 ; dim < this.M.ndim ; dim ++ ){
			
			let mi = 0.
			// Loop over the pixels;
			// compute mean position per dimension with online algorithm
			for( let j = 0 ; j < pixels.length ; j ++ ){
				// Check distance of current pixel to the accumulated mean in this dim.
				// Check if this distance is greater than half the grid size in this
				// dimension; if so, this indicates that the cell has moved to the
				// other end of the grid because of the torus. Note that this only
				// holds AFTER the first pixel (so for j > 0), when we actually have
				// an idea of where the cell is.
				let dx = pixels[j][dim] - mi
				// Update the mean with the appropriate weight. 
				mi += dx/(j+1)
			}			
			// Set the mean position in the cvec vector.
			cvec[dim] = mi
		}
		return cvec
		
	}
		
	/** Compute centroids for all cells on the grid. 
	@return {CellObject} with an {@link ArrayCoordinate} of the centroid for each cell
	 on the grid (see {@link computeCentroidOfCell}). */
	compute(){
		// Get object with arrays of pixels for each cell on the grid, and get
		// the array for the current cell.
		let cellpixels = this.M.getStat( PixelsByCell ) 
		
		// Create an object for the centroids. Add the centroid array for each cell.
		let centroids = {}
		for( let cid of this.M.cellIDs() ){
			centroids[cid] = this.computeCentroidOfCell( cid, cellpixels )
		}
		return centroids
	}
}

export default Centroids
