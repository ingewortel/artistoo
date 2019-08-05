/** 
 * Implements the adhesion constraint of Potts models. 
 */

import SoftConstraint from "./SoftConstraint.js"

class Adhesion extends SoftConstraint {
	/* Check if conf parameters are correct format*/
	confChecker(){
		this.confCheckCellMatrix("J")
	}


	/*  Get adhesion between two cells with type (identity) t1,t2 from "conf" using "this.par". */
	J( t1, t2 ){
		return this.conf["J"][this.C.cellKind(t1)][this.C.cellKind(t2)]
	}
	/*  Returns the Hamiltonian around pixel p, which has ID (type) tp (surrounding pixels'
	 *  types are queried). This Hamiltonian only contains the neighbor adhesion terms.
	 */
	H( i, tp ){
		let r = 0, tn
		/* eslint-disable */
		const N = this.C.grid.neighi( i )
		for( let j = 0 ; j < N.length ; j ++ ){
			tn = this.C.pixti( N[j] )
			if( tn != tp ) r += this.J( tn, tp )
		}
		return r
	}
	deltaH( sourcei, targeti, src_type, tgt_type ){
		return this.H( targeti, src_type ) - this.H( targeti, tgt_type )
	}
}

export default Adhesion
