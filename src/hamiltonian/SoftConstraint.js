
import Constraint from "./Constraint.js"

/** Extension of class {@link Constraint} used for a soft constraint. See description in
 {@link Constraint} for details. This class is not used on its own but serves as a base
 class for a soft constraint. */
class SoftConstraint extends Constraint {

	/** Let the CPM know that this is a soft constraint, so return 'soft'. 
	@return {string} "soft"*/
	get CONSTRAINT_TYPE() {
		return "soft"
	}
	
	/** Soft constraints must have a deltaH method to compute the Hamiltonian. This method
	must be implemented in any SoftConstraint subclass before it works.
	@abstract
	 @param {IndexCoordinate} src_i - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} tgt_i - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {number} the change in Hamiltonian for this copy attempt and this constraint.*/ 
	// eslint-disable-next-line no-unused-vars
	deltaH( src_i, tgt_i, src_type, tgt_type ){
		throw("You need to implement the 'deltaH' method for this constraint!")
	}
}

export default SoftConstraint
