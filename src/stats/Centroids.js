/*	Computes the centroid of a cell. When the cell resides on a torus, the
	centroid may be well outside the cell, and other stats may be preferable. 
*/

import Stat from "./Stat.js"
import PixelsByCell from "./PixelsByCell.js"

class Centroids extends Stat {
	set model( M ){
		this.M = M
		// Half the grid dimensions; if pixels with the same cellid are further apart,
		// we assume they are on the border of the grid and that we need to correct
		// their positions to compute the centroid.
		this.halfsize = new Array( this.M.ndim).fill(0)
		for( let i = 0 ; i < this.M.ndim ; i ++ ){
			this.halfsize[i] = this.M.extents[i]/2
		}
	}
	constructor( conf ){
		super(conf)
	}
	/* Compute the centroid of a specific cell with id = <cellid>. 
	The cellpixels object is given as an argument so that it only has to be requested
	once for all cells together. */
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
		
	/* Compute centroids for all cells on the grid, returning an object with a key
	for each cellid and as "value" the array with coordinates of the centroid. */
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
