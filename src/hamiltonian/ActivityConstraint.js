import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"

/** This class implements the activity constraint of Potts models published in:
 *
 *	Niculescu I, Textor J, de Boer RJ (2015) 
 *	Crawling and Gliding: A Computational Model for Shape-Driven Cell Migration. 
 *	PLoS Comput Biol 11(10): e1004280. 
 * 
 * Pixels recently added to a cell get an "activity", which then declines with every MCS.
 * Copy attempts from more active into less active pixels have a higher success rate,
 * which puts a positive feedback on protrusive activity and leads to cell migration.
 * 
 * This constraint is generally used together with {@link Adhesion}, {@link VolumeConstraint},
 * and {@link PerimeterConstraint}.
 * 
 * @see https://doi.org/10.1371/journal.pcbi.1004280
 *
 * @example
 * // Build a CPM and add the constraint
 * let CPM = require( "path/to/build" )
 * let C = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,20],[20,10]],
 * 	V : [0,500],
 * 	LAMBDA_V : [0,5],
 * 	P : [0,260],
 * 	LAMBDA_P : [0,2] 	
 * })
 * C.add( new CPM.ActivityConstraint( {
 * 	LAMBDA_ACT : [0,500],
 * 	MAX_ACT : [0,30],
 * 	ACT_MEAN : "geometric"
 * } ) )
 * 
 * // Or add automatically by entering the parameters in the CPM
 * let C2 = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,20],[20,10]],
 * 	V : [0,500],
 * 	LAMBDA_V : [0,5],
 * 	P : [0,260],
 * 	LAMBDA_P : [0,2],
 * 	LAMBDA_ACT : [0,500],
 * 	MAX_ACT : [0,30],
 * 	ACT_MEAN : "geometric"	
 * })
 */
class ActivityConstraint extends SoftConstraint {

	/** The constructor of the ActivityConstraint requires a conf object with parameters.
	@param {object} conf - parameter object for this constraint
	@param {string} [conf.ACT_MEAN="geometric"] - should local mean activity be measured with an
	"arithmetic" or a "geometric" mean?
	@param {PerKindNonNegative} conf.LAMBDA_ACT - strength of the activityconstraint per cellkind.
	@param {PerKindNonNegative} conf.MAX_ACT - how long do pixels remember their activity? Given per cellkind.
	*/
	constructor( conf ){
		super( conf )

		/** Activity of all cellpixels with a non-zero activity is stored in this object,
		with the {@link IndexCoordinate} of each pixel as key and its current activity as
		value. When the activity reaches 0, the pixel is removed from the object until it
		is added again. 
		@type {object}*/
		this.cellpixelsact = {}
		
		/** Wrapper: select function to compute activities based on ACT_MEAN in conf.
		Default is to use the {@link activityAtGeom} for a geometric mean.
		@type {function}*/
		this.activityAt = this.activityAtGeom
		if( this.conf.ACT_MEAN == "arithmetic" ){
			this.activityAt = this.activityAtArith
		} 
		
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "ACT_MEAN", "SingleValue", "String", [ "geometric", "arithmetic" ] )
		checker.confCheckParameter( "LAMBDA_ACT", "KindArray", "NonNegative" )
		checker.confCheckParameter( "MAX_ACT", "KindArray", "NonNegative" )
	}
	
	/* ======= ACT MODEL ======= */

	/* Act model : compute local activity values within cell around pixel i.
	 * Depending on settings in conf, this is an arithmetic (activityAtArith)
	 * or geometric (activityAtGeom) mean of the activities of the neighbors
	 * of pixel i.
	 */
	/** Method to compute the Hamiltonian for this constraint. 
	 @param {IndexCoordinate} sourcei - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} targeti - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {number} the change in Hamiltonian for this copy attempt and this constraint.*/ 
	deltaH ( sourcei, targeti, src_type, tgt_type ){

		let deltaH = 0, maxact, lambdaact

		// use parameters for the source cell, unless that is the background.
		// In that case, use parameters of the target cell.
		if( src_type != 0 ){
			maxact = this.cellParameter("MAX_ACT", src_type)
			lambdaact = this.cellParameter("LAMBDA_ACT", src_type)
		} else {
			// special case: punishment for a copy attempt from background into
			// an active cell. This effectively means that the active cell retracts,
			// which is different from one cell pushing into another (active) cell.
			maxact = this.cellParameter("MAX_ACT", tgt_type)
			lambdaact = this.cellParameter("LAMBDA_ACT", tgt_type)
		}
		if( !maxact || !lambdaact ){
			return 0
		}

		// compute the Hamiltonian. The activityAt method is a wrapper for either activityAtArith
		// or activityAtGeom, depending on conf (see constructor).	
		deltaH += lambdaact*(this.activityAt( targeti ) - this.activityAt( sourcei ))/maxact
		return deltaH
	}

	/** Activity mean computation methods for arithmetic mean. It computes the mean activity
		of a pixel and all its neighbors belonging to the same cell.
		
		This method is generally called indirectly via {@link activityAt}, which is set
		based on the value of ACT_MEAN in the configuration object given to the constructor.
		
		@param {IndexCoordinate} i - pixel to evaluate local activity at.
		@return {number} the arithmetic mean of activities in this part of the cell.
		@private
	*/
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
	/** Activity mean computation methods for geometric mean. It computes the mean activity
		of a pixel and all its neighbors belonging to the same cell.
		
		This method is generally called indirectly via {@link activityAt}, which is set
		based on the value of ACT_MEAN in the configuration object given to the constructor.
		
		@param {IndexCoordinate} i - pixel to evaluate local activity at.
		@return {number} the geometric mean of activities in this part of the cell.
		@private
	*/
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


	/** Current activity (under the Act model) of the pixel at position i. 
	@param {IndexCoordinate} i the position of the pixel to evaluate the activity of.
	@return {number} the current activity of this pixel, which is >= 0.*/
	pxact ( i ){
		// If the pixel is not in the cellpixelsact object, it has activity 0.
		// Otherwise, its activity is stored in the object.
		return this.cellpixelsact[i] || 0
	}
	
	/** The postSetpixListener of the ActivityConstraint ensures that pixels are 
	given their maximal activity when they are freshly added to a CPM.
	@listens {CPM#setpixi} because when a new pixel is set (which is determined in the CPM),
	its activity must change so that this class knows about the update.
	@param {IndexCoordinate} i - the coordinate of the pixel that is changed.
	@param {CellId} t_old - the cellid of this pixel before the copy
	@param {CellId} t - the cellid of this pixel after the copy.
	*/
	/* eslint-disable no-unused-vars*/
	postSetpixListener( i, t_old, t ){
		// After setting a pixel, it gets the MAX_ACT value of its cellkind.
		this.cellpixelsact[i] = this.cellParameter("MAX_ACT", t)
	}
	
	/** The postMCSListener of the ActivityConstraint ensures that pixel activities
	decline with one after every MCS.
	@listens {CPM#timeStep} because when the CPM has finished an MCS, the activities must go down.
	*/
	postMCSListener(){
		// iterate over cellpixelsage and decrease all activities by one.
		for( let key in this.cellpixelsact ){
			// activities that reach zero no longer need to be stored.
			if( --this.cellpixelsact[ key ] <= 0 ){
				delete this.cellpixelsact[ key ]
			}
		}
	}


}

export default ActivityConstraint
