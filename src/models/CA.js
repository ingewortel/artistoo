"use strict"

import GridBasedModel from "./GridBasedModel.js"


/** Extension of the {@link GridBasedModel} class suitable for
a Cellular Automaton (CA). Currently only supports synchronous CAs.

@example <caption>Conway's Game of Life </caption>
*	let CPM = require( "path/to/build" )
*	let C = new CPM.CA( [200,200], {
*		"UPDATE_RULE": 	function(p,N){
*			let nalive = 0
*			for( let pn of N ){
*				nalive += (this.pixt(pn)==1)
*			}	
*			if( this.pixt(p) == 1 ){
*				if( nalive == 2 || nalive == 3 ){
*					return 1
*				}
*			} else {
*				if( nalive == 3 ) return 1
*			}
*			return 0
*		}
*	})
*	let initialpixels = [ [100,100], [101,100], [102,100], [102,101], [101,102] ]
*	for( p of initialpixels ){
*		C.setpix( p, 1 )
* 	}
*	// Run it.
*	for( let t = 0; t < 10; t++ ){ C.timeStep() }

@todo Include asynchronous updating scheme?
*/
class CA extends GridBasedModel {

	/** The constructor of class CA.
	@param {GridSize} extents - the size of the grid of the model.
	@param {object} conf - configuration options. 
	@param {boolean} [conf.torus=[true,true,...]] - should the grid have linked borders?
	@param {number} [seed] - seed for the random number generator. If left unspecified,
	a random number from the Math.random() generator is used to make one.
	@param {updatePixelFunction} conf.UPDATE_RULE - the update rule of the CA. 
	*/
	constructor( extents, conf ){
		super( extents, conf )
		/** Bind the supplied updaterule to the object.
		@type {updatePixelFunction}*/
		this.updateRule = conf["UPDATE_RULE"].bind(this)
	}

	/** A timestep in a CA just applies the update rule and clears any cached stats after
	doing so. */
	timeStep(){
		this.grid.applyLocally( this.updateRule )
		
		/** Cached values of these stats. Object with stat name as key and its cached
		value as value. The cache must be cleared when the grid changes!
		@type {object} */
		this.stat_values = {}
	}
}

export default CA
