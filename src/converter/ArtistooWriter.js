import Writer from "./Writer.js"

class ArtistooWriter extends Writer {

	constructor( model, config ){
		super( model, config )

		this.mode = config.mode || "html"
		this.out = ""
		this.modelconfig = {}
		this.custommethods = {}
		this.methodDeclarations = ""



		this.FPSMeterPath = config.FPSMeterPath || "https://artistoo.net/examples/fpsmeter.min.js"
		this.browserLibrary = config.browserLibrary || ".artistoo.js" // "https://artistoo.net/examples/artistoo.js"
		this.nodeLibrary = config.nodeLibrary || "https://raw.githubusercontent.com/ingewortel/artistoo/master/build/artistoo-cjs.js"
		this.styleSheet = config.styleSheet || "./modelStyle.css"

		this.logString = "Hi there! Converting " + this.model.from + " to Artistoo...\n\n"

	}

	write(){
		if( this.mode === "html" ){
			//console.log( this.writeHTML() )
			this.target.innerHTML = this.writeHTML()
		}
		this.writeLog()
	}


	writeHTML(){
		return this.writeHTMLHead() +
			this.writeConfig() +
			this.setInitialisation() +
			this.customMethodsString() +
			this.writeBasicScript() +
			this.writeHTMLBody()
	}

	writeNode(){
		return "let CPM = require(\"../../build/artistoo-cjs.js\")" +
			this.writeConfig() +
			this.writeBasicScript()
	}

	writeHTMLHead( ){

		let string = "<html lang=\"en\"><head><meta http-equiv=\"Content-Type\" " +
			"content=\"text/html; charset=UTF-8\">\n" +
			"\t<title>" + this.model.modelInfo.title + "</title>\n"+
			"\t<link rel=\"stylesheet\" href=\"" + this.styleSheet + "\" />" +
			/*"\t<style type=\"text/css\">\n" +
			"\t\t body{\n"+
			"\t\t\t font-family: \"HelveticaNeue-Light\", \"Helvetica Neue Light\", \"Helvetica Neue\", " +
			"Helvetica, Arial, \"Lucida Grande\", sans-serif; \n" +
			"\t\t\t padding : 15px; \n" +
			"\t\t} \n" +
			"\t\t td { \n" +
			"\t\t\t padding: 10px; \n" +
			"\t\t\t vertical-align: top; \n" +
			"\t\t } \n" +
			"\t </style> \n" +*/
			"\t" + "<script src=\"" + this.browserLibrary + "\"></script> \n" + //'\t <script src="https://artistoo.net/examples/artistoo.js"></script> \n' +
			"\t" + "<script src=\"" + this.FPSMeterPath + "\"></script> \n\n" +
			"<script> \n\n\n" +
			"\"use strict\" \n" +
			"var sim, meter \n\n"

		return(string)

	}

	writeHTMLBody(){

		let modelDesc = this.model.modelInfo.desc
		modelDesc = this.htmlNewLine( modelDesc )

		return "</script> \n\n" +
			"</head>\n" +
			"<body onload=\"initialize();parent.window.model = sim\"> \n" +
			"<h1>"+this.model.modelInfo.title + "</h1> \n"+
			"<p>\n\t" + modelDesc + "\n" +
			"</p>\n" +
			"</body> \n" +
			"</html>"

	}

	writeConfig(){
		this.setModelConfig()
		return "let config = " + this.objToString( this.modelconfig ) + "\n\n"
	}

	customMethodsString(){
		let string = "let custommethods = {\n"
		for( let m of Object.keys( this.custommethods ) ){
			string += "\t" + m + " : " + m + ",\n"
		}
		return string + "}"
	}

	/* TO DO */
	setModelConfig(){

		// Initialize structure
		let config = {
			conf : {},
			simsettings : {
				zoom : 2,
				CANVASCOLOR : "EEEEEE"
			}
		}

		// Time information; warn if start time != 0
		if( this.model.timeInfo.start !== 0 ){
			this.conversionWarnings.time.push(
				"Morpheus model time starts at t = " + this.model.timeInfo.start +
				". Interpreting time before that as a burnin time, but in Artistoo " +
				" time will restart at t = 0 after this burnin."
			)
		}
		config.simsettings.BURNIN = parseInt( this.model.timeInfo.start )
		config.simsettings.RUNTIME = parseInt( this.model.timeInfo.duration )
		config.simsettings.RUNTIME_BROWSER = parseInt( this.model.timeInfo.duration )

		// Grid information, warn if grid has to be converted.
		config.ndim = this.model.grid.ndim
		config.field_size = this.model.grid.extents
		if( this.model.grid.geometry === "hexagonal" ){
			this.conversionWarnings.grid.push(
				"Grid of type 'hexagonal' is not yet supported in Artistoo. " +
				"Converting to square 2D lattice instead. You may have to adjust some parameters, " +
				"especially where neighborhood sizes matter (eg PerimeterConstraint, Adhesion)."
			)
		}
		config.torus = []
		const dimNames = ["x","y","z"]
		for( let d = 0; d < config.ndim; d++ ){
			const bound = this.model.grid.boundaries[d]
			switch( bound ){
			case "periodic" :
				config.torus.push( true )
				break
			case "noflux" :
				config.torus.push( false )
				break
			default :
				config.torus.push( true )
				this.conversionWarnings.grid.push(
					"unknown boundary condition in " + dimNames[d] + "-dimension: " +
					bound + "; reverting to default periodic boundary."
				)
			}

			// special case for "linear" geometry, which in Artistoo is just
			// a 2D grid with a field_size [x,1] and torus = [x, false].
			if( this.model.grid.geometry === "linear" ){
				config.torus[1] = false
			}
		}
		if( !isNaN( this.model.grid.neighborhood.distance ) ){
			this.conversionWarnings.grid.push(
				"You are trying to set a neighborhood with distance = " +
				this.model.grid.neighborhood.distance + ", " +
				"but this is currently not supported in Artistoo. Reverting to" +
				"default (Moore) neighborhood; behaviour may change."
			)
		}
		if( !isNaN( this.model.grid.neighborhood.order ) &&  this.model.grid.neighborhood.order !== 2 ){
			this.conversionWarnings.grid.push(
				"You are trying to set a neighborhood with order = " +
				this.model.grid.neighborhood.order + ", " +
				"but this is currently not supported in Artistoo. Reverting to" +
				"default (Moore) neighborhood; behaviour may change."
			)
		}

		// CPM kinetics
		config.conf.T = this.model.kinetics.T
		config.conf.seed = this.model.kinetics.seed

		this.modelconfig = config

		// CellKinds
		config.simsettings.NRCELLS = this.model.initCellKindVector( 0, false )
		config.simsettings.SHOWBORDERS = this.model.initCellKindVector( true, false )
		config.simsettings.CELLCOLOR = this.model.initCellKindVector( "333333", false )
		for( let k = 1; k < this.model.cellKinds.count - 1; k++ ){
			// Overwrite cellcolors for all kinds except the first with a
			// randomly generated color.
			config.simsettings.CELLCOLOR[k] =
				Math.floor(Math.random()*16777215).toString(16).toUpperCase()
		}

		// Constraints
		// First constraints that can go in the main conf object (via auto-adder)
		let constraintString = ""
		for( let cName of Object.keys( this.model.constraints.constraints ) ){
			const constraintArray = this.model.constraints.constraints[cName]
			for( let ci = 0; ci < constraintArray.length; ci++ ){
				const constraintConf = constraintArray[ci]
				constraintString += this.addConstraintToConfig( cName, constraintConf )
			}
		}
		if( constraintString !== "" ){
			this.addCustomMethod( "addConstraints", "", constraintString )
		}
	}

	addCustomMethod( methodName, args, contentString ){
		if( this.custommethods.hasOwnProperty( methodName ) ){
			throw( "Cannot add two custom methods of the same name!" )
		}
		this.custommethods[methodName] = methodName
		this.methodDeclarations += "function " + methodName + "( " + args + "){\n\n\t" +
			contentString + "\n}\n\n"
	}

	addConstraintToConfig( cName, cConf ){

		const autoAdded = {
			ActivityConstraint : true,
			Adhesion : true,
			VolumeConstraint : true,
			PerimeterConstraint : true,
			BarrierConstraint : true
		}

		// Constraints that can be directly added to config.conf:
		if( autoAdded.hasOwnProperty(cName) ) {
			for (let parameter of Object.keys(cConf)) {
				this.modelconfig.conf[parameter] = cConf[parameter]
			}

			// ActivityConstraint special case; set ACTCOLOR
			if (cName === "ActivityConstraint") {
				// check which kinds have activity; skip background
				let hasAct = []
				for (let k = 1; k < this.model.cellKinds.count; k++) {
					if (cConf.LAMBDA_ACT[k] > 0 && cConf.MAX_ACT[k] > 0) {
						hasAct.push(true)
					} else {
						hasAct.push(false)
					}
				}
				this.modelconfig.simsettings.ACTCOLOR = hasAct
			}

			// Another special case for the PerimeterConstraint, which may
			// have to be converted depending on 'mode' and the 'ShapeSurface'.
			else if (cName === "PerimeterConstraint") {
				switch (cConf.mode) {
				case "surface" :
					// do nothing
					break
				case "aspherity" : {
					// correct the 'target' perimeter.
					let P = cConf.P
					const volume = this.modelconfig.conf.V
					for (let i = 0; i < P.length; i++) {
						if (this.modelconfig.ndim === 2) {
							P[i] = 4 * P[i] * 2 * Math.sqrt(volume[i] * Math.PI)
						} else if (this.modelconfig.ndim === 3) {
							P[i] = P[i] * 4 * Math.PI * Math.pow((3 / 4) * volume[i] / Math.PI, 2 / 3)
						}
						P[i] = parseFloat(P[i])
					}
					this.conversionWarnings.constraints.push(
						"Artistoo does not support the 'aspherity' mode of the Morpheus <SurfaceConstraint>." +
						"Adding a regular PerimeterConstraint (mode 'surface') instead. I am converting the " +
						"target perimeter with an educated guess, but behaviour may be slightly different; " +
						"please check parameters."
					)

					this.modelconfig.conf.P = P
					break
				}

				}
				delete this.modelconfig.conf.mode
			}

			return ""
		}

		// For the other constraints, add them by overwriting the
		// Simulation.addConstraints() method. Return the string of code
		// to add in this method.
		const otherSupportedConstraints = {
			LocalConnectivityConstraint : true,
			PersistenceConstraint : true,
			PreferredDirectionConstraint : true,
			ChemotaxisConstraint : true
		}

		if( !otherSupportedConstraints[cName] ){
			this.conversionWarnings.constraints.push(
				"Ignoring unknown constraint of type " + cName + ". Behaviour may change.")
		}

		// Special case for the PersistenceConstraint: warn if
		// protrusion/retraction setting does not correspond.
		if (cName === "PersistenceConstraint" || cName === "PreferredDirectionConstraint" ){
			const protrude = cConf.PROTRUDE
			const retract = cConf.RETRACT
			const lambda = cConf.LAMBDA_DIR

			let warn = false
			for( let k = 0; k < protrude.length; k++ ){

				if( lambda[k] > 0 ) {

					if (!protrude[k]) {
						warn = true
					}
					if (retract[k]) {
						warn = true
					}
					if (warn) {
						this.conversionWarnings.constraints.push(
							"You are trying to set a PersistenceConstraint for cellkind " +
							this.model.getKindName(k) + " with protrusion = " +
							protrude[k] + " and retraction = " + retract[k] + ", but Artistoo " +
							"only supports protrusion = true and retraction = false. " +
							"Reverting to these settings. Behaviour may change slightly; " +
							"if this is important, consider implementing your own constraint."
						)
					}
				}
			}
			delete cConf.PROTRUDE
			delete cConf.RETRACT
		}

		return "this.C.add( new CPM." + cName + "( " + this.objToString( cConf, 1 ) + ") )\n\n\t"

	}

	writeBasicScript(){

		return "\n\n" +
			"function initialize(){ \n" +
			"\t" + "sim = new CPM.Simulation( config, custommethods ) \n" +
			"\t" + "meter = new FPSMeter({left:\"auto\", right:\"5px\"}) \n\n"+
			"\t" + "step() \n" +
			"} \n\n" +
			"function step(){ \n\t" +
			"sim.step() \n\t" +
			"meter.tick() \n\n\t" +
			"if( sim.conf[\"RUNTIME_BROWSER\"] == \"Inf\" | sim.time+1 < sim.conf[\"RUNTIME_BROWSER\"] ){ \n\t" +
			"\t\t" + "requestAnimationFrame( step ) \n" +
			"\t} \n}\n\n" + this.methodDeclarations

	}

	setInitialisation(){
		// Initializers
		let initString = ""
		for( let initConf of this.model.setup.init ){
			initString += this.addInitializer( initConf )
		}
		if( initString !== "" ){
			initString = "" + "this.addGridManipulator()\n\n" + initString
			this.addCustomMethod( "initializeGrid", "", initString )
		}
		return ""
	}

	addInitializer( conf ){

		const kindIndex = conf.kind
		switch( conf.setter ){

		case "circleObject" :
			return "\t" + "this.gm.assignCellPixels( this.gm.makeCircle( [" +
				conf.center.toString() + "], " + conf.radius +  ") , " + kindIndex + " )\n"

		case "boxObject" :
			return "\t" + "this.gm.assignCellPixels( this.gm.makeBox( [" +
				conf.bottomLeft.toString() + "], [" + conf.boxSize.toString() +
				"] ) , " + kindIndex + " )\n"

		case "cellCircle" :
			return "\t" + "this.gm.seedCellsInCircle( " + kindIndex + ", " +
				conf.nCells + ", [" + conf.center.toString() + "], " +
				conf.radius + " )\n"

		case "pixelSet" : {
			let out = "[\n\t\t"
			for (let i = 0; i < conf.pixels.length; i++ ) {
				const p = conf.pixels[i]
				out += "[" + p.toString() + "]"
				if( i < conf.pixels.length - 1 ){ out += "," }
			}
			return "\t" + "this.gm.assignCellPixels( " + out +
				" ], " + kindIndex + ")\n"

		}

		default :
			this.conversionWarnings.init.push( "Unknown initializer "
			+ conf.setter + "; ignoring." )
		}

	}

}

export default ArtistooWriter
