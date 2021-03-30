
/* eslint-disable no-unused-vars*/
class Cell {
	/** 
    parentId
    own_conf Needs to deep copy :(
    kind
    */
    
	constructor (conf, kind, id, mt){
		this.parentId = 0
		this.id = id
		this.own_conf = JSON.parse(JSON.stringify(conf))
		this.kind = kind
		this.mt = mt 
	}

	params(){
		return this.own_conf
	}

	birth (parent){
		this.parentId = parent.id 
	}
}

export default Cell







