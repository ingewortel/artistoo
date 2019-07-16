'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var MersenneTwister = _interopDefault(require('mersennetwister'));

class Grid {
	constructor( field_size, torus = true ){
		this.extents = field_size;
		this.torus = torus;
		this.X_BITS = 1+Math.floor( Math.log2( this.extents[0] - 1 ) );
		this.Y_BITS = 1+Math.floor( Math.log2( this.extents[1] - 1 ) );
		this.Y_MASK = (1 << this.Y_BITS)-1;
		this.midpoint = this.extents.map( i => Math.round((i-1)/2) );
	}

	neigh(p, torus = this.torus){
		let g = this;
		return g.neighi( this.p2i(p), torus ).map( function(i){ return g.i2p(i) } )
	}

	setpix( p, t ){
		this._pixels[this.p2i(p)] = t;
	}

	setpixi( i, t ){
		this._pixels[i] = t;
	}

	pixt( p ){
		return this._pixels[this.p2i(p)]
	}

	pixti( i ){
		return this._pixels[i]
	}

	/* Return locations of all non-zero pixels.

		This method isn't actually called because the subclasses implement
		it themselves due to efficiency reasons. It serves as a template to
		document the functionality. */
	* pixels() {
		for( let i of this.pixelsi() ){
			if( this._pixels[i] > 0 ){
				yield [this.i2p(i),this._pixels[i]]; 
			}
		}
	}

	* pixelsi() {
		//throw("Iterator 'pixelsi' not implemented!")
		yield undefined;
	}

	pixelsbuffer() {
		if( this._pixels instanceof Uint16Array ){
			this._pixelsbuffer = new Uint16Array(this._pixels.length);
		} else if( this._pixels instanceof Float32Array ){
			this._pixelsbuffer = new Float32Array(this._pixels.length);
		} else {
			throw("unsupported datatype: " + (typeof this._pixels))
		}
	}

	gradienti( i ){
		throw("method 'gradienti' not implemented! "+i)
	}

	gradient( p ){
		return this.gradienti( this.p2i( p ) )
	}

	laplacian( p ){
		return this.laplaciani( this.p2i( p ) )
	}

	laplaciani( i ){
		let L = 0, n = 0;
		for( let x of this.neighNeumanni(i) ){
			L += this.pixti( x ); n ++;
		} 
		return L - n * this.pixti( i )
	}

	diffusion( D ){
		if( ! this._pixelsbuffer ) this.pixelsbuffer();
		for( let i of this.pixelsi() ){
			this._pixelsbuffer[i] = this.pixti( i ) + D * this.laplaciani( i );
		}
		[this._pixelsbuffer, this._pixels] = [this._pixels, this._pixelsbuffer];
	}

	applyLocally( f ){
		if( ! this._pixelsbuffer ) this.pixelsbuffer();
		for( let i of this.pixelsi() ){
			let p = this.i2p(i);
			this._pixelsbuffer[i] = f( p, this.neigh(p) ); 
		}
		[this._pixelsbuffer, this._pixels] = [this._pixels, this._pixelsbuffer];		
	}

	multiplyBy( r ){
		for( let i of this.pixelsi() ){
			this._pixels[i] *= r; 
		}
	}

}

/** A class containing (mostly static) utility functions for dealing with 2D 
 *  and 3D grids. */

class Grid2D extends Grid {
	constructor( extents, torus=true, datatype="Uint16" ){
		super( extents, torus );
		this.X_STEP = 1 << this.Y_BITS; // for neighborhoods based on pixel index
		this.Y_MASK = this.X_STEP-1;
		// Check that the grid size is not too big to store pixel ID in 32-bit number,
		// and allow fast conversion of coordinates to unique ID numbers.
		if( this.X_BITS + this.Y_BITS > 32 ){
			throw("Field size too large -- field cannot be represented as 32-bit number")
		}
		// Attributes per pixel:
		// celltype (identity) of the current pixel.
		if( datatype == "Uint16" ){
			this._pixels = new Uint16Array(this.p2i(this.extents));
		} else if( datatype == "Float32" ){
			this._pixels = new Float32Array(this.p2i(this.extents));
		} else {
			throw("unsupported datatype: " + datatype)
		}
	}

	* pixelsi() {
		let ii = 0, c = 0;
		for( let i = 0 ; i < this.extents[0] ; i ++ ){
			for( let j = 0 ; j < this.extents[1] ; j ++ ){
				yield ii;
				ii ++;
			}
			c += this.X_STEP;
			ii = c;
		}
	}

	* pixels() {
		let ii = 0, c = 0;
		// Loop over coordinates [i,j] on the grid
		// For each pixel with cellid != 0 (so non-background pixels), 
		// return an array with in the first element the pixel 
		// coordinates p = [i,j], and in the second element the cellid of this pixel.
		for( let i = 0 ; i < this.extents[0] ; i ++ ){
			for( let j = 0 ; j < this.extents[1] ; j ++ ){
				if( this._pixels[ii] > 0 ){
					yield [[i,j], this._pixels[ii]];
				}
				ii ++;
			}
			c += this.X_STEP;
			ii = c;
		}
	}

	/*	Return array of indices of neighbor pixels of the pixel at 
		index i. The separate 2D and 3D functions are called by
		the wrapper function neighi, depending on this.ndim.

	*/
	neighisimple( i ){
		let p = this.i2p(i);
		let xx = [];
		for( let d = 0 ; d <= 1 ; d ++ ){
			if( p[d] == 0 ){
				if( this.torus[d] ){
					xx[d] = [p[d],this.extents[d]-1,p[d]+1];
				} else {
					xx[d] = [p[d],p[d]+1];
				}
			} else if( p[d] == this.extents[d]-1 ){
				if( this.torus[d] ){
					xx[d] = [p[d],p[d]-1,0];
				} else {
					xx[d] = [p[d],p[d]-1];
				}
			} else {
				xx[d] = [p[d],p[d]-1,p[d]+1];
			}
		}

		let r = [], first=true;
		for( let x of xx[0] ){
			for( let y of xx[1] ){
				if( first ){
					first = false; 
				} else {
					r.push( this.p2i( [x,y] ) );
				}
			}
		}
		return r
	}

	* neighNeumanni( i, torus = this.torus ){
		// normal computation of neighbor indices (top left-middle-right, 
		// left, right, bottom left-middle-right)
		let t = i-1, l = i-this.X_STEP, r = i+this.X_STEP, b = i+1;
		
		// if pixel is part of one of the borders, adjust the 
		// indices accordingly
		// if torus is false, return NaN for all neighbors that cross
		// the border.

		// left border
		if( i < this.extents[1] ){
			if( torus ){
				l += this.extents[0] * this.X_STEP;
				yield l;
			} 
		} else {
			yield l;
		}
		// right border
		if( i >= this.X_STEP*( this.extents[0] - 1 ) ){
			if( torus ){
				r -= this.extents[0] * this.X_STEP;
				yield r;
			}
		} else {
			yield r;
		}
		// top border
		if( i % this.X_STEP == 0 ){
			if( torus ){
				t += this.extents[1];
				yield t;
			} 
		} else {
			yield t;
		}
		// bottom border
		if( (i+1-this.extents[1]) % this.X_STEP == 0 ){
			if( torus ){
				b -= this.extents[1];
				yield b;
			} 
		} else {
			yield b;
		}
	}

	neighi( i, torus = this.torus ){	
		// normal computation of neighbor indices (top left-middle-right, 
		// left, right, bottom left-middle-right)
		let tl, tm, tr, l, r, bl, bm, br;
		
		tl = i-1-this.X_STEP; tm = i-1; tr = i-1+this.X_STEP;
		l = i-this.X_STEP; r = i+this.X_STEP;
		bl = i+1-this.X_STEP; bm = i+1; br = i+1+this.X_STEP;
		
		// if pixel is part of one of the borders, adjust the 
		// indices accordingly
		let add = NaN; // if torus is false, return NaN for all neighbors that cross
		// the border.
		// 
		// left border
		if( i < this.extents[1] ){
			if( torus ){
				add = this.extents[0] * this.X_STEP;
			}
			tl += add; l += add; bl += add; 	
		}
		
		// right border
		if( i >= this.X_STEP*( this.extents[0] - 1 ) ){
			if( torus ){
				add = -this.extents[0] * this.X_STEP;
			}
			tr += add; r += add; br += add;
		}

		// top border
		if( i % this.X_STEP == 0 ){
			if( torus ){
				add = this.extents[1];
			}
			tl += add; tm += add; tr += add;	
		}
		
		// bottom border
		if( (i+1-this.extents[1]) % this.X_STEP == 0 ){
			if( torus ){
				add = -this.extents[1];
			}
			bl += add; bm += add; br += add;
		}
		if( !torus ){
			return [ tl, l, bl, tm, bm, tr, r, br ].filter( isFinite )
		} else {
			return [ tl, l, bl, tm, bm, tr, r, br ]
		}
	}
	p2i ( p ){
		return ( p[0] << this.Y_BITS ) + p[1]
	}
	i2p ( i ){
		return [i >> this.Y_BITS, i & this.Y_MASK]
	}
	gradienti( i ){
		let t = i-1, b = i+1, l = i-this.X_STEP, r = i+this.X_STEP, torus = this.torus;
		
		let dx=0;
		if( i < this.extents[1] ){ // left border
			if( torus ){
				l += this.extents[0] * this.X_STEP;
				dx = ((this._pixels[r]-this._pixels[i])+
					(this._pixels[i]-this._pixels[l]))/2;
			} else {
				dx = this._pixels[r]-this._pixels[i];
			}
		} else { 
			if( i >= this.X_STEP*( this.extents[0] - 1 ) ){ // right border
				if( torus ){
					r -= this.extents[0] * this.X_STEP;
					dx = ((this._pixels[r]-this._pixels[i])+
						(this._pixels[i]-this._pixels[l]))/2;
				} else {
					dx = this._pixels[i]-this._pixels[l];
				}
			} else {
				dx = ((this._pixels[r]-this._pixels[i])+
					(this._pixels[i]-this._pixels[l]))/2;
			}
		}

		let dy=0;
		if( i % this.X_STEP == 0 ){ // top border
			if( torus ){
				t += this.extents[1];
				dy = ((this._pixels[b]-this._pixels[i])+
					(this._pixels[i]-this._pixels[t]))/2;
			}	else {
				dy = this._pixels[b]-this._pixels[i];
			}
		} else { 
			if( (i+1-this.extents[1]) % this.X_STEP == 0 ){ // bottom border
				if( torus ){
					b -= this.extents[1];
					dy = ((this._pixels[b]-this._pixels[i])+
						(this._pixels[i]-this._pixels[t]))/2;
				} else {
					dy = this._pixels[i]-this._pixels[t];
				}
			} else {
				dy = ((this._pixels[b]-this._pixels[i])+
					(this._pixels[i]-this._pixels[t]))/2;
			}
		}
		return [
			dx, dy
		]
	}
}

/** A class containing (mostly static) utility functions for dealing with 2D 
 *  and 3D grids. */

class Grid3D extends Grid {
	constructor( extents, torus = true ){
		super( extents, torus );
		// Check that the grid size is not too big to store pixel ID in 32-bit number,
		// and allow fast conversion of coordinates to unique ID numbers.
		this.Z_BITS = 1+Math.floor( Math.log2( this.extents[2] - 1 ) );
		if( this.X_BITS + this.Y_BITS + this.Z_BITS > 32 ){
			throw("Field size too large -- field cannot be represented as 32-bit number")
		}
		this.Z_MASK = (1 << this.Z_BITS)-1;
		this.Z_STEP = 1;
		this.Y_STEP = 1 << (this.Z_BITS);
		this.X_STEP = 1 << (this.Z_BITS +this.Y_BITS);
		this._pixels = new Uint16Array(this.p2i(extents));
	}
	/* 	Convert pixel coordinates to unique pixel ID numbers and back.
		Depending on this.ndim, the 2D or 3D version will be used by the 
		wrapper functions p2i and i2p. Use binary encoding for speed. */
	p2i( p ){
		return ( p[0] << ( this.Z_BITS + this.Y_BITS ) ) + 
			( p[1] << this.Z_BITS ) + 
			p[2]
	}
	i2p( i ){
		return [i >> (this.Y_BITS + this.Z_BITS), 
			( i >> this.Z_BITS ) & this.Y_MASK, i & this.Z_MASK ]
	}

	* pixelsi() {
		let ii = 0, c = 0;
		for( let i = 0 ; i < this.extents[0] ; i ++ ){
			let d = 0;
			for( let j = 0 ; j < this.extents[1] ; j ++ ){
				for( let k = 0 ; k < this.extents[2] ; k ++ ){
					yield ii;
					ii++;
				}
				d += this.Y_STEP;
				ii = c + d;
			}
			c += this.X_STEP;
			ii = c;
		}
	}

	* pixels() {
		let ii = 0, c = 0;
		for( let i = 0 ; i < this.extents[0] ; i ++ ){
			let d = 0;
			for( let j = 0 ; j < this.extents[1] ; j ++ ){
				for( let k = 0 ; k < this.extents[2] ; k ++ ){
					if( this._pixels[ii] > 0 ){
						yield [[i,j,k], this._pixels[ii]];
					}
					ii++;
				}
				d += this.Y_STEP;
				ii = c + d;
			}
			c += this.X_STEP;
			ii = c;
		}
	}

	neighi( i, torus = this.torus ){
		let p = this.i2p(i);

		let xx = [];
		for( let d = 0 ; d <= 2 ; d ++ ){
			if( p[d] == 0 ){
				if( torus ){
					xx[d] = [p[d],this.extents[d]-1,p[d]+1];
				} else {
					xx[d] = [p[d],p[d]+1];
				}
			} else if( p[d] == this.extents[d]-1 ){
				if( torus ){
					xx[d] = [p[d],p[d]-1,0];
				} else {
					xx[d] = [p[d],p[d]-1];
				}
			} else {
				xx[d] = [p[d],p[d]-1,p[d]+1];
			}
		}
		let r = [], first=true;
		for( let x of xx[0] ){
			for( let y of xx[1] ){
				for( let z of xx[2] ){
					if( first ){
						first = false; 
					} else {
						r.push( this.p2i( [x,y,z] ) );
					}
				}
			}
		}
		return r
	}
}

/** The core CPM class. Can be used for two- or 
 * three-dimensional simulations. 
*/

class GridBasedModel {

	constructor( extents, conf ){
		let seed = conf.seed || Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
		this.mt = new MersenneTwister( seed );
		if( !("torus" in conf) ){
			conf["torus"] = true;
		}

		// Attributes based on input parameters
		this.ndim = extents.length; // grid dimensions (2 or 3)
		if( this.ndim != 2 && this.ndim != 3 ){
			throw("only 2D and 3D models are implemented!")
		}
		this.conf = conf; // input parameter settings; see documentation.

		// Some functions/attributes depend on ndim:
		if( this.ndim == 2 ){
			this.grid = new Grid2D(extents,conf.torus);
		} else {
			this.grid = new Grid3D(extents,conf.torus);
		}
		// Pull up some things from the grid object so we don't have to access it
		// from the outside
		this.midpoint = this.grid.midpoint;
		this.field_size = this.grid.field_size;
		this.pixels = this.grid.pixels.bind(this.grid);
		this.pixti = this.grid.pixti.bind(this.grid);
		this.neighi = this.grid.neighi.bind(this.grid);
		this.extents = this.grid.extents;

		this.cellvolume = [];

		this.stats = [];
		this.stat_values = {};
	}

	cellKind( t ){
		return t 
	}

	* cellIDs() {
		yield* Object.keys( this.cellvolume );
	}

	/* Get neighbourhood of position p */
	neigh(p, torus=this.conf.torus){
		let g = this.grid;
		return g.neighi( g.p2i(p), torus ).map( function(i){ return g.i2p(i) } )
	}

	/* Get celltype/identity (pixt) or cellkind (pixk) of the cell at coordinates p or index i. */
	pixt( p ){
		return this.grid.pixti( this.grid.p2i(p) )
	}

	/* Change the pixel at position p (coordinates) into cellid t. 
		This standard implementation also keeps track of cell volumes
		for all nonzero cell IDs. Subclasses may want to do more, 
		such as also keeping track of perimeters or even centroids.
		In that case, this method needs to be overridden. */
	setpixi ( i, t ){		
		const t_old = this.grid.pixti(i);
		if( t_old > 0 ){
			// also update volume of the old cell
			this.cellvolume[t_old] --;
			// if this was the last pixel belonging to this cell, 
			// remove the cell altogether.
			if( this.cellvolume[t_old] == 0 ){
				delete this.cellvolume[t_old];
			}
		}
		// update volume of the new cell and cellid of the pixel.
		this.grid.setpixi( i, t );
		if( t > 0 ){
			if( !this.cellvolume[t] ){
				this.cellvolume[t] = 1;
			} else {
				this.cellvolume[t] ++;
			}
		}
	}

	setpix ( p, t ){
		this.setpixi( this.grid.p2i(p), t );
	}

	/* ------------- MATH HELPER FUNCTIONS --------------- */
	random (){
		return this.mt.rnd()
	}

	/* Random integer number between incl_min and incl_max */
	ran (incl_min, incl_max) {
		return Math.floor(this.random() * (1.0 + incl_max - incl_min)) + incl_min
	}

	getStat( s ){
		/* Instantiate stats class if it doesn't exist yet and bind to this model */
		if( !(s.name in this.stats) ){
			let t = new s();
			this.stats[s.name] = t;
			t.model = this;
			
		}
		/* Cache stat value if it hasn't been done yet */
		if( !(s.name in this.stat_values) ){
			this.stat_values[s.name] = this.stats[s.name].compute();
		}
		/* Return cached value */
		return this.stat_values[s.name]
	}
	
	/* ------------- COMPUTING THE HAMILTONIAN --------------- */
	
	timeStep (){
		throw("implemented in subclasses")
	}
}

/** The core CPM class. Can be used for two- or 
 * three-dimensional simulations. 
*/

class CA extends GridBasedModel {
	constructor( extents, conf ){
		super( extents, conf );
		this.updateRule = conf["UPDATE_RULE"].bind(this);
	}

	timeStep(){
		this.grid.applyLocally( this.updateRule );
		this.stat_values = {};
	}
}

/** This class implements a data structure with constant-time insertion, deletion, and random
    sampling. That's crucial for the CPM metropolis algorithm, which repeatedly needs to sample
    pixels at cell borders. */

// pass in RNG
class DiceSet{
	constructor( mt ) {

		// Use a hash map to check in constant time whether a pixel is at a cell border.
		// 
		// Currently (Mar 6, 2019), it seems that vanilla objects perform BETTER than ES6 maps,
		// at least in nodejs. This is weird given that in vanilla objects, all keys are 
		// converted to strings, which does not happen for Maps
		// 
		this.indices = {}; //new Map() // {}
		//this.indices = {}

		// Use an array for constant time random sampling of pixels at the border of cells.
		this.elements = [];

		// track the number of pixels currently present in the DiceSet.
		this.length = 0;

		this.mt = mt;
	}

	insert( v ){
		if( this.indices[v] ){
			return
		}
		// Add element to both the hash map and the array.
		//this.indices.set( v, this.length )
		this.indices[v] = this.length;
	
		this.elements.push( v );
		this.length ++; 
	}

	remove( v ){
		// Check whether element is present before it can be removed.
		if( !this.indices[v] ){
			return
		}
		/* The hash map gives the index in the array of the value to be removed.
		The value is removed directly from the hash map, but from the array we
		initially remove the last element, which we then substitute for the 
		element that should be removed.*/
		//const i = this.indices.get(v)
		const i = this.indices[v];

		//this.indices.delete(v)
		delete this.indices[v];

		const e = this.elements.pop();
		this.length --;
		if( e == v ){
			return
		}
		this.elements[i] = e;

		//this.indices.set(e,i)
		this.indices[e] = i;
	}

	contains( v ){
		//return this.indices.has(v)
		return (v in this.indices)
	}

	sample(){
		return this.elements[Math.floor(this.mt.rnd()*this.length)]
	}
}

class Constraint {
	get CONSTRAINT_TYPE() {
		throw("You need to implement the 'CONSTRAINT_TYPE' getter for this constraint!")
	}
	get parameters(){
		return null
	}
	constructor( conf ){
		this.conf = conf;
	}
	set CPM(C){
		this.C = C;
		if( typeof this.confChecker === "function" ){
			this.confChecker();
		}
	}
	/* The optional confChecker method should verify that all the required conf parameters
	are actually present in the conf object and have the right format.*/
	confChecker( ){
	}

	// Check if the property exists at all
	confCheckPresenceOf( name ){
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		
	}

	confCheckTypeOf( name, type ){
		this.confCheckPresenceOf( name );
		// Check if the property has the right type
		if( !( typeof this.conf[name] === type ) ){
			throw( "Conf object parameter " + name + " should be a " + type +"!" )
		}
	}

	/* Helper check function for parameters that should be a single string,
	which can take on one of the values in 'values'*/
	confCheckString( name, values ){
		this.confCheckPresenceOf( name );
		this.confCheckTypeOf( name, "string" );

		// Check if the property has one of the allowed values.
		let valueFound = false;
		for( let v of values ){
			if ( this.conf[name] == v ){
				valueFound = true;
			}
		}
		
		if( !valueFound ){
			throw( "Conf object parameter " + name + " has invalid value " + this.conf[name] + 
				"! Please choose from: " + values.join( " / " ) )
		}
	}
	/* Checker for parameters that should be a single number.*/
	confCheckNumber( name ){
		this.confCheckTypeOf( name, "number" );
	}
	
	/* Checker for parameters that should be a single non-negative number*/
	confCheckSingleNonNegative( name ){
		this.confCheckNumber( name );
		if ( this.conf[name] < 0 ){
			throw( "Conf object parameter " + name + " should be non-negative!" )
		}
	}
	
	/* Helper function. Some parameters need to be specified for each cellkind, 
	so to check those we first need to know the number of cellkinds.*/
	confCheckCellKinds( n_default ){
		if( !this.C ){
			throw("confCheck method called before addition to CPM!")
		}
		if( !("n_cell_kinds" in this.C) ){
			this.C.n_cell_kinds = n_default - 1;
		}
		return this.C.n_cell_kinds
	}

	confCheckArray( name, type ){
		this.confCheckPresenceOf( name );
		let p = this.conf[name];
		if( !(p instanceof Array) ){
			throw( "Parameter " + name + " is not an array!" )
		}
		
		// Check if the property has the right type
		let n_cell_kinds = this.confCheckCellKinds( p.length );
		if( this.conf[name].length != n_cell_kinds + 1 ){
			throw( "Conf object parameter " + name + 
			" should be an array with an element for each cellkind including background!" )
		}
		
		// Check if the property has the right value.
		for( let e of this.conf[name] ){
			if( ! ( typeof e === type ) ){
				throw( "Conf object parameter " + name + 
					" should be an array with "+type+"s!" )
			}
		}
	}

	/* Checker for parameters that come in an array with a number for each cellkind. */
	confCheckCellNumbers( name ){
		this.confCheckArray( name, "number" );
	}
	
	/* Same as confCheckCellNumbers, but now numbers should also not be negative*/
	confCheckCellNonNegative( name ){
		this.confCheckCellNumbers( name );
		for( let e of this.conf[name] ){
			if( e < 0 ){
				throw( "Elements of parameter " + name + " should be non-negative!" )
			}
		}
	}
	
	/* Same as confCheckCellNonNegative, but now numbers should be between 0 and 1*/
	confCheckCellProbability( name ){
		this.confCheckCellNumbers( name );
		for( let e of this.conf[name] ){
			if( e < 0 ){
				throw( "Elements of parameter " + name + " should be between 0 and 1!" )
			}
			if( e > 1 ){
				throw( "Elements of parameter " + name + " should be between 0 and 1!" )			
			}
		}
	}
	
	/* Same as confCheckCellNumbers, but now values should be boolean */
	confCheckCellBoolean( name ){
		this.confCheckArray( name, "boolean" );
	}
	
	/* Now the format should be a 'matrix' with rows and columns of numbers for each cellkind. */
	confCheckCellMatrix( name, type="number" ){
		this.confCheckPresenceOf( name );
		let p = this.conf[name];
		if( !(p instanceof Array) ){
			throw( "Parameter " + name + " is not an array!" )
		}

		// Check if the property has the right type
		let n_cell_kinds = this.confCheckCellKinds( p.length );
		if( !( p.length == n_cell_kinds + 1 ) ){
			throw( "Conf object parameter " + name + 
			" must be an array with a sub-array for each cellkind including background!" )
		}
		
		for( let e of this.conf[name] ){
			if( ! ( e.length == n_cell_kinds + 1 ) ){
				throw( "Sub-arrays of " + name + 
				" must have an element for each cellkind including background!" )
			}
			for( let ee of e ){
				if( !(typeof ee === type ) ){
					throw("Elements in conf parameter " + name + " must all be numbers/NaN!" )
				}
			}
		}
	}
}

class SoftConstraint extends Constraint {
	get CONSTRAINT_TYPE() {
		return "soft"
	}
	// eslint-disable-next-line no-unused-vars
	deltaH( src_i, tgt_i, src_type, tgt_type ){
		throw("You need to implement the 'deltaH' method for this constraint!")
	}
}

/** 
 * Implements the adhesion constraint of Potts models. 
 */

class Adhesion extends SoftConstraint {
	/* Check if conf parameters are correct format*/
	confChecker(){
		this.confCheckCellMatrix("J");
	}


	/*  Get adhesion between two cells with type (identity) t1,t2 from "conf" using "this.par". */
	J( t1, t2 ){
		return this.conf["J"][this.C.cellKind(t1)][this.C.cellKind(t2)]
	}
	/*  Returns the Hamiltonian around pixel p, which has ID (type) tp (surrounding pixels'
	 *  types are queried). This Hamiltonian only contains the neighbor adhesion terms.
	 */
	H( i, tp ){
		let r = 0, tn;
		/* eslint-disable */
		const N = this.C.grid.neighi( i );
		for( let j = 0 ; j < N.length ; j ++ ){
			tn = this.C.pixti( N[j] );
			if( tn != tp ) r += this.J( tn, tp );
		}
		return r
	}
	deltaH( sourcei, targeti, src_type, tgt_type ){
		return this.H( targeti, src_type ) - this.H( targeti, tgt_type )
	}
}

/** 
 * Implements the adhesion constraint of Potts models. 
 */

class VolumeConstraint extends SoftConstraint {
	confChecker(){
		this.confCheckCellNonNegative( "LAMBDA_V" );
		this.confCheckCellNonNegative( "V" );
	}

	deltaH( sourcei, targeti, src_type, tgt_type ){
		// volume gain of src cell
		let deltaH = this.volconstraint( 1, src_type ) - 
			this.volconstraint( 0, src_type );
		// volume loss of tgt cell
		deltaH += this.volconstraint( -1, tgt_type ) - 
			this.volconstraint( 0, tgt_type );
		return deltaH
	}
	/* ======= VOLUME ======= */

	/* The volume constraint term of the Hamiltonian for the cell with id t.
	   Use vgain=0 for energy of current volume, vgain=1 for energy if cell gains
	   a pixel, and vgain = -1 for energy if cell loses a pixel. 
	*/
	volconstraint ( vgain, t ){
		const k = this.C.cellKind(t), l = this.conf["LAMBDA_V"][k];
		// the background "cell" has no volume constraint.
		if( t == 0 || l == 0 ) return 0
		const vdiff = this.conf["V"][k] - (this.C.getVolume(t) + vgain);
		return l*vdiff*vdiff
	}
}

/* 
	Implements the activity constraint of Potts models. 
	See also: 
		Niculescu I, Textor J, de Boer RJ (2015) 
 		Crawling and Gliding: A Computational Model for Shape-Driven Cell Migration. 
 		PLoS Comput Biol 11(10): e1004280. 
 		https://doi.org/10.1371/journal.pcbi.1004280
 */

class ActivityConstraint extends SoftConstraint {
	constructor( conf ){
		super( conf );

		this.cellpixelsact = {}; // activity of cellpixels with a non-zero activity
		
		// Wrapper: select function to compute activities based on ACT_MEAN in conf
		if( this.conf.ACT_MEAN == "arithmetic" ){
			this.activityAt = this.activityAtArith;
		} else {
			this.activityAt = this.activityAtGeom;
		}
		
	}
	
	confChecker(){
		this.confCheckString( "ACT_MEAN" , [ "geometric", "arithmetic" ] );
		this.confCheckCellNonNegative( "LAMBDA_ACT" );
		this.confCheckCellNonNegative( "MAX_ACT" );
	}
	
	/* ======= ACT MODEL ======= */

	/* Act model : compute local activity values within cell around pixel i.
	 * Depending on settings in conf, this is an arithmetic (activityAtArith)
	 * or geometric (activityAtGeom) mean of the activities of the neighbors
	 * of pixel i.
	 */
	/* Hamiltonian computation */ 
	deltaH ( sourcei, targeti, src_type, tgt_type ){

		let deltaH = 0, maxact, lambdaact;
		const src_kind = this.C.cellKind( src_type );
		const tgt_kind = this.C.cellKind( tgt_type );

		// use parameters for the source cell, unless that is the background.
		// In that case, use parameters of the target cell.
		if( src_type != 0 ){
			maxact = this.conf["MAX_ACT"][src_kind];
			lambdaact = this.conf["LAMBDA_ACT"][src_kind];
		} else {
			// special case: punishment for a copy attempt from background into
			// an active cell. This effectively means that the active cell retracts,
			// which is different from one cell pushing into another (active) cell.
			maxact = this.conf["MAX_ACT"][tgt_kind];
			lambdaact = this.conf["LAMBDA_ACT"][tgt_kind];
		}
		if( maxact == 0 || lambdaact == 0 ){
			return 0
		}

		// compute the Hamiltonian. The activityAt method is a wrapper for either activityAtArith
		// or activityAtGeom, depending on conf (see constructor).	
		deltaH += lambdaact*(this.activityAt( targeti ) - this.activityAt( sourcei ))/maxact;
		return deltaH
	}

	/* Activity mean computation methods for arithmetic/geometric mean.
	The method used by activityAt is defined by conf ( see constructor ).*/
	activityAtArith( i ){
		const t = this.C.pixti( i );
		
		// no activity for background/stroma
		if( t <= 0 ){ return 0 }
		
		// neighborhood pixels
		const N = this.C.neighi(i);
		
		// r activity summed, nN number of neighbors
		// we start with the current pixel. 
		let r = this.pxact(i), nN = 1;
		
		// loop over neighbor pixels
		for( let j = 0 ; j < N.length ; j ++ ){ 
			const tn = this.C.pixti( N[j] ); 
			
			// a neighbor only contributes if it belongs to the same cell
			if( tn == t ){
				r += this.pxact( N[j] );
				nN ++; 
			}
		}

		// average is summed r divided by num neighbors.
		return r/nN
	}
	activityAtGeom ( i ){
		const t = this.C.pixti( i );

		// no activity for background/stroma
		if( t <= 0 ){ return 0 }
		
		//neighborhood pixels
		const N = this.C.neighi( i );
		
		// r activity product, nN number of neighbors.
		// we start with the current pixel.
		let nN = 1, r = this.pxact( i );

		// loop over neighbor pixels
		for( let j = 0 ; j < N.length ; j ++ ){ 
			const tn = this.C.pixti( N[j] ); 

			// a neighbor only contributes if it belongs to the same cell.
			// if it does and has activity 0, the product will also be zero so
			// we can already return.
			if( tn == t ){
				if( this.pxact( N[j] ) == 0 ) return 0
				r *= this.pxact( N[j] );
				nN ++; 
			}
		}
		
		// Geometric mean computation. 
		return Math.pow(r,1/nN)
	}


	/* Current activity (under the Act model) of the pixel with ID i. */
	pxact ( i ){
		// If the pixel is not in the cellpixelsact object, it has activity 0.
		// Otherwise, its activity is stored in the object.
		return this.cellpixelsact[i] || 0
	}
	
	/* eslint-disable no-unused-vars*/
	postSetpixListener( i, t_old, t ){
		// After setting a pixel, it gets the MAX_ACT value of its cellkind.
		const k = this.C.cellKind( t );
		this.cellpixelsact[i] = this.conf["MAX_ACT"][k];
	}
	
	postMCSListener(){
		// iterate over cellpixelsage and decrease all activities by one.
		for( let key in this.cellpixelsact ){
			// activities that reach zero no longer need to be stored.
			if( --this.cellpixelsact[ key ] <= 0 ){
				delete this.cellpixelsact[ key ];
			}
		}
	}


}

/** 
 * Implements the adhesion constraint of Potts models. 
 */

class PerimeterConstraint extends SoftConstraint {
	constructor( conf ){
		super( conf );
		this.cellperimeters = {};
	}
	confChecker(){
		this.confCheckCellNonNegative( "LAMBDA_P" );
		this.confCheckCellNonNegative( "P" );
	}
	
	postSetpixListener( i, t_old, t_new ){
		if( t_old == t_new ){ return }
		const Ni = this.C.neighi( i );
		let n_new = 0, n_old = 0;
		for( let i = 0 ; i < Ni.length ; i ++  ){
			const nt = this.C.pixti(Ni[i]);
			if( nt != t_new ){
				n_new ++; 
			}
			if( nt != t_old ){
				n_old ++;
			}
			if( nt != 0 ){
				if( nt == t_old ){
					this.cellperimeters[nt] ++;
				}
				if( nt == t_new ){
					this.cellperimeters[nt] --;
				}
			}
		}
		if( t_old != 0 ){
			this.cellperimeters[t_old] -= n_old;
		}
		if( t_new != 0 ){
			if( !(t_new in this.cellperimeters) ){
				this.cellperimeters[t_new] = 0;
			}
			this.cellperimeters[t_new] += n_new;
		}
	}
	deltaH( sourcei, targeti, src_type, tgt_type ){
		if( src_type == tgt_type ){
			return 0
		}
		const ts = this.C.cellKind(src_type);
		const ls = this.conf["LAMBDA_P"][ts];
		const tt = this.C.cellKind(tgt_type);
		const lt = this.conf["LAMBDA_P"][tt];
		if( !(ls>0) && !(lt>0) ){
			return 0
		}
		const Ni = this.C.neighi( targeti );
		let pchange = {};
		pchange[src_type] = 0; pchange[tgt_type] = 0;
		for( let i = 0 ; i < Ni.length ; i ++  ){
			const nt = this.C.pixti(Ni[i]);
			if( nt != src_type ){
				pchange[src_type]++; 
			}
			if( nt != tgt_type ){
				pchange[tgt_type]--;
			}
			if( nt == tgt_type ){
				pchange[nt] ++;
			}
			if( nt == src_type ){
				pchange[nt] --;
			}
		}
		let r = 0.0;
		if( ls > 0 ){
			const pt = this.conf["P"][ts],
				ps = this.cellperimeters[src_type];
			const hnew = (ps+pchange[src_type])-pt,
				hold = ps-pt;
			r += ls*((hnew*hnew)-(hold*hold));
		}
		if( lt > 0 ){
			const pt = this.conf["P"][tt],
				ps = this.cellperimeters[tgt_type];
			const hnew = (ps+pchange[tgt_type])-pt,
				hold = ps-pt;
			r += lt*((hnew*hnew)-(hold*hold));
		}
		// eslint-disable-next-line
		//console.log( r )
		return r
	}
}

class HardConstraint extends Constraint {
	get CONSTRAINT_TYPE() {
		return "hard"
	}
	/*constructor( conf ){
		this.conf = conf
	}*/
	set CPM(C){
		this.C = C;
	}
	// eslint-disable-next-line no-unused-vars
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
		throw("You need to implement the 'fulfilled' method for this constraint!")
	}
}

/** 
 * Allows a "barrier" celltype from and into which copy attempts are forbidden. 
 */

class BarrierConstraint extends HardConstraint {
	confChecker(){
		this.confCheckCellBoolean( "IS_BARRIER" );
	}

	fulfilled( src_i, tgt_i, src_type, tgt_type ){
	
		// Fulfilled = false when either src or tgt pixel is of the barrier cellkind	
		if( this.conf["IS_BARRIER"][this.C.cellKind( src_type ) ] ){
			return false
		}

		if( this.conf["IS_BARRIER"][this.C.cellKind( tgt_type ) ] ){
			return false
		}

		return true
	}
}

/* This class enables automatic addition of Hamiltonian terms to a CPM
 * through their parameter names.
 *
 * For each parameter name, we specify one Hamiltonian term. If the parameter
 * is present, then a new instance of this term is initialized with the CPM's
 * configuration as parameter and added to the CPM. */

let AutoAdderConfig = {
	J : Adhesion,
	LAMBDA_V : VolumeConstraint,
	LAMBDA_ACT : ActivityConstraint,
	LAMBDA_P : PerimeterConstraint,
	IS_BARRIER : BarrierConstraint
};

/** The core CPM class. Can be used for two- or 
 * three-dimensional simulations. 
*/

class CPM extends GridBasedModel {
	constructor( field_size, conf ){
		super( field_size, conf );

		// CPM specific stuff here
		this.nr_cells = 0;				// number of cells currently in the grid
		// track border pixels for speed (see also the DiceSet data structure)
		this.borderpixels = new DiceSet( this.mt );

		// Attributes per cell:
		this.t2k = [];	// celltype ("kind"). Example: this.t2k[1] is the celltype of cell 1.
		this.t2k[0] = 0;	// Background cell; there is just one cell of this type.

		this.soft_constraints = [];
		this.soft_constraints_indices = {};
		this.hard_constraints = [];
		this.hard_constraints_indices ={};
		this.post_setpix_listeners = [];
		this.post_mcs_listeners = [];
		this._neighbours = new Uint16Array(this.grid.p2i(field_size));

		for( let x of Object.keys( conf ) ){
			if( x in AutoAdderConfig ){
				this.add( new AutoAdderConfig[x]( conf ) );
			}
		}
	}

	neigh(p, torus=this.conf.torus){
		let g = this.grid;
		return g.neighi( g.p2i(p), torus ).map( function(i){ return g.i2p(i) } )
	}

	* cellPixels() {
		for( let p of this.grid.pixels() ){
			if( p[1] != 0 ){
				yield p;
			}
		}
	}

	* cellBorderPixels() {
		for( let i of this.borderpixels.elements ){
			const t = this.pixti(i);
			if( t != 0 ){
				yield [this.grid.i2p(i),t];
			}
		}
	}

	* cellBorderPixelIndices() {
		for( let i of this.borderpixels.elements ){
			const t = this.pixti(i);
			if( t != 0 ){
				yield [i,t];
			}
		}
	}


	add( t ){
		let tname = t.constructor.name, currentindex;
		if( t instanceof Constraint ){
			switch( t.CONSTRAINT_TYPE ){
			
			case "soft": 
				// Add constraint to the array of soft constraints
				this.soft_constraints.push( t );
				
				// Find index of this constraint in this array
				currentindex = this.soft_constraints.length - 1;
				
				// Write this index to an array in the 
				// this.soft_constraints_indices object, for lookup later. 
				if( !this.soft_constraints_indices.hasOwnProperty(tname) ){
					this.soft_constraints_indices[tname] = [];
				}
				this.soft_constraints_indices[tname].push( currentindex );
				break
				
			case "hard": 
				// Add constraint to the array of soft constraints
				this.hard_constraints.push( t );
				
				// Find index of this constraint in this array
				currentindex = this.hard_constraints.length - 1;
				// Write this index to an array in the 
				// this.soft_constraints_indices object, for lookup later. 
				if( !this.hard_constraints_indices.hasOwnProperty(tname) ){
					this.hard_constraints_indices[tname] = [];
				}
				this.hard_constraints_indices[tname].push( currentindex );				
				break
			}
		}
		if( typeof t["postSetpixListener"] === "function" ){
			this.post_setpix_listeners.push( t.postSetpixListener.bind(t) );
		}
		if( typeof t["postMCSListener"] === "function" ){
			this.post_mcs_listeners.push( t.postMCSListener.bind(t) );
		}
		t.CPM = this;
		if( typeof t["postAdd"] === "function" ){
			t.postAdd();
		}
	}
	
	getConstraint( constraintname, num ){
	
		if( !num ){
			num = 0;
		}
		let i;
		
		if( this.hard_constraints_indices.hasOwnProperty( constraintname ) ){
			i = this.hard_constraints_indices[constraintname][num];
			return this.hard_constraints[i]
		} else if ( this.soft_constraints_indices.hasOwnProperty( constraintname ) ){
			i = this.soft_constraints_indices[constraintname][num];
			return this.soft_constraints[i]
		} else {
			throw("No constraint of name " + " exists in this CPM!")
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
		this.t2k[ t ] = k;
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

	// returns both change in hamiltonian for all registered soft constraints
	deltaH ( sourcei, targeti, src_type, tgt_type ){
		let r = 0.0;
		for( let t of this.soft_constraints ){
			r += t.deltaH( sourcei, targeti, src_type, tgt_type );
		}
		return r
	}
	/* ------------- COPY ATTEMPTS --------------- */

	/* 	Simulate one time step, i.e., a Monte Carlo step
	  	(a number of copy attempts depending on grid size):
		1) Randomly sample one of the border pixels for the copy attempt.
		2) Compute the change in Hamiltonian for the suggested copy attempt.
		3) With a probability depending on this change, decline or accept the 
		   copy attempt and update the grid accordingly. 

		TODO it is quite confusing that the "borderpixels" array also
		contains border pixels of the background.
	*/
	monteCarloStep () {
		this.timeStep();
	}
	timeStep (){
		let delta_t = 0.0;
		// this loop tracks the number of copy attempts until one MCS is completed.
		while( delta_t < 1.0 ){
			// This is the expected time (in MCS) you would expect it to take to
			// randomly draw another border pixel.
			delta_t += 1./(this.borderpixels.length);

			// sample a random pixel that borders at least 1 cell of another type,
			// and pick a random neighbour of tha pixel
			const tgt_i = this.borderpixels.sample();
			const Ni = this.grid.neighi( tgt_i );
			const src_i = Ni[this.ran(0,Ni.length-1)];
		
			const src_type = this.grid.pixti( src_i );
			const tgt_type = this.grid.pixti( tgt_i );

			// only compute the Hamiltonian if source and target belong to a different cell,
			// and do not allow a copy attempt into the stroma. Only continue if the copy attempt
			// would result in a viable cell.
			if( tgt_type != src_type ){
				let ok = true;
				for( let h of this.hard_constraints ){
					if( !h.fulfilled( src_i, tgt_i, src_type, tgt_type ) ){
						ok = false; break
					}
				}
				if( ok ){
					const hamiltonian = this.deltaH( src_i, tgt_i, src_type, tgt_type );
					// probabilistic success of copy attempt 
					if( this.docopy( hamiltonian ) ){
						this.setpixi( tgt_i, src_type );
					}
				}
			} 
		}
		this.time++; // update time with one MCS.
		this.stat_values = {}; // invalidate stat value cache
		for( let l of this.post_mcs_listeners ){
			l();
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
		const t_old = this.grid.pixti(i);
		if( t_old > 0 ){
			// also update volume of the old cell
			// (unless it is background/stroma)
			this.cellvolume[t_old] --;
			
			// if this was the last pixel belonging to this cell, 
			// remove the cell altogether.
			if( this.cellvolume[t_old] == 0 ){
				delete this.cellvolume[t_old];
				delete this.t2k[t_old];
			}
		}
		// update volume of the new cell and cellid of the pixel.
		this.grid.setpixi(i,t);
		if( t > 0 ){
			this.cellvolume[t] ++;
		}
		this.updateborderneari( i, t_old, t );
		for( let l of this.post_setpix_listeners ){
			l( i, t_old, t );
		}
	}

	/* Update border elements after a successful copy attempt. */
	updateborderneari ( i, t_old, t_new ){
		if( t_old == t_new ) return
		const Ni = this.grid.neighi( i );
		const wasborder = this._neighbours[i] > 0; 
		this._neighbours[i] = 0;
		for( let ni of Ni  ){
			const nt = this.grid.pixti(ni);
			if( nt != t_new ){
				this._neighbours[i] ++; 
			}
			if( nt == t_old ){
				if( this._neighbours[ni] ++ == 0 ){
					this.borderpixels.insert( ni );
				}
			}
			if( nt == t_new ){
				if( --this._neighbours[ni] == 0 ){
					this.borderpixels.remove( ni );
				}
			}
		}

		if( !wasborder && this._neighbours[i] > 0 ){
			this.borderpixels.insert( i );
		}
		if( wasborder &&  this._neighbours[i] == 0 ){
			this.borderpixels.remove( i );
		}
	}

	/* ------------- MANIPULATING CELLS ON THE GRID --------------- */

	/* Initiate a new cellid for a cell of celltype "kind", and create elements
	   for this cell in the relevant arrays (cellvolume, cellperimeter, t2k).*/
	makeNewCellID ( kind ){
		const newid = ++ this.nr_cells;
		this.cellvolume[newid] = 0;
		this.setCellKind( newid, kind );
		return newid
	}

}

/* This class encapsulates a lower-resolution grid and makes it
   visible as a higher-resolution grid. Only exact subsampling by
   a constant factor per dimension is supported. 
	*/

class CoarseGrid {
	constructor( grid, upscale = 3 ){
		this.extents = new Array( grid.extents.length );
		for( let i = 0 ; i < grid.extents.length ; i++ ){
			this.extents[i] = upscale * grid.extents[i];
		}
		this.grid = grid;
		this.upscale = upscale;
	}

	pixt( p ){
		// 2D bilinear interpolation
		let l = ~~(p[0] / this.upscale);
		let r = l+1;
		if( r > this.grid.extents[0] ){
			r = this.grid.extents[0];
		}
		let t = ~~(p[1] / this.upscale);
		let b = t+1;
		if( b > this.grid.extents[1] ){
			b = this.grid.extents[1];
		}

		let f_lt = this.grid.pixt([l,t]);
		let f_rt = this.grid.pixt([r,t]);
		let f_lb = this.grid.pixt([l,b]);
		let f_rb = this.grid.pixt([r,b]);

		let h = (p[0] % this.upscale) / this.upscale;
		let f_x_b = f_lb * (1-h) + f_rb * h; 
		let f_x_t = f_lt * (1-h) + f_rt * h;

		let v = (p[1] % this.upscale) / this.upscale;
		return f_x_t*(1-v) + f_x_b * v
	}

	/*gradient( p ){
		let ps = new Array( p.length )
		for( let i = 0 ; i < p.length ; i ++ ){
			ps[i] = ~~(p[i]/this.upscale)
		}
		return this.grid.gradient( ps )
	}*/
}

class Stat {
	// Although Stats do have a 'conf' object, they should not 
	// really be configurable in the sense that they should always
	// provide an expected output. The 'conf' object is mainly intended
	// to provide an option to configure logging / debugging output. That
	// is not implemented yet.
	constructor( conf ){
		this.conf = conf || {};
	}
	set model( M ){
		this.M = M;
	}
	compute(){
		throw("compute method not implemented for subclass of Stat")
	}
}

/* 	
	Creates an object with the cellpixels of each cell on the grid. 
	Keys are the cellIDs of all cells on the grid, corresponding values are arrays
	containing the pixels belonging to that cell. Each element of that array contains
	the coordinate array p = [x,y] for that pixel.
*/

class PixelsByCell extends Stat {

	compute(){
		// initialize the object
		let cellpixels = { };
		// The this.M.pixels() iterator returns coordinates and cellid for all 
		// non-background pixels on the grid. See the appropriate Grid class for
		// its implementation.
		for( let [p,i] of this.M.pixels() ){
			if( !cellpixels[i] ){
				cellpixels[i] = [p];
			} else {
				cellpixels[i].push( p );
			}
		}
		return cellpixels
	}
}

/** Class for taking a CPM grid and displaying it in either browser or with nodejs. */

class Canvas {
	/* The Canvas constructor accepts a CPM object C or a Grid2D object */
	constructor( C, options ){
		if( C instanceof GridBasedModel ){
			this.C = C;
			this.extents = C.extents;
		} else if( C instanceof Grid2D  ||  C instanceof CoarseGrid ){
			this.grid = C;
			this.extents = C.extents;
		}
		this.zoom = (options && options.zoom) || 1;
		this.wrap = (options && options.wrap) || [0,0,0];
		this.width = this.wrap[0];
		this.height = this.wrap[1];

		if( this.width == 0 || this.extents[0] < this.width ){
			this.width = this.extents[0];
		}
		if( this.height == 0 || this.extents[1] < this.height ){
			this.height = this.extents[1];
		}

		if( typeof document !== "undefined" ){
			this.el = document.createElement("canvas");
			this.el.width = this.width*this.zoom;
			this.el.height = this.height*this.zoom;//extents[1]*this.zoom
			var parent_element = (options && options.parentElement) || document.body;
			parent_element.appendChild( this.el );
		} else {
			const {createCanvas} = require("canvas");
			this.el = createCanvas( this.width*this.zoom,
				this.height*this.zoom );
			this.fs = require("fs");
		}

		this.ctx = this.el.getContext("2d");
		this.ctx.lineWidth = .2;
		this.ctx.lineCap="butt";
	}


	/* Several internal helper functions (used by drawing functions below) : */
	pxf( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], this.zoom, this.zoom );
	}

	pxfi( p ){
		const dy = this.zoom*this.width;
		const off = (this.zoom*p[1]*dy + this.zoom*p[0])*4;
		for( let i = 0 ; i < this.zoom*4 ; i += 4 ){
			for( let j = 0 ; j < this.zoom*dy*4 ; j += dy*4 ){
				this.px[i+j+off] = this.col_r;
				this.px[i+j+off + 1] = this.col_g;
				this.px[i+j+off + 2] = this.col_b;
				this.px[i+j+off + 3] = 255;
			}
		}
	}

	pxfir( p ){
		const dy = this.zoom*this.width;
		const off = (p[1]*dy + p[0])*4;
		this.px[off] = this.col_r;
		this.px[off + 1] = this.col_g;
		this.px[off + 2] = this.col_b;
		this.px[off + 3] = 255;
	}

	getImageData(){
		this.image_data = this.ctx.getImageData(0, 0, this.width*this.zoom, this.height*this.zoom);
		this.px = this.image_data.data;
	}

	putImageData(){
		this.ctx.putImageData(this.image_data, 0, 0);
	}

	pxfnozoom( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], 1, 1 );
	}

	/* draw a line left (l), right (r), down (d), or up (u) of pixel p */
	pxdrawl( p ){
		for( let i = this.zoom*p[1] ; i < this.zoom*(p[1]+1) ; i ++ ){
			this.pxfir( [this.zoom*p[0],i] );
		}
	}

	pxdrawr( p ){
		for( let i = this.zoom*p[1] ; i < this.zoom*(p[1]+1) ; i ++ ){
			this.pxfir( [this.zoom*(p[0]+1),i] );
		}
	}

	pxdrawd( p ){
		for( let i = this.zoom*p[0] ; i < this.zoom*(p[0]+1) ; i ++ ){
			this.pxfir( [i,this.zoom*(p[1]+1)] );
		}
	}

	pxdrawu( p ){
		for( let i = this.zoom*p[0] ; i < this.zoom*(p[0]+1) ; i ++ ){
			this.pxfir( [i,this.zoom*p[1]] );
		}
	}

	/* For easier color naming */
	col( hex ){
		this.ctx.fillStyle="#"+hex;
		this.col_r = parseInt( hex.substr(0,2), 16 );
		this.col_g = parseInt( hex.substr(2,2), 16 );
		this.col_b = parseInt( hex.substr(4,2), 16 );
	}

	/* Color the whole grid in color [col] */
	clear( col ){
		col = col || "000000";
		this.ctx.fillStyle="#"+col;
		this.ctx.fillRect( 0,0, this.el.width, this.el.height );
	}

	context(){
		return this.ctx
	}

	p2pdraw( p ){
		var dim;
		for( dim = 0; dim < p.length; dim++ ){
			if( this.wrap[dim] != 0 ){
				p[dim] = p[dim] % this.wrap[dim];
			}
		}
		return p
	}

	/* DRAWING FUNCTIONS ---------------------- */

	drawField( cc ){
		if( !cc ){
			cc = this.grid;
		}
		let maxval = 0;
		for( let i = 0 ; i < cc.extents[0] ; i ++ ){
			for( let j = 0 ; j < cc.extents[1] ; j ++ ){
				let p = Math.log(.1+cc.pixt([i,j]));
				if( maxval < p ){
					maxval = p;
				}
			}
		}
		this.getImageData();
		this.col_g = 0;
		this.col_b = 0;
		for( let i = 0 ; i < cc.extents[0] ; i ++ ){
			for( let j = 0 ; j < cc.extents[1] ; j ++ ){
				this.col_r =  255*(Math.log(.1+cc.pixt( [i,j] ))/maxval);
				this.pxfi([i,j]);
			}
		}
		this.putImageData();
	}

	/* Use to draw the border of each cell on the grid in the color specified in "col"
	(hex format). This function draws a line around the cell (rather than coloring the
	outer pixels). If [kind] is negative, simply draw all borders. */
	drawCellBorders( kind, col ){
		col = col || "000000";
		let pc, pu, pd, pl, pr, pdraw;
		this.col( col );
		this.getImageData();
		// cst contains indices of pixels at the border of cells
		for( let x of this.C.cellBorderPixels() ){
			let p = x[0];
			if( kind < 0 || this.C.cellKind(x[1]) == kind ){
				pdraw = this.p2pdraw( p );

				pc = this.C.pixt( [p[0],p[1]] );
				pr = this.C.pixt( [p[0]+1,p[1]] );
				pl = this.C.pixt( [p[0]-1,p[1]] );		
				pd = this.C.pixt( [p[0],p[1]+1] );
				pu = this.C.pixt( [p[0],p[1]-1] );

				if( pc != pl  ){
					this.pxdrawl( pdraw );
				}
				if( pc != pr ){
					this.pxdrawr( pdraw );
				}
				if( pc != pd ){
					this.pxdrawd( pdraw );
				}
				if( pc != pu ){
					this.pxdrawu( pdraw );
				}
			}

		}
		this.putImageData();
	}

	/* Use to show activity values of the act model using a color gradient, for
		cells in the grid of cellkind "kind". 
		The constraint holding the activity values can be supplied as an 
		argument. Otherwise, the current CPM is searched for the first 
		registered activity constraint and that is then used. */
	drawActivityValues( kind, A ){
		if( !A ){
			for( let c of this.C.soft_constraints ){
				if( c instanceof ActivityConstraint ){
					A = c ; break
				}
			}
		}
		if( !A ){
			throw("Cannot find activity values to draw!")
		}
		// cst contains the pixel ids of all non-background/non-stroma cells in
		// the grid. 
		let ii, sigma, a;
		// loop over all pixels belonging to non-background, non-stroma
		this.col("FF0000");
		this.getImageData();
		this.col_b = 0;
		//this.col_g = 0
		for( let x of this.C.cellPixels() ){
			ii = x[0];
			sigma = x[1];

			// For all pixels that belong to the current kind, compute
			// color based on activity values, convert to hex, and draw.
			if( this.C.cellKind(sigma) == kind ){
				a = A.pxact( this.C.grid.p2i( ii ) )/A.conf["MAX_ACT"][kind];
				if( a > 0 ){
					if( a > 0.5 ){
						this.col_r = 255;
						this.col_g = (2-2*a)*255;
					} else {
						this.col_r = (2*a)*255;
						this.col_g = 255;
					}
					this.pxfi( ii );
				}
			}
		}
		this.putImageData();
	}

	/* colors outer pixels of each cell */
	drawOnCellBorders( kind, col ){
		col = col || "000000";
		this.getImageData();
		this.col( col );
		for( let p of this.C.cellBorderPixels() ){
			if( kind < 0 || this.C.cellKind(p[1]) == kind ){
				if( typeof col == "function" ){
					this.col( col(p[1]) );
				}
				this.pxfi( p[0] );
			}
		}
		this.putImageData();
	}

	/* Draw all cells of cellkind "kind" in color col (hex). col can also be a function that
	 * returns a hex value for a cell id. */
	drawCells( kind, col ){
		if( ! col ){
			col = "000000";
		}
		if( typeof col == "string" ){
			this.col(col);
		}
		// Object cst contains pixel index of all pixels belonging to non-background,
		// non-stroma cells.

		let cellpixelsbyid = this.C.getStat( PixelsByCell );

		/*for( let x of this.C.pixels() ){
			if( kind < 0 || this.C.cellKind(x[1]) == kind ){
				if( !cellpixelsbyid[x[1]] ){
					cellpixelsbyid[x[1]] = []
				}
				cellpixelsbyid[x[1]].push( x[0] )
			}
		}*/

		this.getImageData();
		for( let cid of Object.keys( cellpixelsbyid ) ){
			if( kind < 0 || this.C.cellKind(cid) == kind ){
				if( typeof col == "function" ){
					this.col( col(cid) );
				}
				for( let cp of cellpixelsbyid[cid] ){
					this.pxfi( cp );
				}
			}
		}
		this.putImageData();
	}

	/* Draw grid to the png file "fname". */
	writePNG( fname ){
		this.fs.writeFileSync(fname, this.el.toBuffer());
	}
}

/** Class for outputting various statistics from a CPM simulation, as for instance
    the centroids of all cells (which is actually the only thing that's implemented
    so far) */

class Stats {
	constructor( C ){
		this.C = C;
		this.ndim = this.C.ndim;
	}

	// ------------  FRC NETWORK 

	// for simulation on FRC network. Returns all cells that are in contact with
	// a stroma cell.
	cellsOnNetwork(){
		var px = this.C.cellborderpixels.elements, i,j, N, r = {}, t;
		for( i = 0 ; i < px.length ; i ++ ){
			t = this.C.pixti( px[i] );
			if( r[t] ) continue
			N = this.C.neighi(  px[i] );
			for( j = 0 ; j < N.length ; j ++ ){
				if( this.C.pixti( N[j] ) < 0 ){
					r[t]=1; break
				}
			}
		}
		return r
	}
	
	
	// ------------  CELL LENGTH IN ONE DIMENSION
	// (this does not work with a grid torus).
		
	// For computing mean and variance with online algorithm
	updateOnline( aggregate, value ){
		
		var delta, delta2;

		aggregate.count ++;
		delta = value - aggregate.mean;
		aggregate.mean += delta/aggregate.count;
		delta2 = value - aggregate.mean;
		aggregate.sqd += delta*delta2;

		return aggregate
	}

	newOnline(){
		return( { count : 0, mean : 0, sqd : 0 } ) 
	}
	// return mean and variance of coordinates in a given dimension for cell t
	// (dimension as 0,1, or 2)
	cellStats( t, dim ){

		var aggregate, cpt, j, stats;

		// the cellpixels object can be given as the third argument
		if( arguments.length == 3){
			cpt = arguments[2][t];
		} else {
			cpt = this.cellpixels()[t];
		}

		// compute using online algorithm
		aggregate = this.newOnline();

		// loop over pixels to update the aggregate
		for( j = 0; j < cpt.length; j++ ){
			aggregate = this.updateOnline( aggregate, cpt[j][dim] );
		}

		// get mean and variance
		stats = { mean : aggregate.mean, variance : aggregate.sqd / ( aggregate.count - 1 ) };
		return stats
	}

	// get the length (variance) of cell in a given dimension
	// does not work with torus!
	getLengthOf( t, dim ){
		
		// get mean and sd in x direction
		var stats = this.cellStats( t, dim );
		return stats.variance

	}

	// get the range of coordinates in dim for cell t
	// does not work with torus!
	getRangeOf( t, dim ){

		var minc, maxc, cpt, j;

		// the cellpixels object can be given as the third argument
		if( arguments.length == 3){
			cpt = arguments[2][t];
		} else {
			cpt = this.cellpixels()[t];
		}

		// loop over pixels to find min and max
		minc = cpt[0][dim];
		maxc = cpt[0][dim];
		for( j = 1; j < cpt.length; j++ ){
			if( cpt[j][dim] < minc ) minc = cpt[j][dim];
			if( cpt[j][dim] > maxc ) maxc = cpt[j][dim];
		}
		
		return( maxc - minc )		

	}
	
	// ------------  CONNECTEDNESS OF CELLS
	// ( compatible with torus )
	
	// Compute connected components of the cell ( to check connectivity )
	getConnectedComponentOfCell( t, cellindices ){
		if( cellindices.length == 0 ){ return }

		var visited = {}, k=1, volume = {}, myself = this;

		var labelComponent = function(seed, k){
			var q = [parseInt(seed)];
			visited[q[0]] = 1;
			volume[k] = 0;
			while( q.length > 0 ){
				var e = parseInt(q.pop());
				volume[k] ++;
				var ne = myself.C.neighi( e );
				for( var i = 0 ; i < ne.length ; i ++ ){
					if( myself.C.pixti( ne[i] ) == t &&
						!visited.hasOwnProperty(ne[i]) ){
						q.push(ne[i]);
						visited[ne[i]]=1;
					}
				}
			}
		};

		for( var i = 0 ; i < cellindices.length ; i ++ ){
			if( !visited.hasOwnProperty( cellindices[i] ) ){
				labelComponent( cellindices[i], k );
				k++;
			}
		}

		return volume
	}

	getConnectedComponents(){
	
		let cpi;
	
		if( arguments.length == 1 ){
			cpi = arguments[0];
		} else {
			cpi = this.cellpixelsi();
		}

		const tx = Object.keys( cpi );
		let i, volumes = {};
		for( i = 0 ; i < tx.length ; i ++ ){
			volumes[tx[i]] = this.getConnectedComponentOfCell( tx[i], cpi[tx[i]] );
		}
		return volumes
	}
	
	// Compute probabilities that two pixels taken at random come from the same cell.
	getConnectedness(){
	
		let cpi;
	
		if( arguments.length == 1 ){
			cpi = arguments[0];
		} else {
			cpi = this.cellpixelsi();
		}
	
		const v = this.getConnectedComponents( cpi );
		let s = {}, r = {}, i, j;
		for( i in v ){
			s[i] = 0;
			r[i] = 0;
			for( j in v[i] ){
				s[i] += v[i][j];
			}
			for( j in v[i] ){
				r[i] += (v[i][j]/s[i]) * (v[i][j]/s[i]);
			}
		}
		return r
	}	
	
	// ------------  PROTRUSION ANALYSIS: PERCENTAGE ACTIVE / ORDER INDEX 
	// ( compatible with torus )
	
	// Compute percentage of pixels with activity > threshold
	getPercentageActOfCell( t, cellindices, threshold ){
		if( cellindices.length == 0 ){ return }
		var i, count = 0;

		for( i = 0 ; i < cellindices.length ; i ++ ){
			if( this.C.pxact( cellindices[i] ) > threshold ){
				count++;
			}
		}
		return 100*(count/cellindices.length)
	
	}

	getPercentageAct( threshold ){
	
		let cpi;
	
		if( arguments.length == 2 ){
			cpi = arguments[1];
		} else {
			cpi = this.cellpixelsi();
		}
	
		const tx = Object.keys( cpi );
		let i, activities = {};
		for( i = 0 ; i < tx.length ; i ++ ){
			activities[tx[i]] = this.getPercentageActOfCell( tx[i], cpi[tx[i]], threshold );
		}
		return activities
	
	}

	// Computing an order index of the activity gradients within the cell.
	getGradientAt( t, i ){
	
		var gradient = [];
		
		// for computing index of neighbors in x,y,z dimension:
		var diff = [1, this.C.dy, this.C.dz ]; 
		
		var d, neigh1, neigh2, t1, t2, ai = this.C.pxact( i ), terms = 0;
		
		for( d = 0; d < this.C.ndim; d++ ){
			// get the two neighbors and their types
			neigh1 = i - diff[d];
			neigh2 = i + diff[d];
			t1 = this.C.cellpixelstype[ neigh1 ];
			t2 = this.C.cellpixelstype[ neigh2 ];
			
			// start with a zero gradient
			gradient[d] = 0.00;
			
			// we will average the difference with the left and right neighbor only if both
			// belong to the same cell. If only one neighbor belongs to the same cell, we
			// use that difference. If neither belongs to the same cell, the gradient
			// stays zero.
			if( t == t1 ){
				gradient[d] += ( ai - this.C.pxact( neigh1 ) );
				terms++;
			}
			if( t == t2 ){
				gradient[d] += ( this.C.pxact( neigh2 ) - ai );
				terms++;
			}
			if( terms != 0 ){
				gradient[d] = gradient[d] / terms;
			}		
						
		}
		
		return gradient
		
	}

	// compute the norm of a vector (in array form)
	norm( v ){
		var i;
		var norm = 0;
		for( i = 0; i < v.length; i++ ){
			norm += v[i]*v[i];
		}
		norm = Math.sqrt( norm );
		return norm
	}

	getOrderIndexOfCell( t, cellindices ){
	
		if( cellindices.length == 0 ){ return }
		
		// create an array to store the gradient in. Fill it with zeros for all dimensions.
		var gradientsum = [], d;
		for( d = 0; d < this.C.ndim; d++ ){
			gradientsum.push(0.0);
		}
		
		// now loop over the cellindices and add gi/norm(gi) to the gradientsum for each
		// non-zero local gradient:
		var j;
		for( j = 0; j < cellindices.length; j++ ){
			var g = this.getGradientAt( t, cellindices[j] );
			var gn = this.norm( g );
			// we only consider non-zero gradients for the order index
			if( gn != 0 ){
				for( d = 0; d < this.C.ndim; d++ ){
					gradientsum[d] += 100*g[d]/gn/cellindices.length;
				}
			}
		}
		
		
		// finally, return the norm of this summed vector
		var orderindex = this.norm( gradientsum );
		return orderindex	
	}

	getOrderIndices( ){
		var cpi = this.cellborderpixelsi();
		var tx = Object.keys( cpi ), i, orderindices = {};
		for( i = 0 ; i < tx.length ; i ++ ){
			orderindices[tx[i]] = this.getOrderIndexOfCell( tx[i], cpi[tx[i]] );
		}
		return orderindices
	
	}
	

	// returns a list of all cell ids of the cells that border to "cell" and are of a different type
	// a dictionairy with keys = neighbor cell ids, and 
	// values = number of "cell"-pixels the neighbor cell borders to
	cellNeighborsList( cell, cbpi ) {
		if (!cbpi) {
			cbpi = this.cellborderpixelsi()[cell];
		} else {
			cbpi = cbpi[cell];
		}
		let neigh_cell_amountborder = {};
		//loop over border pixels of cell
		for ( let cellpix = 0; cellpix < cbpi.length; cellpix++ ) {
			//get neighbouring pixels of borderpixel of cell
			let neighbours_of_borderpixel_cell = this.C.neighi(cbpi[cellpix]);
			//don't add a pixel in cell more than twice
			//loop over neighbouring pixels and store the parent cell if it is different from
			//cell, add or increment the key corresponding to the neighbor in the dictionairy
			for ( let neighborpix = 0; neighborpix < neighbours_of_borderpixel_cell.length;
				neighborpix ++ ) {
				let cell_id = this.C.pixti(neighbours_of_borderpixel_cell[neighborpix]);
				if (cell_id != cell) {
					neigh_cell_amountborder[cell_id] = neigh_cell_amountborder[cell_id]+1 || 1;
				}
			}
		}
		return neigh_cell_amountborder
	}

	// ------------ HELPER FUNCTIONS
	
	// TODO all helper functions have been removed from this class.
	// We should only access cellpixels through the "official" interface
	// in the CPM class.
	
}

/*	Computes the centroid of a cell when grid has a torus. 
	Assumption: cell pixels never extend for more than half the size of the grid. 
*/

class CentroidsWithTorusCorrection extends Stat {
	set model( M ){
		this.M = M;
		// Half the grid dimensions; if pixels with the same cellid are further apart,
		// we assume they are on the border of the grid and that we need to correct
		// their positions to compute the centroid.
		this.halfsize = new Array( this.M.ndim).fill(0);
		for( let i = 0 ; i < this.M.ndim ; i ++ ){
			this.halfsize[i] = this.M.extents[i]/2;
		}
	}
	constructor( conf ){
		super(conf);
	}
		
	/* Compute the centroid of a specific cell with id = <cellid>. 
	The cellpixels object is given as an argument so that it only has to be requested
	once for all cells together. */
	computeCentroidOfCell( cellid, cellpixels  ){
	
		//let cellpixels = this.M.getStat( PixelsByCell ) 
	
		const pixels = cellpixels[ cellid ];
		
		// cvec will contain the x, y, (z) coordinate of the centroid.
		// Loop over the dimensions to compute each element separately.
		let cvec = new Array(this.M.ndim).fill(0);
		for( let dim = 0 ; dim < this.M.ndim ; dim ++ ){
			
			let mi = 0.;
			const hsi = this.halfsize[dim], si = this.M.extents[dim];
			
			// Loop over the pixels;
			// compute mean position per dimension with online algorithm
			for( let j = 0 ; j < pixels.length ; j ++ ){
				
				// Check distance of current pixel to the accumulated mean in this dim.
				// Check if this distance is greater than half the grid size in this
				// dimension; if so, this indicates that the cell has moved to the
				// other end of the grid because of the torus. Note that this only
				// holds AFTER the first pixel (so for j > 0), when we actually have
				// an idea of where the cell is.
				let dx = pixels[j][dim] - mi;
				if( j > 0 ){
					// If distance is greater than half the grid size, correct the
					// coordinate.
					if( dx > hsi ){
						dx -= si;
					} else if( dx < -hsi ){
						dx += si;
					}
				}
				// Update the mean with the appropriate weight. 
				mi += dx/(j+1);
			}
			
			// Correct the final position so that it falls in the current grid.
			// (Because of the torus, it can happen to get a centroid at eg x = -1. )
			if( mi < 0 ){
				mi += si;
			} else if( mi > si ){
				mi -= si;
			}
			
			// Set the mean position in the cvec vector.
			cvec[dim] = mi;
		}
		return cvec
		
	}
		
	/* Compute centroids for all cells on the grid, returning an object with a key
	for each cellid and as "value" the array with coordinates of the centroid. */
	compute(){
		// Get object with arrays of pixels for each cell on the grid, and get
		// the array for the current cell.
		let cellpixels = this.M.getStat( PixelsByCell ); 
		
		// Create an object for the centroids. Add the centroid array for each cell.
		let centroids = {};
		for( let cid of this.M.cellIDs() ){
			centroids[cid] = this.computeCentroidOfCell( cid, cellpixels );
		}
		
		return centroids
		
	}
}

/*	Computes the centroid of a cell. When the cell resides on a torus, the
	centroid may be well outside the cell, and other stats may be preferable. 
*/

class Centroids extends Stat {
	set model( M ){
		this.M = M;
		// Half the grid dimensions; if pixels with the same cellid are further apart,
		// we assume they are on the border of the grid and that we need to correct
		// their positions to compute the centroid.
		this.halfsize = new Array( this.M.ndim).fill(0);
		for( let i = 0 ; i < this.M.ndim ; i ++ ){
			this.halfsize[i] = this.M.extents[i]/2;
		}
	}
	constructor( conf ){
		super(conf);
	}
	/* Compute the centroid of a specific cell with id = <cellid>. 
	The cellpixels object is given as an argument so that it only has to be requested
	once for all cells together. */
	computeCentroidOfCell( cellid, cellpixels  ){
	
		//let cellpixels = this.M.getStat( PixelsByCell ) 
	
		const pixels = cellpixels[ cellid ];
		
		// cvec will contain the x, y, (z) coordinate of the centroid.
		// Loop over the dimensions to compute each element separately.
		let cvec = new Array(this.M.ndim).fill(0);
		for( let dim = 0 ; dim < this.M.ndim ; dim ++ ){
			
			let mi = 0.;
			// Loop over the pixels;
			// compute mean position per dimension with online algorithm
			for( let j = 0 ; j < pixels.length ; j ++ ){
				// Check distance of current pixel to the accumulated mean in this dim.
				// Check if this distance is greater than half the grid size in this
				// dimension; if so, this indicates that the cell has moved to the
				// other end of the grid because of the torus. Note that this only
				// holds AFTER the first pixel (so for j > 0), when we actually have
				// an idea of where the cell is.
				let dx = pixels[j][dim] - mi;
				// Update the mean with the appropriate weight. 
				mi += dx/(j+1);
			}			
			// Set the mean position in the cvec vector.
			cvec[dim] = mi;
		}
		return cvec
		
	}
		
	/* Compute centroids for all cells on the grid, returning an object with a key
	for each cellid and as "value" the array with coordinates of the centroid. */
	compute(){
		// Get object with arrays of pixels for each cell on the grid, and get
		// the array for the current cell.
		let cellpixels = this.M.getStat( PixelsByCell ); 
		
		// Create an object for the centroids. Add the centroid array for each cell.
		let centroids = {};
		for( let cid of this.M.cellIDs() ){
			centroids[cid] = this.computeCentroidOfCell( cid, cellpixels );
		}
		return centroids
	}
}

/* This class contains methods that should be executed once per monte carlo step.
   Examples are cell division, cell death etc.
 */

class GridManipulator {
	constructor( C ){
		this.C = C;
	}
	/* Seed a new cell at a random position. Return 0 if failed, ID of new cell otherwise.
	 * Try a specified number of times, then give up if grid is too full. 
	 * The first cell will always be seeded at the midpoint of the grid. */
	seedCell( kind, max_attempts = 10000 ){
		let p = this.C.midpoint;
		while( this.C.pixt( p ) != 0 && max_attempts-- > 0 ){
			for( let i = 0 ; i < p.length ; i ++ ){
				p[i] = this.C.ran(0,this.C.extents[i]-1);
			}
		}
		if( this.C.pixt(p) != 0 ){
			return 0 // failed
		}
		const newid = this.C.makeNewCellID( kind );
		this.C.setpix( p, newid );
		return newid
	}
	/* Seed a new cell of celltype "kind" onto position "p".*/
	seedCellAt( kind, p ){
		const newid = this.C.makeNewCellID( kind );
		this.C.setpix( p, newid );
		return newid
	}
	seedCellsInCircle( kind, n, center, radius, max_attempts = 10000 ){
		if( !max_attempts ){
			max_attempts = 10*n;
		}
		let C = this.C;
		while( n > 0 ){
			if( --max_attempts == 0 ){
				throw("too many attempts to seed cells!")
			}
			let p = center.map( function(i){ return C.ran(Math.ceil(i-radius),Math.floor(i+radius)) } );
			let d = 0;
			for( let i = 0 ; i < p.length ; i ++ ){
				d += (p[i]-center[i])*(p[i]-center[i]);
			}
			if( d < radius*radius ){
				this.seedCellAt( kind, p );
				n--;
			}
		}
	}
	/* Add an entire plane to an array of pixel coordinates. This array is given 
	as first argument but can be empty. The plane is specified by setting the x/y/z
	coordinate (coded by coord = 0/1/2 for x/y/z) to a fixed value [coordvalue], while
	letting the other coordinates range from their min value 0 to their max value. */
	makePlane ( voxels, coord, coordvalue ){
		let x,y,z;
		let minc = [0,0,0];
		let maxc = [0,0,0];
		for( let dim = 0; dim < this.C.ndim; dim++ ){
			maxc[dim] = this.C.extents[dim]-1;
		}
		minc[coord] = coordvalue;
		maxc[coord] = coordvalue;

		// For every coordinate x,y,z, loop over all possible values from min to max.
		// one of these loops will have only one iteration because min = max = coordvalue.
		for( x = minc[0]; x <= maxc[0]; x++ ){
			for( y = minc[1]; y<=maxc[1]; y++ ){
				for( z = minc[2]; z<=maxc[2]; z++ ){
					if( this.C.ndim == 3 ){
						voxels.push( [x,y,z] );	
					} else {
						//console.log(x,y)
						voxels.push( [x,y] );
					}
				}
			}
		}

		return voxels
	}
	/* Convert all pixels in a given array to a specific cellkind:
	   changes the pixels defined by voxels (array of coordinates p) into
	   the given cellkind. */
	changeKind ( voxels, cellkind ){
		
		let newid = this.C.makeNewCellID( cellkind );
		for( let p of voxels ){
			this.C.setpix( p, newid );
		}
		
	}

	/* Let cell t divide by splitting it along a line perpendicular to
	 * its major axis. */
	divideCell( id ){
		let C = this.C;
		if( C.ndim != 2 || C.conf.torus ){
			throw("The divideCell methods is only implemented for 2D non-torus lattices yet!")
		}
		let cp = C.getStat( PixelsByCell )[id], com = C.getStat( Centroids )[id];
		let bxx = 0, bxy = 0, byy=0, cx, cy, x2, y2, side, T, D, x0, y0, x1, y1, L2;

			

		// Loop over the pixels belonging to this cell
		for( let j = 0 ; j < cp.length ; j ++ ){
			cx = cp[j][0] - com[0]; // x position rel to centroid
			cy = cp[j][1] - com[1]; // y position rel to centroid

			// sum of squared distances:
			bxx += cx*cx;
			bxy += cx*cy;
			byy += cy*cy;
		}

		// This code computes a "dividing line", which is perpendicular to the longest
		// axis of the cell.
		if( bxy == 0 ){
			x0 = 0;
			y0 = 0;
			x1 = 1;
			y1 = 0;
		} else {
			T = bxx + byy;
			D = bxx*byy - bxy*bxy;
			//L1 = T/2 + Math.sqrt(T*T/4 - D)
			L2 = T/2 - Math.sqrt(T*T/4 - D);
			x0 = 0;
			y0 = 0;
			x1 = L2 - byy;
			y1 = bxy;
		}

		// create a new ID for the second cell
		let nid = C.makeNewCellID( C.cellKind( id ) );

		// Loop over the pixels belonging to this cell
		//let sidea = 0, sideb = 0
		for( let j = 0 ; j < cp.length ; j ++ ){
			// coordinates of current cell relative to center of mass
			x2 = cp[j][0]-com[0];
			y2 = cp[j][1]-com[1];

			// Depending on which side of the dividing line this pixel is,
			// set it to the new type
			side = (x1 - x0)*(y2 - y0) - (x2 - x0)*(y1 - y0);
			if( side > 0 ){
				//sidea ++
				C.setpix( cp[j], nid ); 
			}
		}
		//console.log( sidea, sideb )
		return nid
	}
}

/** 
 * Forbids that cells exceed or fall below a certain size range. 
 */

class HardVolumeRangeConstraint extends HardConstraint {

	confChecker(){
		this.confCheckCellNonNegative( "LAMBDA_VRANGE_MAX" );
		this.confCheckCellNonNegative( "LAMBDA_VRANGE_MIN" );
	}

	fulfilled( src_i, tgt_i, src_type, tgt_type ){
		// volume gain of src cell
		if( src_type != 0 && this.C.getVolume(src_type) + 1 > 
			this.conf["LAMBDA_VRANGE_MAX"][this.C.cellKind(src_type)] ){
			return false
		}
		// volume loss of tgt cell
		if( tgt_type != 0 && this.C.getVolume(tgt_type) - 1 < 
			this.conf["LAMBDA_VRANGE_MIN"][this.C.cellKind(tgt_type)] ){
			return false
		}
		return true
	}
}

/** 
 * Forbids that cells exceed or fall below a certain size range. 
 */

class HardVolumeRangeConstraint$1 extends HardConstraint {	
	get CONSTRAINT_TYPE() {
		return "none"
	}
	/* eslint-disable */
	setpixListener( i, t_old, t ){
		console.log( i, t_old, t );
	}
	afterMCSListener( ){
		console.log( "the time is now: ", this.C.time );
	}
}

/**
 * This is a constraint in which each cell has a preferred direction of migration. 
 * This direction is only dependent on the cell, not on the specific pixel of a cell.
 */

class PersistenceConstraint extends SoftConstraint {
	constructor( conf ){
		super( conf );
		this.cellcentroidlists = {};
		this.celldirections = {};
	}
	set CPM(C){
		this.halfsize = new Array(C.ndim).fill(0);
		this.C = C;
		for( let i = 0 ; i < C.ndim ; i ++ ){
			this.halfsize[i] = C.extents[i]/2;
		}

	}
	confChecker(){
		this.confCheckCellNonNegative( "LAMBDA_DIR" );
	}
	
	deltaH ( sourcei, targeti, src_type ) {
		if( src_type == 0 || !(src_type in this.celldirections) ) return 0
		let b = this.celldirections[src_type];
		let p1 = this.C.grid.i2p(sourcei), p2 = this.C.grid.i2p(targeti);
		let a = [];
		for( let i = 0 ; i < p1.length ; i ++ ){
			a[i] = p2[i]-p1[i];
			if( a[i] > this.halfsize[i] ){
				a[i] -= this.C.extents[i];
			} else if( a[i] < -this.halfsize[i] ){
				a[i] += this.C.extents[i];
			}
		}
		let dp = 0;
		for( let i = 0 ; i < a.length ; i ++ ){
			dp += a[i]*b[i];
		}
		return - dp
	}
	normalize( a ){
		let norm = 0;
		for( let i = 0 ; i < a.length ; i ++ ){
			norm += a[i]*a[i];
		}
		norm = Math.sqrt(norm);
		for( let i = 0 ; i < a.length ; i ++ ){
			a[i] /= norm;
		}
	}
	// this function samples a random number from a normal distribution
	sampleNorm (mu=0, sigma=1) {
		let u1 = this.C.random();
		let u2 = this.C.random();
		let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(Math.PI*2 * u2);
		return z0 * sigma + mu
	}
	// this function samples a random direction vector with length 1
	randDir (n=3) {
		let dir = [];
		while(n-- > 0){
			dir.push(this.sampleNorm());
		}
		this.normalize(dir);
		return dir
	}
	setDirection( t, dx ){
		this.celldirections[t] = dx;
	}
	postMCSListener(){
		let centroids;
		if( this.C.conf.torus ){
			centroids = this.C.getStat( CentroidsWithTorusCorrection );
		} else {
			centroids = this.C.getStat( Centroids );
		}
		for( let t of this.C.cellIDs() ){
			const k = this.C.cellKind(t);
			let ld = this.conf["LAMBDA_DIR"][k];
			let dt = this.conf["DELTA_T"] && this.conf["DELTA_T"][k] ? 
				this.conf["DELTA_T"][k] : 10;
			if( ld == 0 ){
				delete this.cellcentroidlists[t];
				delete this.celldirections[t];
				continue
			}
			if( !(t in this.cellcentroidlists ) ){
				this.cellcentroidlists[t] = [];
				this.celldirections[t] = this.randDir(this.C.ndim);
			}

			let ci = centroids[t];
			this.cellcentroidlists[t].unshift(ci);
			if( this.cellcentroidlists[t].length >= dt ){
				// note, dt could change during execution
				let l;
				while( this.cellcentroidlists[t].length >= dt ){
					l = this.cellcentroidlists[t].pop();
				}
				let dx = [];
				for( let j = 0 ; j < l.length ; j ++ ){
					dx[j] = ci[j] - l[j];
					if( dx[j] > this.halfsize[j] ){
						dx[j] -= this.C.extents[j];
					} else if( dx[j] < -this.halfsize[j] ){
						dx[j] += this.C.extents[j];
					}
				}
				// apply angular diffusion to target direction if needed
				let per = this.conf["PERSIST"][k];
				if( per < 1 ){
					this.normalize(dx);
					this.normalize(this.celldirections[t]);
					for( let j = 0 ; j < dx.length ; j ++ ){
						dx[j] = (1-per)*dx[j] + per*this.celldirections[t][j];
					}
					this.normalize(dx);
					for( let j = 0 ; j < dx.length ; j ++ ){
						dx[j] *= ld;
					}
					this.celldirections[t] = dx;
				}
			}
		}
	}
}

class PreferredDirectionConstraint extends Constraint {
	get CONSTRAINT_TYPE() {
		return "soft"
	}
	deltaH( src_i, tgt_i, src_type ){
		let l = this.conf["LAMBDA_DIR"][this.C.cellKind( src_type )];
		if( !l ){
			return 0
		}
		let torus = this.C.conf.torus;
		let dir = this.conf["DIR"][this.C.cellKind( src_type )];
		let p1 = this.C.grid.i2p( src_i ), p2 = this.C.grid.i2p( tgt_i );
		// To bias a copy attempt p1 -> p2 in the direction of vector 'dir'.
		let r = 0.;
		// loops over the coordinates x,y,(z)
		for( let i = 0; i < p1.length ; i++ ){
			let si = this.C.extents[i];
			// direction of the copy attempt on this coordinate is from p1 to p2
			let dx = p2[i] - p1[i];
			if( torus ){
				// If distance is greater than half the grid size, correct the
				// coordinate.
				if( dx > si/2 ){
					dx -= si;
				} else if( dx < -si/2 ){
					dx += si;
				}
			}
			// direction of the gradient
			r += dx * dir[i]; 
		}
		return - r * l
	}
}

class ChemotaxisConstraint extends SoftConstraint {
	set CPM(C){
		this.C = C;
	}
	confChecker(){
		this.confCheckCellNonNegative( "LAMBDA_CH" );
		this.confCheckPresenceOf( "CH_FIELD" );
	}

	constructor( conf ){
		super( conf );
		this.conf = conf;
		this.field = conf.CH_FIELD;
		if( this.field instanceof CoarseGrid ){
			this.deltaH = this.deltaHCoarse;
		}
	}

	deltaHCoarse( sourcei, targeti, src_type ){
		let sp = this.C.grid.i2p( sourcei ), tp = this.C.grid.i2p( targeti );
		let delta = this.field.pixt( tp ) - this.field.pixt( sp );
		let lambdachem = this.conf["LAMBDA_CH"][this.C.cellKind(src_type)];
		return -delta*lambdachem
	}

	deltaH( sourcei, targeti, src_type  ){
		let delta = this.field.pixt( targeti ) - this.field.pixt( sourcei );
		let lambdachem = this.conf["LAMBDA_CH"][this.C.cellKind(src_type)];
		return -delta*lambdachem
	}
}

class AttractionPointConstraint extends Constraint {
	get CONSTRAINT_TYPE() {
		return "soft"
	}
	deltaH( src_i, tgt_i, src_type ){
		let l = this.conf["LAMBDA_ATTRACTIONPOINT"][this.C.cellKind( src_type )];
		if( !l ){
			return 0
		}
		let torus = this.C.conf.torus;
		let tgt = this.conf["ATTRACTIONPOINT"][this.C.cellKind( src_type )];
		let p1 = this.C.grid.i2p( src_i ), p2 = this.C.grid.i2p( tgt_i );
		// To bias a copy attempt p1 -> p2 in the direction of vector 'dir'.
		let r = 0., ldir = 0.;
		// loops over the coordinates x,y,(z)
		for( let i = 0; i < p1.length ; i++ ){
			let dir_i = tgt[i] - p1[i];
			ldir += dir_i * dir_i;
			let si = this.C.extents[i];
			// direction of the copy attempt on this coordinate is from p1 to p2
			let dx = p2[i] - p1[i];
			if( torus ){
				// If distance is greater than half the grid size, correct the
				// coordinate.
				if( dx > si/2 ){
					dx -= si;
				} else if( dx < -si/2 ){
					dx += si;
				}
			}
			// direction of the gradient
			r += dx * dir_i; 
		}
		return - r * l / Math.sqrt( ldir )
	}
}

class Simulation {
	constructor( config, custommethods ){
	
		// overwrite default method if methods are supplied in custommethods
		// these can be initializeGrid(), drawCanvas(), logStats(),
		// postMCSListener().
		for( let m of Object.keys( custommethods ) ){
			this[m] = custommethods[m];
		}
		
	
		// Configuration of the simulation environment
		this.conf = config.simsettings;
		this.imgrate = this.conf["IMGFRAMERATE"] || -1;
		this.lograte = this.conf["LOGRATE"] || -1;
		
		// See if code is run in browser or via node, which will be used
		// below to determine what the output should be.
		if( typeof window !== "undefined" && typeof window.document !== "undefined" ){
			this.mode = "browser";
		} else {
			this.mode = "node";
		}
		
		// Save the time of the simulation.
		this.time = 0;
		
		// Make CPM object and add constraints
		this.C = new CPM( config.field_size, config.conf );
				
		// To add canvas / gridmanipulator automatically when required. This will set
		// their values in helpClasses to 'true', so they don't have to be added again.
		this.helpClasses = { gm: false, canvas: false };
		
		// Initialize the grid and run the burnin.
		this.initializeGrid();
		this.runBurnin();
		
	}

	// Add GridManipulator/Canvas objects when required.
	addGridManipulator(){
		this.gm = new GridManipulator( this.C );
		this.helpClasses[ "gm" ] = true;
	}
	addCanvas(){
		this.Cim = new Canvas( this.C, {zoom:this.conf.zoom} );
		this.helpClasses[ "canvas" ] = true;
	}
	
	// Method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){
	
		// add the initializer if not already there
		if( !this.helpClasses["gm"] ){ this.addGridManipulator(); }
	
		let nrcells = this.conf["NRCELLS"], cellkind, i;
		
		// Seed the right number of cells for each cellkind
		for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
			
			for( i = 0; i < nrcells[cellkind]; i++ ){
				// first cell always at the midpoint. Any other cells
				// randomly.				
				if( i == 0 ){
					this.gm.seedCellAt( cellkind+1, this.C.midpoint );
				} else {
					this.gm.seedCell( cellkind+1 );
				}
			}
		}


	}
	
	runBurnin(){
		// Simulate the burnin phase
		for( let i = 0; i < this.conf["BURNIN"]; i++ ){
			this.C.monteCarloStep();
		}
	}

	
	// draw the canvas
	drawCanvas(){
	
		// Add the canvas if required
		if( !this.helpClasses["canvas"] ){ this.addCanvas(); }
	
		// Clear canvas and draw stroma border
		this.Cim.clear( this.conf["CANVASCOLOR"] );
		
		

		// Draw each cellkind appropriately
		let cellcolor=this.conf["CELLCOLOR"], actcolor=this.conf["ACTCOLOR"], 
			nrcells=this.conf["NRCELLS"], cellkind, cellborders = this.conf["SHOWBORDERS"];
		for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		
			// draw the cells of each kind in the right color
			if( cellcolor[ cellkind ] != -1 ){
				this.Cim.drawCells( cellkind+1, cellcolor[cellkind] );
			}
			
			// Draw borders if required
			if(  cellborders[ cellkind  ]  ){
				this.Cim.drawCellBorders( cellkind+1, "000000" );
			}
			
			// if there is an activity constraint, draw activity values depending on color.
			if( this.C.conf["LAMBDA_ACT"] !== undefined && this.C.conf["LAMBDA_ACT"][ cellkind + 1 ] > 0 ){ //this.constraints.hasOwnProperty( "ActivityConstraint" ) ){
				if( actcolor[ cellkind ] ){
					this.Cim.drawActivityValues( cellkind + 1 );//, this.constraints["ActivityConstraint"] )
				}			
			}

		}
		
	}
	
	// Computing and logging stats
	logStats(){
		
		// compute centroids for all cells
		let allcentroids = this.C.getStat( CentroidsWithTorusCorrection );
		
		for( let cid of this.C.cellIDs() ){
		
			let thecentroid = allcentroids[cid];
			
			// eslint-disable-next-line no-console
			console.log( this.time + "\t" + cid + "\t" + 
				this.C.cellKind(cid) + "\t" + thecentroid.join("\t") );
			
		}

	}
	
	// Listener for something that needs to be done after every monte carlo step.
	postMCSListener(){
	
	}
	
	// Function for creating outputs
	createOutputs(){
		// Draw the canvas every IMGFRAMERATE steps
		if( this.imgrate > 0 && this.time % this.conf["IMGFRAMERATE"] == 0 ){
			
			this.drawCanvas();
			
			// Save the image if required and if we're in node (not possible in browser)
			if( this.mode == "node" && this.conf["SAVEIMG"] ){
				let outpath = this.conf["SAVEPATH"], expname = this.conf["EXPNAME"];
				this.Cim.writePNG( outpath +"/" + expname + "-t"+this.time+".png" );
			}
		}
		
		// Log stats every LOGRATE steps
		if( this.conf["STATSOUT"][this.mode] && this.lograte > 0 && this.time % this.conf["LOGRATE"] == 0 ){
			this.logStats();
		}
	}
	
	// Run a montecarlostep and produce outputs if required.
	step(){
		this.C.monteCarloStep();
		this.postMCSListener();
		this.createOutputs();
		this.time++;
	}
	
	
	// Run the entire simulation.
	run(){
		while( this.time < this.conf["RUNTIME"] ){
		
			this.step();
			
		}
	}
	
}

exports.CA = CA;
exports.CPM = CPM;
exports.GridBasedModel = GridBasedModel;
exports.Stats = Stats;
exports.Canvas = Canvas;
exports.GridManipulator = GridManipulator;
exports.Grid2D = Grid2D;
exports.Grid3D = Grid3D;
exports.Adhesion = Adhesion;
exports.VolumeConstraint = VolumeConstraint;
exports.HardVolumeRangeConstraint = HardVolumeRangeConstraint;
exports.TestLogger = HardVolumeRangeConstraint$1;
exports.ActivityConstraint = ActivityConstraint;
exports.PerimeterConstraint = PerimeterConstraint;
exports.PersistenceConstraint = PersistenceConstraint;
exports.CoarseGrid = CoarseGrid;
exports.ChemotaxisConstraint = ChemotaxisConstraint;
exports.BarrierConstraint = BarrierConstraint;
exports.PreferredDirectionConstraint = PreferredDirectionConstraint;
exports.AttractionPointConstraint = AttractionPointConstraint;
exports.PixelsByCell = PixelsByCell;
exports.Centroids = Centroids;
exports.CentroidsWithTorusCorrection = CentroidsWithTorusCorrection;
exports.Simulation = Simulation;
