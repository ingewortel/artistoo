

import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"

/** 
 * Implements the perimeter constraint of Potts models. 
 * A cell's "perimeter" is the number over all its borderpixels of the number of 
 * neighbors that do not belong to the cell itself. 
 * 
 * This constraint is typically used together with {@link Adhesion} and {@VolumeConstraint}.
 * 
 * See {@link PerimeterConstraint#constructor} for the required parameters.
 *
 * @example
 * // Build a CPM and add the constraint
 * let CPM = require( "path/to/build" )
 * let C = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,20],[20,10]],
 * 	V : [0,500],
 * 	LAMBDA_V : [0,5]
 * })
 * C.add( new CPM.PerimeterConstraint( {
 * 	P : [0,260],
 * 	LAMBDA_P : [0,2] 	
 * } ) )
 * 
 * // Or add automatically by entering the parameters in the CPM
 * let C2 = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,20],[20,10]],
 * 	V : [0,500],
 * 	LAMBDA_V : [0,5],
 * 	P : [0,260],
 * 	LAMBDA_P : [0,2]
 * })
 */
class PerimeterConstraint extends SoftConstraint {

	/** The constructor of the PerimeterConstraint requires a conf object with
	 * parameters.
	 * @param {object} conf - parameter object for this constraint
	 * @param {PerKindNonNegative} conf.LAMBDA_P - strength of the perimeter
	 * 	constraint per cellkind.
	 * @param {PerKindNonNegative} conf.P - Target perimeter per cellkind.
	*/
	constructor( conf ){
		super( conf )
		
		/** The perimeter size of each pixel is tracked.
		@type {CellObject}*/
		this.cellperimeters = {}
	}

	/** Set the CPM attached to this constraint.
	@param {CPM} C - the CPM to attach.*/
	set CPM(C){
		super.CPM = C
		
		// if C already has cells, initialize perimeters
		if( C.cellvolume.length !== 0 ){
			this.initializePerimeters()
		}
	}
	
	/** This method checks that all required parameters are present in the
	 * object supplied to the constructor, and that they are of the right
	 * format. It throws an error when this is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "LAMBDA_P", "KindArray", "NonNegative" )
		checker.confCheckParameter( "P", "KindArray", "NonNegative" )
	}

	/** This method initializes the this.cellperimeters object when the
	 * constraint is added to a non-empty CPM. */
	initializePerimeters(){

		for( let bp of this.C.cellBorderPixels() ){
			const p = bp[0]
			let cid = this.C.pixt(p)
			if( !(cid in this.cellperimeters) ){
				this.cellperimeters[cid] = 0
			}
			const i = this.C.grid.p2i( p )
			this.cellperimeters[cid] += this.C.perimeterNeighbours[i]
		}

	}

	/** The postSetpixListener of the PerimeterConstraint ensures that cell
	 * perimeters are updated after each copy in the CPM.
	 * @listens {CPM#setpixi} because when a new pixel is set (which is
	 * 	determined in the CPM),	some of the cell perimeters will change.
	 * @param {IndexCoordinate} i - the coordinate of the pixel that is changed.
	 * @param {CellId} t_old - the cellid of this pixel before the copy
	 * @param {CellId} t_new - the cellid of this pixel after the copy.
	*/
	/* eslint-disable no-unused-vars*/
	postSetpixListener( i, t_old, t_new ){
		if( t_old === t_new ){ return }
		
		// Neighborhood of the pixel that changes
		const Ni = this.C.neighi( i )
		
		// Keep track of perimeter before and after copy
		let n_new = 0, n_old = 0
		
		// Loop over the neighborhood. 
		for( let i = 0 ; i < Ni.length ; i ++  ){
			const nt = this.C.pixti(Ni[i])
			
			// neighbors are added to the perimeter if they are
			// of a different cellID than the current pixel
			if( nt !== t_new ){
				n_new ++ 
			}
			if( nt !== t_old ){
				n_old ++
			}
			
			// if the neighbor is non-background, the perimeter
			// of the cell it belongs to may also have to be updated.
			if( nt !== 0 ){
			
				// if it was of t_old, its perimeter goes up because the
				// current pixel will no longer be t_old. This means it will
				// have a different type and start counting as perimeter.
				if( nt === t_old ){
					this.cellperimeters[nt] ++
				}
				// opposite if it is t_new.
				if( nt === t_new ){
					this.cellperimeters[nt] --
				}
			}
		}
		
		// update perimeters of the old and new type if they are non-background
		if( t_old !== 0 ){
			this.cellperimeters[t_old] -= n_old
		}
		if( t_new !== 0 ){
			if( !(t_new in this.cellperimeters) ){
				this.cellperimeters[t_new] = 0
			}
			this.cellperimeters[t_new] += n_new
		}
	}
	
	/** Method to compute the Hamiltonian for this constraint.
	 * @param {IndexCoordinate} sourcei - coordinate of the source pixel that
	 * 	tries to copy.
	 * @param {IndexCoordinate} targeti - coordinate of the target pixel the
	 * 	source is trying to copy into.
	 * @param {CellId} src_type - cellid of the source pixel.
	 * @param {CellId} tgt_type - cellid of the target pixel.
	 * @return {number} the change in Hamiltonian for this copy attempt and
	 * this constraint.*/
	deltaH( sourcei, targeti, src_type, tgt_type ){
		if( src_type === tgt_type ){
			return 0
		}
		const ls = this.cellParameter("LAMBDA_P", src_type)
		const lt = this.cellParameter("LAMBDA_P", tgt_type)
		if( !(ls>0) && !(lt>0) ){
			return 0
		}
		const Ni = this.C.neighi( targeti )
		let pchange = {}
		pchange[src_type] = 0; pchange[tgt_type] = 0
		for( let i = 0 ; i < Ni.length ; i ++  ){
			const nt = this.C.pixti(Ni[i])
			if( nt !== src_type ){
				pchange[src_type]++ 
			}
			if( nt !== tgt_type ){
				pchange[tgt_type]--
			}
			if( nt === tgt_type ){
				pchange[nt] ++
			}
			if( nt === src_type ){
				pchange[nt] --
			}
		}
		let r = 0.0
		if( ls > 0 ){
			const pt = this.cellParameter("P", src_type),
				ps = this.cellperimeters[src_type]
			const hnew = (ps+pchange[src_type])-pt,
				hold = ps-pt
			r += ls*((hnew*hnew)-(hold*hold))
		}
		if( lt > 0 ){
			const pt = this.cellParameter("P", tgt_type),
				ps = this.cellperimeters[tgt_type]
			const hnew = (ps+pchange[tgt_type])-pt,
				hold = ps-pt
			r += lt*((hnew*hnew)-(hold*hold))
		}
		// eslint-disable-next-line
		//console.log( r )
		return r
	}
}

export default PerimeterConstraint
