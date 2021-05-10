
import Cell from "./Cell.js" 

/**
 * Implements a basic holder for a model with internal products,
 * which can be stochastically divided between daughter cells. 
 */
class Divider extends Cell {

	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)

		/** Arbitrary internal products
		 * @type{Array}*/
		this.products = conf["INIT_PRODUCTS"][kind-1]

		/** Target Volume (overwrites V in volume constraint)
		 * @type{Number}*/
		this.V = conf["INIT_V"][kind-1]	
	}

	/**
	 *  On birth the X and Y products are divided between the two daughters
	 * This is equal between daughters if 'NOISE ' is 0, otherwise increases in 
	 * absolute quantities randomly with NOISE
	 * @param {Cell} parent - the parent (or other daughter) cell
	 */ 
	birth(parent){
		super.birth(parent) // sets ParentId
		for (const [ix, product] of parent.products.entries()){
			let fluct =  this.conf["NOISE"][this.kind-1] * (2  *this.C.random() - 1)
			if ((product/2 - Math.abs(fluct)) < 0){
				fluct = product/2 
				if ( this.C.random() < 0.5){
					fluct *= -1
				}
			}
			this.products[ix] = Math.max(0, product/2 - fluct)
			parent.products[ix] = Math.max(0, product/2 + fluct)
		}
		let V = parent.V
		this.V = V/2
		parent.V = V/2
	}
}

export default Divider