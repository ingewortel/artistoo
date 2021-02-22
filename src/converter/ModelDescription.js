//import GridManipulator from "../grid/GridManipulator"

/** This class is meant as a bridge to convert between model frameworks.
 * It currently supports only conversion from Artistoo -> Morpheus and vice
 * versa.
 * @experimental
 */
class ModelDescription {

	constructor( ){


		// Properties to obtain
		this.modelInfo = {
			title : "",
			desc : ""
		}

		this.timeInfo = {
			start : 0,
			stop : 0,
			duration : 0
		}

		this.grid = {
			geometry : "",
			ndim : 0,
			extents : [],
			boundaries : [],
			neighborhood : {
				distance : NaN,
				order : NaN
			}
		}

		this.kinetics = {
			T : 0,
			seed : undefined
		}

		this.constraints = {
			constraints : []
		}

		this.cellKinds = {
			name2index : {},
			index2name : {},
			properties : {},
			count : 0
		}

		this.setup = {
			init : []
		}

		this.generalWarning = ""

		this.conversionWarnings = {
			modelInfo : [],
			grid : [],
			time : [],
			cells : [],
			kinetics : [],
			constraints : [],
			init : [],
			analysis: []
		}


	}

	build(){
		this.setModelInfo()
		this.setGridInfo()
		this.setTimeInfo()
		this.setCellKindNames()
		this.setCPMGeneral()
		this.setConstraints()
		this.setGridConfiguration()
	}

	getKindIndex( kindName ){
		if( typeof this.cellKinds === "undefined" ){
			throw( "this.cellKinds needs to be set before getKindIndex() can be called!" )
		}
		return this.cellKinds.name2index[ kindName ]
	}

	getKindName( kindIndex ){
		if( typeof this.cellKinds === "undefined" ){
			throw( "this.cellKinds needs to be set before getKindName() can be called!" )
		}
		return this.cellKinds.index2name[ kindIndex.toString() ]
	}


	initDimensionVector( value = NaN ){
		let vec = []
		if( !this.grid.ndim > 0 ){
			throw( "initDimensionVector cannot be called before this.grid.ndim is set!" )
		}
		for( let d = 0; d < this.grid.ndim; d++ ){
			vec.push( value )
		}
		return vec
	}

	initCellKindVector( value = NaN, includeBackground = true ){

		if( typeof this.cellKinds === "undefined" ){
			throw( "this.cellKinds needs to be set before initCellKindVector() can be called!" )
		}

		let nk = this.cellKinds.count
		if( !includeBackground ){ nk-- }

		let vec = []
		for( let k = 0; k < nk; k++ ){
			vec.push( value )
		}
		return vec
	}

	initCellKindMatrix( value = NaN, includeBackground = true ){
		if( typeof this.cellKinds === "undefined" ){
			throw( "this.cellKinds needs to be set before initCellKindVector() can be called!" )
		}

		let nk = this.cellKinds.count
		if( !includeBackground ){ nk-- }

		let m = []
		for( let k = 0; k < nk; k++ ){
			m.push( this.initCellKindVector( value, includeBackground ) )
		}

		return m
	}

	setGridGeometry( geomString ){
		switch( geomString ){
		case "cubic" :
			this.grid.ndim = 3
			this.grid.geometry = "cubic"
			break
		case "square" :
			this.grid.ndim = 2
			this.grid.geometry = "square"
			break
		case "linear" :
			this.grid.ndim = 2
			this.grid.geometry = "linear"
			break
		case "hexagonal" :
			this.grid.ndim = 2
			this.grid.geometry = "hexagonal"
			break
		default :
			this.grid.ndim = 2
			this.grid.geometry = "square"
			this.conversionWarnings.grid.push(
				"Unknown grid geometry : " + geomString +
				". Continuing with default 2D square grid; but behavior may change!"
			)
			// do nothing.
		}
	}

	addConstraint( name, conf ){

		if( !this.hasConstraint(name) ){
			this.constraints.constraints[ name ] = []
		}
		this.constraints.constraints[ name ].push( conf )

	}

	hasConstraint( name ){
		return this.constraints.constraints.hasOwnProperty( name )
	}

	getConstraint( name, index = 0 ){
		return this.constraints.constraints[name][index]
	}

	getConstraintParameter( constraintName, paramName, index = 0 ){
		return this.getConstraint( constraintName, index )[ paramName ]
	}

	/* ==========	METHODS TO OVERWRITE IN SUBCLASS =========== */

	callerName() {
		try {
			throw new Error()
		}
		catch (e) {
			try {
				return e.stack.split("at ")[3].split(" ")[0]
			} catch (e) {
				return ""
			}
		}

	}
	methodOverwriteError(){
		throw( "Extensions of class ModelDescription must implement method: '" +
			this.callerName() + "'!" )
	}

	setModelInfo(){
		this.methodOverwriteError()
	}

	setTimeInfo(){
		this.methodOverwriteError()
	}

	setGridInfo(){
		this.methodOverwriteError()
	}

	setCPMGeneral(){
		this.methodOverwriteError()
	}

	setConstraints(){
		this.methodOverwriteError()
	}

	setCellKindNames(){
		this.methodOverwriteError()
	}

	setGridConfiguration(){
		this.methodOverwriteError()
	}

}




export default ModelDescription

