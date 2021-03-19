
import Cell from "./Cell.js" 
/* eslint-disable no-unused-vars*/
class StochasticCorrector extends Cell {
	/* eslint-disable */ 
	constructor (conf, kind, id, C, parent) {
		super(conf, kind, id, C, parent)
		this.X = conf["INIT_X"][kind]
		this.Y = conf["INIT_Y"][kind]
		this.V = conf["INIT_V"][kind]
		this.individualParams = ["V"]
		if (parent instanceof Cell){ // copy on birth
			this.V = parent.V
			divideXY(parent)
		} 
	}

	setXY(X, Y){
		this.X = X
		this.Y = Y
	}

	setV(V){
		this.V = V
	}

	divideXY(parent){
		let prevX = parent.X
		let prevY = parent.Y
		let fluctX = this.conf["NOISE"][this.kind] * (2  *this.C.random() - 1)
		let fluctY = this.conf["NOISE"][this.kind] * (2  *this.C.random() - 1)

		if (prevX / 2 - fluctX < 0)
			fluctX = prevX
		if (prevY / 2 - fluctY < 0)
			fluctY = prevY

		this.setXY(prevX/2+fluctX ,prevY/2 +fluctY )
		parent.setXY(prevX/2 - fluctX,prevY/2 - fluctY)
	}

	/* eslint-disable */ 
	getIndividualParam(param){
		if (param == "V"){
			// console.log(this.V)
			return this.V
		} 
		throw("Implement changed way to get" + param + " constraint parameter per individual, or remove this from " + typeof this + " Cell class's indivualParams." )
	}

	
}

export default StochasticCorrector