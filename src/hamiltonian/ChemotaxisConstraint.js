import SoftConstraint from "./SoftConstraint.js"
import CoarseGrid from "../grid/CoarseGrid.js"
import Grid2D from "../grid/Grid2D.js"
import ParameterChecker from "./ParameterChecker.js"


/** 
 * This class implements a constraint for cells moving up a chemotactic gradient.
 * It checks the chemokine gradient in the direction of the attempted copy, and 
 * rewards copy attempts that go up the gradient. This effect is stronger when the
 * gradient is steep. Copy attempts going to a lower chemokine value are punished.
 * 
 * The grid with the chemokine must be supplied, see the {@link constructor}.
 *
 * @example
 * // Build a chemotaxis field
 * let CPM = require( "path/to/build" )
 * let chemogrid = new CPM.Grid2D( [200,200], [true,true], "Float32" )
 * chemogrid.setpix( [100,100], 100 )
 * 
 * // Build a CPM with the constraint
 * let C = new CPM.CPM( [200,200], {
 * 	T : 20,
 * 	J : [[0,20],[20,10]],
 * 	V : [0,500],
 * 	LAMBDA_V : [0,5]	
 * })
 * C.add( new CPM.ChemotaxisConstraint( {
 * 	LAMBDA_CH : [0,5000],
 * 	CH_FIELD : chemogrid
 * } ) )
 */
class ChemotaxisConstraint extends SoftConstraint {

	/** Set the CPM attached to this constraint.
	@param {CPM} C - the CPM to attach.*/
	set CPM(C){
		super.CPM = C
		
		this.checkField()
	}
	
	/** @todo add checks for dimensions, better check for type.*/
	checkField(){
		if( !( this.field instanceof CoarseGrid || this.field instanceof Grid2D ) ){
			throw( "CH_FIELD must be a CoarseGrid or a Grid2D!" )
		}
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "LAMBDA_CH", "KindArray", "NonNegative" )

		// Custom check for the chemotactic field
		checker.confCheckPresenceOf( "CH_FIELD" )
	}

	/** The constructor of the ChemotaxisConstraint requires a conf object with a parameter
	and a chemotactic field.
	@todo what kinds of grids are allowed for the chemotactic field? Do we need to check
	somewhere that its properties "match" that of the CPM? (That is, the same resolution and
	torus properties)?
	@param {object} conf - parameter object for this constraint
	@param {PerKindNonNegative} conf.LAMBDA_CH - chemotactic sensitivity per cellkind.
	@param {CoarseGrid|Grid2D} conf.CH_FIELD - the chemotactic field where the chemokine lives.
	*/
	constructor( conf ){
		super( conf )
		
		/** @todo is this ever used? */
		this.conf = conf
		/** The field where the chemokine lives.
		@type {CoarseGrid|Grid2D}*/
		this.field = conf.CH_FIELD
		if( this.field instanceof CoarseGrid ){
			this.deltaH = this.deltaHCoarse
		}
	}

	/** Method to compute the Hamiltonian if the chemotactic field is a {@link CoarseGrid}.
		This method is used instead of the regular {@link deltaH} whenever this is true.
	 @param {IndexCoordinate} sourcei - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} targeti - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. This argument is not actually
	 used by this method, but is supplied for compatibility; the CPM will always call the
	 deltaH method with all 4 arguments.
	 @return {number} the change in Hamiltonian for this copy attempt and this constraint.
	 @private */
	/* eslint-disable no-unused-vars*/
	deltaHCoarse( sourcei, targeti, src_type, tgt_type ){
		let sp = this.C.grid.i2p( sourcei ), tp = this.C.grid.i2p( targeti )
		let delta = this.field.pixt( tp ) - this.field.pixt( sp )
		let lambdachem = this.cellParameter("LAMBDA_CH", src_type)
		return -delta*lambdachem
	}

	/** Method to compute the Hamiltonian for this constraint. 
	 @param {IndexCoordinate} sourcei - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} targeti - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. This argument is not actually
	 used by this method, but is supplied for compatibility; the CPM will always call the
	 deltaH method with all 4 arguments.
	 @return {number} the change in Hamiltonian for this copy attempt and this constraint.*/
	/* eslint-disable no-unused-vars*/
	deltaH( sourcei, targeti, src_type, tgt_type  ){
		let delta = this.field.pixt( targeti ) - this.field.pixt( sourcei )
		let lambdachem = this.cellParameter("LAMBDA_CH",src_type)
		return -delta*lambdachem
	}
}

export default ChemotaxisConstraint
