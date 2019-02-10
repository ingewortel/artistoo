/** The core CPM class. Can be used for two- or 
 * three-dimensional simulations. 
*/

"use strict"

import DiceSet from "./DiceSet.js"
import MersenneTwister from 'mersennetwister'

class CPM {

	constructor( ndim, field_size, conf ){
		if( conf.seed ){
			this.mt = new MersenneTwister( config.seed )
		} else {
			this.mt = new MersenneTwister( Math.floor(Math.random()*Number.MAX_SAFE_INTEGER) )
		}

		// Attributes based on input parameters
		this.field_size = field_size			/* grid size ( Note: the grid will run from 0 to 
								field_size pixels, so the actual size in pixels is
								one larger. ) */
		this.ndim = ndim				// grid dimensions (2 or 3)
		this.conf = conf				// input parameter settings; see documentation.

		// Some functions/attributes depend on ndim:
		if( ndim == 2 ){
	
			// wrapper functions:
			//this.neigh = this.neigh2D		/* returns coordinates of neighbor pixels
			//					(including diagonal neighbors) */
			this.neighi = this.neighi2D		/* same, but with pixel index as in/output */
			this.neighC = this.neighC2D		/* returns indices of neighbor pixels
								(excluding diagnoal neighbors) */
			this.p2i = this.p2i2D			// converts pixel coordinates to a unique ID
			this.i2p = this.i2p2D			// converts pixel ID to coordinates

			this.field_size.z = 1			// for compatibility
			this.midpoint = 			// middle pixel in the grid.
			[ 	Math.round((this.field_size.x-1)/2),
				Math.round((this.field_size.y-1)/2) ] //,0 ]

		} else {
	
			// wrapper functions: 
			//this.neigh = this.neigh3D		/* returns coordinates of neighbor pixels
			//					(including diagonal neighbors) */
			this.neighi = this.neighi3D		/* same, but with pixel index as in/output */
			this.neighC = this.neighC3D		/* returns indices of neighbor pixels
								(excluding diagnoal neighbors) */
			this.p2i = this.p2i3D			// converts pixel coordinates to a unique ID
			this.i2p = this.i2p3D			// converts pixel ID to coordinates

			this.midpoint = 
			[	Math.round((this.field_size.x-1)/2),
				Math.round((this.field_size.y-1)/2),
				Math.round((this.field_size.z-1)/2) ]
		}


		// Check that the grid size is not too big to store pixel ID in 32-bit number,
		// and allow fast conversion of coordinates to unique ID numbers.
		this.X_BITS = 1+Math.floor( Math.log2( this.field_size.x - 1 ) )
		this.X_MASK = (1 << this.X_BITS)-1 

		this.Y_BITS = 1+Math.floor( Math.log2( this.field_size.y - 1 ) )
		this.Y_MASK = (1 << this.Y_BITS)-1

		this.Z_BITS = 1+Math.floor( Math.log2( this.field_size.z - 1 ) )
		this.Z_MASK = (1 << this.Z_BITS)-1

		this.dy = 1 << this.Y_BITS // for neighborhoods based on pixel index
		this.dz = 1 << ( this.Y_BITS + this.Z_BITS )


		if( this.X_BITS + this.Y_BITS + this.Z_BITS > 32 ){
			throw("Field size too large -- field cannot be represented as 32-bit number")
		} 

		// Attributes of the current CPM as a whole:
		this.nNeigh = this.neighi(0).length 		// neighbors per pixel (depends on ndim)
		this.nr_cells = 0				// number of cells currently in the grid
		this.time = 0					// current system time in MCS
	
		// track border pixels for speed (see also the DiceSet data structure)
		this.cellborderpixels = new DiceSet( this.mt )
		this.bgborderpixels = new DiceSet( this.mt ) 

		// Attributes per pixel:
		this.cellpixelsbirth = {}		// time the pixel was added to its current cell.
		this.cellpixelstype = {}		// celltype (identity) of the current pixel.
		this.stromapixelstype = {}		// celltype (identity) for all stroma pixels.

		// Attributes per cell:
		this.cellvolume = []			
		this.cellperimeter = []		
		this.t2k = []				// celltype ("kind"). Example: this.t2k[1] is the celltype of cell 1.
		this.t2k[0] = 0

		// Wrapper: select function to compute activities based on ACT_MEAN in conf
		if( this.conf.ACT_MEAN == "arithmetic" ){
			this.activityAt = this.activityAtArith
		} else {
			this.activityAt = this.activityAtGeom
		}
		
		// terms to use in the Hamiltonian
		if( this.conf.TERMS ){
			this.terms = this.conf.TERMS
		} else {
			this.terms = ["adhesion","volume","perimeter","actmodel"] //,"connectivity"]
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
		this.t2k[ t ] = k
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
		let tl, tm, tr, l, r, bl, bm, br
		
		tl = i-1-this.dy; tm = i-1; tr = i-1+this.dy
		l = i-this.dy; r = i+this.dy
		bl = i+1-this.dy; bm = i+1; br = i+1+this.dy
		
		// if pixel is part of one of the borders, adjust the 
		// indices accordingly
		let add = NaN // if torus is false, return NaN for all neighbors that cross
		// the border.
		
		// left border
		if( i < this.field_size.y ){
			if( torus ){
				add = this.field_size.x * this.dy
			}
			tl += add; l += add; bl += add 	
		}
		
		// right border
		if( i >= this.dy*( this.field_size.x - 1 ) ){
			if( torus ){
				add = -this.field_size.x * this.dy
			}
			tr += add; r += add; br += add
		}

		// top border
		if( i % this.dy == 0 ){
			if( torus ){
				add = this.field_size.y
			}
			tl += add; tm += add; tr += add	
		}
		
		// bottom border
		if( (i+1-this.field_size.y) % this.dy == 0 ){
			if( torus ){
				add = -this.field_size.y
			}
			bl += add; bm += add; br += add
		}
		
		return [ tl, l, bl, tm, bm, tr, r, br ]

	}
	neighi3D( i, torus = true ){
	
		const dy = this.dy, dz = this.dz
		const fsx = this.field_size.x, fsy = this.field_size.y, fsz = this.field_size.z
		
		// normal computation of neighbor indices.
		// first letter: U(upper), M(middle), B(bottom) layer
		// second letter: l(left), m(middle), r(right)
		// third letter: t(top), c(center), b(bottom)
		
		let Ult, Umt, Urt, Ulc, Umc, Urc, Ulb, Umb, Urb,
			Mlt, Mmt, Mrt, Mlc, /*Mmc*/ Mrc, Mlb, Mmb, Mrb,
			Blt, Bmt, Brt, Blc, Bmc, Brc, Blb, Bmb, Brb
		
		Ult = i-1-dz-dy; Umt = i-1-dz; Urt = i-1-dz+dy
		Ulc = i-1-dy; Umc = i-1; Urc = i-1+dy
		Ulb = i-1+dz-dy; Umb = i-1+dz; Urb = i-1+dz+dy
		
		Mlt = i-dz-dy; Mmt = i-dz; Mrt = i-dz+dy
		Mlc = i-dy; /*Mmc = i */ Mrc = i+dy
		Mlb = i+dz-dy; Mmb = i+dz; Mrb = i+dz+dy
		
		Blt = i+1-dz-dy; Bmt = i+1-dz; Brt = i+1-dz+dy
		Blc = i+1-dy; Bmc = i+1; Brc = i+1+dy
		Blb = i+1+dz-dy; Bmb = i+1+dz; Brb = i+1+dz+dy
		
		// Additions for up/down/left/right/front/back border "faces"
		let add = NaN // if torus is false, return NaN for all neighbors that cross
		// the border.
		
		// back border
		if( i < dz ){
			if( torus ){
				add = fsy*dz
			}
			Ult += add; Umt += add; Urt += add 
			Mlt += add; Mmt += add; Mrt += add
			Blt += add; Bmt += add; Brt += add
		}
		
		// front border
		if( i >= dz*( fsy-1 ) ){
			if( torus ){
				add = -fsy*dz
			}
			Ulb += add; Umb += add; Urb += add
			Mlb += add; Mmb += add; Mrb += add
			Blb += add; Bmb += add; Brb += add		
		}
		
		// left border
		if( i%dz < dy ){
			if( torus ){
				add = fsx*dy
			}
			Ult += add; Ulc += add; Ulb += add
			Mlt += add; Mlc += add; Mlb += add
			Blt += add; Blc += add; Blb += add
		}
		
		// right border
		if( i%dz >= dy*( fsx-1 ) ){
			if( torus ){
				add = -fsx*dy
			}
			Urt += add; Urc += add; Urb += add
			Mrt += add; Mrc += add; Mrb += add
			Brt += add; Brc += add; Brb += add
		}
		
		// upper border
		if( ( i%dz )%dy == 0 ){
			if( torus ){
				add = fsz
			}
			Ult += add; Umt += add; Urt += add
			Ulc += add; Umc += add;	Urc += add
			Ulb += add; Umb += add; Urb += add
		}
		
		// down border
		if( ( i%dz )%dy == (fsz-1) ){
			if( torus ){
				add = -fsz
			}
			Blt += add; Bmt += add; Brt += add
			Blc += add; Bmc += add; Brc += add
			Blb += add; Bmb += add; Brb += add
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
		}
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
		let r = 0., i = 0
		for( ; i < p1.length ; i ++ ){
			r += p1[i]*p2[i]
		}
		return r
	}
	
	
	/* ------------- COMPUTING THE HAMILTONIAN --------------- */


	/* ======= ADHESION ======= */

	/*  Returns the Hamiltonian around pixel p, which has ID (type) tp (surrounding pixels'
	 *  types are queried). This Hamiltonian only contains the neighbor adhesion terms.
	 */
	H( i, tp ){

		let r = 0, tn
		const N = this.neighi( i )

		// Loop over pixel neighbors
		for( let j = 0 ; j < N.length ; j ++ ){
			tn = this.pixti( N[j] )
			if( tn != tp ) r += this.J( tn, tp )
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

		const vdiff = this.par("V",t) - (this.cellvolume[t] + vgain)
		
		return this.par("LAMBDA_V",t)*vdiff*vdiff
	}
	
	deltaHvolume ( sourcei, targeti, src_type, tgt_type ){

		// volume gain of src cell
		let deltaH = this.volconstraint( 1, src_type ) - 
			this.volconstraint( 0, src_type )
		// volume loss of tgt cell
		deltaH += this.volconstraint( -1, tgt_type ) - 
			this.volconstraint( 0, tgt_type )

		return deltaH

	}
	
	
	/* ======= PERIMETER ======= */

	/* The perimeter constraint term of the Hamiltonian. Returns the change in
	   perimeter energy if the pixel at coordinates p is changed from cell "oldt"
	   into "newt".
	*/
	perconstrainti ( pixid, oldt, newt ){
		const N = this.neighi( pixid )
		let perim_before = {}, perim_after = {}
		
		/* Loop over the local neighborhood and track perimeter of the old 
		and new cell (oldt, newt) before/after update. Note that perimeter
		for other cells will not change. */
		perim_before[oldt]=0; perim_before[newt]=0
		perim_after[oldt]=0; perim_after[newt]=0

		for( let i = 0 ; i < N.length ; i ++ ){

			// Type of the current neighbor
			const t = this.pixti( N[i] )

			if( t != oldt ){
				perim_before[oldt] ++
				if( t == newt ) perim_before[newt] ++
			}
			if( t != newt ){
				perim_after[newt] ++
				if( t == oldt ) perim_after[oldt] ++
			}
		}
		// Compare perimeter before and after to evaluate the change in perimeter.
		// Use this to compute the change in perimeter energy.
		const ta = Object.keys( perim_after )
		let r = 0, Pup = {}
		for( let i = 0 ; i < ta.length ; i ++ ){
			if( ta[i] > 0 ){
				Pup[ta[i]] = perim_after[ta[i]] - perim_before[ta[i]]
				const Pt = this.par("P",ta[i]), l = this.par("LAMBDA_P",ta[i])
				let t = this.cellperimeter[ta[i]]+Pup[ta[i]] - Pt
				r += l*t*t
				t = this.cellperimeter[ta[i]] - Pt
				r -= l*t*t
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
			actmax = this.par("MAX_ACT",this.cellpixelstype[i])
			
		return (age > actmax) ? 0 : actmax-age
	}
	/* Act model : compute local activity values within cell around pixel i.
	 * Depending on settings in conf, this is an arithmetic (activityAtArith)
	 * or geometric (activityAtGeom) mean of the activities of the neighbors
	 * of pixel i.
	 */
	activityAtArith( i ){
		const t = this.pixti( i )
		
		// no activity for background/stroma
		if( t <= 0 ){ return 0 }
		
		const N = this.neighi(i)
		let r = this.pxact(i), has_stroma_neighbour = false, nN = 1
		
		// loop over neighbor pixels
		for( let j = 0 ; j < N.length ; j ++ ){ 
			const tn = this.pixti(N[j]) 
			
			// a neighbor only contributes if it belongs to the same cell
			if( tn == t ){
				r += this.pxact( N[j] )
				nN ++ 
			}
			// track if there are stroma neighbors
			if( tn < 0 ){
				has_stroma_neighbour = true
			}
		}
		// Special case: encourage cell migration along fibers of the FRC network.
		// In that case, encode FRC as stroma.
		if( has_stroma_neighbour && this.conf.FRC_BOOST ){
			r *= this.par("FRC_BOOST",t)
		}
		return r/nN
	}
	activityAtGeom ( i ){
		const t = this.pixti( i )

		// no activity for background/stroma
		if( t <= 0 ){ return 0 }
		const N = this.neighi( i )
		let nN = 1, r = this.pxact( i ), has_stroma_neighbour = false

		// loop over neighbor pixels
		for( let j = 0 ; j < N.length ; j ++ ){ 
			const tn = this.pixti(N[j]) 

			// a neighbor only contributes if it belongs to the same cell
			if( tn == t ){
				if( this.pxact( N[j] ) == 0 ) return 0
				r *= this.pxact( N[j] )
				nN ++ 
			}
			// track if there are stroma neighbors
			if( tn < 0 ){
				has_stroma_neighbour = true
			}
		}
		// Special case: encourage cell migration along fibers of the FRC network.
		// In that case, encode FRC as stroma.
		if( has_stroma_neighbour && this.conf.FRC_BOOST ){
			r *= this.par("FRC_BOOST",1)
		}
		return Math.pow(r,1/nN)
	}
	
	deltaHactmodel ( sourcei, targeti, src_type, tgt_type ){

		let deltaH = 0, maxact, lambdaact

		// use parameters for the source cell, unless that is the background.
		// In that case, use parameters of the target cell.
		if( src_type != 0 ){
			maxact = this.par("MAX_ACT",src_type)
			lambdaact = this.par("LAMBDA_ACT",src_type)
		} else {
			// special case: punishment for a copy attempt from background into
			// an active cell. This effectively means that the active cell retracts,
			// which is different from one cell pushing into another (active) cell.
			maxact = this.par("MAX_ACT",tgt_type)
			lambdaact = this.par("LAMBDA_ACT",tgt_type)
		}
		if( maxact > 0 ){
			deltaH += lambdaact*(this.activityAt( targeti ) - this.activityAt( sourcei ))/maxact
		}
		return deltaH
	}
	
	/* ======= CONNECTIVITY ======= */

	/* Connectivity constraint. Checks the number of connected components 
	of type t in neighbourhood N of a pixel with type tp.
	*/
	nrConnectedComponents ( N, t, tp ){
		let r = 0, v, visited = [] 
		const nc = this.neighC(), _this=this
		
		const Nt = function( k){
			if( k < N.length ){ 
				const t = _this.pixti( N[k] ) 
				return t >= 0 ? t : 0
			}
			// if k is equal to N.length, we mean the middle pixel whose
			// neighbourhood we are looking at (and whose type is tp).
			return tp
		}
		// Loop over the pixels in the neighbourhood N.
		// Add one extra pixel (the pixel whose neighbourhood we are looking at).
		// For each pixel, find all other pixels in the connected component and
		// store them as "visited". Only start a new connected component for 
		// pixels that were not previously visited.
		for( let i = 0 ; i < N.length+1 ; i ++ ){
			let stack = []
			// we only start at this pixel if it wasn't part of another connected
			// component (visited), and if it is of type t.
			if( !visited[i] && ( Nt(i) == t ) ){
				// this is a new connected component
				r ++
				// depth first search algorithm to find all pixels in N
				// that are part of this component.
				stack.push( i )
				while( stack.length > 0 ){
					v = stack.pop()
					visited[v] = true
					const ncv = nc[v]
					for( let j = 0 ; j < ncv.length ; j ++ ){
					// loop over the neighbours within N (in this.neighC(v)[j])
					// add them to the stack if they haven't been visited yet.
						if( !visited[ncv[j]] 
							&& ( Nt(ncv[j] ) == t ) ){
							stack.push( ncv[j] )
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
		const N = this.neighi( targeti )
		let totalcost = 0
		
		// Changes in connected components of the cell src_type when the pixel at
		// targeti changes from tgt_type to src_type
		let cost1 = this.par("LAMBDA_CONNECTIVITY",tgt_type)
		if( cost1 > 0 ){
			if( this.nrConnectedComponents( N, tgt_type, src_type )
				!= this.nrConnectedComponents( N, tgt_type, tgt_type ) ){
				totalcost += cost1
				
			}
		}
		// Changes in connected components of the cell tgt_type when the pixel at 
		// targeti changes from tgt_type to src_type
		let cost2 = this.par("LAMBDA_CONNECTIVITY",src_type) 
		if( cost2 > 0 ){
			if( this.nrConnectedComponents( N, src_type, src_type )
				!= this.nrConnectedComponents( N, src_type, tgt_type ) ){
				totalcost += cost2
			}
		}
		return totalcost
	}
	
	// invasiveness. If there is a celltype a that prefers to invade
	// pixels of type b. Currently not used.
	deltaHinvasiveness ( sourcei, targeti, src_type, tgt_type ){
		var deltaH = 0	
		if( tgt_type != 0 && src_type != 0 && this.conf.INV ){
			deltaH += this.par( "INV", tgt_type, src_type )
		}
		return -deltaH
	}
	
	// returns both change in hamiltonian and perimeter
	deltaH ( sourcei, targeti, src_type, tgt_type ){

		
		const terms = this.terms
		let dHlog = {}, per, currentterm
	
		let r = 0.0
		for( let i = 0 ; i < terms.length ; i++ ){
			currentterm = this["deltaH"+terms[i]].call( this,sourcei,targeti,src_type,tgt_type )
			if( terms[i]=="perimeter"){
				r+=currentterm.r
				per = currentterm
				dHlog[terms[i]] = currentterm.r
			} else {
				r += currentterm
				dHlog[terms[i]] = currentterm
			}
		
		}

		if( ( this.logterms || 0 ) && this.time % 100 == 0 ){
			// eslint-disable-next-line no-console
			console.log( dHlog )
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
		
			const N = this.neighi( p1i )
			const p2i = N[this.ran(0,N.length-1)]
		
			const src_type = this.pixti( p1i )
			const tgt_type = this.pixti( p2i )

			// only compute the Hamiltonian if source and target belong to a different cell,
			// and do not allow a copy attempt into the stroma. Only continue if the copy attempt
			// would result in a viable cell.
			if( tgt_type >= 0 && src_type != tgt_type ){

				const hamiltonian = this.deltaH( p1i, p2i, src_type, tgt_type )

				// probabilistic success of copy attempt        
				if( this.docopy( hamiltonian.dH ) ){
					this.setpixi( p2i, src_type, hamiltonian.per.Pup )
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
	setpixi ( i, t, Pup ){
		const t_old = this.cellpixelstype[i]

		// If Pup not specified, compute it here.
		if( !Pup ){
			Pup = this.perconstrainti( i, t_old, t ).Pup
		}
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
			// store the time when the new pixel was added
			this.cellpixelsbirth[i] = this.time

			// update volume of the new cell and cellid of the pixel.
			this.cellpixelstype[i] = t
			this.cellvolume[t] ++
		}
		// update cellperimeters and border pixels.
		this.updateperimeter( Pup )
		this.updateborderneari( i )
	}
	setpix ( p, t, Pup ){
		this.setpixi( this.p2i(p), t, Pup )
	}
	/* Change pixel at coordinates p/index i into background (t=0) */
	delpixi ( i ){
		const t = this.cellpixelstype[i]

		// Reduce cell volume.
		this.cellvolume[t] --

		// remove this pixel from objects cellpixelsbirth / cellpixelstype
		delete this.cellpixelsbirth[i]
		delete this.cellpixelstype[i]

		// if this was the last pixel belonging to this cell, 
		// remove the cell altogether.
		if( this.cellvolume[t] == 0 ){
			delete this.cellvolume[t]
			delete this.t2k[t]
		}

	}
	delpix ( p ){
		this.delpixi( this.p2i(p) )
	}
	/* Update each cell's perimeter after a successful copy attempt. */
	updateperimeter ( Pup ){
		const ta = Object.keys( Pup )
		for( let i = 0 ; i < ta.length ; i ++ ){
			this.cellperimeter[ta[i]] += Pup[ta[i]]
		}
	}
	/* Update border elements after a successful copy attempt. */
	updateborderneari ( i ){

		// neighborhood + pixel itself (in indices)
		const Ni = this.neighi(i)
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
			const N = this.neighi( Ni[j] )
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
		this.cellperimeter[newid] = 0
		this.setCellKind( newid, kind )
		return newid
	}
	/* Seed a new cell of celltype "kind" onto position "p".*/
	seedCellAt ( kind, p ){
		const newid = this.makeNewCellID( kind )
		const id = this.p2i( p )
		this.setpixi( id, newid )
		return newid
	}
	/* Seed a new cell of celltype "kind" to a random position on the grid.
		Opts: fixToStroma (only seed next to stroma),
		brutal (allow seeding into other non-background cell),
		avoid (do not allow brutal seeding into cell of type "avoid"). */
	seedCell ( kind, opts ){
		let N, p
		// By default, seed a cell of kind 1, without any options.
		if( arguments.length < 1 ){
			kind = 1
		}
		if( arguments.length < 2 ){
			opts = {}
		}
		if( !opts.fixToStroma ){
			// N: max amount of trials, avoids infinite loops in degenerate
			// situations
			for( N = 1000; N>0 ; N-- ){
				// random position on the grid
				p = [this.ran( 0, this.field_size.x-1 ),
					this.ran( 0, this.field_size.y-1 )]
				if( this.ndim == 3 ){
					p.push( this.ran( 0, this.field_size.z-1 ) )
				} else {
					p.push( 0 )
				}
				const t = this.pixti( this.p2i( p ) )

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
			const stromapixels = Object.keys( this.stromapixelstype )
			const Ns=stromapixels.length
			for( N = 1000; N>0 ; N-- ){
				// Choose a random stroma pixel, and then randomly choose one of its
				// neighbors.
				p = this.i2p( this.neighi( stromapixels[this.ran(0,Ns-1)] )[
					this.ran(0,this.nNeigh-1)] )
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
			stromatype = -1
		}
		// store stromapixels in a special object. 
		for( let i = 0 ; i < stromavoxels.length ; i ++ ){
			this.stromapixelstype[this.p2i( stromavoxels[i] )]=stromatype
		}
	}
	// Adds a plane of stroma pixels at coord x/y/z (coded by 0,1,2) value [coordvalue],
	// by letting the other coordinates range from their min value 0 to their max value.
	addStromaPlane ( stromavoxels, coord, coordvalue ){
		let x,y,z
		let minc = [0,0,0]
		let maxc = [this.field_size.x-1, this.field_size.y-1, this.field_size.z-1]
		minc[coord] = coordvalue
		maxc[coord] = coordvalue

		// For every coordinate x,y,z, loop over all possible values from min to max.
		// one of these loops will have only one iteration because min = max = coordvalue.
		for( x = minc[0]; x <= maxc[0]; x++ ){
			for( y = minc[1]; y<=maxc[1]; y++ ){
				for( z = minc[2]; z<=maxc[2]; z++ ){
					if( this.ndim == 3 ){
						stromavoxels.push( [x,y,z] )	
					} else {
						//console.log(x,y)
						stromavoxels.push( [x,y] )
					}
				}
			}
		}

		return stromavoxels
	}

	addStromaBorder ( stromatype ){
		let stromavoxels = []
		const x = this.field_size.x-1, y = this.field_size.y-1, z = this.field_size.z-1

		// the celltype used for stroma is default -1.
		if( arguments.length < 1 ){
			stromatype = -1
		}
		
		// depending on ndim
		stromavoxels = this.addStromaPlane( stromavoxels, 0, 0, stromatype )
		stromavoxels = this.addStromaPlane( stromavoxels, 0, x, stromatype )
		stromavoxels = this.addStromaPlane( stromavoxels, 1, 0, stromatype )
		stromavoxels = this.addStromaPlane( stromavoxels, 1, y, stromatype )
		if( this.ndim == 3 ){
			stromavoxels = this.addStromaPlane( stromavoxels, 2, 0, stromatype )
			stromavoxels = this.addStromaPlane( stromavoxels, 2, z, stromatype )
		}

		this.addStroma( stromavoxels, stromatype )
	}


	/** Checks whether position p (given as array) is adjacent to any pixel of type
	t */
	isAdjacentToType ( p, t ){
		const i = this.p2i(p)
		const N = this.neighi( i )
		return N.map( function(pn){ return this.pixti(pn)==t } ).
			reduce( function(xa,x){ return xa || x }, false ) 
	}
	countCells ( kind ){
		return this.t2k.reduce( function(xa,x){ return (x==kind) + xa } )
	}

}

export default CPM
