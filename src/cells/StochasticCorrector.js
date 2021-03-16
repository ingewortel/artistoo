
import Cell from "./Cell.js" 
/* eslint-disable no-unused-vars*/
class StochasticCorrector extends Cell {
    
	constructor (conf, kind, parent) {
		super(conf, kind, parent)
		this.X = 0
		this.Y = 0
	}
}

export default StochasticCorrector