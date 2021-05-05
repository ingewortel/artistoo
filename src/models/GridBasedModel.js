"use strict"

import MersenneTwister from "mersenne-twister"
//import HexGrid2D from "../grid/HexGrid2D.js"
import Grid2D from "../grid/Grid2D.js"
import Grid3D from "../grid/Grid3D.js"


/** Base class for grid-based models. This class is not used by itself; see
{@link CPM} for a Cellular Potts Model and {@link CA} for a Cellular Automaton. 
*/
class GridBasedModel {

	/** The constructor of a GridBasedModel automatically attaches a grid of 
	class {@link Grid2D} or {@link Grid3D}, depending on the grid dimensions
	given in the 'extents' parameter. Configuration options for the model can
	be supplied in 'conf'.
	@param {GridSize} extents - the size of the grid of the model.
	@param {object} conf - configuration options. See below for its elements,
	but subclasses can have more.
	@param {boolean[]} [conf.torus=[true,true,...]] - should the grid have linked borders?
	@param {boolean} [conf.hexGrid=false] - should the grid be hexagonal? Grids
	 are square by default.
	@param {number} [seed] - seed for the random number generator. If left unspecified,
	a random number from the Math.random() generator is used to make one.  */
	constructor( extents, conf ){
		let seed = conf.seed || Math.floor(Math.random()*Number.MAX_SAFE_INTEGER)
		
		/** Attach a random number generation with a seed.
		@type {MersenneTwister}*/
		this.mt = new MersenneTwister( seed )
		if( !("torus" in conf) ){
			let torus = []
			for( let d = 0; d < extents.length; d++ ){
				torus.push( true )
			}
			conf["torus"] = torus
		}

		// Attributes based on input parameters
		/** Dimensionality of the grid 
		@type {number}*/
		this.ndim = extents.length // grid dimensions (2 or 3)
		if( this.ndim !== 2 && this.ndim !== 3 ){
			throw("only 2D and 3D models are implemented!")
		}
		
		/** Input parameter settings; see the constructor of subclasses documentation.
		@type {object}*/
		this.conf = conf // input parameter settings; see documentation.

		// Some functions/attributes depend on ndim:
		//this.hexGrid = conf.hexGrid || false

		if( this.ndim === 2 ){
			this.grid=new Grid2D(extents,conf.torus)
			//if( this.hexGrid ){
			//	/** The grid.
			//	@type {Grid2D|Grid3D|HexGrid2D}*/
			//	this.grid = new HexGrid2D(extents,conf.torus)
			//} else {
			//	this.grid = new Grid2D(extents,conf.torus)
			//}

		} else {
			/*if( this.hexGrid ){
				throw( "There is no 3D hexagonal grid!" )
			}*/
			this.grid = new Grid3D(extents,conf.torus)
		}
		// Pull up some things from the grid object so we don't have to access it
		// from the outside
		/** Midpoint of the grid.
		@type {ArrayCoordinate}*/
		this.midpoint = this.grid.midpoint
		/** Size of the grid in object format.
		@type {object}*/
		this.field_size = this.grid.field_size
		/** The {@link Grid2D#pixels} or {@link Grid3D#pixels} iterator function of the underlying grid.
		@type {function}*/
		this.pixels = this.grid.pixels.bind(this.grid)
		/** The {@link Grid#pixti} iterator function of the underlying grid.
		@type {function}*/
		this.pixti = this.grid.pixti.bind(this.grid)
		/** The {@link Grid2D#neighi} or {@link Grid3D#neighi} iterator function of the underlying grid.
		@type {function}*/
		this.neighi = this.grid.neighi.bind(this.grid)
		/** Size of the grid.
		@type {GridSize}*/
		this.extents = this.grid.extents


		/** This tracks the volumes of all non-background cells on the grid.
		cellvolumes will be added with key = {@link CellId}, value = volume.
		@type{number[]}*/
		this.cellvolume = []
		/** Tracks the elapsed time in MCS
		@type {number}*/
		this.time = 0
		/** Objects of class {@link Stat} that have been computed on this model.
		@type {Stat}*/
		this.stats = []
		/** Cached values of these stats. Object with stat name as key and its cached
		value as value. The cache must be cleared when the grid changes!
		@type {object} */
		this.stat_values = {}
	}

	/** Get the {@link CellKind} of the cell with {@link CellId} t. For this model, they
	are just the same.
	@param {CellId} t - id of the cell to get kind of.
	@return {CellKind} the cellkind. */
	cellKind( t ){
		return t 
	}

	/** Iterator for all the {@link CellId}s that are currently on the grid. 
	@return {CellId}*/
	* cellIDs() {
		yield* Object.keys( this.cellvolume )
	}

	/** Get neighbourhood of position p, using neighborhood functions of the underlying
	grid class.
	@param {ArrayCoordinate} p - coordinate of a pixel to get the neighborhood of.
	@param {boolean[]} [torus=[true,true,...]]  Does the grid have linked borders? If left unspecified,
	this is determined by this.conf.torus.*/
	neigh(p, torus=this.conf.torus){
		let g = this.grid
		return g.neighi( g.p2i(p), torus ).map( function(i){ return g.i2p(i) } )
	}

	/** Get {@link CellId} of the pixel at coordinates p. 
	@param {ArrayCoordinate} p - pixel to get cellid of.
	@return {CellId} ID of the cell p belongs to.*/
	pixt( p ){
		return this.grid.pixti( this.grid.p2i(p) )
	}

	/** Change the pixel at position i into {@link CellId} t. 
		This standard implementation also keeps track of cell volumes
		for all nonzero cell IDs. Subclasses may want to do more, 
		such as also keeping track of perimeters or even centroids.
		In that case, this method needs to be overridden. 
		
		See also {@link setpix} for a method working with {@link ArrayCoordinate}s.
		
		@param {IndexCoordinate} i - coordinate of pixel to change.
		@param {CellId} t - cellid to change this pixel into.
		*/
	setpixi ( i, t ){		
		const t_old = this.grid.pixti(i)
		if( t_old > 0 ){
			// also update volume of the old cell
			this.cellvolume[t_old] --
			// if this was the last pixel belonging to this cell, 
			// remove the cell altogether.
			if( this.cellvolume[t_old] == 0 ){
				delete this.cellvolume[t_old]
			}
		}
		// update volume of the new cell and cellid of the pixel.
		this.grid.setpixi( i, t )
		if( t > 0 ){
			if( !this.cellvolume[t] ){
				this.cellvolume[t] = 1
			} else {
				this.cellvolume[t] ++
			}
		}
	}

	/** Change the pixel at position p into {@link CellId} t. 
		This just calls the {@link setpixi} method internally.
		
		@param {ArrayCoordinate} p - coordinate of pixel to change.
		@param {CellId} t - cellid to change this pixel into.
		*/
	setpix ( p, t ){
		this.setpixi( this.grid.p2i(p), t )
	}

	/* ------------- MATH HELPER FUNCTIONS --------------- */
	/** Get a random number from the seeded number generator.
	@return {number} a random number between 0 and 1, uniformly sampled.*/
	random (){
		return this.mt.random()
	}

	/** Get a random integer number between incl_min and incl_max, uniformly sampled.
	@param {number} incl_min - lower end of the sampling range.
	@param {number} incl_max - upper end of the sampling range. 
	@return {number} the randomly sampled integer.*/
	ran (incl_min, incl_max) {
		return Math.floor(this.random() * (1.0 + incl_max - incl_min)) + incl_min
	}

	/** Compute a statistic on this model. If necessary, this produces an object
	of the right {@link Stat} subclass and runs the compute method. Stats are 
	cached because many stats use each other; this prevents that 'expensive' stats are
	computed twice. 
	@param {Stat} s - the stat to compute.
	@return {anything} - the value of the computed stat. This is often a {@link CellObject}
	or a {@link CellArrayObject}. 
	
	@example
	* let CPM = require( "path/to/dir")
	* let C = new CPM.CPM( [200,200], {T:20, torus:[false,false]} )
	* let gm = new CPM.GridManipulator( C )
	* gm.seedCell( 1 )
	* gm.seedCell( 1 )
	* C.getStat( Centroids )
	*/
	getStat( s ){
		/* Instantiate stats class if it doesn't exist yet and bind to this model */
		if( !(s.name in this.stats) ){
			let t = new s()
			this.stats[s.name] = t
			t.model = this
			
		}
		/* Cache stat value if it hasn't been done yet */
		if( !(s.name in this.stat_values) ){
			this.stat_values[s.name] = this.stats[s.name].compute()
		}
		/* Return cached value */
		return this.stat_values[s.name]
	}
	
	/** Update the grid in one timestep. This method is model-dependent and 
	must be implemented in the subclass.
	@abstract */
	timeStep (){
		throw("implemented in subclasses")
	}
}

export default GridBasedModel 
