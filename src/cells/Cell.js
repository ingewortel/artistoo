
/* eslint-disable no-unused-vars*/
class Cell {
	/** 
    parentId
    own_conf Needs to deep copy :(
    kind
    */
    
	constructor (conf, kind, id, mt, parent){
		// this.individualParams = []
		this.parentId = 0
		this.id = id
		this.own_conf = JSON.parse(JSON.stringify(conf))
		this.kind = kind
		this.mt = mt 
		if (parent instanceof Cell){ // copy on birth
			this.parentId = parent.id
		} 
	}

	params(){
		return this.own_conf
	}
}

export default Cell







