
import Cell from "./Cell.js" 

/**
 * Implements a basic holder for a model with two internal products,
 * where these can be stochastically divided between daughter cells. 
 */
class StochasticCorrector extends Cell {

	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)

		/** X quantity (in standard implementation: master RNA equation)
		 * @type{number}*/
		this.X = conf["INIT_X"][kind]

		/** Y quantity (in standard implementation: mutant RNA equation)
		 * @type{number}*/
		this.Y = conf["INIT_Y"][kind]

		/** Target Volume (overwrites V in volume constraint)
		 * @type{number}*/
		this.V = conf["INIT_V"][kind]	
	}

	/**
	 *  On birth the X and Y products are divided between the two daughters
	 * This is equal between daughters if 'NOISE ' is 0, otherwise increases in 
	 * absolute quantities randomly with NOISE
	 * @param {Cell} parent - the parent (or other daughter) cell
	 */ 
	birth(parent){
		super.birth(parent) // sets ParentId
		
		let prevX = parent.X
		let prevY = parent.Y
		let fluctX = this.conf["NOISE"][this.kind] * (2  *this.C.random() - 1)
		let fluctY = this.conf["NOISE"][this.kind] * (2  *this.C.random() - 1)

		if ((prevX / 2 - fluctX) < 0)
			fluctX = prevX/2
		if ((prevY / 2 - fluctY) < 0)
			fluctY = prevY/2

		this.setXY(prevX/2+fluctX ,prevY/2 +fluctY )
		parent.setXY(prevX/2 - fluctX,prevY/2 - fluctY)
		let V = parent.V
		this.V = V/2
		parent.V = V/2
	}

	/** sets x and y with minimum 0
	 * @param {number} X - new X
	 * @param {number} Y - new Y
	 */
	setXY(X, Y){
		this.X = Math.max(0, X)
		this.Y = Math.max(0, Y)
	}

}

export default StochasticCorrector