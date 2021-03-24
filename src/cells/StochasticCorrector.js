
import Cell from "./Cell.js" 
/* eslint-disable no-unused-vars*/
class StochasticCorrector extends Cell {
	/* eslint-disable */ 
	constructor (conf, kind, id, mt, parent) {
		/* eslint-disable	*/
		// console.log("hi", parent)
		super(conf, kind, id, mt, parent)
		this.X = conf["INIT_X"][kind]
		this.Y = conf["INIT_Y"][kind]
		this.V = conf["INIT_V"][kind]
		this.individualParams = ["V"]
		if (parent instanceof Cell){ // copy on birth
			this.V = parent.V
			this.divideXY(parent)
		} 
	}

	setXY(X, Y){
		if (X > 0){
			this.X = X
		} else {
			this.X = 0
		}
		if (Y > 0){
			this.Y = Y
		} else {
			this.Y = 0
		}
	}

	setV(V){
		this.V = V
	}
/* eslint-disable	*/
	divideXY(parent){
		let prevX = parent.X
		let prevY = parent.Y
		let fluctX = this.conf["NOISE"][this.kind] * (2  *this.mt.random() - 1)
		let fluctY = this.conf["NOISE"][this.kind] * (2  *this.mt.random() - 1)

		if ((prevX / 2 - fluctX) < 0)
			fluctX = prevX/2
		if ((prevY / 2 - fluctY) < 0)
			fluctY = prevY/2

		this.setXY(prevX/2+fluctX ,prevY/2 +fluctY )
		parent.setXY(prevX/2 - fluctX,prevY/2 - fluctY)
		let V = this.V
		this.setV(V/2)
		parent.setV(V/2)
	}

	/* eslint-disable */ 
	getIndividualParam(param){
		if (param == "V"){
			// console.log(this.V)
			return this.V
		} 
		throw("Implement changed way to get" + param + " constraint parameter per individual, or remove this from " + typeof this + " Cell class's indivualParams." )
	}

	// getColor(){
	// 	return 100/this.Y
	// }
	
}

export default StochasticCorrector