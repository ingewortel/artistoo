/** The core CPM class. Can be used for two- or 
 * three-dimensional simulations. 
*/

"use strict"

import GridBasedModel from "./GridBasedModel.js"

class CA extends GridBasedModel {
	constructor( extents, conf ){
		super( extents, conf )
		this.updateRule = conf["UPDATE_RULE"].bind(this)
	}

	timeStep(){
		this.grid.applyLocally( this.updateRule )
	}
}

export default CA
