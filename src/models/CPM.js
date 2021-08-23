"use strict"

import GridBasedModel from "./GridBasedModel.js"
import DiceSet from "../DiceSet.js"
import AutoAdderConfig from "../hamiltonian/AutoAdderConfig.js"


/** The core CPM class. Can be used for two- or three-dimensional simulations.
*/
class CPM extends GridBasedModel {

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

		/** To check from outside if an object is a CPM; doing this with
		 * instanceof doesn't work in some cases. Any other object will
		 * not have this variable and return 'undefined', which in an
		 * if-statement equates to a 'false'.
		 * @type{boolean}*/
		this.isCPM = true

		/** Track time in MCS.
		 * @type{number}*/
		this.time = 0

		// ---------- CPM specific stuff here
		
		/** Number of non-background cells currently on the grid.
		@type{number}*/
		this.nr_cells = 0
		/** Highest cell ID previously assigned. 
		@type{number}*/
		this.last_cell_id = 0
		/** track border pixels for speed 
		@type {DiceSet}*/
		this.borderpixels = new DiceSet( this.mt )
		/** Private property used by {@link updateborderneari} to track borders. 
		@private
		@type {Uint16Array} */
		this._neighbours = new Uint16Array(this.grid.p2i(field_size))

		//  ---------- Attributes per cell:
		/** Store the {@CellKind} of each cell on the grid. 
		@example
		this.t2k[1] // cellkind of cell with cellId 1
		@type {CellObject}
		*/
		this.t2k = []	// cell type ("kind"). Example: this.t2k[1] is the cellKind of cell 1.
		this.t2k[0] = 0	// Background cell; there is just one cell of this type.

		//  ---------- CPM constraints
		/** Array of objects of (@link SoftConstraint) subclasses attached to the CPM.
		These are used to determine {@link deltaH}.
		@type {Array}*/
		this.soft_constraints = []
		/** Object showing which constraints are where in {@link soft_constraints}. Used
		by the {@link getConstraint} method to find an attached constraint by name.
		@type {object}*/
		this.soft_constraints_indices = {}
		/** Array of objects of (@link HardConstraint) subclasses attached to the CPM.
		These are used to determine which copy attempts are allowed in a {@link timeStep}.
		@type {Array}*/
		this.hard_constraints = []
		/** Object showing which constraints are where in {@link soft_constraints}. Used
		by the {@link getConstraint} method to find an attached constraint by name.
		@type {object}*/
		this.hard_constraints_indices = {}
		/** Array of functions that need to be executed after every {@link setpixi} event.
		These functions are often implemented in subclasses of {@link Constraint} that
		need to track some specific property on the grid. 
		@type {function[]}*/
		this.post_setpix_listeners = []
		/** Array of functions that need to be executed after every {@link timeStep} event.
		These functions are often implemented in subclasses of {@link Constraint} that
		need to track some specific property on the grid. 
		@type {function[]}*/
		this.post_mcs_listeners = []
		
		/* Automatically add constraints by their parameters in conf. This only works
		for some constraints specified in AutoAdderConfig. */
		for( let x of Object.keys( conf ) ){
			if( x in AutoAdderConfig ){
				this.add( new AutoAdderConfig[x]( conf ) )
			}
		}
	}

	/** Completely reset; remove all cells and set time back to zero. Only the
	 * constraints remain. */
	reset(){
		for( let p of this.cellPixels()){
			this.setpix( p[0], 0 )
		}
		this.last_cell_id = 0
		this.t2k = []
		this.t2k[0] = 0
		this.time = 0
		this.cellvolume = []
		this.stat_values = {}
	}

	/* This is no different from the GridBasedModel function and can go. 
	neigh(p, torus=this.conf.torus){
		let g = this.grid
		return g.neighi( g.p2i(p), torus ).map( function(i){ return g.i2p(i) } )
	}*/

	/** Iterator returning non-background pixels on the grid.
	@return {Pixel} for each pixel, return an array [p,v] where p are
		the pixel's array coordinates on the grid, and v its value.*/
	* cellPixels() {
		for( let p of this.grid.pixels() ){
			if( p[1] !== 0 ){
				yield p
			}
		}
	}

	/** Iterator returning non-background border pixels on the grid.
	See {@link cellBorderPixelIndices} for a version returning pixels
	by their {@link IndexCoordinate} instead of {@link ArrayCoordinate}.
	
	@return {Pixel} for each pixel, return an array [p,v] where p are
		the pixel's array coordinates on the grid, and v its value.*/
	* cellBorderPixels() {
		for( let i of this.borderpixels.elements ){
			const t = this.grid.pixti(i)
			if( t !== 0 ){
				yield [this.grid.i2p(i),t]
			}
		}
	}

	/** Iterator returning non-background border pixels on the grid.
	See {@link cellBorderPixels} for a version returning pixels
	by their {@link ArrayCoordinate} instead of {@link IndexCoordinate}.
	
	@return {iPixel} for each pixel, return an array [p,v] where p are
		the pixel's array coordinates on the grid, and v its value.*/
	* cellBorderPixelIndices() {
		for( let i of this.borderpixels.elements ){
			const t = this.grid.pixti(i)
			if( t !== 0 ){
				yield [i,t]
			}
		}
	}

	/** Add a constraint to the CPM, ensuring that its {@link SoftConstraint#deltaH} or
	{@link HardConstraint#fulfilled} methods are called appropriately during a copy attempt.
	Any postSetpixListeners and postMCSListeners are also executed at the appropriate times.
	@param {Constraint} t - the constraint object to add.
	*/
	add( t ){
		let tName = t.constructor.name, i
		if( t.CONSTRAINT_TYPE ){
			switch( t.CONSTRAINT_TYPE ){
			
			case "soft": 
				// Add constraint to the array of soft constraints
				i = this.soft_constraints.push( t )
				
				// Write this index to an array in the 
				// this.soft_constraints_indices object, for lookup later. 
				if( !this.soft_constraints_indices.hasOwnProperty(tName) ){
					this.soft_constraints_indices[tName] = []
				}
				this.soft_constraints_indices[tName].push( i-1 )
				break
				
			case "hard": 
				// Add constraint to the array of soft constraints
				i = this.hard_constraints.push( t )
				
				// Write this index to an array in the 
				// this.hard_constraints_indices object, for lookup later.
				if( !this.hard_constraints_indices.hasOwnProperty(tName) ){
					this.hard_constraints_indices[tName] = []
				}
				this.hard_constraints_indices[tName].push( i-1 )
				break
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
	
	/** Get a {@link Constraint} object linked to this CPM by the name of its class.
	By default, the first constraint found of this class is returned. It is possible
	that there are multiple constraints of the same type on the CPM; in that case,
	supply its number (by order in which the constraints of this type were added) to 
	get a specific one. 
	
	This function can be useful if you need to access information in the constraint object,
	such as the cell directions in a {@PersistenceConstraint}, from outside. You can use
	this for stuff like drawing.
	
	@param {string} constraintname - name of the constraint class you are looking for.
	@param {number} [num = 0] - if multiple constraints of this class are present, 
	return the num-th one added to the CPM. 
	*/
	getConstraint( constraintname, num ){
	
		if( !num ){
			num = 0
		}
		let i
		
		if( this.hard_constraints_indices.hasOwnProperty( constraintname ) ){
			i = this.hard_constraints_indices[constraintname][num]
			return this.hard_constraints[i]
		} else if ( this.soft_constraints_indices.hasOwnProperty( constraintname ) ){
			i = this.soft_constraints_indices[constraintname][num]
			return this.soft_constraints[i]
		} else {
			throw("No constraint of name " + " exists in this CPM!")
		}	
	
	}

	getAllConstraints(){
		const soft = Object.keys( this.soft_constraints_indices )
		const hard = Object.keys( this.hard_constraints_indices )
		let names = {}
		for( let n of soft ){ names[n] = soft[n] }
		for( let n of hard ){ names[n] = hard[n] }
		return names
	}

	/** Get {@link CellId} of the pixel at coordinates p. 
	@param {ArrayCoordinate} p - pixel to get cellid of.
	@return {CellId} ID of the cell p belongs to.*/
	pixt( p ){
		return this.grid.pixti( this.grid.p2i(p) )
	}

	/** Get volume of the cell with {@link CellId} t 
	@param {CellId} t - id of the cell to get volume of.
	@return {number} the cell's current volume. */ 
	getVolume( t ){
		return this.cellvolume[t]
	}

	/** Get the {@link CellKind} of the cell with {@link CellId} t. 
	Overwrites {@link GridBasedModel#cellKind} because in a CPM, the two are not the same.
	@param {CellId} t - id of the cell to get kind of.
	@return {CellKind} the cellkind. */
	cellKind( t ){
		return this.t2k[ t ]
	}

	/** Assign the cell with {@link CellId} t to {@link CellKind} k.
	@param {CellId} t - id of the cell to assing
	@param {CellKind} k - cellkind to give it. 
	*/
	setCellKind( t, k ){
		this.t2k[ t ] = k
	}
	
	
	/* ------------- COMPUTING THE HAMILTONIAN --------------- */

	/** returns total change in hamiltonian for all registered soft constraints together.
	 @param {IndexCoordinate} sourcei - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} targeti - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {number} the change in Hamiltonian for this copy attempt.
	*/
	deltaH ( sourcei, targeti, src_type, tgt_type ){
		let r = 0.0
		for( let t of this.soft_constraints ){
			r += t.deltaH( sourcei, targeti, src_type, tgt_type )
		}
		return r
	}
	/* ------------- COPY ATTEMPTS --------------- */

	/** Simulate one Monte Carlo Step. We now just use {@link timeStep} for consistency
	with other {@link GridBasedModel}s, but we have kept this method for compatibility
	with earlier version. Internally, it just calls {@link timeStep}.
	*/
	monteCarloStep () {
		this.timeStep()
	}
	
	/** A time step in the CPM is a Monte Carlo step. This performs a 
	  	 number of copy attempts depending on grid size:
	  	 
		1) Randomly sample one of the border pixels for the copy attempt.
		2) Compute the change in Hamiltonian for the suggested copy attempt.
		3) With a probability depending on this change, decline or accept the 
		   copy attempt and update the grid accordingly. 

		@todo TODO it is quite confusing that the "borderpixels" array also
		contains border pixels of the background.
	*/
	timeStep (){
		let delta_t = 0.0
		// this loop tracks the number of copy attempts until one MCS is completed.
		while( delta_t < 1.0 ){
			// This is the expected time (in MCS) you would expect it to take to
			// randomly draw another border pixel.
			delta_t += 1./(this.borderpixels.length)

			// sample a random pixel that borders at least 1 cell of another type,
			// and pick a random neighbour of tha pixel
			const tgt_i = this.borderpixels.sample()
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
					if( !h.fulfilled( src_i, tgt_i, src_type, tgt_type ) ){
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
		/** Cached values of these stats. Object with stat name as key and its cached
		value as value. The cache must be cleared when the grid changes!
		@type {object} */
		this.stat_values = {} // invalidate stat value cache
		for( let l of this.post_mcs_listeners ){
			l()
		}
	}	

	/** Determine whether copy attempt will succeed depending on deltaH (stochastic). 
	@param {number} deltaH - energy change associated with the potential copy.
	@return {boolean} whether the copy attempt succeeds.
	*/
	docopy ( deltaH ){
		if( deltaH < 0 ) return true
		return this.random() < Math.exp( -deltaH / this.conf.T )
	}
	
	/** Change the pixel at position i into {@link CellId} t. 
	This method overrides {@link GridBasedModel#setpixi} because we want to
	add postSetpixListeners for all the constraints, to keep track of relevant information.
	
	See also {@link setpix} for a method working with {@link ArrayCoordinate}s.
	
	@param {IndexCoordinate} i - coordinate of pixel to change.
	@param {CellId} t - cellid to change this pixel into.
	*/
	setpixi ( i, t ){		
		const t_old = this.grid.pixti(i)
		if( t_old == t ){
			return
		}
		if( t_old > 0 ){
			// also update volume of the old cell
			// (unless it is background/stroma)
			this.cellvolume[t_old] --
			
			// if this was the last pixel belonging to this cell, 
			// remove the cell altogether.
			if( this.cellvolume[t_old] == 0 ){
				delete this.cellvolume[t_old]
				delete this.t2k[t_old]
				this.nr_cells--
			}
		}
		// update volume of the new cell and cellid of the pixel.
		this.grid.setpixi(i,t)
		if( t > 0 ){
			this.cellvolume[t] ++
		}
		this.updateborderneari( i, t_old, t )
		//this.stat_values = {} // invalidate stat value cache
		for( let l of this.post_setpix_listeners ){
			l( i, t_old, t )
		}
	}

	get perimeterNeighbours(){
		return this._neighbours
	}

	/** Update border elements ({@link borderpixels}) after a successful copy attempt. 
	@listens {setpixi} because borders change when a copy succeeds.
	@param {IndexCoordinate} i - coordinate of pixel that has changed.
	@param {CellId} t_old - id of the cell the pixel belonged to before the copy.
	@param {CellId} t_new - id of the cell the pixel has changed into.
	*/
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
					this.borderpixels.insert( ni )
				}
			}
			if( nt == t_new ){
				if( --this._neighbours[ni] == 0 ){
					this.borderpixels.remove( ni )
				}
			}
		}

		if( !wasborder && this._neighbours[i] > 0 ){
			this.borderpixels.insert( i )
		}
		if( wasborder &&  this._neighbours[i] == 0 ){
			this.borderpixels.remove( i )
		}
	}

	/* ------------- MANIPULATING CELLS ON THE GRID --------------- */

	/** Initiate a new {@link CellId} for a cell of {@link CellKind} "kind", and create elements
	   for this cell in the relevant arrays (cellvolume, t2k).
	   @param {CellKind} kind - cellkind of the cell that has to be made.
	   @return {CellId} of the new cell.*/
	makeNewCellID ( kind ){
		if (this.nr_cells >= 65533){
			// here you know that there are indices available in the Uint16 range for new cellIds
			throw("Max amount of living cells exceeded!")
		}
		let newid
		do{
			newid = ++this.last_cell_id
			if (newid >= 65534){
				this.last_cell_id = 1
				newid = 1
			}
		}  while (this.cellvolume.hasOwnProperty(newid))
		this.cellvolume[newid] = 0
		this.setCellKind( newid, kind )
		return newid
	}

}

export default CPM
