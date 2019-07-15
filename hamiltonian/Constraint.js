
class Constraint {
	get CONSTRAINT_TYPE() {
		throw("You need to implement the 'CONSTRAINT_TYPE' getter for this constraint!")
	}
	get parameters(){
		return null
	}
	constructor( conf ){
		this.conf = conf
	}
	set CPM(C){
		this.C = C
		if( typeof this.confChecker === "function" ){
			this.confChecker()
		}
	}
	/* The optional confChecker method should verify that all the required conf parameters
	are actually present in the conf object and have the right format.*/
	confChecker( ){
	}
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
	confCheckCellKinds( n_default ){
		if( !this.C ){
			throw("confCheck method called before addition to CPM!")
		}
		if( !("n_cell_kinds" in this.C) ){
			this.C.n_cell_kinds = n_default - 1
		}
		return this.C.n_cell_kinds
	}

	confCheckArray( name, type ){
		// Check if the property exists at all
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		let p = this.conf[name]
		if( !(p instanceof Array) ){
			throw( "Parameter " + name + " is not an array!" )
		}
		
		// Check if the property has the right type
		let n_cell_kinds = this.confCheckCellKinds( p.length )
		if( this.conf[name].length != n_cell_kinds + 1 ){
			throw( "Conf object parameter " + name + 
			" should be an array with an element for each cellkind including background!" )
		}
		
		// Check if the property has the right value.
		for( let e of this.conf[name] ){
			if( ! ( typeof e === type ) ){
				throw( "Conf object parameter " + name + 
					" should be an array with "+type+"s!" )
			}
		}
	}

	/* Checker for parameters that come in an array with a number for each cellkind. */
	confCheckCellNumbers( name ){
		this.confCheckArray( name, "number" )
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
		this.confCheckArray( name, "boolean" )
	}
	
	/* Now the format should be a 'matrix' with rows and columns of numbers for each cellkind. */
	confCheckCellMatrix( name, type="number" ){
		// Check if the property exists at all
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		let p = this.conf[name]
		if( !(p instanceof Array) ){
			throw( "Parameter " + name + " is not an array!" )
		}

		// Check if the property has the right type
		let n_cell_kinds = this.confCheckCellKinds( p.length )
		if( !( p.length == n_cell_kinds + 1 ) ){
			throw( "Conf object parameter " + name + 
			" must be an array with a sub-array for each cellkind including background!" )
		}
		
		for( let e of this.conf[name] ){
			if( ! ( e.length == n_cell_kinds + 1 ) ){
				throw( "Sub-arrays of " + name + 
				" must have an element for each cellkind including background!" )
			}
			for( let ee of e ){
				if( !(typeof ee === type ) ){
					throw("Elements in conf parameter " + name + " must all be numbers/NaN!" )
				}
			}
		}
		
		
	}
}

export default Constraint
