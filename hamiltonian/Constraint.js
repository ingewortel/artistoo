
class Constraint {
	get CONSTRAINT_TYPE() {
		throw("You need to implement the 'CONSTRAINT_TYPE' getter for this constraint!")
	}
	constructor( conf ){
		this.conf = conf
		if( typeof this.confChecker === "function" ){
			this.confChecker()
		}
	}
	set CPM(C){
		this.C = C
	}
	/* The optional confChecker method should verify that all the required conf parameters
	are actually present in the conf object and have the right format.*/
	//confChecker( ){
	//	
	//}
	/* Helper check function for parameters that should be a single string,
	which can take on one of the values in 'values'*/
	confCheckString( name, values ){
	
		// Check if the property exists at all
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		
		// Check if the property has the right type
		if( !( typeof this.conf[name] === "string" ) ){
			throw( "Conf object parameter " + name + " should be a single string!" )
		}
		
		// Check if the property has one of the allowed values.
		let valueFound = false
		for( let v of values ){
			if ( this.conf[name] == v ){
				valueFound = true
			}
		}
		
		if( !valueFound ){
			throw( "Conf object parameter " + name + " has invalid value " + this.conf[name] + 
				"! Please choose from: " + values.join( " / " ) )
		}
	}
	/* Checker for parameters that should be a single number.*/
	confCheckNumber( name ){
		// Check if the property exists at all
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		
		// Check if the property has the right type
		if( !( typeof this.conf[name] === "number" ) ){
			throw( "Conf object parameter " + name + " should be a number/NaN!" )
		}	
	}
	
	/* Checker for parameters that should be a single non-negative number*/
	confCheckSingleNonNegative( name ){
		this.confCheckNumber()
		if ( this.conf[name] < 0 ){
			throw( "Conf object parameter " + name + " should be non-negative!" )
		}
	}
	
	/* Helper function. Some parameters need to be specified for each cellkind, 
	so to check those we first need to know the number of cellkinds.*/
	confCheckCellKinds(){
		if( !this.conf.hasOwnProperty( "nCellKinds" ) ){
			throw( "Please specify the nCellKinds in the configuration object of the "
			+ this.__proto__.constructor.name + " constraint.")
		}
	}
	
	/* Checker for parameters that come in an array with a number for each cellkind. */
	confCheckCellNumbers( name ){
		// Check if the property exists at all
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		
		// Check if the property has the right type
		this.confCheckCellKinds()
		if( ! ( typeof this.conf[name] === "object" ) | 
			! ( this.conf[name].length == this.conf["nCellKinds"] + 1 ) ){
			throw( "Conf object parameter " + name + 
			" should be an array with an element for each cellkind including background!" )
		}
		
		// Check if the property has the right value.
		for( let e of this.conf[name] ){
			if( ! ( typeof e === "number" ) ){
				throw( "Conf object parameter " + name + " should be an array with numbers/NaNs!" )
			}
		}
	}
	
	/* Same as confCheckCellNumbers, but now numbers should also not be negative*/
	confCheckCellNonNegative( name ){
		this.confCheckCellNumbers( name )
		for( let e of this.conf[name] ){
			if( e < 0 ){
				throw( "Elements of parameter " + name + " should be non-negative!" )
			}
		}
	}
	
	/* Same as confCheckCellNonNegative, but now numbers should be between 0 and 1*/
	confCheckCellProbability( name ){
		this.confCheckCellNumbers( name )
		for( let e of this.conf[name] ){
			if( e < 0 ){
				throw( "Elements of parameter " + name + " should be between 0 and 1!" )
			}
			if( e > 1 ){
				throw( "Elements of parameter " + name + " should be between 0 and 1!" )			
			}
		}
	}
	
	/* Same as confCheckCellNumbers, but now values should be boolean */
	confCheckCellBoolean( name ){
		// Check if the property exists at all
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		
		// Check if the property has the right type
		this.confCheckCellKinds()
		if( ! ( typeof this.conf[name] === "object" ) | 
			! ( this.conf[name].length == this.conf["nCellKinds"] + 1 ) ){
			throw( "Conf object parameter " + name + 
			" should be an array with an element for each cellkind including background!" )
		}
		
		// Check if the property has the right value.
		for( let e of this.conf[name] ){
			if( ! ( typeof e === "boolean" ) ){
				throw( "Conf object parameter " + name + " should be an array with booleans!" )
			}
		}
	}
	
	/* Now the format should be a 'matrix' with rows and columns of numbers for each cellkind. */
	confCheckCellMatrix( name ){
		// Check if the property exists at all
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		
		// Check if the property has the right type
		this.confCheckCellKinds()
		if( ! ( typeof this.conf[name] === "object" ) | 
			! ( this.conf[name].length == this.conf["nCellKinds"] + 1 ) ){
			throw( "Conf object parameter " + name + 
			" should be an array with a sub-array for each cellkind including background!" )
		}
		
		for( let e of this.conf[name] ){
			if( ! ( typeof e === "object" ) | 
				! ( e.length == this.conf["nCellKinds"] + 1 ) ){
				throw( "Sub-arrays of " + name + 
				" should have an element for each cellkind including background!" )
			}
			for( let ee of e ){
				if( !(typeof ee === "number" ) ){
					throw("Elements in conf parameter " + name + " should all be numbers/NaN!" )
				}
			}
		}
		
		
	}
}

export default Constraint
