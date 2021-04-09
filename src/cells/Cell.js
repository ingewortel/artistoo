
class Cell {
	
	/** The constructor of class Cell.
	 * @param {object} conf - configuration options; see below. In addition,
	 * the conf object can have parameters to constraints added to the CPM.
	 * See the different {@link Constraint} subclasses for options. For some
	 * constraints, adding its parameter to the CPM conf object automatically
	 * adds the constraint; see {@link AutoAdderConfig} to see for which
	 * constraints this is supported.
	 * @param {boolean[]} [conf.torus=[true,true,...]] - should the grid have
	 * linked borders?
	 * @param {number} [conf.T] - the temperature of this CPM. At higher
	 * temperatures, unfavourable copy attempts are more likely to be accepted.
	 * @param {number} [conf.seed] - seed for the random number generator. If
	 * left unspecified, a random number from the Math.random() generator is
	 * used to make one.
	 * */
	constructor (conf, kind, id, mt){
		this.parentId = 0
		this.id = id
		this.conf = conf
		this.kind = kind
		this.mt = mt 
	}

	birth (parent){
		this.parentId = parent.id 
	}

	getParam(param){
		if( this.hasOwnProperty(param)){
			return this[param]
		} else {
			return this.conf[param][this.kind]
		}
	}
}

export default Cell







