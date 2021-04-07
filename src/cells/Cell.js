
/* eslint-disable no-unused-vars*/
class Cell {
    
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







