	
	
	/*confCheckPresenceOf( name ){
		if( !this.conf.hasOwnProperty( name ) ){
			throw( "Cannot find parameter " + name + " in the conf object!" )
		}
		if( this.conf[name] == "undefined" ){
			throw( "Parameter " + name + " is undefined!" )
		}
	}
	confCheckCellKinds( n_default ){
		if( !this.C ){
			throw("confCheck method called before addition to CPM!")
		}
		if( !("n_cell_kinds" in this.C) ){
			this.C.n_cell_kinds = n_default - 1
		}
		return this.C.n_cell_kinds
	}*/

	

	/** Method to check if a parameter of a given name is present in the conf object 
	supplied to the constraint, and if it has an expected type.
	Throws an error if this is not the case.
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.
	@param {string} type - the expected type of the parameter.*/
	/*confCheckTypeOf( name, type ){
		this.confCheckPresenceOf( name )
		// Check if the property has the right type
		if( !( typeof this.conf[name] === type ) ){
			throw( "Conf object parameter " + name + " should be a " + type +"!" )
		}
	}*/

	/** Helper check function for parameters that should be a single string,
	which can take on one of the values in 'values'. It checks whether the parameter is
	present, whether it is a string, and whether its value matches one of the predefined
	options.
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.
	@param {string[]} values - an array of values the parameter is allowed to have.*/
	/*confCheckString( name, values ){
		this.confCheckPresenceOf( name )
		this.confCheckTypeOf( name, "string" )

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
	}*/
	/** Checker for parameters that should be a single number.
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.*/
	/*confCheckNumber( name ){
		this.confCheckTypeOf( name, "number" )
	}*/
	
	/** Checker for parameters that should be a single non-negative number
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.*/
	/*confCheckSingleNonNegative( name ){
		this.confCheckNumber( name )
		if ( this.conf[name] < 0 ){
			throw( "Conf object parameter " + name + " should be non-negative!" )
		}
	}*/
	


	/** Checker for parameters that should be an array where elements are a given type.
	This array should have an element for each cellkind + background.
	Throws an error when this is not the case.
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.
	@param {string} type - the expected type of each array element.
	*/
	/*confCheckArray( name, type ){
		this.confCheckPresenceOf( name )
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
	}*/

	/** Checker for parameters that come in an array with a number for each cellkind. 
	Throws an error when this is not the case.
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.
	*/
	/*confCheckCellNumbers( name ){
		this.confCheckArray( name, "number" )
	}*/
	
	/** Same as {@link confCheckCellNumbers}, but now numbers should also not be negative
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.
	*/
	/*confCheckCellNonNegative( name ){
		this.confCheckCellNumbers( name )
		for( let e of this.conf[name] ){
			if( e < 0 ){
				throw( "Elements of parameter " + name + " should be non-negative!" )
			}
		}
	}*/
	
	/** Same as {@link confCheckCellNonNegative}, but now numbers should be between 0 and 1
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.	
	*/
	/*confCheckCellProbability( name ){
		this.confCheckCellNumbers( name )
		for( let e of this.conf[name] ){
			if( e < 0 ){
				throw( "Elements of parameter " + name + " should be between 0 and 1!" )
			}
			if( e > 1 ){
				throw( "Elements of parameter " + name + " should be between 0 and 1!" )			
			}
		}
	}*/
	
	/** Same as {@link confCheckCellNumbers}, but now values should be boolean 
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.
	*/
	/*confCheckCellBoolean( name ){
		this.confCheckArray( name, "boolean" )
	}*/
	
	/** Checker for parameters that specify interactions between two cells with each a 
	{@link CellKind}. Checks if there is an array of arrays ("matrix") where each array
	has an element for each cellkind including background. Thus, M[n][m] specifies
	the parameter for an interaction between a cell of cellkind n and a cell of cellkind m.
	Elements in the subarrays be of a specified type (number by default). 
	If this is not the case, the method throws an error.
	@param {string} name - the name of the parameter, which should be present as a key
	in the object.
	@param {string}[ type = "number" ] - the expected type of each array element.
	*/
	/*confCheckCellMatrix( name, type="number" ){
		this.confCheckPresenceOf( name )
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
					throw("Elements in conf parameter " + name + " must all be of type " + type + "!" )
				}
			}
		}
	}*/