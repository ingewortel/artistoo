import Constraint from "./Constraint.js"

/** Extension of class {@link Constraint} used for a hard constraint. See description in
 {@link Constraint} for details. This class is not used on its own but serves as a base
 class for a hard constraint. */
class HardConstraint extends Constraint {

	/** Let the CPM know that this is a soft constraint, so return 'soft'.
	@return {string} "hard"*/
	get CONSTRAINT_TYPE() {
		return "hard"
	}
	/*constructor( conf ){
		this.conf = conf
	}*/
	/*set CPM(C){
		this.C = C
	}*/
	
	/** Hard constraints must have a 'fulfilled' method to compute whether the copy attempt fulfills the rule.
	This method must be implemented in the subclass.
	 @param {IndexCoordinate} src_i - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} tgt_i - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {boolean} whether the copy attempt satisfies the constraint.
	 @abstract
	 */ 
	// eslint-disable-next-line no-unused-vars
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
		throw("You need to implement the 'fulfilled' method for this constraint!")
	}
}

export default HardConstraint
