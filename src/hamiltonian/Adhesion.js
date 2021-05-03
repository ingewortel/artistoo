import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"

/** 
 * Implements the adhesion constraint of Potts models. 
 * Each pair of neighboring pixels [n,m] gets a positive energy penalty deltaH if n and m
 * do not belong to the same {@link CellId}.
 *
 * @example
 * // Build a CPM and add the constraint
 * let CPM = require( "path/to/build" )
 * let C = new CPM.CPM( [200,200], { T : 20 } )
 * C.add( new CPM.Adhesion( { J : [[0,20],[20,10]] } ) )
 * 
 * // Or add automatically by entering the parameters in the CPM
 * let C2 = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,20],[20,10]]
 * })
 */
class Adhesion extends SoftConstraint {

	/** The constructor of Adhesion requires a conf object with a single parameter J.
	@param {object} conf - parameter object for this constraint
	@param {CellKindInteractionMatrix} conf.J - J[n][m] gives the adhesion energy between a pixel of
	{@link CellKind} n and a pixel of {@link CellKind} m. J[n][n] is only non-zero
	when the pixels in question are of the same {@link CellKind}, but a different 
	{@link CellId}. Energies are given as non-negative numbers.
	*/
	constructor( conf ){
		super( conf )		
	}

	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "J", "KindMatrix", "Number" )
	}

	/**  Get adhesion between two cells t1,t2 from "conf". 
	@param {CellId} t1 - cellid of the first cell.
	@param {CellId} t2 - cellid of the second cell.
	@return {number} adhesion between a pixel of t1 and one of t2.
	@private
	*/
	J( t1, t2 ) {
		return this.cellParameter("J", t1)[this.C.cellKind(t2)]
	}
	/**  Returns the Hamiltonian around a pixel i with cellid tp by checking all its
	neighbors that belong to a different cellid.
	@param {IndexCoordinate} i - coordinate of the pixel to evaluate hamiltonian at.
	@param {CellId} tp - cellid of this pixel.
	@return {number} sum over all neighbors of adhesion energies (only non-zero for 
	neighbors belonging to a different cellid).	
	@private
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
	/** Method to compute the Hamiltonian for this constraint. 
	 @param {IndexCoordinate} sourcei - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} targeti - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {number} the change in Hamiltonian for this copy attempt and this constraint.*/ 
	deltaH( sourcei, targeti, src_type, tgt_type ){
		return this.H( targeti, src_type ) - this.H( targeti, tgt_type )
	}
}

export default Adhesion
