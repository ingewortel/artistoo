/** This class implements a data structure with constant-time insertion, deletion, and random
    sampling. That's crucial for the CPM metropolis algorithm, which repeatedly needs to sample
    pixels at cell borders. */

'use strict'

// pass in RNG
function DiceSet( mt ) {
	// Use a hash map to check in constant time whether a pixel is at a cell border.
	// Use Map() instead of object {} for speed.
	this.indices = new Map() // {}

	// Use an array for constant time random sampling of pixels at the border of cells.
	this.elements = []

	// track the number of pixels currently present in the DiceSet.
	this.length = 0

	this.mt = mt
}

DiceSet.prototype = {
	insert : function( v ){
		// Check whether value is defined and not already in the set.
		if( typeof v == "undefined" ){
			throw("attempting to insert undefined value!")
		}
		if( this.indices.has( v ) ){
			return
		}
		// Add element to both the hash map and the array.
		this.indices.set( v, this.length )
		this.elements.push( v )
		this.length ++ 
	},
	remove : function( v ){
		// Check whether element is present before it can be removed.
		if( !this.indices.has( v ) ){
			return
		}
		/* The hash map gives the index in the array of the value to be removed.
		The value is removed directly from the hash map, but from the array we
		initially remove the last element, which we then substitute for the 
		element that should be removed.*/
		var i = this.indices.get(v)
		this.indices.delete(v)
		var e = this.elements.pop()
		this.length --
		if( e == v ){
			return
		}
		this.elements[i] = e
		this.indices.set(e,i)
	},
	contains : function( v ){
		return this.indices.has(v) // (v in this.indices)
	},
	sample : function(){
		return this.elements[Math.floor(this.mt.rnd()*this.length)]
	}
}

export default DiceSet

