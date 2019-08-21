
import Stat from "./Stat.js"
import PixelsByCell from "./PixelsByCell.js"

/**	This Stat computes the centroid of a cell when grid has a torus. 

	!!! Assumption: cell pixels never extend for more than half the size of the grid.
	If this assumption does not hold, centroids may be computed wrongly.
	
	See also {@link Centroids} for a version without torus correction.
		
	@example
	* let CPM = require( "path/to/build" )
	*
	* // Make a CPM, seed two cells, run a little, and get their centroids
	* let C = new CPM.CPM( [100,100], { 
	* 	T:20,
	* 	torus:[true,true],
	* 	J:[[0,20],[20,10]],
	* 	V:[0,200],
	* 	LAMBDA_V:[0,2]
	* } )
	* let gm = new CPM.GridManipulator( C )
	* gm.seedCell(1)
	* gm.seedCell(1)
	* for( let t = 0; t < 100; t++ ){ C.timeStep() }
	*
	* C.getStat( CPM.CentroidsWithTorusCorrection ) 
*/

class CentroidsWithTorusCorrection extends Stat {

	/** The set model method of class CentroidsWithTorusCorrection.
	@param {GridBasedModel} M - the model to compute centroids on. */
	set model( M ){
	
		/** The model to compute centroids on. 
		@type {GridBasedModel}*/
		this.M = M
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
		
	/** This method computes the centroid of a specific cell with id = <cellid>. 
	The cellpixels object is given as an argument so that it only has to be requested
	once for all cells together.
	@param {CellId} cellid ID number of the cell to get centroid of. 
	@param {CellArrayObject} cellpixels object produced by {@link PixelsByCell}, 
	where keys are the cellids
	of all non-background cells on the grid, and the corresponding value is an array
	of the pixels belonging to that cell specified by their {@link ArrayCoordinate}.
	@return {ArrayCoordinate} the centroid of the current cell.
	*/
	computeCentroidOfCell( cellid, cellpixels  ){
	
		//let cellpixels = this.M.getStat( PixelsByCell ) 
	
		const pixels = cellpixels[ cellid ]
		
		// cvec will contain the x, y, (z) coordinate of the centroid.
		// Loop over the dimensions to compute each element separately.
		let cvec = new Array(this.M.ndim).fill(0)
		for( let dim = 0 ; dim < this.M.ndim ; dim ++ ){
			
			let mi = 0.
			const hsi = this.halfsize[dim], si = this.M.extents[dim]
			
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
				if( this.M.grid.torus[dim] && j > 0 ){
					// If distance is greater than half the grid size, correct the
					// coordinate.
					if( dx > hsi ){
						dx -= si
					} else if( dx < -hsi ){
						dx += si
					}
				}
				// Update the mean with the appropriate weight. 
				mi += dx/(j+1)
			}
			
			// Correct the final position so that it falls in the current grid.
			// (Because of the torus, it can happen to get a centroid at eg x = -1. )
			if( mi < 0 ){
				mi += si
			} else if( mi > si ){
				mi -= si
			}
			
			// Set the mean position in the cvec vector.
			cvec[dim] = mi
		}
		return cvec
		
	}
		
	/** This method computes the centroids of all cells on the grid. 
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

export default CentroidsWithTorusCorrection
