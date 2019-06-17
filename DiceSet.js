/** This class implements a data structure with constant-time insertion, deletion, and random
    sampling. That's crucial for the CPM metropolis algorithm, which repeatedly needs to sample
    pixels at cell borders. */

"use strict"

// pass in RNG
class DiceSet{
	constructor( mt ) {

		// Use a hash map to check in constant time whether a pixel is at a cell border.
		// 
		// Currently (Mar 6, 2019), it seems that vanilla objects perform BETTER than ES6 maps,
		// at least in nodejs. This is weird given that in vanilla objects, all keys are 
		// converted to strings, which does not happen for Maps
		// 
		this.indices = {} //new Map() // {}
		//this.indices = {}

		// Use an array for constant time random sampling of pixels at the border of cells.
		this.elements = []

		// track the number of pixels currently present in the DiceSet.
		this.length = 0

		this.mt = mt
	}

	insert( v ){
		if( this.indices[v] ){
			return
		}
		// Add element to both the hash map and the array.
		//this.indices.set( v, this.length )
		this.indices[v] = this.length
	
		this.elements.push( v )
		this.length ++ 
	}

	remove( v ){
		// Check whether element is present before it can be removed.
		if( !this.indices[v] ){
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

	contains( v ){
		//return this.indices.has(v)
		return (v in this.indices)
	}

	sample(){
		return this.elements[Math.floor(this.mt.rnd()*this.length)]
	}
}

export default DiceSet

