import SoftConstraint from "./SoftConstraint.js"
import CoarseGrid from "../grid/CoarseGrid.js"

class ChemotaxisConstraint extends SoftConstraint {
	set CPM(C){
		this.C = C
	}
	confChecker(){
		this.confCheckCellNonNegative( "LAMBDA_CH" )
		this.confCheckPresenceOf( "CH_FIELD" )
	}

	constructor( conf ){
		super( conf )
		this.conf = conf
		this.field = conf.CH_FIELD
		if( this.field instanceof CoarseGrid ){
			this.deltaH = this.deltaHCoarse
		}
	}

	deltaHCoarse( sourcei, targeti, src_type ){
		let sp = this.C.grid.i2p( sourcei ), tp = this.C.grid.i2p( targeti )
		let delta = this.field.pixt( tp ) - this.field.pixt( sp )
		let lambdachem = this.conf["LAMBDA_CH"][this.C.cellKind(src_type)]
		return -delta*lambdachem
	}

	deltaH( sourcei, targeti, src_type  ){
		let delta = this.field.pixt( targeti ) - this.field.pixt( sourcei )
		let lambdachem = this.conf["LAMBDA_CH"][this.C.cellKind(src_type)]
		return -delta*lambdachem
	}
}

export default ChemotaxisConstraint
