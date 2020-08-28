

"use strict"

// pass in RNG

/** This class implements a data structure with constant-time insertion, deletion, and random
    sampling. That's crucial for the CPM metropolis algorithm, which repeatedly needs to sample
    pixels at cell borders. Elements in this set must be unique.*/
class DiceSet{

	/** An object of class MersenneTwister. 
	@see https://www.npmjs.com/package/mersenne-twister
	@typedef {object} MersenneTwister
	*/

	/** The constructor of class DiceSet takes a MersenneTwister object as input, to allow
	seeding of the random number generator used for random sampling.
	@param {MersenneTwister} mt MersenneTwister object used for random numbers.*/
	constructor( mt ) {

		/** Object or hash map used to check in constant time whether a pixel is at the
		cell border. Keys are the actual values stored in the DiceSet, numbers are their
		location in the elements arrray.
		Currently (Mar 6, 2019), it seems that vanilla objects perform BETTER than ES6 maps,
		at least in nodejs. This is weird given that in vanilla objects, all keys are 
		converted to strings, which does not happen for Maps.
		@type {object}
		*/
		this.indices = {} //new Map() // {}
		//this.indices = {}

		/** Use an array for constant time random sampling of pixels at the border of cells.
		@type {number[]} */
		this.elements = []

		/** The number of elements currently present in the DiceSet. 
		@type {number}
		*/
		this.length = 0

		/** @ignore */
		this.mt = mt
	}

	/** Unique identifier of some element. This can be a number (integer) or a string,
	but it must uniquely identify one element in a set.
	@typedef {number|string} uniqueID*/

	/** Insert a new element. It is added as an index in the indices, and pushed
	to the end of the elements array.
	@param {uniqueID} v The element to add.
	*/
	insert( v ){
		if( this.indices.hasOwnProperty( v ) ){
			return
		}
		// Add element to both the hash map and the array.
		//this.indices.set( v, this.length )
		this.indices[v] = this.length
	
		this.elements.push( v )
		this.length ++ 
	}

	/** Remove element v.
	@param {uniqueID} v The element to remove. 
	*/
	remove( v ){
		// Check whether element is present before it can be removed.
		if( !this.indices.hasOwnProperty( v ) ){
			return
		}
		/* The hash map gives the index in the array of the value to be removed.
		The value is removed directly from the hash map, but from the array we
		initially remove the last element, which we then substitute for the 
		element that should be removed.*/
		//const i = this.indices.get(v)
		const i = this.indices[v]

		//this.indices.delete(v)
		delete this.indices[v]

		const e = this.elements.pop()
		this.length --
		if( e == v ){
			return
		}
		this.elements[i] = e

		//this.indices.set(e,i)
		this.indices[e] = i
	}
	/** Check if the DiceSet already contains element v. 
	@param {uniqueID} v The element to check presence of. 
	@return {boolean} true or false depending on whether the element is present or not.
	*/
	contains( v ){
		//return this.indices.has(v)
		return (v in this.indices)
	}
	
	/** Sample a random element from v.
	@return {uniqueID} the element sampled.
	*/
	sample(){
		return this.elements[Math.floor(this.mt.random()*this.length)]
	}
}

export default DiceSet

