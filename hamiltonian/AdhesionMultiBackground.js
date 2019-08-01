/** 
 * Implements the adhesion constraint of Potts models, but allows multiple types of 
 background. Only the 0 background is physically present on the grid, but the parameters
 are taken from other background types depending on whether the background type of that
 location is set.
 Adhesion parameters are now in J_MULTI instead of J.
 */

import SoftConstraint from "./SoftConstraint.js"

class AdhesionMultiBackground extends SoftConstraint {

	constructor( conf ){
	
		super( conf )
		
		this.bgvoxels = []
		this.setup = false
		
	}
	
	setBackgroundVoxels(){
	
		for( let bgkind = 0; bgkind < this.conf["BACKGROUND_VOXELS"].length; bgkind++ ){
			this.bgvoxels.push({})
			for( let v of this.conf["BACKGROUND_VOXELS"][bgkind] ){
				this.bgvoxels[bgkind][ this.C.grid.p2i(v) ] = true
			}
		}
		this.setup = true

	}

	/* Check if conf parameters are correct format*/
	confChecker(){
		this.confCheckCellMatrix("J_MULTI")
	}


	/*  Get adhesion between two cells with type (identity) t1,t2 from "conf" using "this.par". 
	Adjusted method from the default adhesion constraint to account for multiple backgrounds.
	i1 and i2 are the positions of the pixels to assess adhesion from.*/
	J( i1 , i2, t1, t2 ){
	
		// Get cellkinds of the types
		let k1 = this.C.cellKind( t1 ), k2 = this.C.cellKind( t2 )
	
		// If one of the types is background, the parameters may change depending on 
		// location
		if( k1 == 0 ){
			for( let bgkind = 0; bgkind < this.bgvoxels.length; bgkind++ ){
				if( i1 in this.bgvoxels[bgkind] ){
					k1 = bgkind
				}
			}
		}
		if( k2 == 0 ){
			for( let bgkind = 0; bgkind < this.bgvoxels.length; bgkind++ ){
				if( i2 in this.bgvoxels[bgkind] ){
					k2 = bgkind
				}
			}
		}
		
		return this.conf["J_MULTI"][k1][k2]
	}
	H( i, tp ){
		let r = 0, tn
		/* eslint-disable */
		const N = this.C.grid.neighi( i )
		for( let j = 0 ; j < N.length ; j ++ ){
			tn = this.C.pixti( N[j] )
			if( tn != tp ){
				r += this.J( i, N[j], tn, tp )
			} else if ( tn == 0 ){ // and since tn == tp, tp is also zero
				r += this.J( i, N[j], tn, tp )
			}
		}
		return r
	}
	deltaH( sourcei, targeti, src_type, tgt_type ){
		if( ! this.setup ){
			this.setBackgroundVoxels()
		}
		return this.H( targeti, src_type ) - this.H( targeti, tgt_type )
	}
	
}

export default AdhesionMultiBackground
