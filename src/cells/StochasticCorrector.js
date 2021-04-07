
import Cell from "./Cell.js" 

class StochasticCorrector extends Cell {

	constructor (conf, kind, id, mt, parent) {
		super(conf, kind, id, mt, parent)
		this.X = conf["INIT_X"][kind]
		this.Y = conf["INIT_Y"][kind]
		this.V = conf["INIT_V"][kind]	
	}

	birth(parent){
		super.birth(parent) // sets ParentId
		this.V  = parent.V
		this.divideXY(parent) 
	}

	setXY(X, Y){
		this.X = Math.max(0, X)
		this.Y = Math.max(0, Y)
	}

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
		this.V = V/2
		parent.V = V/2
	}

	// get V() {
	// 	return this.conf["V"][this.kind]
	// }

	// set V(V){
	// 	this.conf["V"][this.kind] = V
	// }
}

export default StochasticCorrector