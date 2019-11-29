
import HardConstraint from "./HardConstraint.js"
import ParameterChecker from "./ParameterChecker.js"
/** 
 * This constraint allows a set of "barrier" background pixels, into 
 * which copy attempts are forbidden.
 * @example
 * // Build a CPM and add the constraint
 * let CPM = require( "path/to/build" )
 * let C = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,20],[20,10]],
 * 	V : [0,500],
 * 	LAMBDA_V : [0,5],
 * })
 * 
 * // Build a barrier and add the border constraint
 * let border = []
 * let channelwidth = 10
 * for( let x = 0; x < C.extents[0]; x++ ){
 * 	let ymin = Math.floor( C.extents[1]/2 )
 *  let ymax = ymin + channelwidth
 *  border.push( [x,ymin] )
 *  border.push( [x,ymax] )
 * }
 * 
 * C.add( new CPM.BorderConstraint( {
 * 	BARRIER_VOXELS : border
 * } ) )
 * 
 * // Seed a cell
 * let gm = new CPM.GridManipulator( C )
 * gm.seedCell(1)
 */
class BorderConstraint extends HardConstraint {

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
	
		/** Store which pixels are barrier pixels. Each entry has key the {@IndexCoordinate} of
		the pixel, and value equal to true.
		@type {object}*/
		this.barriervoxels = {}
		
		/** Track if this.barriervoxels has been set.
		@type {boolean}*/
		this.setup = false
	}
	
	
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )

		checker.confCheckPresenceOf( "BARRIER_VOXELS" )
		let barriervox = this.conf["BARRIER_VOXELS"]
		// Barrier voxels must be an array of arrays
		if( !(barriervox instanceof Array) ){
			throw( "Parameter BARRIER_VOXELS should be an array!" )
		} 
		// Elements of the initial array must be arrays.
		for( let e of barriervox ){
			
			let isCoordinate = true
			if( !(e instanceof Array)){
				isCoordinate = false
			} else if( e.length != this.C.extents.length ){
				isCoordinate = false
			}
			if( !isCoordinate ){
				throw( "Parameter BARRIER_VOXELS: elements should be ArrayCoordinates; arrays of length " + this.C.extents.length + "!" )
				
			}
			
		}
	}
	
	/** Get the background voxels from input argument or the conf object and store them in a correct format
	in this.barriervoxels. This only has to be done once, but can be called from outside to
	change the background voxels during a simulation (eg in a HTML page).
	@param {ArrayCoordinate[]} voxels - the pixels that should act as barrier.
	 */	
	setBarrierVoxels( voxels ){
	
		voxels = voxels || this.conf["BARRIER_VOXELS"]
	
		// reset if any exist already
		this.barriervoxels = {}
		for( let v of voxels ){
			this.barriervoxels[ this.C.grid.p2i(v) ] = true
		}
		this.setup = true

	}
	
	/** Method for hard constraints to compute whether the copy attempt fulfills the rule.
	 @param {IndexCoordinate} src_i - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} tgt_i - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {boolean} whether the copy attempt satisfies the constraint.*/ 
	// eslint-disable-next-line no-unused-vars
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
	
		if( !this.setup ){
			this.setBarrierVoxels()
		}
	
		// If the target pixel is a barrier pixel, forbid the copy attempt.
		if( tgt_i in this.barriervoxels ){
			return false
		}
		
		// Otherwise accept it.
		return true
	}



}

export default BorderConstraint
