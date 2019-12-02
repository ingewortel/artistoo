/** Class for checking if parameters are present in a conf object and are of the expected
structure and type. This is not meant for usage from outside the package, but you can
use it when you are building your own constraints and want to specify the required parameters.

@example
* // Add this above your constraint class
* import ParameterChecker from "./ParameterChecker.js"
* 
* // from inside the confChecker() function of your constraint:
* let checker = new ParameterChecker( this.conf, this.C )
* 
* // Most parameters have a standard structure and value type;
* // you can check them like this:
* checker.confCheckParameter( "MY_PARAMETER", "KindMatrix", "Number" ) // see Adhesion
* checker.confCheckParameter( "MY_PARAMETER_2", "KindArray", "NonNegative" )
* 
* // Or you can just check their presence and do a custom check:
* checker.confCheckPresenceOf( "MY_WEIRD_PARAMETER" )
* if( !myCondition ){
* 	throw( "Some error because MY_WEIRD_PARAMETER does not fulfill myCondition!" )
* }
*/
class ParameterChecker {

	/** The constructor of the ParameterChecker takes a configuration object.
	@param {object} conf - configuration settings as supplied to a constraint, containing the
	relevant parameters.
	@param {CPM} C - the attached CPM.
	*/
	constructor( conf, C ){
	
		/** The configuration object to check parameters in 
		@type {object}*/
		this.conf = conf
		
		/** The attached CPM. This is used to check if parameter array lengths match
		the number of cellkinds
		@type {CPM}*/
		this.C = C
	}
	
	/* ========= CHECKING PARAMETER PRESENCE ======== */

	/** Method to check if a parameter of a given name is present in the conf object 
	supplied to the constraint, and if it is defined. Throws an error if this is not the case.
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.
	
	@example
	* let conf = { MY_PARAMETER : "something" }
	* // This works, because  MY_PARAMETER is present in conf
	* let checker = new ParameterChecker( conf, myCPM )
	* checker.confCheckPresenceOf( "MY_PARAMETER" )
	* 
	* // There will be an error if MY_PARAMETER is absent/undefined:
	* conf = {}
	* checker = new ParameterChecker( conf, myCPM )
	* checker.confCheckPresenceOf( "MY_PARAMETER" )
	* conf = { MY_PARAMETER : "undefined" }
	* checker = new ParameterChecker( conf, myCPM )
	* checker.confCheckPresenceOf( "MY_PARAMETER" )
	*/
	confCheckPresenceOf( name ){
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		if( this.conf[name] == "undefined" ){
			throw( "Parameter " + name + " is undefined!" )
		}
	}
	
	/* ========= CHECKING PARAMETER STRUCTURE ======== */
	
	/** Helper function. Some parameters need to be specified for each {@link CellKind}, 
	so to check those we first need to know the number of cellkinds on the CPM.
	This number is retrieved from the CPM or added to it if it isn't there yet.
	@param {number} n_default - a number of cellkinds (including background), which is used
	to set the number of cellkinds in the CPM if it isn't there yet.
	@return {number} the number of non-background cellkinds as cached in the CPM.
	@private
	*/
	confCheckCellKinds( n_default ){
		if( !this.C ){
			throw("confCheck method called before addition to CPM!")
		}
		if( !("n_cell_kinds" in this.C) ){
			this.C.n_cell_kinds = n_default - 1
		}
		return this.C.n_cell_kinds
	}
	
	/** Parameter structure for parameters that should come as a single value.
	This value can be of type string, boolean, or number.
	@example
	* let ACT_MEAN = "arithmetic" // Is a SingleValue parameter
	@typedef {number|string|boolean} SingleValue
	*/
	
	/** Check if a parameter consists of a single value (rather than an object or array),
	which can be a string, number, or boolean. 
	@param {SingleValue} p - the parameter to check, which must be a single
	string/number/boolean value.
	@param {string} name - the name of this parameter in the conf object, used for the
	error message if p is not a single value.
	
	@example
	* let checker = new ParameterChecker( conf, C )
	* let p1 = true, p2 = 1, p3 = "hi", p4 = [1,2]
	* // Nothing happens for parameters of type SingleValue:
	* checker.confCheckStructureSingle( p1, "MY_PARAMETER" )
	* checker.confCheckStructureSingle( p2, "MY_PARAMETER" )
	* checker.confCheckStructureSingle( p3, "MY_PARAMETER" )
	*
	* // This will throw an error because p4 is an array.
	* checker.confCheckStructureSingle( p4, "MY_PARAMETER" )
	*/
	confCheckStructureSingle( p, name ){
	
		// single values are of type string, number, or boolean. If that is the case,
		// just return.
		let type = typeof p
		if( type == "string" || type == "number" || type == "boolean" ){
			return
		} else {
			throw( "Parameter " + name + " should be a single value!" )
		}

	}
	
	/** Parameter structure for parameters that should come in an array with an element
	for each {@link CellKind} including background.
	@example
	* let V = [0,5] // Is a KindArray parameter
	@typedef {Array} KindArray
	*/
	
	/** Check if a parameter has a {@link KindArray} structure.
	@param {KindArray} p - the parameter to check
	@param {string} name - the name of this parameter in the conf object, used for the
	error message if p is not a {@link KindArray}.
	
	@example
	* // C is a CPM which has 2 cellkinds including background:
	* let checker = new ParameterChecker( conf, C )
	* let p1 = [1,1], p2 = ["hi","hi"], p3 = "hi", p4 = [1,2,3]
	* // Nothing happens when parameters are indeed arrays of length 2
	* // (regardless of what type of array)
	* checker.confCheckStructureKindArray( p1, "MY_PARAMETER" )
	* checker.confCheckStructureKindArray( p2, "MY_PARAMETER" )
	*
	* // You'll get an error when p is no array, or when 
	* // its length doesn't match the number of cellkinds:
	* checker.confCheckStructureSingle( p3, "MY_PARAMETER" )
	* checker.confCheckStructureSingle( p4, "MY_PARAMETER" )
	*/
	confCheckStructureKindArray( p, name ){
		if( !(p instanceof Array) ){
			throw( "Parameter " + name + " should be an array!" )
		}	
		
		// Check if the array has an element for each cellkind incl. background
		let n_cell_kinds = this.confCheckCellKinds( p.length )
		if( this.conf[name].length != n_cell_kinds + 1 ){
			throw( "Parameter " + name + 
			" should be an array with an element for each cellkind including background!" )
		}
	}
	
	/** Parameter structure for parameters that specify interactions between two cells 
	with each a {@link CellKind}. Should be an array of arrays ("matrix") 
	where each array has an element for each cellkind including background. 
	Thus, M[n][m] specifies the parameter for an interaction between a cell of 
	cellkind n and a cell of cellkind m.
	@example
	* let J = [[0,20],[20,10]] // is a KindMatrix parameter.
	@typedef {Array} KindMatrix
	*/
	
	/** Checker if a parameter has a {@link KindMatrix} structure.
	If this is not the case, the method throws an error.
	@param {KindMatrix} p - the parameter to check
	@param {string} name - the name of this parameter in the conf object, used for the
	error message if p is not a {@link KindMatrix}.
	
	@example
	* // C is a CPM which has 2 cellkinds including background:
	* let checker = new ParameterChecker( conf, C )
	* let p1 = [[1,1],[1,1]], p2 = [["a","a"],["a","a"]] 
	* // Nothing happens when parameters are indeed arrays of length 2
	* // with sub-arrays of length 2 (regardless of what is in the elements)
	* checker.confCheckStructureKindArray( p1, "MY_PARAMETER" ) //OK
	* checker.confCheckStructureKindArray( p2, "MY_PARAMETER" ) //OK
	*
	* // You'll get an error when p is no array, or when 
	* // its length doesn't match the number of cellkinds:
	* let p3 = 1, p4 = [1,2,3], p5 = [[1,2],[1,2],[1,2]]
	* checker.confCheckStructureSingle( p3, "MY_PARAMETER" ) //error
	* checker.confCheckStructureSingle( p4, "MY_PARAMETER" ) //error
	* checker.confCheckStructureSingle( p5, "MY_PARAMETER" ) //error
	*/
	confCheckStructureKindMatrix( p, name ){

		let err1 = false, err2 = false
		let n_cell_kinds

		// err1: Check if the main array is an array and has the right size
		if( !(p instanceof Array) ){
			err1 = true
		} else {
			n_cell_kinds = this.confCheckCellKinds( p.length )
			if( !( p.length == n_cell_kinds + 1 ) ){
				err1 = true
			}		
		}
		if( err1 ){
			throw( "Parameter " + name + 
			" must be an array with a sub-array for each cellkind including background!" )
		}
		
		// Check if subarrays have the right size
		for( let e of p ){
			if( !(e instanceof Array) ){
				err2 = true
			} else {
				if( !( e.length == n_cell_kinds + 1 ) ){
					err2 = true
				}		
			}
			if( err2 ){
				throw( "Sub-arrays of " + name + 
				" must have an element for each cellkind including background!" )
			}
		}
	}
	
	/** Method for checking if the parameter has the right structure. Throws an error
	message if the parameter does not have this structure.
	
	It internally uses one of the following functions, depending on the structure argument:
	{@link confCheckStructureSingle}, {@link confCheckStructureKindArray}, or
	{@link confCheckStructureKindMatrix}.
	
	@param {SingleValue|KindArray|KindMatrix} p - the parameter to check the structure of
	@param {string} name - the name of this parameter in the conf object, used for the
	error message.
	@param {string} structure - parameter structure, which must be one of 
	"{@link SingleValue}", "{@link KindArray}", or "{@link KindMatrix}".
	
	@example
	* // My own configuration object
	* let conf = {
	*	P1 : true,
	* 	P2 : [0,2],
	* 	P3 : [-1,2,4],
	* 	P4 : [[1,2],[1,2]]
	* }
	* // C is a CPM which has 2 cellkinds including background:
	* let checker = new ParameterChecker( conf, C )
	* // These checks work out fine:
	* checker.confCheckStructure( conf["P1"],"P1","SingleValue")
	* checker.confCheckStructure( conf["P2"],"P2","KindArray")
	* checker.confCheckStructure( conf["P4"],"P4","KindMatrix")
	* 
	* // These checks throw an error:
	* checker.confCheckStructure( conf["P1"],"P1","KindArray") // not an array
	* checker.confCheckStructure( conf["P2"],"P3","KindArray") // too long
	*/
	confCheckStructure( p, name, structure ){
		if( structure == "SingleValue" ){
			this.confCheckStructureSingle( p, name )
		} else if ( structure == "KindArray" ){
			this.confCheckStructureKindArray( p, name )
		} else if ( structure == "KindMatrix" ){
			this.confCheckStructureKindMatrix( p, name )
		} else {
			throw("Unknown structure " + structure + ", please choose 'SingleValue', 'KindArray', or 'KindMatrix'.")
		}
	}
	
	/* ========= CHECKING VALUE TYPE ======== */
	
	/** Check if a value is of type 'number'.
	@param {number} v - value to check.
	@return {boolean} is v a number?
	@example
	this.isNumber( -1 ) // true
	this.isNumber( 0.5 ) // true
	this.isNumber( true ) // false
	this.isNumber( [1,2 ] ) // false
	this.isNumber( "hello world" ) // false
	@private
	*/
	isNumber( v ){
		return ( typeof v === "number" )
	}
	/** Check if a value is of type 'number' and non-negative.
	@param {number} v - value to check.
	@return {boolean} is v a non-negative number?
	@example
	this.isNonNegative( -1 ) // false
	this.isNonNegative( 0.5 ) // true
	this.isNumber( true ) // false
	this.isNumber( [1,2 ] ) // false
	this.isNumber( "hello world" ) // false
	@private
	*/
	isNonNegative( v ){
		if( !( typeof v === "number" ) || v < 0 ){
			return false
		}
		return true
	}
	/** Check if a value is of type 'number' and between 0 and 1.
	@param {number} v - value to check.
	@return {boolean} is v a number between 0 and 1?
	@example
	this.isProbability( -1 ) // false
	this.isProbability( 0.5 ) // true
	this.isProbability( true ) // false
	this.isProbability( [1,2 ] ) // false
	this.isProbability( "hello world" ) // false
	@private
	*/
	isProbability( v ){
		if( !( typeof v === "number" ) || v < 0 || v > 1 ){
			return false
		}
		return true
	}
	/** Check if a value is of type 'string' and has one of a set of
	predefined values.
	@param {number} v - value to check.
	@param {string[]} [values=[]] - possible values. If left empty,
	any string is considered OK.
	@return {boolean} is v a string and does it match one of the predefined values?
	@example
	this.isString( true ) // false
	this.isString( ["a","b"] ) // false
	this.isString( "hello world" ) // true
	@private
	*/
	isString( v, values = [] ){
		if( !( typeof v === "string" ) ){
			return false
		}
		let found = false
		for( let val of values ){
			if( val == v ){
				found = true
			}
		}
		return found
	}
	/** Check if a value is of type 'boolean'.
	@param {number} v - value to check.
	@return {boolean} is v a boolean?
	@example
	this.isBoolean( true ) // true
	this.isBoolean( [true,false] ) // false
	this.isBoolean( "hello world" ) // true
	@private
	*/
	isBoolean( v ){
		return( typeof v === "boolean" )
	}
	
	/** Check if a value is a coordinate in the dimensions of the current grid.
	@param {number} v - value to check.
	@return {boolean} is v a coordinate of the right dimensions?
	@public
	*/
	isCoordinate( v ){
		if( !( v instanceof Array ) ){
			return false
		}
		if( !v.length == this.C.extents.length ){
			return false
		}
		return true
	}
	
	/** Check if the elements of a given parameter are of the right type.
	It throws an error if this is not the case.
	@param {anything} p - parameter to check.
	@param {string} name - parameter name used for any error messages.
	@param {string} structure - parameter structure, which must be one of 
	"{@link SingleValue}", "{@link KindArray}", or "{@link KindMatrix}".
	@param {string} valuetype - type of value, which must be one of 
	"Number", "NonNegative", "Probability", "String", or "Boolean". 
	@param {string[]} values - predefined specific options for the value. 
	If left empty, this is ignored.
	@private
	*/
	confCheckValueType( p, name, structure, valuetype, values = [] ){
	
		// Determine which checkfunction will be used.
		let valuechecker
		if( valuetype == "Number" ){
			valuechecker = this.isNumber
		} else if ( valuetype == "NonNegative" ){
			valuechecker = this.isNonNegative
		} else if ( valuetype == "Probability" ){
			valuechecker = this.isProbability
		} else if ( valuetype == "String" ){
			valuechecker = this.isString
		} else if ( valuetype == "Boolean" ){
			valuechecker = this.isBoolean
		} else {
			throw( "Unsupported valuetype in check for parameter " + name +
				", please choose from: 'Number','NonNegative', 'Probability', 'String', 'Boolean'.")
		}
		
		let message =  "Parameter " + name + " : incorrect type. Expecting values of type " + valuetype + "." 
		
		// structure determines how the checker is applied.
		if( structure == "SingleValue" ){
			if( p == "undefined" || !valuechecker( p, values ) ){ throw(message) }
		} else if ( structure == "KindArray" ){
			for( let i of p ){
				if( i == "undefined" || !valuechecker( i, values ) ){ throw(message) }
			}
		} else if ( structure == "KindMatrix" ){
			for( let i of p ){
				for( let j of i ){
					if( j == "undefined" || !valuechecker( j, values ) ){ throw(message) }
				}
			}
		} else {
			throw("Unknown structure " + structure + ", please choose 'SingleValue', 'KindArray', or 'KindMatrix'.")
		}
	}
	
	/** Check if a parameter exists and is defined, has the right structure, and if all 
	its elements are of the correct type. Throw an error if any of these do not hold.
	@param {string} name - parameter name used for any error messages.
	@param {string} structure - parameter structure, which must be one of 
	"{@link SingleValue}", "{@link KindArray}", or "{@link KindMatrix}".
	@param {string} valuetype - type of value, which must be one of 
	"Number", "NonNegative", "Probability", "String", or "Boolean". 
	@param {string[]} [values =[]] - predefined specific options for the value. 
	If left empty, this is ignored.
	
	@example
	* // from inside the confChecker() function of your constraint:
	* let checker = new ParameterChecker( this.conf, this.C )
	* 
	* checker.confCheckParameter( "MY_PARAMETER", "KindMatrix", "Number" ) // see Adhesion
	* checker.confCheckParameter( "MY_PARAMETER_2", "KindArray", "NonNegative" )
	*/
	confCheckParameter( name, structure, valuetype, values = [] ){
		this.confCheckPresenceOf( name )
		let p = this.conf[name]
		this.confCheckStructure( p, name, structure )
		this.confCheckValueType( p, name, structure, valuetype, values )
	}
	
	
}

export default ParameterChecker