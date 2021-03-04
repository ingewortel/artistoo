import ModelDescription from "./ModelDescription.js"


class MorpheusImport extends ModelDescription {

	constructor( config ){

		super( )

		this.xml = config.xml
		this.from = "a Morpheus model"
		this.build()

	}

	/* ==========	GENERAL HELPER FUNCTIONS =========== */

	readXMLTag( tag, xml, index = 0 ){
		if( typeof xml === "undefined" ){
			xml = this.xml
		}
		const tag2 = this.getXMLTag( tag, xml, index )
		if( typeof tag2 !== "undefined" ){
			return tag2.innerHTML
		}
		return undefined
	}

	getXMLTag( tag, xml, index = 0 ){
		if( typeof xml === "undefined" ){
			xml = this.xml
		}
		const tags = xml.getElementsByTagName( tag )
		if( tags.length === 0 ){
			return undefined
		}
		return tags[index]
	}

	readVectorAttribute( xml, attrName ){
		const attr = xml.getAttribute( attrName )
		return attr.split( "," ).map( function(x){
			return( parseInt(x) )
		})
	}

	readCoordinateAttribute( xml, attrName ){
		const vec = this.readVectorAttribute( xml, attrName )
		let outVec = []
		for( let d = 0; d < this.grid.ndim; d++ ){
			outVec.push( vec[d] )
		}
		return outVec
	}

	toCoordinate( string ){
		const vec = string.split( "," ).map( function(x){
			return( parseInt(x) )
		})
		let outVec = []
		for( let d = 0; d < this.grid.ndim; d++ ){
			outVec.push( vec[d] )
		}
		return outVec
	}

	/* ==========	MORPHEUS READER FUNCTIONS =========== */

	setModelInfo(){

		// Get title from XML
		const title = this.readXMLTag( "Title" )
		if( typeof title === "undefined" ) {
			this.conversionWarnings.modelInfo.push(
				"Could not find model title."
			)
		} else {
			this.modelInfo.title = title
		}

		// Get description from XML
		const desc = this.readXMLTag( "Details" )
		if( typeof desc === "undefined" ) {
			this.conversionWarnings.modelInfo.push(
				"Could not find a model description."
			)
		} else {
			this.modelInfo.desc = desc.toString()
		}

	}

	setTimeInfo(){

		const time = this.getXMLTag( "Time" )

		for( let time_ch of time.children ) {

			switch (time_ch.nodeName) {

			case "StartTime" :
				this.timeInfo.start = Number( time_ch.getAttribute("value") )
				break
			case "StopTime" :
				this.timeInfo.stop = Number( time_ch.getAttribute("value") )
				break
			case "RandomSeed" :
				this.kinetics.seed = parseInt( time_ch.getAttribute("value") )
				break
			case "TimeSymbol" :
				break
			default :
				this.conversionWarnings.time.push(
					"I don't know what to do with tag <" + time_ch.nodeName + "> in <Time>. Ignoring it."
				)
			}
		}
		this.timeInfo.duration = this.timeInfo.stop - this.timeInfo.start
		if( this.timeInfo.duration < 0 ){
			throw( "Error: I cannot go back in time; timeInfo.stop must be larger than timeInfo.start!")
		}
	}

	setGridInfo(){
		const space = this.getXMLTag( "Space" )
		for( let space_ch of space.children ){
			switch( space_ch.nodeName ) {
			case "Lattice" :
				this.readMorpheusLattice( space_ch )
				break
			case "SpaceSymbol" :
				break
			default :
				this.conversionWarnings.grid.push(
					"Tags of type <" + space_ch.nodeName + "> are currently not supported. " +
					"Ignoring it for now."
				)

			}
		}
	}

	readMorpheusLattice( lattice ){

		// this.grid.geometry and this.grid.ndim
		this.setGridGeometry( lattice.className )

		// declare some variables needed
		const boundLookup = { x : 0, y : 1, z : 2 }
		let order, bound, dimIndex, boundType


		// Read info in the lattice
		for( let lattice_ch of lattice.children ){

			switch( lattice_ch.nodeName ) {
			case "Size" :
				this.grid.extents = this.readCoordinateAttribute( lattice_ch, "value" )
				break
			case "Neighborhood" :
				for( let nn of lattice_ch.children ){
					switch( nn.nodeName ){
					case "Order" :
						order = parseInt( this.readXMLTag( "Order", lattice_ch ) )
						if( isNaN(order) ){
							this.conversionWarnings.grid.push(
								"Non-integer neighborhood order. Ignoring."
							)
						} else {
							this.grid.neighborhood.order = order
						}
						break
					case "Distance" :
						this.grid.neighborhood.distance = this.readXMLTag( "Distance", lattice_ch )
						break
					default:
						this.conversionWarnings.grid.push(
							"I don't know what to do with tag <" + nn.nodeName +
							"> in a <Neighborhood> of a <Space> <Lattice>. Ignoring."
						)

					}
				}
				break

			case "BoundaryConditions" :

				for( let nn of lattice_ch.children ) {
					switch (nn.nodeName) {
					case "Condition" :
						bound = nn.getAttribute("boundary")
						dimIndex = boundLookup[bound]
						boundType = nn.getAttribute("type")
						this.grid.boundaries[dimIndex] = boundType
						break

					default :
						this.conversionWarnings.grid.push(
							"I don't know what to do with tag <" + nn.nodeName +
							"> in the <BoundaryConditions> of a <Space> <Lattice>. Ignoring."
						)
					}
				}
				break

			case "Domain" :
				this.conversionWarnings.grid.push(
					"Your MorpheusModel has specified a <" + lattice_ch.nodeName + "> : \n\t\t\t" +
					lattice_ch.outerHTML + "\n" +
					"This is currently not supported, but you can mimic the behaviour " +
					"by adding a physical barrier using a BarrierConstraint; " +
					"e.g. see artistoo.net/examples/Microchannel.html."
				)
				break

			case "NodeLength" :
				this.conversionWarnings.grid.push(
					"Your MorpheusModel has specified a <" + lattice_ch.nodeName + "> : \n\t\t\t" +
					lattice_ch.outerHTML + "\n" +
					"This is currently not supported, so spatial scales in your model " +
					"are just measured in pixels. This shouldn't change behaviour as long as " +
					"(spatial) parameters are defined in units of pixels. Please check this."
				)
				break

			default :
				this.conversionWarnings.grid.push(
					"I don't know what to do with tag <" + lattice_ch.nodeName +
					"> in a <Space> <Lattice>. Ignoring."
				)
			}
		}
	}

	setCellKindNames(){

		// this counter will increase every time a new CellType is handled.
		let indexNonBackground = 1
		for( let ck of this.getXMLTag( "CellTypes" ).children ){
			if( ck.nodeName !== "CellType" ){
				this.conversionWarnings.cells.push(
					"Not expecting tag <" + ck.nodeName + "> inside CellTypes. Ignoring."
				)
			}
			const kind_class = ck.className
			const kind_name = ck.getAttribute( "name" )

			// special case for kind of class 'medium', the background;
			// this is always index 0 and there can be only one kind of this
			// class.
			if( kind_class === "medium" ){
				if( this.cellKinds.name2index.hasOwnProperty( kind_class ) ){
					throw( "There cannot be two CellTypes of class 'medium'! Aborting." )
				} else {
					// it gets index 0.
					this.cellKinds.name2index[ kind_class ] = 0
					this.cellKinds.index2name[ "0" ] = kind_class
				}
			} else if ( kind_class === "biological" ){
				if( this.cellKinds.name2index.hasOwnProperty( kind_name ) ){
					throw( "There cannot be two CellTypes with name '" + kind_name +
						"' Aborting." )
				} else {
					this.cellKinds.name2index[ kind_name ] = indexNonBackground
					this.cellKinds.index2name[ indexNonBackground.toString() ] = kind_name
				}
				indexNonBackground++

			} else {
				throw( "Don't know what to do with a CellType of class " + kind_class + ". Aborting." )
			}

			// Also extract any <Property> or <PropertyVector>
			if( !this.cellKinds.properties.hasOwnProperty( kind_name ) ){
				this.cellKinds.properties[ kind_name ] = {}
			}
			const props = ck.getElementsByTagName( "Property" )
			for( let p of props ){
				const propName = p.getAttribute( "symbol" )
				const propVal = p.getAttribute( "value" )
				this.cellKinds.properties[ kind_name ][ propName ] = propVal
			}
			const propVecs = ck.getElementsByTagName( "PropertyVector" )
			for( let pv of propVecs ){
				const propName = pv.getAttribute( "symbol" )
				const propVal = this.readCoordinateAttribute( pv, "value" )
				this.cellKinds.properties[ kind_name ][ propName ] = propVal
			}
		}

		// counter: number of cell kinds including medium/background.
		this.cellKinds.count = indexNonBackground
	}

	setCPMGeneral(){

		// Random Seed
		// Note that the random 'seed' in Morpheus is specified in <Time>,
		// and as such is handled by this.setTimeInfo().

		// Temperature
		const cpm = this.getXMLTag( "CPM" )
		for( let cpm_ch of cpm.children ) {
			switch( cpm_ch.nodeName ){
			case "Interaction" :
				this.setAdhesionMorpheus( cpm_ch )
				break

			case "ShapeSurface" :
				if( cpm_ch.getAttribute("scaling") !== "none" ){
					this.conversionWarnings.grid.push(
						"You are trying to use a ShapeSurface with scaling '" +
						cpm_ch.getAttribute("scaling") +
						"'. This is currently not supported in Artistoo; " +
						"Reverting to the default scaling = 'none' instead. You may have " +
						"to adapt parameters that involve cell-cell interfaces, such as " +
						"those of the CPM's Adhesion and Perimeter constraints."
					)
				}
				if( typeof this.readXMLTag( "Distance", cpm_ch ) !== "undefined" ){
					this.conversionWarnings.grid.push(
						"You are trying to use a ShapeSurface with neighborhood distance '" +
						this.readXMLTag( "Distance", cpm_ch ) +
						"'. This is currently not supported in Artistoo; " +
						"Reverting to the default Moore neighborhood instead. You may have " +
						"to adapt parameters that involve cell-cell interfaces, such as " +
						"those of the CPM's Adhesion and Perimeter constraints."
					)
				}
				if( this.readXMLTag( "Order", cpm_ch ) !== "2" ){
					this.conversionWarnings.grid.push(
						"You are trying to use a ShapeSurface with neighborhood order '" +
						this.readXMLTag( "Order", cpm_ch ) +
						"'. This is currently not supported in Artistoo; " +
						"Reverting to the default Moore neighborhood instead. You may have " +
						"to adapt parameters that involve cell-cell interfaces, such as " +
						"those of the CPM's Adhesion and Perimeter constraints."
					)
				}
				break

			case "MonteCarloSampler" : {
				const stepper = cpm_ch.getAttribute("stepper")
				if (stepper !== "edgelist") {
					this.conversionWarnings.kinetics.push(
						"Stepper '" + stepper + "' not supported. Switching to 'edgelist'."
					)
				}

				for (let nn of cpm_ch.children) {

					switch (nn.nodeName) {
					case "MetropolisKinetics": {

						const kineticAttr = nn.getAttributeNames()
						for (let k of kineticAttr) {
							switch (k) {
							case "temperature":
								this.kinetics.T = parseFloat(nn.getAttribute("temperature"))
								break
							default :
								this.conversionWarnings.kinetics.push(
									"Unknown attribute of < MetropolisKinetics >: " +
									k + ". Ignoring."
								)
							}
						}
						break
					}

					case "Neighborhood":

						for (let nnn of nn.children) {

							switch (nnn.nodeName) {
							case "Order": {
								const order = nnn.innerHTML
								if ( order !== "2" ) {
									this.conversionWarnings.grid.push(
										"Ignoring < Neighborhood > <Order> in <MetropolisKinetics>: "
										+ order + ". " +
										"Using default order 2 (Moore-neighborhood) instead.")
								}
								break
							}
							default :
								this.conversionWarnings.grid.push(
									"I don't understand what you mean with a neighborhood " +
									nnn.nodeName + ". Using the default (Moore) neighborhood instead."
								)
							}
						}
						break

					case "MCSDuration" :
						this.conversionWarnings.kinetics.push(
							"Ignoring unsupported tag <MCSDuration>; this should not change " +
							"behaviour of the model, but it means all time should be defined in units of MCS. " +
							"Please check if this is the case."
						)
						break

					default :
						this.conversionWarnings.kinetics.push(
							"Unknown child of < MonteCarloSampler >: <" +
							nn.nodeName + ">.")

					}
				}

				break
			}

			default :
				this.conversionWarnings.kinetics.push(
					"I don't know what to do with tag <" + cpm_ch.nodeName + ">. Ignoring it for now."
				)

			}
		}
	}

	setConstraints(){

		// Adhesion in Morpheus is stored under 'CPM' and is set by
		// setCPMGeneral().
		const ct = this.getXMLTag( "CellTypes" )

		for (let cc of ct.children ){

			const kindIndex = this.getKindIndex( cc.getAttribute("name") )

			// add constraints:
			for( let constraint of cc.children ){

				switch( constraint.nodeName ){

				case "VolumeConstraint" :
					this.setVolumeConstraintForKind( constraint, kindIndex )
					break

				case "SurfaceConstraint" :
					this.setPerimeterConstraintForKind( constraint, kindIndex )
					break

				case "Protrusion" :
					this.setActivityConstraintForKind( constraint, kindIndex )
					break

				case "ConnectivityConstraint" :
					this.setConnectivityConstraintForKind( constraint, kindIndex )
					break

				case "FreezeMotion":
					this.setBarrierConstraintForKind( constraint, kindIndex )
					break

				case "PersistentMotion" :
					this.setPersistenceConstraintForKind( constraint, kindIndex )
					break

				case "DirectedMotion" :
					this.setPreferredDirectionConstraintForKind( constraint, kindIndex )
					break

				case "Chemotaxis" :
					this.setChemotaxisConstraintForKind( constraint, kindIndex )
					break

				case "StarConvex":
					this.unknownConstraintWarning( constraint.nodeName )
					break

				case "Haptotaxis" :
					this.unknownConstraintWarning( constraint.nodeName )
					break

				case "LengthConstraint" :
					this.unknownConstraintWarning( constraint.nodeName )
					break

				case "Property" :
					// Properties are handled by this.setCellKindNames
					break

				case "PropertyVector" :
					// PropertyVectors are handled by this.setCellKindNames
					break

				default:
					this.conversionWarnings.cells.push(
						"I don't know what to do with <CellType> property <" +
						constraint.nodeName  + "> for cell " +
						cc.getAttribute("name") + ". Ignoring it. " )
				}

			}


		}

	}

	unknownConstraintWarning( constraintName ){
		this.conversionWarnings.constraints.push(
			"Constraint '" + constraintName +
			"' is currently not supported in Artistoo. +" +
			"I am ignoring it for now, but model behaviour may change. " +
			"Check out the online manual at https://artistoo.net/manual/custommodules.html " +
			"to implement your own, or choose a similar constraint from available options " +
			"https://artistoo.net/identifiers.html#hamiltonian"
		)
	}

	setGridConfiguration(){
		const pops = this.getXMLTag( "CellPopulations" )
		for( let p of pops.children ){

			// Check if this is a Population.
			if( p.nodeName !== "Population" ){
				this.conversionWarnings.init.push(
					"Unexpected tag <" + p.nodeName + "> inside <CellPopulations>. Ignoring."
				)
			}

			// Check which cellKind this population is of
			const kindName = p.getAttribute( "type" )


			// Handle the initialization depending on the type of child tags
			for( let p_ch of p.children ){

				switch( p_ch.nodeName ){

				case "Cell":
					this.setCellPixelList( p_ch, kindName )
					break

				case "InitCircle" :
					this.setInitCircle( p_ch, kindName )
					break

				case "InitCellObjects":
					this.setInitObjects( p_ch, kindName )
					break

					/*
				case "InitDistribute":
					this.setInitDistribute( p_ch, kindName )
					break

				case "InitHexLattice":
					this.setHexLattice( p_ch, kindName )
					break

				case "InitRectangle" :
					this.setInitRectangle (p_ch, kindName )
					break*/

				default: //InitProperty, InitVectorProperty, InitVoronoi, TIFFReader, InitPoissonDisc
					this.conversionWarnings.init.push(
						"Ignoring unsupported tag <" + p_ch.nodeName + "> inside " +
						"a <Population>."
					)
				}
			}
		}
	}

	/* ==========	MORPHEUS POPULATION READERS =========== */

	setInitObjects( initXML, kindName ){
		const mode = initXML.getAttribute( "mode" )
		this.conversionWarnings.init.push( "In InitCellObjects: attribute 'mode' currently not supported. " +
			"Ignoring mode = '" + mode + "' setting. " +
			"If conflicts arise during cell seeding, the pixel gets the value of the last cell" +
			" trying to occupy it. Adjust the script manually if this is not what you want.")

		const arr = initXML.getElementsByTagName( "Arrangement" )[0]
		const disp = this.readCoordinateAttribute( arr, "displacements" )
		const reps = this.readCoordinateAttribute( arr, "repetitions" )

		const obj = arr.children[0]

		for( let xi = 0; xi < reps[0]; xi++ ){
			const dx = xi*disp[0]
			for( let yi = 0; yi < reps[1]; yi++ ){

				const dy = yi*disp[1]
				if( this.grid.ndim === 3 ){
					for( let zi = 0; zi < reps[2]; zi++ ){

						const dz = zi*disp[2]
						this.addInitObject( [dx,dy,dz], obj, kindName )

					}
				} else {
					this.addInitObject( [dx,dy], obj, kindName )
				}
			}

		}
	}

	addInitObject( disp, objXML, kindName ) {

		const objType = objXML.nodeName
		const ndim = disp.length

		let pos

		switch (objType) {
		case "Sphere" : {
			// For a sphere, position is the center attribute; add the
			// displacement to that.
			pos = this.readCoordinateAttribute(objXML, "center")
			for (let d = 0; d < ndim; d++) {
				pos[d] += disp[d]
			}

			this.setup.init.push( {
				setter : "circleObject",
				kind : this.getKindIndex( kindName ),
				kindName : kindName,
				radius : parseFloat(objXML.getAttribute("radius")),
				center : pos
			} )
			break
		}

		case "Box" : {
			// For a box, position is the origin attribute; add the
			// displacement to that.
			pos = this.readCoordinateAttribute(objXML, "origin")
			for (let d = 0; d < ndim; d++) {
				pos[d] += disp[d]
			}

			// Read the box dimensions from the XML, this is the 'size' attribute.
			let boxSize = this.readCoordinateAttribute(objXML, "size")

			this.setup.init.push( {
				setter : "boxObject",
				kind : this.getKindIndex( kindName ),
				kindName : kindName,
				bottomLeft: pos,
				boxSize: boxSize
			} )
			break
		}

		default :
			this.conversionWarnings.init.push(
				"No method to seed an object of type " + objType + ". Ignoring."
			)
		}
	}

	setInitCircle( initXML, kindName ){

		let nCells

		// Get information from attributes
		for( let attr of initXML.getAttributeNames() ){
			switch( attr ){
			case "mode" :
				if( initXML.getAttribute( "mode" ) !== "random" ){
					this.conversionWarnings.init.push(
						"In InitCircle: 'mode' " + initXML.getAttribute( "mode" )  +
						" currently not supported. " +
						"Seeding cells randomly in the circle; to change this, define your own" +
						"initialization function as e.g. in " +
						"https://artistoo.net/examples/DirectedMotionLinear.html." )
				}
				break

			case "number-of-cells" :
				// get number of cells to seed
				nCells = initXML.getAttribute( "number-of-cells" )

				// in morpheus, this can also be a function -- but this is not supported. Check and warn.
				if( !isFinite( nCells ) ){
					this.conversionWarnings.init.push(
						"In InitCircle: it appears as if the number-of-cells attribute is " +
						"not a number but a function. Ignoring it for now. " +
						"Please change to a number or initialize the grid manually.")
				}
				break

			default :
				this.conversionWarnings.init.push(
					"Attribute " + attr + " in <InitCircle> currently not " +
					"supported; ignoring it for now." )

			}
		}

		// Get the dimensions
		for( let ch of initXML.children ){
			switch( ch.nodeName ){
			case "Dimensions" :
				this.addInitCircle( ch, kindName, nCells )
				break

			default :
				this.conversionWarnings.init.push(
					"In <InitCircle> I don't know what to do with " +
					"tag <" + ch.nodeName + ">. Ignoring it." )
			}
		}


	}

	addInitCircle( initXML, kindName, nCells ){
		let center, radius

		for( let attr of initXML.getAttributeNames() ){

			switch( attr ){
			case "center" : {

				center = this.readCoordinateAttribute( initXML, "center" )

				// check if it's an array of numbers and correct dimensions so that
				// position has 2 coordinates for 2D grids.
				for (let d = 0; d < this.grid.ndim; d++) {
					if (!isFinite(center[d])) {
						this.conversionWarnings.init.push(
							"In <InitCircle> <Dimensions>, 'center' does not appear to be a numeric vector:" +
							"center = " + center + ". Ignoring it for now."
						)
						return
					}
				}
				break
			}

			case "radius" :
				radius = parseInt( initXML.getAttribute( "radius" ) )
				if( !isFinite(radius) ){
					this.conversionWarnings.init.push(
						"In <InitCircle> <Dimensions>, 'radius' does not appear to be a number:" +
						"radius = " + radius + ". Ignoring it for now." )
					return
				}
				break

			default :
				this.conversionWarnings.init.push(
					"In <InitCircle> <Dimensions>, I don't know what to do with attribute " +
					attr + ". Ignoring." )

			}
		}

		if( typeof center === "undefined" || typeof radius === "undefined" ){
			this.conversionWarnings.init.push(
				"In <InitCircle> <Dimensions>, I cannot find a 'center' or a " +
				"'radius'. Ignoring." )
			return
		}


		// If we get here, we have both center and radius now.
		this.setup.init.push( {
			setter : "cellCircle",
			kind : this.getKindIndex( kindName ),
			kindName : kindName,
			radius : radius,
			center : center,
			nCells : nCells
		} )

	}

	setCellPixelList( cellXML, kindName ){

		const kindIndex = this.getKindIndex( kindName )
		const cid = cellXML.getAttribute( "id" )
		let pixels = []
		for( let n of cellXML.children ){
			if( n.nodeName !== "Nodes" ){
				this.conversionWarnings.init.push(
					"Ignoring unexpected tag <" + n.nodeName + "> inside a " +
					"<Population><Cell>."
				)
			} else {
				pixels.push( this.toCoordinate( n.innerHTML ) )
			}
		}

		this.setup.init.push( {
			setter : "pixelSet",
			kind : kindIndex,
			kindName : kindName,
			cid : cid,
			pixels : pixels
		} )

	}


	/* ==========	MORPHEUS CONSTRAINT READERS =========== */

	parameterFromXML( constraintXML, paramName, kindIndex, pType = "int" ){

		let par = constraintXML.getAttribute( paramName )
		const kindName = this.getKindName( kindIndex )

		let parser
		if( pType === "int" ){
			parser = parseInt
		} else if (pType === "float" ){
			parser = parseFloat
		} else {
			throw ( "Unknown type of parameter : " + pType )
		}

		if( !isNaN( parser(  par ) ) ){
			par = parser( par )
		} else {
			// try if it is the name of one of the defined symbols.
			if( this.cellKinds.properties[ kindName ].hasOwnProperty( par ) ){
				par = parser( this.cellKinds.properties[ this.getKindName( kindIndex ) ][ par ] )
			}
		}

		// Check if now okay, otherwise set to 0 and add a warning.
		if( isNaN( parser( par ) ) ){
			this.conversionWarnings.constraints.push(
				"Failed to interpret parameter " + paramName + " in " +
				constraintXML.nodeName + " for cellKind " + kindName +
				". For now, this is set to 0; please correct manually."
			)
			return 0
		}
		return parser( par )

	}

	setAdhesionMorpheus( interactionXML ){

		let defValue = NaN, negative = false
		if( interactionXML.hasAttribute("default" ) ){
			defValue = parseFloat( interactionXML.getAttribute( "default" ) )
		}
		if( interactionXML.hasAttribute("negative" ) ){
			negative = ( interactionXML.getAttribute( "negative" ) === "true" )
		}

		let J = this.initCellKindMatrix( defValue )

		for( let contact of interactionXML.children ){
			// Check if child is indeed a contact energy
			if( contact.nodeName !== "Contact" ){
				this.conversionWarnings.constraints.push( "I don't know what to do with a tag <" +
					contact.nodeName + "> inside the Adhesion <Interactions>. Ignoring. " )
				break
			}

			// Get the types and convert to the corresponding number using the 'cellTypes' object used above
			const type1 = this.getKindIndex( contact.getAttribute( "type1" ) )
			const type2 = this.getKindIndex( contact.getAttribute( "type2" ) )
			const energy = contact.getAttribute( "value" )
			let energyNum = parseFloat( energy )
			if( isNaN(energyNum) ){
				this.conversionWarnings.constraints.push( "Contact energy value '" +
					energy.toString() + "' inside Adhesion < Interactions > " +
					"seems not to be a number and will be ignored.")
			}

			// set the value symmetrically
			if( negative ){ energyNum = -energyNum }
			J[type1][type2] = energyNum
			J[type2][type1] = energyNum
		}

		// Add the adhesion constraint to the model description.
		this.addConstraint( "Adhesion", { J : J } )


	}

	setVolumeConstraintForKind( constraintXML, kindIndex ){

		if( !this.hasConstraint( "VolumeConstraint" ) ){
			this.addConstraint( "VolumeConstraint", {
				V : this.initCellKindVector( 0 ),
				LAMBDA_V : this.initCellKindVector( 0 )
			})
		}
		const vol = this.parameterFromXML( constraintXML,
			"target", kindIndex,  "int" )
		const lambda = this.parameterFromXML( constraintXML,
			"strength", kindIndex,  "float" )

		this.getConstraintParameter( "VolumeConstraint",
			"V" )[kindIndex] = vol
		this.getConstraintParameter( "VolumeConstraint",
			"LAMBDA_V" )[kindIndex] = lambda

	}

	setPerimeterConstraintForKind( constraintXML, kindIndex ){

		if( !this.hasConstraint( "PerimeterConstraint" ) ){
			this.addConstraint( "PerimeterConstraint", {
				P : this.initCellKindVector( 0 ),
				LAMBDA_P : this.initCellKindVector( 0 ),
				mode : "surface"
			})
		}

		// Get info from XML object
		let perimeter, lambda, mode
		for( let att of constraintXML.getAttributeNames() ) {
			switch (att) {
			case "mode":
				mode = constraintXML.getAttribute( "mode" )
				break

			case "target" :
				perimeter = this.parameterFromXML( constraintXML,
					"target", kindIndex,  "float" )
				break

			case "strength":
				lambda = this.parameterFromXML( constraintXML,
					"strength", kindIndex,  "float" )
				break

			default :
				this.conversionWarnings.constraints.push(
					"Ignoring unsupported attribute '" + att +
					"' of the < SurfaceConstraint >")

			}
		}

		// Set (converted) values.
		this.getConstraintParameter( "PerimeterConstraint",
			"P" )[kindIndex] = perimeter
		this.getConstraintParameter( "PerimeterConstraint",
			"LAMBDA_P" )[kindIndex] = lambda
		this.getConstraint( "PerimeterConstraint" ).mode = mode

	}

	setActivityConstraintForKind( constraintXML, kindIndex ){

		if( !this.hasConstraint( "ActivityConstraint" ) ){
			this.addConstraint( "ActivityConstraint", {
				MAX_ACT : this.initCellKindVector( 0 ),
				LAMBDA_ACT : this.initCellKindVector( 0 ),
				ACT_MEAN : "geometric"
			})
		}

		const lambda = this.parameterFromXML( constraintXML,
			"strength", kindIndex,  "float" )
		const max = this.parameterFromXML( constraintXML,
			"maximum", kindIndex,  "float" )

		this.getConstraintParameter( "ActivityConstraint",
			"MAX_ACT" )[kindIndex] = max
		this.getConstraintParameter( "ActivityConstraint",
			"LAMBDA_ACT" )[kindIndex] = lambda
	}

	setConnectivityConstraintForKind( constraintXML, kindIndex ){
		if( !this.hasConstraint( "LocalConnectivityConstraint" ) ){
			this.addConstraint( "LocalConnectivityConstraint", {
				CONNECTED : this.initCellKindVector( false ),
			})
		}

		this.getConstraintParameter( "LocalConnectivityConstraint",
			"CONNECTED" )[kindIndex] = true

	}

	setBarrierConstraintForKind( constraintXML, kindIndex ){

		if( !this.hasConstraint( "BarrierConstraint" ) ){
			this.addConstraint( "BarrierConstraint", {
				IS_BARRIER : this.initCellKindVector( false ),
			})
		}

		this.getConstraintParameter( "BarrierConstraint",
			"IS_BARRIER" )[kindIndex] = true

		// The Morpheus <FreezeMotion> has an optional attribute/child 'Condition',
		// which Artistoo doesn't have. It defaults to true, but for anything different
		// the behaviour will be different; issue a warning.
		for( let ch of constraintXML.children ){
			if( ch.nodeName === "Condition" ){
				if( this.readXMLTag( "Condition", constraintXML ) !== "1" ){
					this.conversionWarnings.constraints.push(
						"Converting a <FreezeMotion> constraint to an Artistoo 'BarrierConstraint', but " +
						"don't know how to handle a <Condition> other than '1'. Ignoring Condition.")
				}
			} else {
				this.conversionWarnings.constraints.push(
					"I don't know what to do with <" + ch.nodeName +
					"> in a <FreezeMotion> constraint. Ignoring.")
			}
		}
		for( let ch of constraintXML.getAttributeNames() ){
			if( ch === "condition" ){
				if( constraintXML.getAttribute( "condition" ) !== "1" ){
					this.conversionWarnings.constraints.push(
						"Converting a <FreezeMotion> constraint to an Artistoo 'BarrierConstraint', but " +
						"don't know how to handle a <Condition> other than '1'. Ignoring Condition.")
				}
			} else {
				this.conversionWarnings.constraints.push(
					"I don't know what to do with property '" + ch +
					"' in a <FreezeMotion> constraint. Ignoring.")
			}
		}


	}

	setPersistenceConstraintForKind( constraintXML, kindIndex ){
		if( !this.hasConstraint( "PersistenceConstraint" ) ){
			this.addConstraint( "PersistenceConstraint", {
				DELTA_T : this.initCellKindVector( 0 ),
				LAMBDA_DIR : this.initCellKindVector( 0 ),
				// Morpheus doesn't have this param and just uses the default 1.
				PERSIST : this.initCellKindVector( 1 ),
				PROTRUDE : this.initCellKindVector( true ),
				RETRACT : this.initCellKindVector( false )
			})
		}

		const dt = this.parameterFromXML( constraintXML,
			"decay-time", kindIndex,  "int" )
		const lambda = this.parameterFromXML( constraintXML,
			"strength", kindIndex, "float" )


		// Two other params specified in morpheus
		let protrude = constraintXML.getAttribute( "protrusion" )
		if( typeof protrude === undefined ){
			protrude = true
		} else {
			protrude = ( protrude === "true" )
		}
		let retract = constraintXML.getAttribute( "retraction" )
		if( typeof retract === undefined ){
			retract = false
		} else {
			retract = ( retract === "true" )
		}

		this.getConstraintParameter( "PersistenceConstraint",
			"DELTA_T" )[kindIndex] = dt
		this.getConstraintParameter( "PersistenceConstraint",
			"LAMBDA_DIR" )[kindIndex] = lambda
		this.getConstraintParameter( "PersistenceConstraint",
			"PROTRUDE" )[kindIndex] = protrude
		this.getConstraintParameter( "PersistenceConstraint",
			"RETRACT" )[kindIndex] = retract
	}

	setPreferredDirectionConstraintForKind( constraintXML, kindIndex ){
		if( !this.hasConstraint( "PreferredDirectionConstraint" ) ){
			this.addConstraint( "PreferredDirectionConstraint", {
				DIR : this.initCellKindVector( this.initDimensionVector(0) ),
				LAMBDA_DIR : this.initCellKindVector( 0 ),
				PROTRUDE : this.initCellKindVector( true ),
				RETRACT : this.initCellKindVector( false )
			})
		}

		const kindName = this.getKindName( kindIndex )
		const dirSymbol = constraintXML.getAttribute( "direction" )
		let dir = undefined
		if( this.cellKinds.properties[kindName].hasOwnProperty( dirSymbol ) ){
			// read value of this parameter
			dir = this.cellKinds.properties[kindName][dirSymbol]
		}
		let lambdaDir = this.parameterFromXML( constraintXML,
			"strength", kindIndex,  "float" )

		// Two other params specified in morpheus
		let retract = constraintXML.getAttribute( "retraction" )
		if( typeof retract === undefined ){
			retract = false
		} else {
			retract = ( retract === "true" )
		}
		let protrude = constraintXML.getAttribute( "protrusion" )
		if( typeof protrude === undefined ){
			protrude = true
		} else {
			protrude = ( protrude === "true" )
		}

		this.getConstraintParameter( "PreferredDirectionConstraint",
			"DIR" )[kindIndex] = dir
		this.getConstraintParameter( "PreferredDirectionConstraint",
			"LAMBDA_DIR" )[kindIndex] = lambdaDir
		this.getConstraintParameter( "PreferredDirectionConstraint",
			"PROTRUDE" )[kindIndex] = protrude
		this.getConstraintParameter( "PreferredDirectionConstraint",
			"RETRACT" )[kindIndex] = retract
	}
}


export default MorpheusImport