/* This class encapsulates a lower-resolution grid and makes it
   visible as a higher-resolution grid. Only exact subsampling by
   a constant factor per dimension is supported. 

	TODO not all methods of the base Grid class are supported yet.
	Since this is mainly supposed to support diffusion grids, 
	we have now focused on those methods that are necessary to
	support diffusion.
	*/

class CoarseGrid extends Grid {
	constructor( grid, downsample = 2 ){
		let i = 0
		for( ; i < grid.extents.length ; i++ ){
			if( grid.extents[i] % downsample != 0 ){
				throw( "Dimensionality of grid does not match along dimension ",i )
			}
		}
		this.grid = grid
	}

}
