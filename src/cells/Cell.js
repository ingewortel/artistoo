
/* eslint-disable no-unused-vars*/
class Cell {
	/** 
    individualParams
    parentId
    conf
    kind
    */
    
	constructor (conf, kind, id, parent){
		this.individualParams = []
		this.parentId = 0
		this.id = id
		this.conf = conf
		this.kind = kind
		if (parent instanceof Cell){ // copy on birth
			this.parentId = parent.id
		} 
	}

	getParam(param){
		if (!(this.individualParams.includes(param))){
			return this.conf[param][this.kind]
		} else {
			return this.getIndividualParam(param)
		}
	}

	getIndividualParam(param){
		throw("Implement changed way to get" + param + " constraint parameter per individual, or remove this from " + typeof this + " Cell class's indivualParams." )
	}
	/* eslint-disable no-unused-vars*/
	mutate(weight){
		throw("Implement top-down mutation for " + typeof this + " Cell class's " )
	}
}



export default Cell







