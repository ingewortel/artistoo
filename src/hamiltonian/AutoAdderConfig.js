

import Adhesion from "./Adhesion.js"
import VolumeConstraint from "./VolumeConstraint.js"
import ActivityConstraint from "./ActivityConstraint.js"
import PerimeterConstraint from "./PerimeterConstraint.js"
import BarrierConstraint from "./BarrierConstraint.js"

/** This class enables automatic addition of Hamiltonian terms to a CPM
 * through their parameter names.
 *
 * For each parameter name, we specify one Hamiltonian term. If the parameter
 * is present, then a new instance of this term is initialized with the CPM's
 * configuration as parameter and added to the CPM. 
@type {object}
@property {Constraint} J - An {@link Adhesion} constraint is added when there is a parameter J.
@property {Constraint} LAMBDA_V - A {@link VolumeConstraint} is added when there is a parameter LAMBDA_V.
@property {Constraint} LAMBDA_P - A {@link PerimeterConstraint} is added when there is a parameter LAMBDA_P.
@property {Constraint} LAMBDA_ACT - An {@link ActivityConstraint} is added when there is a parameter LAMBDA_ACT.
@property {Constraint} IS_BARRIER - A {@link BarrierConstraint} is added when there is a parameter IS_BARRIER.
*/
let AutoAdderConfig = {
	J : Adhesion,
	LAMBDA_V : VolumeConstraint,
	LAMBDA_ACT : ActivityConstraint,
	LAMBDA_P : PerimeterConstraint,
	IS_BARRIER : BarrierConstraint
}

export default AutoAdderConfig
