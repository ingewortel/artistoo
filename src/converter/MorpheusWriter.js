import Writer from "./Writer.js"

class MorpheusWriter extends Writer {

	constructor( model, config ){
		super( model, config )

		// property set by initXML.
		this.xml = undefined
		this.initXML()

		this.cellTypeTagIndex = {}

		this.fieldsToDraw = []

		this.logString = "Hi there! Converting " + this.model.from + " to Morpheus XML...\n\n"

	}

	write(){
		if( typeof this.target !== undefined ){
			this.target.innerHTML = this.writeXML()
		} else {
			//eslint-disable-next-line no-console
			console.log( this.writeXML() )
		}
		this.writeLog()
	}

	writeXML(){
		this.writeDescription()
		this.writeGlobal()
		this.writeSpace()
		this.writeTime()
		this.writeCellTypes()
		this.writeCPM()
		this.writeConstraints()
		this.writeCellPopulations()
		this.writeAnalysis()
		return this.formatXml( new XMLSerializer().serializeToString(this.xml) )
	}

	formatXml(xml, tab) { // tab = optional indent value, default is tab (\t)
		let formatted = "", indent= ""
		tab = tab || "\t"
		xml.split(/>\s*</).forEach(function(node) {
			if (node.match( /^\/\w/ )) indent = indent.substring(tab.length) // decrease indent by one 'tab'
			formatted += indent + "<" + node + ">\r\n"
			if (node.match( /^<?\w[^>]*[^/]$/ )) indent += tab             // increase indent
		})
		return formatted.substring(1, formatted.length-3)
	}

	initXML(){
		let xmlString = "<MorpheusModel></MorpheusModel>"
		let parser = new DOMParser()
		this.xml = parser.parseFromString( xmlString, "text/xml" )
		this.setAttributesOf( "MorpheusModel", {version: "4" } )
	}

	/* ==========	METHODS TO MANIPULATE XML STRUCTURE =========== */

	setAttributesOf( node, attr, index = 0 ){
		for( let a of Object.keys( attr ) ){
			this.xml.getElementsByTagName( node )[index].setAttribute( a, attr[a] )
		}
	}
	attachNode( parentName, nodeName, value = undefined, attr= {}, index = 0 ){
		let node = this.makeNode( nodeName, value, attr )
		this.addNodeTo( node, parentName, index )
	}
	makeNode( nodeName, value = undefined, attr= {} ){
		let node = this.xml.createElement( nodeName )
		if( typeof value !== "undefined" ){
			node.innerHTML = value
		}
		for( let a of Object.keys( attr ) ){
			node.setAttribute( a, attr[a] )
		}
		return node

	}
	addNodeTo( node, parentName, index = 0 ){
		let parent = this.xml.getElementsByTagName( parentName )[index]
		parent.appendChild(node)
	}
	setNode( nodeName, value, index = 0 ){
		this.xml.getElementsByTagName( nodeName )[index].innerHTML = value
	}

	/* ==========	OTHER HELPER METHODS =========== */

	toMorpheusCoordinate( coordinate, fillValue = 0 ){
		while( coordinate.length < 3 ){
			coordinate.push( fillValue )
		}
		return coordinate.toString()
	}

	/* ==========	WRITING THE MAIN XML MODEL COMPONENTS OF MORPHEUS =========== */

	writeDescription(){
		this.attachNode( "MorpheusModel", "Description" )
		this.attachNode( "Description", "Title",
			this.model.modelInfo.title )
		this.attachNode( "Description", "Details",
			this.model.modelInfo.desc )
	}

	writeGlobal(){
		this.attachNode( "MorpheusModel", "Global" )
	}

	writeSpace(){
		// Set <Space> tag and children
		this.attachNode( "MorpheusModel", "Space" )
		this.attachNode( "Space", "Lattice", undefined,
			{"class":this.model.grid.geometry } )
		this.attachNode( "Space", "SpaceSymbol", undefined,
			{symbol: "space" } )

		// Set the lattice properties.
		this.attachNode( "Lattice", "Size", undefined,
			{ symbol : "size",
				value : this.toMorpheusCoordinate( this.model.grid.extents ) } )
		this.attachNode( "Lattice", "Neighborhood" )

		if( typeof this.model.grid.neighborhood.order !== "undefined" ){
			this.attachNode( "Neighborhood", "Order",
				this.model.grid.neighborhood.order )
		} else if ( typeof this.model.grid.neighborhood.distance !== "undefined") {
			this.attachNode( "Neighborhood", "Distance",
				this.model.grid.neighborhood.distance )
		} else {
			this.conversionWarnings.grid.push( "Unknown neighborhood order; " +
				"reverting to default order 2 instead." )
			this.attachNode( "Neighborhood", "Order", 2 )
		}

		this.attachNode( "Lattice", "BoundaryConditions" )

		const dimNames = ["x","y","z"]
		const knownBounds = { periodic: true, noflux : true, constant: true }
		for( let d = 0; d < this.model.grid.boundaries.length; d++ ){
			let bType = this.model.grid.boundaries[d]
			if( !knownBounds.hasOwnProperty( bType ) ){

				this.conversionWarnings.grid.push(
					"Unknown boundary type : " + bType + "; setting to" +
					"default 'periodic' instead."
				)
				bType = "periodic"

			}
			this.attachNode( "BoundaryConditions", "Condition",
				undefined, { boundary: dimNames[d], type: bType } )
		}
	}

	writeTime(){
		this.attachNode( "MorpheusModel", "Time" )
		this.attachNode( "Time", "StartTime", undefined,
			{value: this.model.timeInfo.start } )
		this.attachNode( "Time", "StopTime", undefined,
			{value: this.model.timeInfo.stop } )

		if( typeof this.model.kinetics.seed !== "undefined" ){
			this.attachNode( "Time", "RandomSeed", undefined,
				{ value: this.model.kinetics.seed } )
		}

		this.attachNode( "Time", "TimeSymbol", undefined,
			{ symbol: "time" } )

	}

	writeCellTypes(){
		this.attachNode( "MorpheusModel", "CellTypes" )
		const ck = this.model.cellKinds

		for( let ki = 0; ki < ck.count; ki++ ){
			// Special case: background is always the first (index ki = 0 )
			if( ki === 0 ){
				this.attachNode( "CellTypes", "CellType", undefined,
					{ class : "medium", name : ck.index2name[ ki.toString() ] } )
			} else {
				this.attachNode( "CellTypes", "CellType", undefined,
					{ class : "biological", name : ck.index2name[ ki.toString() ] } )
			}
			this.cellTypeTagIndex[ this.model.getKindName( ki ) ] =
				this.xml.getElementsByTagName( "CellType" ).length - 1
		}
	}

	writeCPM(){
		this.attachNode( "MorpheusModel", "CPM" )

		this.attachNode( "CPM", "Interaction" )
		this.setAdhesion()

		this.attachNode( "CPM", "MonteCarloSampler", undefined,
			{stepper:"edgelist"})
		this.attachNode( "MonteCarloSampler" , "MCSDuration", undefined,
			{value:1})
		this.attachNode( "MonteCarloSampler", "Neighborhood" )
		let neighIndex = this.xml.getElementsByTagName("Neighborhood").length - 1
		this.attachNode( "Neighborhood", "Order", 2, {}, neighIndex )
		this.attachNode( "MonteCarloSampler", "MetropolisKinetics", undefined,
			{ temperature: this.model.kinetics.T } )
		this.attachNode( "CPM", "ShapeSurface", undefined,
			{scaling: "none" } )
		this.attachNode( "ShapeSurface", "Neighborhood" )
		neighIndex++
		this.attachNode( "Neighborhood", "Order", 2, {}, neighIndex )

	}

	writeConstraints(){
		const constraints = this.model.constraints.constraints
		for (let cName of Object.keys( constraints ) ){

			switch( cName ){

			case "Adhesion" :
				// is actually handled by this.writeCPM()
				break

			case "VolumeConstraint" :
				this.setVolumeConstraint( constraints[cName] )
				break

			case "PerimeterConstraint" :
				this.setPerimeterConstraint( constraints[cName] )
				break

			case "ActivityConstraint" :
				this.setActivityConstraint( constraints[cName] )
				break

			case "LocalConnectivityConstraint" :
				this.setConnectivityConstraint( constraints[cName], cName )
				break

			case "ConnectivityConstraint" :
				this.setConnectivityConstraint( constraints[cName], cName )
				break

			case "SoftConnectivityConstraint" :
				this.setConnectivityConstraint( constraints[cName], cName )
				break

			case "SoftLocalConnectivityConstraint" :
				this.setConnectivityConstraint( constraints[cName], cName )
				break

			case "BarrierConstraint" :
				this.setBarrierConstraint( constraints[cName] )
				break

			case "PersistenceConstraint" :
				this.setPersistenceConstraint( constraints[cName] )
				break

			case "PreferredDirectionConstraint" :
				this.setPreferredDirectionConstraint( constraints[cName] )
				break

			case "ChemotaxisConstraint" :
				this.setChemotaxisConstraint( constraints[cName] )
				break

			default :
				this.conversionWarnings.constraints.push( "Constraint :" +
					cName + " doesn't exist in Morpheus. Making the model anyway " +
					"without it; behaviour of the model may change so please " +
					"check manually for alternatives in Morpheus."
				)
			}

		}


	}

	multipleConstraintsWarning( constraintName ){
		this.conversionWarnings.constraints.push(
			"It appears as if your model has multiple constraints of type " +
			constraintName + "; ignoring all but the first."
		)
	}

	setAdhesion( ){
		if( this.model.constraints.constraints.hasOwnProperty("Adhesion")) {
			const JMatrix = this.model.constraints.constraints.Adhesion[0].J
			for (let ki = 0; ki < this.model.cellKinds.count; ki++) {
				for (let kj = 0; kj <= ki; kj++) {
					const j1 = JMatrix[ki][kj], j2 = JMatrix[kj][ki]
					if (!isNaN(j1) && (j1 !== j2)) {
						this.conversionWarnings.constraints.push(
							"Your adhesion matrix is not symmetrical, which is not" +
							"supported by Morpheus. Please check <Interaction> <Contact> values and " +
							"modify if required."
						)
					}
					let J = j1
					if (isNaN(J)) {
						J = 0
					}
					const iName = this.model.getKindName(ki)
					const jName = this.model.getKindName(kj)
					this.attachNode("Interaction", "Contact", undefined,
						{type1: iName, type2: jName, value: J})
				}
			}
		}
	}

	setVolumeConstraint( confArray ){
		if( confArray.length > 1 ){
			this.multipleConstraintsWarning( "VolumeConstraint" )
		}
		const conf = confArray[0]
		const lambda = conf.LAMBDA_V
		const target = conf.V

		for( let k = 0; k < lambda.length; k++ ){
			// only add constraint to CellType for which it is non-zero.
			if( lambda[k] > 0 ){
				const kName = this.model.getKindName(k)
				let constraintNode = this.makeNode( "VolumeConstraint",
					undefined, {target: target[k], strength: lambda[k]})
				this.addNodeTo( constraintNode, "CellType", this.cellTypeTagIndex[kName] )
			}
		}
	}

	setPerimeterConstraint( confArray ){
		if( confArray.length > 1 ){
			this.multipleConstraintsWarning( "PerimeterConstraint" )
		}
		const conf = confArray[0]
		const lambda = conf.LAMBDA_P
		const target = conf.P

		for( let k = 0; k < lambda.length; k++ ){
			// only add constraint to CellType for which it is non-zero.
			if( lambda[k] > 0 ){
				const kName = this.model.getKindName(k)
				let constraintNode = this.makeNode( "SurfaceConstraint",
					undefined, {mode: "surface", target: target[k], strength: lambda[k]})
				this.addNodeTo( constraintNode, "CellType", this.cellTypeTagIndex[kName] )
			}
		}
	}

	setActivityConstraint( confArray ){
		if( confArray.length > 1 ){
			this.multipleConstraintsWarning( "ActivityConstraint" )
		}
		const conf = confArray[0]
		const lambda = conf.LAMBDA_ACT
		const maximum = conf.MAX_ACT
		const actMean = conf.ACT_MEAN
		if( actMean !== "geometric" ){
			this.conversionWarnings.constraints.push( "You have an ActivityConstraint with" +
				" ACT_MEAN = 'arithmetic', but this is not supported in Morpheus. " +
				"Switching to 'geometric'. Behaviour may change slightly; please " +
				"check if this is a problem and adjust parameters if this is the case." )
		}

		for( let k = 0; k < lambda.length; k++ ){
			// only add constraint to CellType for which it is non-zero.
			if( lambda[k] > 0 ){
				const kName = this.model.getKindName(k)
				// Add the protrusion plugin to the celltype
				let constraintNode = this.makeNode( "Protrusion",
					undefined, {field: "act", maximum: maximum[k], strength: lambda[k]})
				this.addNodeTo( constraintNode, "CellType", this.cellTypeTagIndex[kName] )
				// We also need to add an activity Field to the <Global> tag.

				let actField = this.makeNode( "Field", undefined,
					{symbol: "act", value: "0", name: "actin-activity" } )
				let diff = this.makeNode( "Diffusion", undefined, {rate:"0"})
				actField.appendChild( diff )
				this.addNodeTo( actField, "Global" )
			}
		}

		this.fieldsToDraw.push( "act" )
	}

	setConnectivityConstraint( confArray, cName ){
		if( confArray.length > 1 ){
			this.multipleConstraintsWarning( "ConnectivityConstraint" )
		}
		const conf = confArray[0]

		// Hard constraint
		if( conf.hasOwnProperty( "CONNECTED" ) ){
			const conn = conf.CONNECTED

			for( let k = 0; k < conn.length; k++ ){
				if( conn[k] ){
					let constraintNode = this.makeNode( "ConnectivityConstraint" )
					this.addNodeTo( constraintNode, "CellType",
						this.cellTypeTagIndex[this.model.getKindName(k)] )
				}
			}
			if( cName === "LocalConnectivityConstraint" ){
				this.conversionWarnings.constraints.push( "Your artistoo " +
					"model has a LocalConnectivityConstraint, which is not " +
					"supported in Morpheus. Converting to the Morpheus " +
					"ConnectivityConstraint; behaviour may change slightly " +
					"so please check your model." )
			}
		}

		// Or the soft constraint
		else if ( conf.hasOwnProperty ( "LAMBDA_CONNECTIVITY" ) ){

			// add only to the cells for which it is non-zero.
			const lambda = conf.LAMBDA_CONNECTIVITY
			for( let k = 0; k < lambda.length; k++ ){
				if( lambda[k] > 0 ){
					let constraintNode = this.makeNode( "ConnectivityConstraint" )
					this.addNodeTo( constraintNode, "CellType",
						this.cellTypeTagIndex[this.model.getKindName(k)] )
				}
			}

			this.conversionWarnings.constraints.push( "Your artistoo " +
				"model has a " + cName + ", which is not " +
				"supported in Morpheus. Converting to the Morpheus " +
				"ConnectivityConstraint; this is a hard constraint so " +
				" behaviour may change slightly -- please check your model." )
		}

	}

	setBarrierConstraint( confArray ){
		if( confArray.length > 1 ){
			this.multipleConstraintsWarning( "BarrierConstraint" )
		}
		const conf = confArray[0]
		const barr = conf.IS_BARRIER

		// Add to cells for which it is set to true.
		for( let k = 0; k < barr.length; k++ ){
			if( barr[k] ){
				let constraintNode = this.makeNode( "FreezeMotion",
					undefined, { condition: "1"})
				this.addNodeTo( constraintNode, "CellType",
					this.cellTypeTagIndex[this.model.getKindName(k)] )
			}
		}
	}

	setPersistenceConstraint( confArray ){
		if( confArray.length > 1 ){
			this.multipleConstraintsWarning( "PersistenceConstraint" )
		}
		const conf = confArray[0]
		const lambda = conf.LAMBDA_DIR
		const dt = conf.DELTA_T || this.model.initCellKindVector(10)
		const prob = conf.PERSIST

		for( let k = 0; k < lambda.length; k++ ){
			// only add constraint to CellType for which it is non-zero.
			if( lambda[k] > 0 ){
				const kName = this.model.getKindName(k)
				let constraintNode = this.makeNode( "PersistentMotion",
					undefined, {decaytime: dt[k], strength: lambda[k]})
				this.addNodeTo( constraintNode, "CellType", this.cellTypeTagIndex[kName] )
				if( prob[k] !== 1 ){
					this.conversionWarnings.constraints.push( "Your model has a " +
						"PersistenceConstraint with PERSIST = " + prob[k] + ", but " +
						"Morpheus only supports PERSIST = 1. Reverting to this setting " +
						"instead, please check your model carefully." )
				}
			}
		}
	}

	setPreferredDirectionConstraint( confArray ){
		if( confArray.length > 1 ){
			this.multipleConstraintsWarning( "PreferredDirectionConstraint" )
		}
		const conf = confArray[0]
		const lambda = conf.LAMBDA_DIR
		const dir = conf.DIR

		for( let k = 0; k < lambda.length; k++ ){
			// only add constraint to CellType for which it is non-zero.
			if( lambda[k] > 0 ){
				const kName = this.model.getKindName(k)
				const direction = this.toMorpheusCoordinate( dir[k] )
				let constraintNode = this.makeNode( "DirectedMotion",
					undefined, {direction: direction, strength: lambda[k]})
				this.addNodeTo( constraintNode, "CellType", this.cellTypeTagIndex[kName] )
			}
		}

	}

	setChemotaxisConstraint( confArray ){

		for( let i = 0; i < confArray.length; i++ ){

			const conf = confArray[i]
			const index = i+1
			const fieldName = "U" + index

			const lambda = conf.LAMBDA_CH
			const field = conf.CH_FIELD

			// Warn for a CoarseGrid
			if( typeof field.upscale !== "undefined" && field.upscale !== 1 ){
				this.conversionWarnings.constraints.push(
					"Your ChemotaxisConstraint is linked to a 'CoarseGrid' with " +
					"a different resolution than the original CPM grid. This is not " +
					"supported in Morpheus. Adding a Field anyway, but you may have " +
					"to check and scale the diffusion rate."
				)
			}

			// Add the constraint to celltypes for which lambda nonzero.
			for( let k = 0; k < lambda.length; k++ ){
				if( lambda[k] > 0 ){
					const kName = this.model.getKindName(k)
					let constraintNode = this.makeNode( "Chemotaxis",
						undefined, {field: fieldName, strength: lambda[k]})
					this.addNodeTo( constraintNode, "CellType", this.cellTypeTagIndex[kName] )
				}
			}

			// For this to work, the concentration field 'U' needs to exist in 'global'.
			let fieldNode = this.makeNode( "Field", undefined,
				{symbol: fieldName, value : 0 } )
			let diffNode = this.makeNode( "Diffusion", undefined,
				{rate:0.1} )
			this.conversionWarnings.constraints.push( "Adding a ChemotaxisConstraint " +
				"with an attached field, but cannot find parameters like diffusion rate, " +
				"chemokine production rate, and decay rate automatically. Adding some " +
				"default values; please adapt these manually (by configuring constants " +
				"and properties under 'Global' and where " +
				"relevant under the 'CellTypes')" )
			fieldNode.appendChild( diffNode )
			this.addNodeTo( fieldNode, "Global" )

			// Also add the production/decay equation in a system
			let sysNode = this.makeNode( "System", undefined,
				{solver: "Euler [fixed, O(1)]", "time-step":1 } )
			let eqnNode = this.makeNode( "DiffEqn", undefined,
				{ "symbol-ref" : fieldName })
			let expr = "P" + index + " - d" + index +"*" + fieldName
			let exprNode = this.makeNode( "Expression", expr )
			eqnNode.appendChild( exprNode )
			sysNode.appendChild( eqnNode )

			// Add the constant degradation used in the equation
			let constNode = this.makeNode( "Constant", undefined,
				{ symbol: "d"+index, value : "0", name: "degradation "+fieldName } )
			sysNode.appendChild( constNode )

			// Add the production, space-dependent so use a field
			let productionField = this.makeNode( "Field", undefined,
				{"symbol": "P"+index, value : 0} )
			let eqn2Node = this.makeNode( "Equation", undefined,
				{ "symbol-ref" : "P"+index, name: "production "+fieldName })
			const randX = Math.floor( Math.random() * this.model.grid.extents[0] )
			const randY = Math.floor( Math.random() * this.model.grid.extents[1] )
			let expr2Node = this.makeNode( "Expression",
				"if( space.x == "+randX+" and space.y == "+randY+", 10, 0 )" )
			eqn2Node.appendChild( expr2Node )
			this.addNodeTo( eqn2Node, "Global" )
			this.addNodeTo( productionField, "Global" )
			this.addNodeTo( sysNode, "Global" )

			this.fieldsToDraw.push( fieldName )

		}



	}

	writeCellPopulations(){
		this.attachNode( "MorpheusModel", "CellPopulations" )

		let objects = {} // key for each kind, array of objects in InitCellObjects as value.
		let ID = 1

		for( let init of this.model.setup.init ){
			const k = init.kindName
			if( !objects.hasOwnProperty(k) ){ objects[k] = [] }

			switch( init.setter ){
			case "circleObject" :
				// objects added per cellkind below the loop.
				objects[k].push(this.makeNode("Sphere", undefined,
					{center: this.toMorpheusCoordinate( init.center ),
						radius: init.radius}))
				break

			case "boxObject" :
				// objects added per cellkind below the loop.
				objects[k].push(this.makeNode("Box", undefined,
					{origin: this.toMorpheusCoordinate( init.bottomLeft ),
						size: this.toMorpheusCoordinate( init.boxSize ) } ) )
				break

			case "cellCircle" : {
				let popNode = this.makeNode( "Population", undefined, {type:k } )
				let initNode = this.makeNode( "InitCircle",
					undefined, { mode: "random", "number-of-cells": init.nCells })
				let dimNode = this.makeNode( "Dimensions", undefined,
					{center : this.toMorpheusCoordinate( init.center ),
						radius: init.radius} )
				initNode.appendChild( dimNode )
				popNode.appendChild( initNode )
				this.addNodeTo( popNode, "CellPopulations" )
				break
			}

			case "pixelSet" : {
				let popNode = this.makeNode( "Population", undefined, {type:k } )
				let cellNode = this.makeNode( "Cell",
					undefined, { id: ID, name: ID })
				let ww = this
				let pixelList = init.pixels.map( function(p){
					return ww.toMorpheusCoordinate(p)
				} )
				let nodeNode = this.makeNode( "Nodes",
					pixelList.join(";") )
				ID++

				cellNode.appendChild( nodeNode )
				popNode.appendChild( cellNode )
				this.addNodeTo( popNode, "CellPopulations" )
				break
			}

			default :
				this.conversionWarnings.init.push( "Unknown initializer : " + init.setter +
				", ignoring; you may have to check the CellPopulations settings of your model" +
					"manually.")

			}
		}

		for( let k of Object.keys( objects ) ){

			if( objects[k].length > 0 ) {

				let popNode = this.makeNode("Population", undefined, {type: k})
				let initNode = this.makeNode("InitCellObjects",
					undefined, {mode: "distance"})


				let objArr = objects[k]
				for (let obj of objArr) {
					let arrNode = this.makeNode("Arrangement", undefined,
						{displacements: "0,0,0", repetitions: "1,1,1"})
					arrNode.appendChild(obj)
					initNode.appendChild(arrNode)
				}
				popNode.appendChild(initNode)
				this.addNodeTo(popNode, "CellPopulations")

			}
		}

	}

	writeAnalysis(){
		this.conversionWarnings.analysis.push(
			"Auto-conversion of plots and other output is not (yet) supported." +
			"Adding some default outputs, but please check and adjust these " +
			"manually."
		)
		this.attachNode( "MorpheusModel", "Analysis" )

		let gnuPlot = this.makeNode( "Gnuplotter", undefined, {"time-step":50} )
		gnuPlot.appendChild(
			this.makeNode( "Terminal", undefined, {name:"png"})
		)
		let plot = this.makeNode( "Plot" )
		plot.appendChild(
			this.makeNode( "Cells", undefined,
				{opacity:"0.2", value: "cell.type" })
		)

		// Plot the fields to draw
		for( let f of this.fieldsToDraw ){
			plot.appendChild( this.makeNode( "Field", undefined,
				{"symbol-ref": f } ) )
		}

		gnuPlot.appendChild( plot )
		this.addNodeTo( gnuPlot, "Analysis" )

	}

}

export default MorpheusWriter