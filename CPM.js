/** The core CPM class. Can be used for two- or 
 * three-dimensional simulations. 
*/

"use strict"

import DiceSet from "./DiceSet.js"
import MersenneTwister from "mersennetwister"
import Grid2D from "./Grid2D.js"
import Grid3D from "./Grid3D.js"

class CPM {
	constructor( field_size, conf ){
		let seed = conf.seed || Math.floor(Math.random()*Number.MAX_SAFE_INTEGER)
		this.mt = new MersenneTwister( seed )

		// Attributes based on input parameters
		this.ndim = field_size.length // grid dimensions (2 or 3)
		if( this.ndim != 2 && this.ndim != 3 ){
			throw("only 2D and 3D models are implemented!")
		}
		this.conf = conf // input parameter settings; see documentation.

		// Some functions/attributes depend on ndim:
		if( this.ndim == 2 ){
			this.grid = new Grid2D(field_size)
		} else {
			this.grid = new Grid3D(field_size)
		}
		this.field_size = this.grid.field_size

		// Attributes of the current CPM as a whole:
		this.nNeigh = this.grid.neighi(0).length 	// neighbors per pixel (depends on ndim)
		this.nr_cells = 0				// number of cells currently in the grid
		this.time = 0					// current system time in MCS
	
		// track border pixels for speed (see also the DiceSet data structure)
		this.cellborderpixels = new DiceSet( this.mt )
		this.bgborderpixels = new DiceSet( this.mt ) 

		// Attributes per pixel:
		this.cellpixelstype = {}		// celltype (identity) of the current pixel.

		// Attributes per cell:
		this.cellvolume = []			
		this.t2k = []		// celltype ("kind"). Example: this.t2k[1] is the celltype of cell 1.
		this.t2k[0] = 0		// Background cell; there is just one cell of this type.

		this.soft_constraints = []
		this.hard_constraints = []
	}

	addTerm( t ){
		if( t.CONSTRAINT_TYPE == "soft" ){
			this.soft_constraints.push( t.deltaH.bind(t) )
		}
		if( t.CONSTRAINT_TYPE == "hard" ){
			this.hard_constraints.push( t.fulfilled.bind(t) )
		}
		t.CPM = this
	}

	/* Get celltype/identity (pixt) or cellkind (pixk) of the cell at coordinates p or index i. */
	pixt( p ){
		return this.pixti( this.grid.p2i(p) )
	}
	pixti( i ){
		return this.cellpixelstype[i] || 0
	}

	/* Get volume, or cellkind of the cell with type (identity) t */ 
	getVolume( t ){
		return this.cellvolume[t]
	}
	cellKind( t ){
		return this.t2k[ t ]
	}

	/* Assign the cell with type (identity) t to kind k.*/
	setCellKind( t, k ){
		this.t2k[ t ] = k
	}
	
	/* ------------- MATH HELPER FUNCTIONS --------------- */
	random (){
		return this.mt.rnd()
	}
	/* Random integer number between incl_min and incl_max */
	ran (incl_min, incl_max) {
		return Math.floor(this.random() * (1.0 + incl_max - incl_min)) + incl_min
	}
	
	/* ------------- COMPUTING THE HAMILTONIAN --------------- */


	/* ======= ADHESION ======= */

	// returns both change in hamiltonian and perimeter
	deltaH ( sourcei, targeti, src_type, tgt_type ){
		const terms = this.soft_constraints
	
		let r = 0.0
		for( let i = 0 ; i < terms.length ; i++ ){
			r += terms[i]( sourcei, targeti, src_type, tgt_type )
		}

		return r 

	}
	/* ------------- COPY ATTEMPTS --------------- */

	/* 	Simulate one MCS (a number of copy attempts depending on grid size):
		1) Randomly sample one of the border pixels for the copy attempt.
		2) Compute the change in Hamiltonian for the suggested copy attempt.
		3) With a probability depending on this change, decline or accept the 
		   copy attempt and update the grid accordingly. 
	*/
	
	monteCarloStep (){
		let delta_t = 0.0
		// this loop tracks the number of copy attempts until one MCS is completed.
		while( delta_t < 1.0 ){

			// This is the expected time (in MCS) you would expect it to take to
			// randomly draw another border pixel.
			delta_t += 1./(this.bgborderpixels.length + this.cellborderpixels.length)


			let p1i
			// Randomly sample one of the CPM border pixels (the "source" (src)),
			// and one of its neighbors (the "target" (tgt)).
			if( this.ran( 0, this.bgborderpixels.length + this.cellborderpixels.length )
				< this.bgborderpixels.length ){
				p1i = this.bgborderpixels.sample()
			} else {
				p1i = this.cellborderpixels.sample()
			}
		
			const N = this.grid.neighi( p1i )
			const p2i = N[this.ran(0,N.length-1)]
		
			const src_type = this.pixti( p1i )
			const tgt_type = this.pixti( p2i )

			// only compute the Hamiltonian if source and target belong to a different cell,
			// and do not allow a copy attempt into the stroma. Only continue if the copy attempt
			// would result in a viable cell.
			if( tgt_type >= 0 && src_type != tgt_type ){

				const hamiltonian = this.deltaH( p1i, p2i, src_type, tgt_type )

				// probabilistic success of copy attempt 
				if( this.docopy( hamiltonian ) ){
					this.setpixi( p2i, src_type )
				}
			}

		}

		this.time++ // update time with one MCS.
	}	

	/* Determine whether copy attempt will succeed depending on deltaH (stochastic). */
	docopy ( deltaH ){
		if( deltaH < 0 ) return true
		return this.random() < Math.exp( -deltaH / this.conf.T )
	}
	/* Change the pixel at position p (coordinates) into cellid t. 
	Update cell perimeters with Pup (optional parameter).*/
	setpixi ( i, t ){
		const t_old = this.cellpixelstype[i]
		// Specific case: changing a pixel into background (t = 0) is done by delpix.
		if( t == 0 ){
			this.delpixi( i )
		} else {
			if( t_old > 0 ){
				// also update volume of the old cell
				// (unless it is background/stroma)
				this.cellvolume[t_old] --
				
				// if this was the last pixel belonging to this cell, 
				// remove the cell altogether.
				if( this.cellvolume[t_old] == 0 ){
					delete this.cellvolume[t_old]
					delete this.t2k[t_old]
				}
			}
			// update volume of the new cell and cellid of the pixel.
			this.cellpixelstype[i] = t
			this.cellvolume[t] ++
		}
		this.updateborderneari( i )
	}
	setpix ( p, t ){
		this.setpixi( this.grid.p2i(p), t )
	}
	/* Change pixel at coordinates p/index i into background (t=0) */
	delpixi ( i ){
		const t = this.cellpixelstype[i]

		// Reduce cell volume.
		this.cellvolume[t] --

		// remove this pixel from objects cellpixelsbirth / cellpixelstype
		delete this.cellpixelstype[i]

		// if this was the last pixel belonging to this cell, 
		// remove the cell altogether.
		if( this.cellvolume[t] == 0 ){
			delete this.cellvolume[t]
			delete this.t2k[t]
		}

	}

	delpix ( p ){
		this.delpixi( this.grid.p2i(p) )
	}

	/* Update border elements after a successful copy attempt. */
	updateborderneari ( i ){
		// neighborhood + pixel itself (in indices)
		const Ni = this.grid.neighi(i)
		Ni.push(i)
		
		for( let j = 0 ; j < Ni.length ; j ++ ){

			i = Ni[j]
			const t = this.pixti( i )

			// stroma pixels are not stored
			if( t < 0 ) continue
			let isborder = false

			// loop over neighborhood of the current pixel.
			// if the pixel has any neighbors belonging to a different cell,
			// it is a border pixel.			
			const N = this.grid.neighi( Ni[j] )
			for( let k = 0 ; k < N.length ; k ++ ){
				if( this.pixti( N[k] ) != t ){
					isborder = true; break
				}
			}

			// if current pixel is background, it should not be part of
			// cellborderpixels (only for celltypes > 0). Whether it
			// should be part of bgborderpixels depends on isborder.
			if( t == 0 ){
				this.cellborderpixels.remove( i )
				if( isborder ){
					this.bgborderpixels.insert( i )
				} else {
					this.bgborderpixels.remove( i )
				}
			// if current pixel is from a cell, this works the other way around.
			} else {
				this.bgborderpixels.remove( i )
				if( isborder ){
					this.cellborderpixels.insert( i )
				} else {
					this.cellborderpixels.remove( i )
				}
			}
		}
	}

	/* ------------- MANIPULATING CELLS ON THE GRID --------------- */

	/* Initiate a new cellid for a cell of celltype "kind", and create elements
	   for this cell in the relevant arrays (cellvolume, cellperimeter, t2k).*/
	makeNewCellID ( kind ){
		const newid = ++ this.nr_cells
		this.cellvolume[newid] = 0
		this.setCellKind( newid, kind )
		return newid
	}

}

export default CPM
