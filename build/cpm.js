var CPM = (function (exports) {
	'use strict';

	/** This class implements a data structure with constant-time insertion, deletion, and random
	    sampling. That's crucial for the CPM metropolis algorithm, which repeatedly needs to sample
	    pixels at cell borders. */

	// pass in RNG
	function DiceSet( mt ) {
		// Use a hash map to check in constant time whether a pixel is at a cell border.
		// Use Map() instead of object {} for speed.
		this.indices = new Map(); // {}

		// Use an array for constant time random sampling of pixels at the border of cells.
		this.elements = [];

		// track the number of pixels currently present in the DiceSet.
		this.length = 0;

		this.mt = mt;
	}

	DiceSet.prototype = {
		insert : function( v ){
			// Check whether value is defined and not already in the set.
			if( typeof v == "undefined" ){
				throw("attempting to insert undefined value!")
			}
			if( this.indices.has( v ) ){
				return
			}
			// Add element to both the hash map and the array.
			this.indices.set( v, this.length );
			this.elements.push( v );
			this.length ++; 
		},
		remove : function( v ){
			// Check whether element is present before it can be removed.
			if( !this.indices.has( v ) ){
				return
			}
			/* The hash map gives the index in the array of the value to be removed.
			The value is removed directly from the hash map, but from the array we
			initially remove the last element, which we then substitute for the 
			element that should be removed.*/
			var i = this.indices.get(v);
			this.indices.delete(v);
			var e = this.elements.pop();
			this.length --;
			if( e == v ){
				return
			}
			this.elements[i] = e;
			this.indices.set(e,i);
		},
		contains : function( v ){
			return this.indices.has(v) // (v in this.indices)
		},
		sample : function(){
			return this.elements[Math.floor(this.mt.rnd()*this.length)]
		}
	};

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var MersenneTwister = createCommonjsModule(function (module, exports) {
	(function (root, factory) {

	    {
	        module.exports = factory();
	    }
	}(commonjsGlobal, function () {

	    var MAX_INT = 4294967296.0,
	        N = 624,
	        M = 397,
	        UPPER_MASK = 0x80000000,
	        LOWER_MASK = 0x7fffffff,
	        MATRIX_A = 0x9908b0df;

	    /**
	     * Instantiates a new Mersenne Twister.
	     *
	     * @constructor
	     * @alias module:MersenneTwister
	     * @since 0.1.0
	     * @param {number=} seed The initial seed value.
	     */
	    var MersenneTwister = function (seed) {
	        if (typeof seed === 'undefined') {
	            seed = new Date().getTime();
	        }

	        this.mt = new Array(N);
	        this.mti = N + 1;

	        this.seed(seed);
	    };

	    /**
	     * Initializes the state vector by using one unsigned 32-bit integer "seed", which may be zero.
	     *
	     * @since 0.1.0
	     * @param {number} seed The seed value.
	     */
	    MersenneTwister.prototype.seed = function (seed) {
	        var s;

	        this.mt[0] = seed >>> 0;

	        for (this.mti = 1; this.mti < N; this.mti++) {
	            s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
	            this.mt[this.mti] =
	                (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;
	            this.mt[this.mti] >>>= 0;
	        }
	    };

	    /**
	     * Initializes the state vector by using an array key[] of unsigned 32-bit integers of the specified length. If
	     * length is smaller than 624, then each array of 32-bit integers gives distinct initial state vector. This is
	     * useful if you want a larger seed space than 32-bit word.
	     *
	     * @since 0.1.0
	     * @param {array} vector The seed vector.
	     */
	    MersenneTwister.prototype.seedArray = function (vector) {
	        var i = 1,
	            j = 0,
	            k = N > vector.length ? N : vector.length,
	            s;

	        this.seed(19650218);

	        for (; k > 0; k--) {
	            s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);

	            this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525))) +
	                vector[j] + j;
	            this.mt[i] >>>= 0;
	            i++;
	            j++;
	            if (i >= N) {
	                this.mt[0] = this.mt[N - 1];
	                i = 1;
	            }
	            if (j >= vector.length) {
	                j = 0;
	            }
	        }

	        for (k = N - 1; k; k--) {
	            s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
	            this.mt[i] =
	                (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941)) - i;
	            this.mt[i] >>>= 0;
	            i++;
	            if (i >= N) {
	                this.mt[0] = this.mt[N - 1];
	                i = 1;
	            }
	        }

	        this.mt[0] = 0x80000000;
	    };

	    /**
	     * Generates a random unsigned 32-bit integer.
	     *
	     * @since 0.1.0
	     * @returns {number}
	     */
	    MersenneTwister.prototype.int = function () {
	        var y,
	            kk,
	            mag01 = new Array(0, MATRIX_A);

	        if (this.mti >= N) {
	            if (this.mti === N + 1) {
	                this.seed(5489);
	            }

	            for (kk = 0; kk < N - M; kk++) {
	                y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
	                this.mt[kk] = this.mt[kk + M] ^ (y >>> 1) ^ mag01[y & 1];
	            }

	            for (; kk < N - 1; kk++) {
	                y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
	                this.mt[kk] = this.mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 1];
	            }

	            y = (this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK);
	            this.mt[N - 1] = this.mt[M - 1] ^ (y >>> 1) ^ mag01[y & 1];
	            this.mti = 0;
	        }

	        y = this.mt[this.mti++];

	        y ^= (y >>> 11);
	        y ^= (y << 7) & 0x9d2c5680;
	        y ^= (y << 15) & 0xefc60000;
	        y ^= (y >>> 18);

	        return y >>> 0;
	    };

	    /**
	     * Generates a random unsigned 31-bit integer.
	     *
	     * @since 0.1.0
	     * @returns {number}
	     */
	    MersenneTwister.prototype.int31 = function () {
	        return this.int() >>> 1;
	    };

	    /**
	     * Generates a random real in the interval [0;1] with 32-bit resolution.
	     *
	     * @since 0.1.0
	     * @returns {number}
	     */
	    MersenneTwister.prototype.real = function () {
	        return this.int() * (1.0 / (MAX_INT - 1));
	    };

	    /**
	     * Generates a random real in the interval ]0;1[ with 32-bit resolution.
	     *
	     * @since 0.1.0
	     * @returns {number}
	     */
	    MersenneTwister.prototype.realx = function () {
	        return (this.int() + 0.5) * (1.0 / MAX_INT);
	    };

	    /**
	     * Generates a random real in the interval [0;1[ with 32-bit resolution.
	     *
	     * @since 0.1.0
	     * @returns {number}
	     */
	    MersenneTwister.prototype.rnd = function () {
	        return this.int() * (1.0 / MAX_INT);
	    };

	    /**
	     * Generates a random real in the interval [0;1[ with 32-bit resolution.
	     *
	     * Same as .rnd() method - for consistency with Math.random() interface.
	     *
	     * @since 0.2.0
	     * @returns {number}
	     */
	    MersenneTwister.prototype.random = MersenneTwister.prototype.rnd;

	    /**
	     * Generates a random real in the interval [0;1[ with 53-bit resolution.
	     *
	     * @since 0.1.0
	     * @returns {number}
	     */
	    MersenneTwister.prototype.rndHiRes = function () {
	        var a = this.int() >>> 5,
	            b = this.int() >>> 6;

	        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
	    };

	    var instance = new MersenneTwister();

	    /**
	     * A static version of [rnd]{@link module:MersenneTwister#rnd} on a randomly seeded instance.
	     *
	     * @static
	     * @function random
	     * @memberof module:MersenneTwister
	     * @returns {number}
	     */
	    MersenneTwister.random = function () {
	        return instance.rnd();
	    };

	    return MersenneTwister;
	}));
	});

	/** The core CPM class. Can be used for two- or 
	 * three-dimensional simulations. 
	*/

	class CPM {

		constructor( ndim, field_size, conf ){
			if( conf.seed ){
				this.mt = new MersenneTwister( conf.seed );
			} else {
				this.mt = new MersenneTwister( Math.floor(Math.random()*Number.MAX_SAFE_INTEGER) );
			}

			// Attributes based on input parameters
			this.field_size = field_size;			/* grid size ( Note: the grid will run from 0 to 
									field_size pixels, so the actual size in pixels is
									one larger. ) */
			this.ndim = ndim;				// grid dimensions (2 or 3)
			this.conf = conf;				// input parameter settings; see documentation.

			// Some functions/attributes depend on ndim:
			if( ndim == 2 ){
		
				// wrapper functions:
				//this.neigh = this.neigh2D		/* returns coordinates of neighbor pixels
				//					(including diagonal neighbors) */
				this.neighi = this.neighi2D;		/* same, but with pixel index as in/output */
				this.neighC = this.neighC2D;		/* returns indices of neighbor pixels
									(excluding diagnoal neighbors) */
				this.p2i = this.p2i2D;			// converts pixel coordinates to a unique ID
				this.i2p = this.i2p2D;			// converts pixel ID to coordinates

				this.field_size.z = 1;			// for compatibility
				this.midpoint = 			// middle pixel in the grid.
				[ 	Math.round((this.field_size.x-1)/2),
					Math.round((this.field_size.y-1)/2) ]; //,0 ]

			} else {
		
				// wrapper functions: 
				//this.neigh = this.neigh3D		/* returns coordinates of neighbor pixels
				//					(including diagonal neighbors) */
				this.neighi = this.neighi3D;		/* same, but with pixel index as in/output */
				this.neighC = this.neighC3D;		/* returns indices of neighbor pixels
									(excluding diagnoal neighbors) */
				this.p2i = this.p2i3D;			// converts pixel coordinates to a unique ID
				this.i2p = this.i2p3D;			// converts pixel ID to coordinates

				this.midpoint = 
				[	Math.round((this.field_size.x-1)/2),
					Math.round((this.field_size.y-1)/2),
					Math.round((this.field_size.z-1)/2) ];
			}


			// Check that the grid size is not too big to store pixel ID in 32-bit number,
			// and allow fast conversion of coordinates to unique ID numbers.
			this.X_BITS = 1+Math.floor( Math.log2( this.field_size.x - 1 ) );
			this.X_MASK = (1 << this.X_BITS)-1; 

			this.Y_BITS = 1+Math.floor( Math.log2( this.field_size.y - 1 ) );
			this.Y_MASK = (1 << this.Y_BITS)-1;

			this.Z_BITS = 1+Math.floor( Math.log2( this.field_size.z - 1 ) );
			this.Z_MASK = (1 << this.Z_BITS)-1;

			this.dy = 1 << this.Y_BITS; // for neighborhoods based on pixel index
			this.dz = 1 << ( this.Y_BITS + this.Z_BITS );


			if( this.X_BITS + this.Y_BITS + this.Z_BITS > 32 ){
				throw("Field size too large -- field cannot be represented as 32-bit number")
			} 

			// Attributes of the current CPM as a whole:
			this.nNeigh = this.neighi(0).length; 		// neighbors per pixel (depends on ndim)
			this.nr_cells = 0;				// number of cells currently in the grid
			this.time = 0;					// current system time in MCS
		
			// track border pixels for speed (see also the DiceSet data structure)
			this.cellborderpixels = new DiceSet( this.mt );
			this.bgborderpixels = new DiceSet( this.mt ); 

			// Attributes per pixel:
			this.cellpixelsbirth = {};		// time the pixel was added to its current cell.
			this.cellpixelstype = {};		// celltype (identity) of the current pixel.
			this.stromapixelstype = {};		// celltype (identity) for all stroma pixels.

			// Attributes per cell:
			this.cellvolume = [];			
			this.cellperimeter = [];		
			this.t2k = [];				// celltype ("kind"). Example: this.t2k[1] is the celltype of cell 1.
			this.t2k[0] = 0;

			// Wrapper: select function to compute activities based on ACT_MEAN in conf
			if( this.conf.ACT_MEAN == "arithmetic" ){
				this.activityAt = this.activityAtArith;
			} else {
				this.activityAt = this.activityAtGeom;
			}
			
			// terms to use in the Hamiltonian
			if( this.conf.TERMS ){
				this.terms = this.conf.TERMS;
			} else {
				this.terms = ["adhesion","volume","perimeter","actmodel"]; //,"connectivity"]
			}
		}



		/* ------------- GETTING/SETTING PARAMETERS --------------- */

		/* 	helper to get cell-dependent parameters from conf.
			"name" is the parameter name, the 2nd/3rd arguments (optional) are
			the celltypes (identities) to find parameter settings for. */
		par( name ){
			if( arguments.length == 2 ){
				return this.conf[name][this.cellKind( arguments[1] ) ]
			}
			if( arguments.length == 3 ){
				return this.conf[name][this.cellKind(arguments[1] ) ][
					this.cellKind( arguments[2] ) ]
			}
		}
		
		/*  Get adhesion between two cells with type (identity) t1,t2 from "conf" using "this.par". */
		J( t1, t2 ){
			if( t1 == 0 ){
				// Adhesion between ECM and non-background/non-stroma cell
				if( t2 > 0 ){
					return this.par("J_T_ECM",t2)
				}
				// Adhesion ECM-ECM or ECM-stroma is 0.
				return 0
			} else if( t1 > 0 ){
				// adhesion between two non-background/non-stroma cells
				if( t2 > 0 ){
					return this.par("J_T_T",t1,t2)
				}
				// adhesion between stroma and non-background/non-stroma cells
				if( t2 < 0 ){
					return this.par("J_T_STROMA",t1)
				}
				// adhesion between ECM and non-background/non-stroma cells
				return this.par("J_T_ECM",t1)
			} else {
				// adhesion between stroma and non-background/non-stroma cells
				if( t2 > 0 ){
					return this.par("J_T_STROMA",t2)
				}
				// adhesion ECM-ECM or ECM-stroma is 0.
				return 0
			}
		}
		
		/* Get celltype/identity (pixt) or cellkind (pixk) of the cell at coordinates p or index i. */
		pixt( p ){
			return this.pixti( this.p2i(p) )
		}
		pixti( i ){
			return this.cellpixelstype[i] || this.stromapixelstype[i] || 0
		}
		pixki( i ){
			return this.cellKind( this.pixti(i) )
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
		
		/* ------------- GRID HELPER FUNCTIONS --------------- */


		/* 	A mod function with sane behaviour for negative numbers. 
			Use to correctly link grid borders if TORUS = true. */
		fmodx( x ) {
			/*x = x % this.field_size.x
			if( x > 0 ) return x
			return ( x + this.field_size.x ) % this.field_size.x*/
			return x
		}
		fmody( x ) {
			/*x = x % this.field_size.y
			if( x > 0 ) return x
			return ( x + this.field_size.y ) % this.field_size.y*/
			return x
		}
		fmodz( x ) {
			/*x = x % this.field_size.z
			if( x > 0 ) return x
			return ( x + this.field_size.z ) % this.field_size.z*/
			return x
		}	


		/* 	Convert pixel coordinates to unique pixel ID numbers and back.
			Depending on this.ndim, the 2D or 3D version will be used by the 
			wrapper functions p2i and i2p. Use binary encoding for speed. */
		p2i3D ( p ){
			return ( this.fmodx( p[0] ) << ( this.Z_BITS + this.Y_BITS ) ) + 
				( this.fmody( p[1] ) << this.Z_BITS ) + 
				this.fmodz( p[2] )
		}
		i2p3D ( i ){
			return [i >> (this.Y_BITS + this.Z_BITS), ( i >> this.Z_BITS ) & this.Y_MASK, i & this.Z_MASK ]
		}
		p2i2D ( p ){
			return ( this.fmodx( p[0] ) << this.Y_BITS ) + this.fmody( p[1] )
		}
		i2p2D ( i ){
			return [i >> this.Y_BITS, i & this.Y_MASK]
		}
		
		
		/*	Return array of indices of neighbor pixels of the pixel at 
			index i. The separate 2D and 3D functions are called by
			the wrapper function neighi, depending on this.ndim.

		*/
		neighi2D( i, torus = true ){
		
			// normal computation of neighbor indices (top left-middle-right, 
			// left, right, bottom left-middle-right)
			let tl, tm, tr, l, r, bl, bm, br;
			
			tl = i-1-this.dy; tm = i-1; tr = i-1+this.dy;
			l = i-this.dy; r = i+this.dy;
			bl = i+1-this.dy; bm = i+1; br = i+1+this.dy;
			
			// if pixel is part of one of the borders, adjust the 
			// indices accordingly
			let add = NaN; // if torus is false, return NaN for all neighbors that cross
			// the border.
			
			// left border
			if( i < this.field_size.y ){
				if( torus ){
					add = this.field_size.x * this.dy;
				}
				tl += add; l += add; bl += add; 	
			}
			
			// right border
			if( i >= this.dy*( this.field_size.x - 1 ) ){
				if( torus ){
					add = -this.field_size.x * this.dy;
				}
				tr += add; r += add; br += add;
			}

			// top border
			if( i % this.dy == 0 ){
				if( torus ){
					add = this.field_size.y;
				}
				tl += add; tm += add; tr += add;	
			}
			
			// bottom border
			if( (i+1-this.field_size.y) % this.dy == 0 ){
				if( torus ){
					add = -this.field_size.y;
				}
				bl += add; bm += add; br += add;
			}
			
			return [ tl, l, bl, tm, bm, tr, r, br ]

		}
		neighi3D( i, torus = true ){
		
			const dy = this.dy, dz = this.dz;
			const fsx = this.field_size.x, fsy = this.field_size.y, fsz = this.field_size.z;
			
			// normal computation of neighbor indices.
			// first letter: U(upper), M(middle), B(bottom) layer
			// second letter: l(left), m(middle), r(right)
			// third letter: t(top), c(center), b(bottom)
			
			let Ult, Umt, Urt, Ulc, Umc, Urc, Ulb, Umb, Urb,
				Mlt, Mmt, Mrt, Mlc, /*Mmc*/ Mrc, Mlb, Mmb, Mrb,
				Blt, Bmt, Brt, Blc, Bmc, Brc, Blb, Bmb, Brb;
			
			Ult = i-1-dz-dy; Umt = i-1-dz; Urt = i-1-dz+dy;
			Ulc = i-1-dy; Umc = i-1; Urc = i-1+dy;
			Ulb = i-1+dz-dy; Umb = i-1+dz; Urb = i-1+dz+dy;
			
			Mlt = i-dz-dy; Mmt = i-dz; Mrt = i-dz+dy;
			Mlc = i-dy; /*Mmc = i */ Mrc = i+dy;
			Mlb = i+dz-dy; Mmb = i+dz; Mrb = i+dz+dy;
			
			Blt = i+1-dz-dy; Bmt = i+1-dz; Brt = i+1-dz+dy;
			Blc = i+1-dy; Bmc = i+1; Brc = i+1+dy;
			Blb = i+1+dz-dy; Bmb = i+1+dz; Brb = i+1+dz+dy;
			
			// Additions for up/down/left/right/front/back border "faces"
			let add = NaN; // if torus is false, return NaN for all neighbors that cross
			// the border.
			
			// back border
			if( i < dz ){
				if( torus ){
					add = fsy*dz;
				}
				Ult += add; Umt += add; Urt += add; 
				Mlt += add; Mmt += add; Mrt += add;
				Blt += add; Bmt += add; Brt += add;
			}
			
			// front border
			if( i >= dz*( fsy-1 ) ){
				if( torus ){
					add = -fsy*dz;
				}
				Ulb += add; Umb += add; Urb += add;
				Mlb += add; Mmb += add; Mrb += add;
				Blb += add; Bmb += add; Brb += add;		
			}
			
			// left border
			if( i%dz < dy ){
				if( torus ){
					add = fsx*dy;
				}
				Ult += add; Ulc += add; Ulb += add;
				Mlt += add; Mlc += add; Mlb += add;
				Blt += add; Blc += add; Blb += add;
			}
			
			// right border
			if( i%dz >= dy*( fsx-1 ) ){
				if( torus ){
					add = -fsx*dy;
				}
				Urt += add; Urc += add; Urb += add;
				Mrt += add; Mrc += add; Mrb += add;
				Brt += add; Brc += add; Brb += add;
			}
			
			// upper border
			if( ( i%dz )%dy == 0 ){
				if( torus ){
					add = fsz;
				}
				Ult += add; Umt += add; Urt += add;
				Ulc += add; Umc += add;	Urc += add;
				Ulb += add; Umb += add; Urb += add;
			}
			
			// down border
			if( ( i%dz )%dy == (fsz-1) ){
				if( torus ){
					add = -fsz;
				}
				Blt += add; Bmt += add; Brt += add;
				Blc += add; Bmc += add; Brc += add;
				Blb += add; Bmb += add; Brb += add;
			}
			
			return [
				Ult, Ulc, Ulb,
				Umt, Umc, Umb,
				Urt, Urc, Urb,
				
				Mlt, Mlc, Mlb,
				Mmt, Mmb,
				Mrt, Mrc, Mrb,
				
				Blt, Blc, Blb,
				Bmt, Bmc, Bmb,
				Brt, Brc, Brb		
			
			]
			
			/*return[
			
				i-1-dy-dz, i-1-dz, i-1+dy-dz,
				i-dy-dz, i-dz, i+dy-dz,
				i+1-dy-dz, i+1-dz, i+1+dy-dz,
				
				i-1-dy, i-1, i-1+dy,
				i-dy,		i+dy,
				i+1-dy, i+1, i+1+dy,
				
				i-1-dy+dz, i-1+dz, i-1+dy+dz,
				i-dy+dz, i+dz, i+dy+dz, 
				i+1-dy+dz, i+1+dz, i+1+dy+dz ]	*/
		}



		/* 
			The following functions hardcode the neighbors of pixels in a given neighborhood,
			by id number. Consider a local 2D region of 9 pixels with the following ID numbers:
				0	3	5
				1	8	6
				2	4	7
			neighC2D/neighC2Da return objects for each pixel ID (keys) containing arrays with
			their neighbors (values). neighC2Da also considers diagonal neighbors, whereas
			neighC2D does not. The current implementation uses only neighC2D, called by the
			wrapper neighC if ndim = 2.
		*/
		neighC2D() {
			return {
				0 : [1,3],
				1 : [0,2,8],
				2 : [1,4],
				3 : [0,5,8],
				4 : [2,7,8],
				5 : [3,6],
				6 : [5,7,8],
				7 : [4,6],
				8 : [1,3,4,6] 
			}
		}
		neighC2Da(){
			return {
				0 : [1,3,8], 
				1 : [0,2,3,4,8], 
				2 : [1,4,8], 
				3 : [0,1,5,6,8], 
				4 : [1,2,6,7,8], 
				5 : [3,6,8],
				6 : [3,4,5,7,8], 
				7 : [4,6,8],  
				8 : [0,1,2,3,4,5,6,7]
			}
		}
		/* 
			The following functions hardcode the neighbors of pixels in a given 3D neighborhood,
			by id number. Consider a local 3D region of 3*9 pixels with the following ID numbers:
				Upper layer:
				0	3	6
				1	4	7
				2	5	8
				
				Middle layer:
				9	12	15
				10	13	16
				11	14	17
				
				Lower layer:
				18	21	24
				19	22	25
				20	23	26
				
			neighC3D/neighC3Da returns an object with for each pixel ID (keys) linked to arrays with
			their neighbors (values). Considers only non-diagonal neighbors. Called by the
			wrapper neighC if ndim = 3.
		*/	
		neighC3D() {
			
			const N = {
				0 : [1,3,9],			//3 corner ( 2 + 1 ) : 2 from same layer, 1 from layer below
				1 : [0,2,4,10],			//4 border ( 3 + 1 )
				2 : [1,5,11],			//3 corner ( 2 + 1 )
				3 : [0,4,6,12],			//4 border ( 3 + 1 )
				4 : [1,3,5,7,26],		//5 center ( 4 + 1 )
				5 : [2,4,8,13],			//4 border ( 3 + 1 )
				6 : [3,7,14],			//3 corner ( 2 + 1 )
				7 : [4,6,8,15],			//4 border ( 3 + 1 )
				8 : [5,7,16],			//3 corner ( 2 + 1 )
			
				9 : [0,10,12,17],		//4 corner ( 2 + 1 + 1 ) : 2 same layer, 1 upper, 1 lower
				10 : [1,9,26,11,18],	//5 border ( 3 + 1 + 1 )
				11 : [2,10,13,19],		//4 corner ( 2 + 1 + 1 )
				12 : [3,9,26,14,20],	//5 border ( 3 + 1 + 1 )
				26 : [4,10,12,13,15,21],//6 center ( 4 + 1 + 1 )
				13 : [5,11,26,16,22],	//5 border ( 3 + 1 + 1 )
				14 : [6,12,15,23],		//4 corner ( 3 + 1 + 1 )
				15 : [7,26,14,16,24],	//5 border ( 3 + 1 + 1 )
				16 : [8,13,15,25],		//4 corner ( 2 + 1 + 1 )
			
				17 : [11,18,20],		//3 corner ( 2 + 1 ) : 2 same layer, 1 layer above
				18 : [10,17,19,21],		//4 border ( 3 + 1 )
				19 : [11,18,22],		//3 corner ( 2 + 1 )
				20 : [12,17,21,23],		//4 border ( 3 + 1 )
				21 : [26,18,20,22,24],	//5 center ( 4 + 1 )
				22 : [13,19,21,25],		//4 border ( 3 + 1 )
				23 : [14,20,24], 		//3 corner ( 2 + 1 )
				24 : [15,21,23,25],		//4 border ( 3 + 1 )
				25 : [16,22,24]			//3 corner ( 2 + 1 )
			};
			return N
		}

		

		/* ------------- MATH HELPER FUNCTIONS --------------- */

		random (){
			return this.mt.rnd()
		}

		/* Random integer number between incl_min and incl_max */
		ran (incl_min, incl_max) {
			return Math.floor(this.random() * (1.0 + incl_max - incl_min)) + incl_min
		}
		/* dot product */
		dot ( p1, p2 ){
			let r = 0., i = 0;
			for( ; i < p1.length ; i ++ ){
				r += p1[i]*p2[i];
			}
			return r
		}
		
		
		/* ------------- COMPUTING THE HAMILTONIAN --------------- */


		/* ======= ADHESION ======= */

		/*  Returns the Hamiltonian around pixel p, which has ID (type) tp (surrounding pixels'
		 *  types are queried). This Hamiltonian only contains the neighbor adhesion terms.
		 */
		H( i, tp ){

			let r = 0, tn;
			const N = this.neighi( i );

			// Loop over pixel neighbors
			for( let j = 0 ; j < N.length ; j ++ ){
				tn = this.pixti( N[j] );
				if( tn != tp ) r += this.J( tn, tp );
			}

			return r
		}
		
		deltaHadhesion ( sourcei, targeti, src_type, tgt_type ){
			return this.H( targeti, src_type ) - this.H( targeti, tgt_type )
		}
		


		/* ======= VOLUME ======= */

		/* The volume constraint term of the Hamiltonian for the cell with id t.
		   Use vgain=0 for energy of current volume, vgain=1 for energy if cell gains
		   a pixel, and vgain = -1 for energy if cell loses a pixel. 
		*/
		volconstraint ( vgain, t ){

			// the background "cell" has no volume constraint.
			if( t == 0 ) return 0	

			const vdiff = this.par("V",t) - (this.cellvolume[t] + vgain);
			
			return this.par("LAMBDA_V",t)*vdiff*vdiff
		}
		
		deltaHvolume ( sourcei, targeti, src_type, tgt_type ){

			// volume gain of src cell
			let deltaH = this.volconstraint( 1, src_type ) - 
				this.volconstraint( 0, src_type );
			// volume loss of tgt cell
			deltaH += this.volconstraint( -1, tgt_type ) - 
				this.volconstraint( 0, tgt_type );

			return deltaH

		}
		
		
		/* ======= PERIMETER ======= */

		/* The perimeter constraint term of the Hamiltonian. Returns the change in
		   perimeter energy if the pixel at coordinates p is changed from cell "oldt"
		   into "newt".
		*/
		perconstrainti ( pixid, oldt, newt ){
			const N = this.neighi( pixid );
			let perim_before = {}, perim_after = {};
			
			/* Loop over the local neighborhood and track perimeter of the old 
			and new cell (oldt, newt) before/after update. Note that perimeter
			for other cells will not change. */
			perim_before[oldt]=0; perim_before[newt]=0;
			perim_after[oldt]=0; perim_after[newt]=0;

			for( let i = 0 ; i < N.length ; i ++ ){

				// Type of the current neighbor
				const t = this.pixti( N[i] );

				if( t != oldt ){
					perim_before[oldt] ++;
					if( t == newt ) perim_before[newt] ++;
				}
				if( t != newt ){
					perim_after[newt] ++;
					if( t == oldt ) perim_after[oldt] ++;
				}
			}
			// Compare perimeter before and after to evaluate the change in perimeter.
			// Use this to compute the change in perimeter energy.
			const ta = Object.keys( perim_after );
			let r = 0, Pup = {};
			for( let i = 0 ; i < ta.length ; i ++ ){
				if( ta[i] > 0 ){
					Pup[ta[i]] = perim_after[ta[i]] - perim_before[ta[i]];
					const Pt = this.par("P",ta[i]), l = this.par("LAMBDA_P",ta[i]);
					let t = this.cellperimeter[ta[i]]+Pup[ta[i]] - Pt;
					r += l*t*t;
					t = this.cellperimeter[ta[i]] - Pt;
					r -= l*t*t;
				}
			}

			// output variables: r is the change in perimeter energy, Pup the
			// perimeter updates
			return { r:r, Pup:Pup }
		}
		
		deltaHperimeter ( sourcei, targeti, src_type, tgt_type ){
			return this.perconstrainti( targeti, tgt_type, src_type )
		}
		
		
		/* ======= ACT MODEL ======= */
		
		/* Current activity (under the Act model) of the pixel with ID i. */
		pxact ( i ){
			const age = (this.time - this.cellpixelsbirth[i]), 
				actmax = this.par("MAX_ACT",this.cellpixelstype[i]);
				
			return (age > actmax) ? 0 : actmax-age
		}
		/* Act model : compute local activity values within cell around pixel i.
		 * Depending on settings in conf, this is an arithmetic (activityAtArith)
		 * or geometric (activityAtGeom) mean of the activities of the neighbors
		 * of pixel i.
		 */
		activityAtArith( i ){
			const t = this.pixti( i );
			
			// no activity for background/stroma
			if( t <= 0 ){ return 0 }
			
			const N = this.neighi(i);
			let r = this.pxact(i), has_stroma_neighbour = false, nN = 1;
			
			// loop over neighbor pixels
			for( let j = 0 ; j < N.length ; j ++ ){ 
				const tn = this.pixti(N[j]); 
				
				// a neighbor only contributes if it belongs to the same cell
				if( tn == t ){
					r += this.pxact( N[j] );
					nN ++; 
				}
				// track if there are stroma neighbors
				if( tn < 0 ){
					has_stroma_neighbour = true;
				}
			}
			// Special case: encourage cell migration along fibers of the FRC network.
			// In that case, encode FRC as stroma.
			if( has_stroma_neighbour && this.conf.FRC_BOOST ){
				r *= this.par("FRC_BOOST",t);
			}
			return r/nN
		}
		activityAtGeom ( i ){
			const t = this.pixti( i );

			// no activity for background/stroma
			if( t <= 0 ){ return 0 }
			const N = this.neighi( i );
			let nN = 1, r = this.pxact( i ), has_stroma_neighbour = false;

			// loop over neighbor pixels
			for( let j = 0 ; j < N.length ; j ++ ){ 
				const tn = this.pixti(N[j]); 

				// a neighbor only contributes if it belongs to the same cell
				if( tn == t ){
					if( this.pxact( N[j] ) == 0 ) return 0
					r *= this.pxact( N[j] );
					nN ++; 
				}
				// track if there are stroma neighbors
				if( tn < 0 ){
					has_stroma_neighbour = true;
				}
			}
			// Special case: encourage cell migration along fibers of the FRC network.
			// In that case, encode FRC as stroma.
			if( has_stroma_neighbour && this.conf.FRC_BOOST ){
				r *= this.par("FRC_BOOST",1);
			}
			return Math.pow(r,1/nN)
		}
		
		deltaHactmodel ( sourcei, targeti, src_type, tgt_type ){

			let deltaH = 0, maxact, lambdaact;

			// use parameters for the source cell, unless that is the background.
			// In that case, use parameters of the target cell.
			if( src_type != 0 ){
				maxact = this.par("MAX_ACT",src_type);
				lambdaact = this.par("LAMBDA_ACT",src_type);
			} else {
				// special case: punishment for a copy attempt from background into
				// an active cell. This effectively means that the active cell retracts,
				// which is different from one cell pushing into another (active) cell.
				maxact = this.par("MAX_ACT",tgt_type);
				lambdaact = this.par("LAMBDA_ACT",tgt_type);
			}
			if( maxact > 0 ){
				deltaH += lambdaact*(this.activityAt( targeti ) - this.activityAt( sourcei ))/maxact;
			}
			return deltaH
		}
		
		/* ======= CONNECTIVITY ======= */

		/* Connectivity constraint. Checks the number of connected components 
		of type t in neighbourhood N of a pixel with type tp.
		*/
		nrConnectedComponents ( N, t, tp ){
			let r = 0, v, visited = []; 
			const nc = this.neighC(), _this=this;
			
			const Nt = function( k){
				if( k < N.length ){ 
					const t = _this.pixti( N[k] ); 
					return t >= 0 ? t : 0
				}
				// if k is equal to N.length, we mean the middle pixel whose
				// neighbourhood we are looking at (and whose type is tp).
				return tp
			};
			// Loop over the pixels in the neighbourhood N.
			// Add one extra pixel (the pixel whose neighbourhood we are looking at).
			// For each pixel, find all other pixels in the connected component and
			// store them as "visited". Only start a new connected component for 
			// pixels that were not previously visited.
			for( let i = 0 ; i < N.length+1 ; i ++ ){
				let stack = [];
				// we only start at this pixel if it wasn't part of another connected
				// component (visited), and if it is of type t.
				if( !visited[i] && ( Nt(i) == t ) ){
					// this is a new connected component
					r ++;
					// depth first search algorithm to find all pixels in N
					// that are part of this component.
					stack.push( i );
					while( stack.length > 0 ){
						v = stack.pop();
						visited[v] = true;
						const ncv = nc[v];
						for( let j = 0 ; j < ncv.length ; j ++ ){
						// loop over the neighbours within N (in this.neighC(v)[j])
						// add them to the stack if they haven't been visited yet.
							if( !visited[ncv[j]] 
								&& ( Nt(ncv[j] ) == t ) ){
								stack.push( ncv[j] );
							}
						}
					}
				}
			}
			return r
		}
		
		/* Evaluate the change in connectivity energy associated with changing pixel targeti
			from cellid src_type to tgt_type
		*/
		deltaHconnectivity ( sourcei, targeti, src_type, tgt_type ){
			
			// For the connectivity constraint, we look at connected components
			// in the neighbourhood of the target pixel (which might change type).
			const N = this.neighi( targeti );
			let totalcost = 0;
			
			// Changes in connected components of the cell src_type when the pixel at
			// targeti changes from tgt_type to src_type
			let cost1 = this.par("LAMBDA_CONNECTIVITY",tgt_type);
			if( cost1 > 0 ){
				if( this.nrConnectedComponents( N, tgt_type, src_type )
					!= this.nrConnectedComponents( N, tgt_type, tgt_type ) ){
					totalcost += cost1;
					
				}
			}
			// Changes in connected components of the cell tgt_type when the pixel at 
			// targeti changes from tgt_type to src_type
			let cost2 = this.par("LAMBDA_CONNECTIVITY",src_type); 
			if( cost2 > 0 ){
				if( this.nrConnectedComponents( N, src_type, src_type )
					!= this.nrConnectedComponents( N, src_type, tgt_type ) ){
					totalcost += cost2;
				}
			}
			return totalcost
		}
		
		// invasiveness. If there is a celltype a that prefers to invade
		// pixels of type b. Currently not used.
		deltaHinvasiveness ( sourcei, targeti, src_type, tgt_type ){
			var deltaH = 0;	
			if( tgt_type != 0 && src_type != 0 && this.conf.INV ){
				deltaH += this.par( "INV", tgt_type, src_type );
			}
			return -deltaH
		}
		
		// returns both change in hamiltonian and perimeter
		deltaH ( sourcei, targeti, src_type, tgt_type ){

			
			const terms = this.terms;
			let dHlog = {}, per, currentterm;
		
			let r = 0.0;
			for( let i = 0 ; i < terms.length ; i++ ){
				currentterm = this["deltaH"+terms[i]].call( this,sourcei,targeti,src_type,tgt_type );
				if( terms[i]=="perimeter"){
					r+=currentterm.r;
					per = currentterm;
					dHlog[terms[i]] = currentterm.r;
				} else {
					r += currentterm;
					dHlog[terms[i]] = currentterm;
				}
			
			}

			if( ( this.logterms || 0 ) && this.time % 100 == 0 ){
				// eslint-disable-next-line no-console
				console.log( dHlog );
			}

			return ({ dH: r, per: per })

		}
		
		
		
		
		/* ------------- COPY ATTEMPTS --------------- */

		/* 	Simulate one MCS (a number of copy attempts depending on grid size):
			1) Randomly sample one of the border pixels for the copy attempt.
			2) Compute the change in Hamiltonian for the suggested copy attempt.
			3) With a probability depending on this change, decline or accept the 
			   copy attempt and update the grid accordingly. 
		*/
		
		monteCarloStep (){

			let delta_t = 0.0;

			// this loop tracks the number of copy attempts until one MCS is completed.
			while( delta_t < 1.0 ){

				// This is the expected time (in MCS) you would expect it to take to
				// randomly draw another border pixel.
				delta_t += 1./(this.bgborderpixels.length + this.cellborderpixels.length);


				let p1i;
				// Randomly sample one of the CPM border pixels (the "source" (src)),
				// and one of its neighbors (the "target" (tgt)).
				if( this.ran( 0, this.bgborderpixels.length + this.cellborderpixels.length )
					< this.bgborderpixels.length ){
					p1i = this.bgborderpixels.sample();
				} else {
					p1i = this.cellborderpixels.sample();
				}
			
				const N = this.neighi( p1i );
				const p2i = N[this.ran(0,N.length-1)];
			
				const src_type = this.pixti( p1i );
				const tgt_type = this.pixti( p2i );

				// only compute the Hamiltonian if source and target belong to a different cell,
				// and do not allow a copy attempt into the stroma. Only continue if the copy attempt
				// would result in a viable cell.
				if( tgt_type >= 0 && src_type != tgt_type ){

					const hamiltonian = this.deltaH( p1i, p2i, src_type, tgt_type );

					// probabilistic success of copy attempt        
					if( this.docopy( hamiltonian.dH ) ){
						this.setpixi( p2i, src_type, hamiltonian.per.Pup );
					}
				}

			}

			this.time++; // update time with one MCS.
		}	

		/* Determine whether copy attempt will succeed depending on deltaH (stochastic). */
		docopy ( deltaH ){
			if( deltaH < 0 ) return true
			return this.random() < Math.exp( -deltaH / this.conf.T )
		}
		/* Change the pixel at position p (coordinates) into cellid t. 
		Update cell perimeters with Pup (optional parameter).*/
		setpixi ( i, t, Pup ){
			const t_old = this.cellpixelstype[i];

			// If Pup not specified, compute it here.
			if( !Pup ){
				Pup = this.perconstrainti( i, t_old, t ).Pup;
			}
			// Specific case: changing a pixel into background (t = 0) is done by delpix.
			if( t == 0 ){
				this.delpixi( i );
			} else {
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
				// store the time when the new pixel was added
				this.cellpixelsbirth[i] = this.time;

				// update volume of the new cell and cellid of the pixel.
				this.cellpixelstype[i] = t;
				this.cellvolume[t] ++;
			}
			// update cellperimeters and border pixels.
			this.updateperimeter( Pup );
			this.updateborderneari( i );
		}
		setpix ( p, t, Pup ){
			this.setpixi( this.p2i(p), t, Pup );
		}
		/* Change pixel at coordinates p/index i into background (t=0) */
		delpixi ( i ){
			const t = this.cellpixelstype[i];

			// Reduce cell volume.
			this.cellvolume[t] --;

			// remove this pixel from objects cellpixelsbirth / cellpixelstype
			delete this.cellpixelsbirth[i];
			delete this.cellpixelstype[i];

			// if this was the last pixel belonging to this cell, 
			// remove the cell altogether.
			if( this.cellvolume[t] == 0 ){
				delete this.cellvolume[t];
				delete this.t2k[t];
			}

		}
		delpix ( p ){
			this.delpixi( this.p2i(p) );
		}
		/* Update each cell's perimeter after a successful copy attempt. */
		updateperimeter ( Pup ){
			const ta = Object.keys( Pup );
			for( let i = 0 ; i < ta.length ; i ++ ){
				this.cellperimeter[ta[i]] += Pup[ta[i]];
			}
		}
		/* Update border elements after a successful copy attempt. */
		updateborderneari ( i ){

			// neighborhood + pixel itself (in indices)
			const Ni = this.neighi(i);
			Ni.push(i);
			
			for( let j = 0 ; j < Ni.length ; j ++ ){

				i = Ni[j];
				const t = this.pixti( i );

				// stroma pixels are not stored
				if( t < 0 ) continue
				let isborder = false;

				// loop over neighborhood of the current pixel.
				// if the pixel has any neighbors belonging to a different cell,
				// it is a border pixel.			
				const N = this.neighi( Ni[j] );
				for( let k = 0 ; k < N.length ; k ++ ){
					if( this.pixti( N[k] ) != t ){
						isborder = true; break
					}
				}

				// if current pixel is background, it should not be part of
				// cellborderpixels (only for celltypes > 0). Whether it
				// should be part of bgborderpixels depends on isborder.
				if( t == 0 ){
					this.cellborderpixels.remove( i );
					if( isborder ){
						this.bgborderpixels.insert( i );
					} else {
						this.bgborderpixels.remove( i );
					}
				// if current pixel is from a cell, this works the other way around.
				} else {
					this.bgborderpixels.remove( i );
					if( isborder ){
						this.cellborderpixels.insert( i );
					} else {
						this.cellborderpixels.remove( i );
					}
				}
			}
		}


		/* ------------- MANIPULATING CELLS ON THE GRID --------------- */


		/* Initiate a new cellid for a cell of celltype "kind", and create elements
		   for this cell in the relevant arrays (cellvolume, cellperimeter, t2k).*/
		makeNewCellID ( kind ){
			const newid = ++ this.nr_cells;
			this.cellvolume[newid] = 0;
			this.cellperimeter[newid] = 0;
			this.setCellKind( newid, kind );
			return newid
		}
		/* Seed a new cell of celltype "kind" onto position "p".*/
		seedCellAt ( kind, p ){
			const newid = this.makeNewCellID( kind );
			const id = this.p2i( p );
			this.setpixi( id, newid );
			return newid
		}
		/* Seed a new cell of celltype "kind" to a random position on the grid.
			Opts: fixToStroma (only seed next to stroma),
			brutal (allow seeding into other non-background cell),
			avoid (do not allow brutal seeding into cell of type "avoid"). */
		seedCell ( kind, opts ){
			let N, p;
			// By default, seed a cell of kind 1, without any options.
			if( arguments.length < 1 ){
				kind = 1;
			}
			if( arguments.length < 2 ){
				opts = {};
			}
			if( !opts.fixToStroma ){
				// N: max amount of trials, avoids infinite loops in degenerate
				// situations
				for( N = 1000; N>0 ; N-- ){
					// random position on the grid
					p = [this.ran( 0, this.field_size.x-1 ),
						this.ran( 0, this.field_size.y-1 )];
					if( this.ndim == 3 ){
						p.push( this.ran( 0, this.field_size.z-1 ) );
					} else {
						p.push( 0 );
					}
					const t = this.pixti( this.p2i( p ) );

					// seeding successful if this position is background, or if
					// the brutal option is on.
					if( t == 0 || opts.brutal ){
						if( !opts.hasOwnProperty("avoid") ||
							opts.avoid != this.cellKind(t) ){
							break
						}
					} 
				}
			// if option fixToStroma
			} else {
				const stromapixels = Object.keys( this.stromapixelstype );
				const Ns=stromapixels.length;
				for( N = 1000; N>0 ; N-- ){
					// Choose a random stroma pixel, and then randomly choose one of its
					// neighbors.
					p = this.i2p( this.neighi( stromapixels[this.ran(0,Ns-1)] )[
						this.ran(0,this.nNeigh-1)] );
					// continue until you find a background pixel for seeding.
					if( this.pixti( this.p2i( p )) == 0 ){
						break
					}
				}
			}
			if( N == 0 ) return false
			return this.seedCellAt( kind, p, opts )
		}
		/* Change the pixels defined by stromavoxels (array of coordinates p) into
		   the special stromatype. */
		addStroma ( stromavoxels, stromatype ){
			// the celltype used for stroma is default -1.
			if( arguments.length < 2 ){
				stromatype = -1;
			}
			// store stromapixels in a special object. 
			for( let i = 0 ; i < stromavoxels.length ; i ++ ){
				this.stromapixelstype[this.p2i( stromavoxels[i] )]=stromatype;
			}
		}
		// Adds a plane of stroma pixels at coord x/y/z (coded by 0,1,2) value [coordvalue],
		// by letting the other coordinates range from their min value 0 to their max value.
		addStromaPlane ( stromavoxels, coord, coordvalue ){
			let x,y,z;
			let minc = [0,0,0];
			let maxc = [this.field_size.x-1, this.field_size.y-1, this.field_size.z-1];
			minc[coord] = coordvalue;
			maxc[coord] = coordvalue;

			// For every coordinate x,y,z, loop over all possible values from min to max.
			// one of these loops will have only one iteration because min = max = coordvalue.
			for( x = minc[0]; x <= maxc[0]; x++ ){
				for( y = minc[1]; y<=maxc[1]; y++ ){
					for( z = minc[2]; z<=maxc[2]; z++ ){
						if( this.ndim == 3 ){
							stromavoxels.push( [x,y,z] );	
						} else {
							//console.log(x,y)
							stromavoxels.push( [x,y] );
						}
					}
				}
			}

			return stromavoxels
		}

		addStromaBorder ( stromatype ){
			let stromavoxels = [];
			const x = this.field_size.x-1, y = this.field_size.y-1, z = this.field_size.z-1;

			// the celltype used for stroma is default -1.
			if( arguments.length < 1 ){
				stromatype = -1;
			}
			
			// depending on ndim
			stromavoxels = this.addStromaPlane( stromavoxels, 0, 0, stromatype );
			stromavoxels = this.addStromaPlane( stromavoxels, 0, x, stromatype );
			stromavoxels = this.addStromaPlane( stromavoxels, 1, 0, stromatype );
			stromavoxels = this.addStromaPlane( stromavoxels, 1, y, stromatype );
			if( this.ndim == 3 ){
				stromavoxels = this.addStromaPlane( stromavoxels, 2, 0, stromatype );
				stromavoxels = this.addStromaPlane( stromavoxels, 2, z, stromatype );
			}

			this.addStroma( stromavoxels, stromatype );
		}


		/** Checks whether position p (given as array) is adjacent to any pixel of type
		t */
		isAdjacentToType ( p, t ){
			const i = this.p2i(p);
			const N = this.neighi( i );
			return N.map( function(pn){ return this.pixti(pn)==t } ).
				reduce( function(xa,x){ return xa || x }, false ) 
		}
		countCells ( kind ){
			return this.t2k.reduce( function(xa,x){ return (x==kind) + xa } )
		}

	}

	/** Class for taking a CPM grid and displaying it in either browser or with nodejs. */

	// Constructor takes a CPM object C
	function Canvas( C, options ){
		this.C = C;
		this.zoom = (options && options.zoom) || 1;

		this.wrap = (options && options.wrap) || [0,0,0];
		this.width = this.wrap[0];
		this.height = this.wrap[1];

		if( this.width == 0 || this.C.field_size.x < this.width ){
			this.width = this.C.field_size.x;
		}
		if( this.height == 0 || this.C.field_size.y < this.height ){
			this.height = this.C.field_size.y;
		}

		if( typeof document !== "undefined" ){
			this.el = document.createElement("canvas");
			this.el.width = this.width*this.zoom;
			this.el.height = this.height*this.zoom;//C.field_size.y*this.zoom
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


	Canvas.prototype = {


		/* Several internal helper functions (used by drawing functions below) : */
		pxf : function( p ){
			this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], this.zoom, this.zoom );
		},

		pxfnozoom : function( p ){
			this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], 1, 1 );
		},
		/* draw a line left (l), right (r), down (d), or up (u) of pixel p */
		pxdrawl : function( p ){
			this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], 1, this.zoom );
		},
		pxdrawr : function( p ){
			this.ctx.fillRect( this.zoom*(p[0]+1), this.zoom*p[1], 1, this.zoom );
		},
		pxdrawd : function( p ){
			this.ctx.fillRect( this.zoom*p[0], this.zoom*(p[1]+1), this.zoom, 1 );
		},
		pxdrawu : function( p ){
			this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], this.zoom, 1 );
		},

		/* For easier color naming */
		col : function( hex ){
			this.ctx.fillStyle="#"+hex;
		},
		/* Color the whole grid in color [col] */
		clear : function( col ){
			col = col || "000000";
			this.ctx.fillStyle="#"+col;
			this.ctx.fillRect( 0,0, this.el.width, this.el.height );
		},

		context : function(){
			return this.ctx
		},

		i2p : function( i ){
			var p = this.C.i2p( i ), dim;
			for( dim = 0; dim < p.length; dim++ ){
				if( this.wrap[dim] != 0 ){
					p[dim] = p[dim] % this.wrap[dim];
				}
			}
			return p
		},

		/* DRAWING FUNCTIONS ---------------------- */

		/* Use to draw the border of each cell on the grid in the color specified in "col"
		(hex format). This function draws a line around the cell (rather than coloring the
		outer pixels). If [kind] is negative, simply draw all borders. */
		drawCellBorders : function( kind, col ){
			col = col || "000000";
			var p, pc, pu, pd, pl, pr, i, pdraw;
			this.col( col );
			this.ctx.fillStyle="#"+col;

			// cst contains indices of pixels at the border of cells
			var cst =  this.C.cellborderpixels.elements;
			for( i = 0 ; i < cst.length ; i ++ ){
				if( kind < 0 || this.C.cellKind(this.C.cellpixelstype[cst[i]]) == kind ){
					p = this.C.i2p( cst[i] );
					pdraw = this.i2p( cst[i] );
					pc = this.C.pixt( [p[0],p[1],0] );
					pr = this.C.pixt( [p[0]+1,p[1],0] );
					pl = this.C.pixt( [p[0]-1,p[1],0] );		
					pd = this.C.pixt( [p[0],p[1]+1,0] );
					pu = this.C.pixt( [p[0],p[1]-1,0] );
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
		},
		/* Use to show activity values of the act model using a color gradient, for
		cells in the grid of cellkind "kind". */
		drawActivityValues : function( kind ){

			// cst contains the pixel ids of all non-background/non-stroma cells in
			// the grid. The function tohex is used to convert computed color gradients
			// to the hex format.
			var cst = Object.keys( this.C.cellpixelstype ), ii, sigma, a,
				tohex = function(a) { a = parseInt(255*a).toString(16); 
					return  ("00".substring(0,2-a.length))+a }, i;

			// loop over all pixels belonging to non-background, non-stroma
			for( i = 0 ; i < cst.length ; i ++ ){
				ii = cst[i];
				sigma = this.C.cellpixelstype[ii];

				// For all pixels that belong to the current kind, compute
				// color based on activity values, convert to hex, and draw.
				if( this.C.cellKind(sigma) == kind ){
					a = this.C.pxact( ii )/this.C.par("MAX_ACT",sigma);
					if( a > 0 ){
						if( a > 0.5 ){
							this.col( "FF"+tohex(2-2*a)+"00" );
						} else {
							this.col( tohex(2*a)+"FF00" );
						} 
						this.pxf( this.i2p( ii ) );
					}
				}
			}
		},
		/* colors outer pixels of each cell */
		drawOnCellBorders : function( col ){
			col = col || "000000";
			this.col( col );
			this.ctx.fillStyle="#"+col;
			var cst =  this.C.cellborderpixels.elements, i;
			for( i = 0 ; i < cst.length ; i ++ ){
				this.pxf( this.i2p( cst[i] ) );
			}
		},

		/* Draw all cells of cellkind "kind" in color col (hex). col can also be a function that
		 * returns a hex value for a cell id. */
		drawCells : function( kind, col ){
			if( ! col ){
				col = "000000";
			}
			if( typeof col == "string" ){
				this.col(col);
			}
			// Object cst contains pixel index of all pixels belonging to non-background,
			// non-stroma cells.
			var cst = Object.keys( this.C.cellpixelstype ), i;
			var cellpixelsbyid = {};
			for( i = 0 ; i < cst.length ; i ++ ){
				let cid = this.C.cellpixelstype[cst[i]];
				if( this.C.cellKind(cid) == kind ){
					if( !cellpixelsbyid[cid] ){
						cellpixelsbyid[cid] = [];
					}
					cellpixelsbyid[cid].push( cst[i] );
				}
			}
			for( let cid of Object.keys( cellpixelsbyid ) ){
				if( typeof col == "function" ){
					this.col( col(cid) );
				}
				for( let cp of cellpixelsbyid[cid] ){
					this.pxf( this.i2p( cp ) );
				}
			}
		},

		/* Draw all stroma pixels in color col (hex). */
		drawStroma : function( col ){
			col = col || "000000";
			this.col( col );

			// Loop over all stroma pixels. Object cst contains
			// pixel index of all stroma pixels.
			var cst = Object.keys( this.C.stromapixelstype ), i;
			for( i = 0 ; i < cst.length ; i ++ ){
				this.pxf( this.i2p( cst[i] ) );
			}
		},

		/* Draw grid to the png file "fname". */
		writePNG : function( fname ){
			this.fs.writeFileSync(fname, this.el.toBuffer());
		}
	};

	/** Class for outputting various statistics from a CPM simulation, as for instance
	    the centroids of all cells (which is actually the only thing that's implemented
	    so far) */

	function Stats( C ){
		this.C = C;
		this.ndim = this.C.ndim;
	}

	Stats.prototype = {

		// ------------  FRC NETWORK 

		// for simulation on FRC network. Returns all cells that are in contact with
		// a stroma cell.
		cellsOnNetwork : function(){
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
		},
		
		
		// ------------  CELL LENGTH IN ONE DIMENSION
		// (this does not work with a grid torus).
			
		// For computing mean and variance with online algorithm
		updateOnline : function( aggregate, value ){
			
			var delta, delta2;

			aggregate.count ++;
			delta = value - aggregate.mean;
			aggregate.mean += delta/aggregate.count;
			delta2 = value - aggregate.mean;
			aggregate.sqd += delta*delta2;

			return aggregate
		},
		newOnline : function(){
			return( { count : 0, mean : 0, sqd : 0 } ) 
		},
		// return mean and variance of coordinates in a given dimension for cell t
		// (dimension as 0,1, or 2)
		cellStats : function( t, dim ){

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
		},
		// get the length (variance) of cell in a given dimension
		// does not work with torus!
		getLengthOf : function( t, dim ){
			
			// get mean and sd in x direction
			var stats = this.cellStats( t, dim );
			return stats.variance

		},
		// get the range of coordinates in dim for cell t
		// does not work with torus!
		getRangeOf : function( t, dim ){

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

		},
		
		// ------------  CONNECTEDNESS OF CELLS
		// ( compatible with torus )
		
		// Compute connected components of the cell ( to check connectivity )
		getConnectedComponentOfCell : function( t, cellindices ){
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
		},
		getConnectedComponents : function(){
		
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
		},	
		
		// Compute probabilities that two pixels taken at random come from the same cell.
		getConnectedness : function(){
		
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
		},	
		
		// ------------  PROTRUSION ANALYSIS: PERCENTAGE ACTIVE / ORDER INDEX 
		// ( compatible with torus )
		
		// Compute percentage of pixels with activity > threshold
		getPercentageActOfCell : function( t, cellindices, threshold ){
			if( cellindices.length == 0 ){ return }
			var i, count = 0;

			for( i = 0 ; i < cellindices.length ; i ++ ){
				if( this.C.pxact( cellindices[i] ) > threshold ){
					count++;
				}
			}
			return 100*(count/cellindices.length)
		
		},
		getPercentageAct : function( threshold ){
		
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
		
		},
		// Computing an order index of the activity gradients within the cell.
		getGradientAt : function( t, i ){
		
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
			
		},
		// compute the norm of a vector (in array form)
		norm : function( v ){
			var i;
			var norm = 0;
			for( i = 0; i < v.length; i++ ){
				norm += v[i]*v[i];
			}
			norm = Math.sqrt( norm );
			return norm
		},
		getOrderIndexOfCell : function( t, cellindices ){
		
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
		},
		getOrderIndices : function( ){
			var cpi = this.cellborderpixelsi();
			var tx = Object.keys( cpi ), i, orderindices = {};
			for( i = 0 ; i < tx.length ; i ++ ){
				orderindices[tx[i]] = this.getOrderIndexOfCell( tx[i], cpi[tx[i]] );
			}
			return orderindices
		
		},
		
		// ------------  CENTROIDS
		// ( compatible with torus )
		//
		// computation of cell centroid is more complicated when the grid is a torus.
		// We compute connected components of the cell with the option torus = false in
		// the computation of neighbourhoods, which means that pixels crossing the border
		// are not considered neighbours (see CPM.js ). We then compute the total centroid as
		// a weighted average of the centroids of the connected components, which we correct
		// separately if they cross the grid borders. 
		
		// Return connected components of the cell ( to compute centroids )
		returnConnectedComponentOfCell : function( t, cellindices ){
			if( cellindices.length == 0 ){ return }

			var visited = {}, k=1, pixels = {}, myself = this;

			var labelComponent = function(seed, k){
				var q = [parseInt(seed)];
				visited[q[0]] = 1;
				pixels[k] = [];
				while( q.length > 0 ){
					var e = parseInt(q.pop());
					pixels[k].push( myself.C.i2p(e) );
					var ne = myself.C.neighi( e, false );
					for( var i = 0 ; i < ne.length ; i ++ ){
						if( !isNaN( ne[i] ) ){
							if( myself.C.pixti( ne[i] ) == t &&
								!visited.hasOwnProperty(ne[i]) ){
								q.push(ne[i]);
								visited[ne[i]]=1;
							}
						
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

			return pixels
		},
		// converts an array of pixel coordinates to its centroid
		pixelsToCentroid : function( cellpixels ){
			let cvec, j;

			// fill the array cvec with zeros first
			cvec = Array.apply(null, Array(this.ndim)).map(Number.prototype.valueOf,0);

			// loop over pixels to sum up coordinates
			for( j = 0; j < cellpixels.length; j++ ){
				// loop over coordinates x,y,z
				for( let dim = 0; dim < this.ndim; dim++ ){
					cvec[dim] += cellpixels[j][dim];
				}		
			}

			// divide to get mean
			for( let dim = 0; dim < this.ndim; dim++ ){
				cvec[dim] /= j;
			}

			return cvec
		},

		// computes the centroid of a cell when grid has a torus.
		getCentroidOfCellWithTorus : function( t, cellindices ){
			
			if( cellindices.length == 0 ){ return }
			
			// get the connected components and the pixels in it
			let ccpixels = this.returnConnectedComponentOfCell( t, cellindices );
			
			// centroid of the first component
			let c = Object.keys( ccpixels );
			let centroid0 = this.pixelsToCentroid( ccpixels[ c[0] ] );

			// loop over the connected components to compute a weighted sum of their 
			// centroids.
			let n = 0, 
				centroid = Array.apply(null, Array(this.ndim)).map(Number.prototype.valueOf,0);
			const fs = [ this.C.field_size.x, this.C.field_size.y, this.C.field_size.z ];
			for( let j = 0; j < c.length; j++ ){
			
				let centroidc, nc, d;
				centroidc = this.pixelsToCentroid( ccpixels[ c[j] ] );
				nc = ccpixels[ c[j] ].length;
				n += nc;
				
				// compute weighted sum. 
				for( d = 0; d < this.ndim; d++ ){
				
					// If centroid is more than half the field size away
					// from the first centroid0, it crosses the border, so we 
					// first correct its coordinates.
					if( centroidc[d] - centroid0[d] > fs[d]/2 ){
						centroidc[d] -= fs[d];
					}
					if( centroidc[d] - centroid0[d] < -fs[d]/2 ){
						centroidc[d] += fs[d];
					}
					
					centroid[d] += centroidc[d] * nc;
				}
				
			}
			
			// divide by the total n to get the mean
			let d;
			for( d = 0; d < this.ndim; d++ ){
				centroid[d] /= n;
			}

			return centroid		
		},	
		// center of mass of cell t; cellpixels object can be given as the second argument
		getCentroidOf : function( t ){
			var cvec, cpt;
			if( arguments.length == 2 ){
				cpt = arguments[1];
			} else {
				cpt = this.cellpixelsi();
			}
			
			cvec = this.getCentroidOfCellWithTorus( t, cpt[t] );

			return cvec
		},
		// center of mass (return)
		getCentroids : function(){
			
			let cpi;
		
			if( arguments.length == 1 ){
				cpi = arguments[0];
			} else {
				cpi = this.cellpixelsi();
			}
		
			const tx = Object.keys( cpi );
			let cvec, r = [], current, i;

			// loop over the cells in tx to get their centroids
			for( i = 0; i < tx.length; i++ ){
				cvec = this.getCentroidOf( tx[i], cpi[tx[i]] );

				// output depending on ndim
				current = { id : tx[i], x : cvec[0], y : cvec[1] };
				if( this.ndim == 3 ){
					current["z"] = cvec[2];			
				}
				r.push( current );
			}
			return r
		},
		// center of mass (print to console)
		centroids : function(){
			var cp = this.cellpixelsi();
			var tx = Object.keys( cp );	
			var cvec, i;

			// loop over the cells in tx to get their centroids
			for( i = 0; i < tx.length; i++ ){
				cvec = this.getCentroidOf( tx[i], cp[tx[i]] );

				// eslint-disable-next-line no-console
				console.log( 
					tx[i] + "\t" +
					this.C.time + "\t" +
					this.C.time + "\t" +
					cvec.join("\t")
				);

			}
		},

		// returns a list of all cell ids of the cells that border to "cell" and are of a different type
		// a dictionairy with keys = neighbor cell ids, and 
		// values = number of "cell"-pixels the neighbor cell borders to
		cellNeighborsList : function( cell, cbpi ) {
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
		},

		// ------------ HELPER FUNCTIONS
		
		// returns an object with a key for each celltype (identity). 
		// The corresponding value is an array of pixel coordinates per cell.
		cellpixels : function(){
			var cp = {};
			var px = Object.keys( this.C.cellpixelstype ), t, i;
			for( i = 0 ; i < px.length ; i ++ ){
				t = this.C.cellpixelstype[px[i]];
				if( !(t in cp ) ){
					cp[t] = [];
				}
				cp[t].push( this.C.i2p( px[i] ) );
			}
			return cp
		},

		cellpixelsi : function(){
			var cp = {};
			var px = Object.keys( this.C.cellpixelstype ), t, i;
			for( i = 0 ; i < px.length ; i ++ ){
				t = this.C.cellpixelstype[px[i]];
				if( !(t in cp ) ){
					cp[t] = [];
				}
				cp[t].push( px[i] );
			}
			return cp
		},
	  
		cellborderpixelsi : function(){
			let cp = {}, t;
			const px = this.C.cellborderpixels.elements;
			for( let i = 0; i < px.length; i++ ){
				t = this.C.cellpixelstype[px[i]];
				if( !(t in cp ) ){
					cp[t] = [];
				}
				cp[t].push( px[i] );
			}
			return cp		
		}

	};

	/* This class contains methods that should be executed once per monte carlo step.
	   Examples are cell division, cell death etc.
	 */

	function GridManipulator( C ){
		this.C = C;
		this.Cs = new Stats( C );
	}

	GridManipulator.prototype = {

		/* this.cellpixels is an object with keys for every cell type (identity) in the grid.
		values contain pixel coordinates for all pixels belonging to that cell. */
		prepare: function(){
			this.cellpixels = this.Cs.cellpixels();
		},
		/* Kill a cell by setting its kind to 4 */
		killCell: function( t ){
			//console.log("killing cell "+t)
			/*var cp = this.cellpixels
			for( var j = 0 ; j < cp[t].length ; j ++ ){
				this.C.setpix( cp[t][j], 0 )
			}*/
			this.C.setCellKind( t, 4 );
		},
		/* With a given [probability], kill cells of kind [kind] that have a volume of
		less than [lowerbound] of their target volume. */
		killTooSmallCells : function( kind, probability, lowerbound ){
			var cp = this.cellpixels, C = this.C;
			var ids = Object.keys(cp);

			// Loop over cells in the grid
			for( var i = 0 ;  i < ids.length ; i++ ){
				var t = ids[i];
				var k = C.cellKind(t);
				if( k == kind && ( C.getVolume( t ) < C.conf.V[kind]*lowerbound ) ){
					if( C.random() < probability ){
						this.killCell( t );
					}
				}
			}
		},

		/* Let cell t divide by splitting it along a line perpendicular to
		 * its major axis. */
		divideCell2D : function( id ){
			let cp = this.cellpixels, C = this.C, Cs = this.Cs;
			let bxx = 0, bxy = 0, byy=0,
				com = Cs.getCentroidOf( id ), cx, cy, x2, y2, side, T, D, x0, y0, x1, y1, L2;

			// Loop over the pixels belonging to this cell
			for( var j = 0 ; j < cp[id].length ; j ++ ){
				cx = cp[id][j][0] - com[0]; // x position rel to centroid
				cy = cp[id][j][1] - com[1]; // y position rel to centroid

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
			var nid = C.makeNewCellID( C.cellKind( id ) );

			// Loop over the pixels belonging to this cell
			//let sidea = 0, sideb = 0
			for( j = 0 ; j < cp[id].length ; j ++ ){
				// coordinates of current cell relative to center of mass
				x2 = cp[id][j][0]-com[0];
				y2 = cp[id][j][1]-com[1];

				// Depending on which side of the dividing line this pixel is,
				// set it to the new type
				side = (x1 - x0)*(y2 - y0) - (x2 - x0)*(y1 - y0);
				if( side > 0 ){
					//sidea ++
					C.setpix( cp[id][j], nid ); 
				}
			}
			//console.log( sidea, sideb )
			return nid
		},

		/* With a given probability, let cells of kind [kind] divide. */
		divideCells2D: function( kind, probability, minvolume=10 ){
			var cp = this.cellpixels, C = this.C;
			var ids = Object.keys(cp);		
			// loop over the cells
			for( var i = 0 ;  i < ids.length ; i++ ){
				var id = ids[i];
				var k = C.cellKind(id); 
				if( k == kind && ( C.getVolume( id ) >= minvolume ) && C.random() < probability ){
					this.divideCell2D( id );
				}
			}
		}
	};

	/* This extends the CPM from CPM.js with a chemotaxis module. 
	Can be used for two- or three-dimensional simulations, but visualization
	is currently supported only in 2D. Usable from browser and node.
	*/

	class CPMChemotaxis extends CPM {

		constructor( ndim, field_size, conf ) {
			// call the parent (CPM) constructor
			super( ndim, field_size, conf );
			// make sure "chemotaxis" is included in list of terms
			if( this.terms.indexOf( "chemotaxis" ) == -1 ){	
				this.terms.push( "chemotaxis" );
			}
		}


		/*  To bias a copy attempt p1->p2 in the direction of target point pt.
			Vector p1 -> p2 is the direction of the copy attempt, 
			Vector p1 -> pt is the preferred direction. Then this function returns the cosine
			of the angle alpha between these two vectors. This cosine is 1 if the angle between
			copy attempt direction and preferred direction is 0 (when directions are the same), 
			-1 if the angle is 180 (when directions are opposite), and 0 when directions are
			perpendicular. */
		pointAttractor ( p1, p2, pt ){
			let r = 0., norm1 = 0, norm2 = 0, d1=0., d2=0.;
			for( let i=0 ; i < p1.length ; i ++ ){
				d1 = pt[i]-p1[i]; d2 = p2[i]-p1[i];
				r += d1 * d2;
				norm1 += d1*d1;
				norm2 += d2*d2;
			}
			if( norm1 == 0 || norm2 == 0 ) return 0
			return r/Math.sqrt(norm1)/Math.sqrt(norm2)
		}
		
		/* To bias a copy attempt p1 -> p2 in the direction of vector 'dir'.
		This implements a linear gradient rather than a radial one as with pointAttractor. */
		linAttractor ( p1, p2, dir ){

			let r = 0., norm1 = 0, norm2 = 0, d1 = 0., d2 = 0.;
			// loops over the coordinates x,y,(z)
			for( let i = 0; i < p1.length ; i++ ){
				// direction of the copy attempt on this coordinate is from p1 to p2
				d1 = p2[i] - p1[i];

				// direction of the gradient
				d2 = dir[i];
				r += d1 * d2; 
				norm1 += d1*d1;
				norm2 += d2*d2;
			}
			return r/Math.sqrt(norm1)/Math.sqrt(norm2)
		}

		/* This computes the gradient based on a given function evaluated at the two target points. */ 
		gridAttractor ( p1, p2, dir ){
			return dir( p2 ) - dir( p1 )
		}
		
		deltaHchemotaxis ( sourcei, targeti, src_type, tgt_type ){
			const gradienttype = this.conf["GRADIENT_TYPE"];
			const gradientvec = this.conf["GRADIENT_DIRECTION"];
			let bias, lambdachem;

			if( gradienttype == "radial" ){
				bias = this.pointAttractor( this.i2p(sourcei), this.i2p(targeti), gradientvec );
			} else if( gradienttype == "linear" ){
				bias = this.linAttractor( this.i2p(sourcei), this.i2p(targeti), gradientvec );
			} else if( gradienttype == "grid" ){
				bias = this.gridAttractor( this.i2p( sourcei ), this.i2p( targeti ), gradientvec );
			} else if( gradienttype == "custom" ){
				bias = gradientvec( this.i2p( sourcei ), this.i2p( targeti ), this );
			} else {
				throw("Unknown GRADIENT_TYPE. Please choose 'linear', 'radial', 'grid', or 'custom'." )
			}

			// if source is non background, lambda chemotaxis is of the source cell.
			// if source is background, use lambda chemotaxis of target cell.
			if( src_type != 0 ){
				lambdachem = this.par("LAMBDA_CHEMOTAXIS",src_type );
			} else {
				lambdachem = this.par("LAMBDA_CHEMOTAXIS",tgt_type );
			}	

			return -bias*lambdachem
		}

	}

	exports.CPM = CPM;
	exports.CPMChemotaxis = CPMChemotaxis;
	exports.Stats = Stats;
	exports.Canvas = Canvas;
	exports.GridManipulator = GridManipulator;

	return exports;

}({}));
