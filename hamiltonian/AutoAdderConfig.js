/* This class enables automatic addition of Hamiltonian terms to a CPM
 * through their parameter names.
 *
 * For each parameter name, we specify one Hamiltonian term. If the parameter
 * is present, then a new instance of this term is initialized with the CPM's
 * configuration as parameter and added to the CPM. */

import Adhesion from "./Adhesion.js"
import VolumeConstraint from "./VolumeConstraint.js"
import ActivityConstraint from "./ActivityConstraint.js"
import PerimeterConstraint from "./PerimeterConstraint.js"
import BarrierConstraint from "./BarrierConstraint.js"

let AutoAdderConfig = {
	J : Adhesion,
	LAMBDA_V : VolumeConstraint,
	LAMBDA_ACT : ActivityConstraint,
	LAMBDA_P : PerimeterConstraint,
	IS_BARRIER : BarrierConstraint
}

export default AutoAdderConfig
