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
		if( !("torus" in conf) ){
			conf["torus"] = true
		}

		// Attributes based on input parameters
		this.ndim = field_size.length // grid dimensions (2 or 3)
		if( this.ndim != 2 && this.ndim != 3 ){
			throw("only 2D and 3D models are implemented!")
		}
		this.conf = conf // input parameter settings; see documentation.

		// Some functions/attributes depend on ndim:
		if( this.ndim == 2 ){
			this.grid = new Grid2D(field_size,conf.torus)
		} else {
			this.grid = new Grid3D(field_size,conf.torus)
		}
		// Pull up some things from the grid object so we don't have to access it
		// from the outside
		this.midpoint = this.grid.midpoint
		this.field_size = this.grid.field_size
		this.cellPixels = this.grid.pixels.bind(this.grid)
		this.pixti = this.grid.pixti.bind(this.grid)
		this.neighi = this.grid.neighi.bind(this.grid)
		this.extents = this.grid.extents

		// Attributes of the current CPM as a whole:
		this.nNeigh = this.grid.neighi(
			this.grid.p2i(this.midpoint)).length // neighbors per pixel (depends on ndim)
		this.nr_cells = 0				// number of cells currently in the grid
		this.time = 0					// current system time in MCS
	
		// track border pixels for speed (see also the DiceSet data structure)
		this.cellborderpixels = new DiceSet( this.mt )

		// Attributes per cell:
		this.cellvolume = []			
		this.t2k = []	// celltype ("kind"). Example: this.t2k[1] is the celltype of cell 1.
		this.t2k[0] = 0	// Background cell; there is just one cell of this type.

		this.soft_constraints = []
		this.hard_constraints = []
		this.post_setpix_listeners = []
		this.post_mcs_listeners = []
		this._neighbours = new Uint16Array(this.grid.p2i(field_size))
	}

	neigh(p, torus=this.conf.torus){
		let g = this.grid
		return g.neighi( g.p2i(p), torus ).map( function(i){ return g.i2p(i) } )
	}

	* cellIDs() {
		yield* Object.keys( this.t2k )
	}

	* cellBorderPixels() {
		for( let i of this.cellborderpixels.elements ){
			const t = this.pixti(i)
			if( t != 0 ){
				yield [this.grid.i2p(i),t]
			}
		}
	}

	* cellBorderPixelIndices() {
		for( let i of this.cellborderpixels.elements ){
			const t = this.pixti(i)
			if( t != 0 ){
				yield [i,t]
			}
		}
	}

	add( t ){
		if( "CONSTRAINT_TYPE" in t ){
			switch( t.CONSTRAINT_TYPE ){
			case "soft": this.soft_constraints.push( t.deltaH.bind(t) );break
			case "hard": this.hard_constraints.push( t.fulfilled.bind(t) ); break
			}
		}
		if( typeof t["postSetpixListener"] === "function" ){
			this.post_setpix_listeners.push( t.postSetpixListener.bind(t) )
		}
		if( typeof t["postMCSListener"] === "function" ){
			this.post_mcs_listeners.push( t.postMCSListener.bind(t) )
		}
		t.CPM = this
		if( typeof t["postAdd"] === "function" ){
			t.postAdd()
		}
	}

	/* Get celltype/identity (pixt) or cellkind (pixk) of the cell at coordinates p or index i. */
	pixt( p ){
		return this.grid.pixti( this.grid.p2i(p) )
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
		let r = 0.0
		for( let t of this.soft_constraints ){
			r += t( sourcei, targeti, src_type, tgt_type )
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
			delta_t += 1./(this.cellborderpixels.length)

			// sample a random pixel that borders at least 1 cell of another type,
			// and pick a random neighbour of tha pixel
			const tgt_i = this.cellborderpixels.sample()
			const Ni = this.grid.neighi( tgt_i )
			const src_i = Ni[this.ran(0,Ni.length-1)]
		
			const src_type = this.grid.pixti( src_i )
			const tgt_type = this.grid.pixti( tgt_i )

			// only compute the Hamiltonian if source and target belong to a different cell,
			// and do not allow a copy attempt into the stroma. Only continue if the copy attempt
			// would result in a viable cell.
			if( tgt_type != src_type ){
				let ok = true
				for( let h of this.hard_constraints ){
					if( !h( src_i, tgt_i, src_type, tgt_type ) ){
						ok = false; break
					}
				}
				if( ok ){
					const hamiltonian = this.deltaH( src_i, tgt_i, src_type, tgt_type )
					// probabilistic success of copy attempt 
					if( this.docopy( hamiltonian ) ){
						this.setpixi( tgt_i, src_type )
					}
				}
			} 
		}
		this.time++ // update time with one MCS.
		for( let l of this.post_mcs_listeners ){
			l()
		}
	}	

	/* Determine whether copy attempt will succeed depending on deltaH (stochastic). */
	docopy ( deltaH ){
		if( deltaH < 0 ) return true
		return this.random() < Math.exp( -deltaH / this.conf.T )
	}
	/* Change the pixel at position p (coordinates) into cellid t. 
	Update cell perimeters with Pup (optional parameter).*/
	setpixi ( i, t ){		
		const t_old = this.grid.pixti(i)
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
		this.grid.setpixi(i,t)
		if( t > 0 ){
			this.cellvolume[t] ++
		}
		this.updateborderneari( i, t_old, t )
		for( let l of this.post_setpix_listeners ){
			l( i, t_old, t )
		}
	}
	setpix ( p, t ){
		this.setpixi( this.grid.p2i(p), t )
	}

	/* Update border elements after a successful copy attempt. */
	updateborderneari ( i, t_old, t_new ){
		if( t_old == t_new ) return
		const Ni = this.grid.neighi( i )
		const wasborder = this._neighbours[i] > 0 
		this._neighbours[i] = 0
		for( let ni of Ni  ){
			const nt = this.grid.pixti(ni)
			if( nt != t_new ){
				this._neighbours[i] ++ 
			}
			if( nt == t_old ){
				if( this._neighbours[ni] ++ == 0 ){
					this.cellborderpixels.insert( ni )
				}
			}
			if( nt == t_new ){
				if( --this._neighbours[ni] == 0 ){
					this.cellborderpixels.remove( ni )
				}
			}
		}

		if( !wasborder && this._neighbours[i] > 0 ){
			this.cellborderpixels.insert( i )
		}
		if( wasborder &&  this._neighbours[i] == 0 ){
			this.cellborderpixels.remove( i )
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
