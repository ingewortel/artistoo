

import ActivityConstraint from "./ActivityConstraint.js"
import ParameterChecker from "./ParameterChecker.js"
/**
 * The ActivityMultiBackground constraint implements the activity constraint of Potts models,
 but allows users to specify locations on the grid where LAMBDA_ACT is different. 
 See {@link ActivityConstraint} for the normal version of this constraint.
 See {@link ActivityMultiBackground#constructor} for an explanation of the parameters.
 */
class ActivityMultiBackground extends ActivityConstraint {

	/** Creates an instance of the ActivityMultiBackground constraint 
	* @param {object} conf - Configuration object with the parameters.
	* ACT_MEAN is a single string determining whether the activity mean should be computed
	* using a "geometric" or "arithmetic" mean. 
	*/
	/** The constructor of the ActivityConstraint requires a conf object with parameters.
	@param {object} conf - parameter object for this constraint
	@param {string} [conf.ACT_MEAN="geometric"] - should local mean activity be measured with an
	"arithmetic" or a "geometric" mean?
	@param {PerKindArray} conf.LAMBDA_ACT_MBG - strength of the activityconstraint per cellkind and per background.
	@param {PerKindNonNegative} conf.MAX_ACT - how long do pixels remember their activity? Given per cellkind.
	@param {Array} conf.BACKGROUND_VOXELS - an array where each element represents a different background type.
	This is again an array of {@ArrayCoordinate}s of the pixels belonging to that backgroundtype. These pixels
	will have the LAMBDA_ACT_MBG value of that backgroundtype, instead of the standard value.
	*/
	constructor( conf ){
		super( conf )

		/** Activity of all cellpixels with a non-zero activity is stored in this object,
		with the {@link IndexCoordinate} of each pixel as key and its current activity as
		value. When the activity reaches 0, the pixel is removed from the object until it
		is added again. 
		@type {object}*/
		this.cellpixelsact = {} // activity of cellpixels with a non-zero activity
		
		/** Wrapper: select function to compute activities based on ACT_MEAN in conf.
		Default is to use the {@link activityAtGeom} for a geometric mean.
		@type {function}*/
		this.activityAt = this.activityAtGeom
		if( this.conf.ACT_MEAN == "arithmetic" ){
			this.activityAt = this.activityAtArith
		} 
		
		/** Store which pixels belong to which background type 
		@type {Array}*/
		this.bgvoxels = []
		
		/** Track if this.bgvoxels has been set.
		@type {boolean}*/
		this.setup = false
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "ACT_MEAN", "SingleValue", "String", [ "geometric", "arithmetic" ] )
		checker.confCheckPresenceOf( "LAMBDA_ACT_MBG" )
		checker.confCheckParameter( "MAX_ACT", "KindArray", "NonNegative" )
		
		// Custom checks
		checker.confCheckStructureKindArray( this.conf["LAMBDA_ACT_MBG"], "LAMBDA_ACT_MBG" )
		for( let e of this.conf["LAMBDA_ACT_MBG"] ){
			for( let i of e ){
				if( !checker.isNonNegative(i) ){
					throw("Elements of LAMBDA_ACT_MBG must be non-negative numbers!")
				}
			}
		}
		checker.confCheckPresenceOf( "BACKGROUND_VOXELS" )
		let bgvox = this.conf["BACKGROUND_VOXELS"]
		// Background voxels must be an array of arrays
		if( !(bgvox instanceof Array) ){
			throw( "Parameter BACKGROUND_VOXELS should be an array of at least two arrays!" )
		} else if ( bgvox.length < 2 ){
			throw( "Parameter BACKGROUND_VOXELS should be an array of at least two arrays!" )
		}
		// Elements of the initial array must be arrays.
		for( let e of bgvox ){
			if( !(e instanceof Array) ){
				throw( "Parameter BACKGROUND_VOXELS should be an array of at least two arrays!" )
			}
			
			// Entries of this array must be pixel coordinates, which are arrays of length C.extents.length
			for( let ee of e ){
				let isCoordinate = true
				if( !(ee instanceof Array) ){
					isCoordinate = false
				} else if ( ee.length != this.C.extents.length ){
					isCoordinate = false
				}
				if( !isCoordinate ){
					throw( "Parameter BACKGROUND_VOXELS: subarray elements should be ArrayCoordinates; arrays of length " + this.C.extents.length + "!" )
				}
			}
		}
	}
	
	/** Get the background voxels from input argument or the conf object and store them in a correct format
	in this.bgvoxels. This only has to be done once, but can be called from outside to
	change the background voxels during a simulation (eg in a HTML page).
	 */	
	setBackgroundVoxels( voxels ){
	
		voxels = voxels || this.conf["BACKGROUND_VOXELS"]
	
		// reset if any exist already
		this.bgvoxels = []
		for( let bgkind = 0; bgkind < voxels.length; bgkind++ ){
			this.bgvoxels.push({})
			for( let v of voxels[bgkind] ){
				this.bgvoxels[bgkind][ this.C.grid.p2i(v) ] = true
			}
		}
		this.setup = true

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
	
		if( ! this.setup ){
			this.setBackgroundVoxels()
		}

		let deltaH = 0, maxact, lambdaact
		let bgindex1 = 0, bgindex2 = 0
		
		for( let bgkind = 0; bgkind < this.bgvoxels.length; bgkind++ ){
			if( sourcei in this.bgvoxels[bgkind] ){
				bgindex1 = bgkind
			}
			if( targeti in this.bgvoxels[bgkind] ){
				bgindex2 = bgkind
			}
		}
		

		// use parameters for the source cell, unless that is the background.
		// In that case, use parameters of the target cell.
		if( src_type != 0 ){
			maxact = this.cellParameter("MAX_ACT", src_type)
			lambdaact = this.cellParameter("LAMBDA_ACT_MBG", src_type)[bgindex1]
		} else {
			// special case: punishment for a copy attempt from background into
			// an active cell. This effectively means that the active cell retracts,
			// which is different from one cell pushing into another (active) cell.
			maxact = this.cellParameter("MAX_ACT", tgt_type)
			lambdaact = this.cellParameter("LAMBDA_ACT_MBG", tgt_type)[bgindex2]
		}
		if( !maxact || !lambdaact ){
			return 0
		}

		// compute the Hamiltonian. The activityAt method is a wrapper for either activityAtArith
		// or activityAtGeom, depending on conf (see constructor).	
		deltaH += lambdaact*(this.activityAt( targeti ) - this.activityAt( sourcei ))/maxact
		return deltaH
	}



}

export default ActivityMultiBackground
