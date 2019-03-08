/* 
	Implements the activity constraint of Potts models. 
	See also: 
		Niculescu I, Textor J, de Boer RJ (2015) 
 		Crawling and Gliding: A Computational Model for Shape-Driven Cell Migration. 
 		PLoS Comput Biol 11(10): e1004280. 
 		https://doi.org/10.1371/journal.pcbi.1004280
 */

import SoftConstraint from "./SoftConstraint.js"

class ActivityConstraint extends SoftConstraint {

	constructor( conf ){
		super( conf )

		this.cellpixelsbirth = {} // time the pixel was added to its current cell.
		
		// Wrapper: select function to compute activities based on ACT_MEAN in conf
		if( this.conf.ACT_MEAN == "arithmetic" ){
			this.activityAt = this.activityAtArith
		} else {
			this.activityAt = this.activityAtGeom
		}
		
	}
	
	/* ======= ACT MODEL ======= */

	/* Act model : compute local activity values within cell around pixel i.
	 * Depending on settings in conf, this is an arithmetic (activityAtArith)
	 * or geometric (activityAtGeom) mean of the activities of the neighbors
	 * of pixel i.
	 */


	/* Hamiltonian computation */ 
	deltaH ( sourcei, targeti, src_type, tgt_type ){

		let deltaH = 0, maxact, lambdaact
		const src_kind = this.C.cellKind( src_type )
		const tgt_kind = this.C.cellKind( tgt_type )

		// use parameters for the source cell, unless that is the background.
		// In that case, use parameters of the target cell.
		if( src_type != 0 ){
			maxact = this.conf["MAX_ACT"][src_kind]
			lambdaact = this.conf["LAMBDA_ACT"][src_kind]
		} else {
			// special case: punishment for a copy attempt from background into
			// an active cell. This effectively means that the active cell retracts,
			// which is different from one cell pushing into another (active) cell.
			maxact = this.conf["MAX_ACT"][tgt_kind]
			lambdaact = this.conf["LAMBDA_ACT"][tgt_kind]
		}
		if( maxact == 0 || lambdaact == 0 ){
			return 0
		}

		// compute the Hamiltonian. The activityAt method is a wrapper for either activityAtArith
		// or activityAtGeom, depending on conf (see constructor).	
		deltaH += lambdaact*(this.activityAt( targeti ) - this.activityAt( sourcei ))/maxact
		return deltaH
	}

	/* Activity mean computation methods for arithmetic/geometric mean.
	The method used by activityAt is defined by conf ( see constructor ).*/
	activityAtArith( i ){
		const t = this.C.pixti( i )
		
		// no activity for background/stroma
		if( t <= 0 ){ return 0 }
		
		// neighborhood pixels
		const N = this.C.neighi(i)
		
		// r activity summed, nN number of neighbors
		// we start with the current pixel. 
		let r = this.pxact(i), nN = 1
		
		// loop over neighbor pixels
		for( let j = 0 ; j < N.length ; j ++ ){ 
			const tn = this.C.pixti( N[j] ) 
			
			// a neighbor only contributes if it belongs to the same cell
			if( tn == t ){
				r += this.pxact( N[j] )
				nN ++ 
			}
		}

		// average is summed r divided by num neighbors.
		return r/nN
	}
	activityAtGeom ( i ){
		const t = this.C.pixti( i )

		// no activity for background/stroma
		if( t <= 0 ){ return 0 }
		
		//neighborhood pixels
		const N = this.C.neighi( i )
		
		// r activity product, nN number of neighbors.
		// we start with the current pixel.
		let nN = 1, r = this.pxact( i )

		// loop over neighbor pixels
		for( let j = 0 ; j < N.length ; j ++ ){ 
			const tn = this.C.pixti( N[j] ) 

			// a neighbor only contributes if it belongs to the same cell.
			// if it does and has activity 0, the product will also be zero so
			// we can already return.
			if( tn == t ){
				if( this.pxact( N[j] ) == 0 ) return 0
				r *= this.pxact( N[j] )
				nN ++ 
			}
		}
		
		// Geometric mean computation. 
		return Math.pow(r,1/nN)
	}


	/* Current activity (under the Act model) of the pixel with ID i. */
	pxact ( i ){
	
		// If the pixel is not in the cellpixelsbirth object, it has activity 0.
		/*if ( !this.cellpixelsbirth[i] ){
			return 0
		}*/
		
		// cellkind of current pixel
		const k = this.C.cellKind( this.C.pixti(i) )
		
		// Activity info
		const actmax = this.conf["MAX_ACT"][k], age = (this.C.time - this.cellpixelsbirth[i])

		return (age > actmax) ? 0 : actmax-age
	}
	/* eslint-disable no-unused-vars*/
	setpixListener( i, t_old, t ){
		this.cellpixelsbirth[i] = this.C.time
	}


}

export default ActivityConstraint


	


	


	
	
	
	
	