import ModelDescription from "./ModelDescription.js"
import PixelsByCell from "../stats/PixelsByCell.js"

class ArtistooImport extends ModelDescription {

	constructor( model ) {

		super()

		if( model.isCPM ){
			this.C = model
			this.simsettings = {}
			this.mode = "CPM"
		} else if ( model.isSimulation ){
			this.sim = model
			this.C = model.C
			this.simsettings = model.conf
			this.mode = "Simulation"
		} else {
			throw("Model must be a CPM or Simulation object!")
		}

		this.from = "an Artistoo model (" + this.mode + " class)"
		this.generalWarning += "\nWarning: cannot automatically convert an entire " +
			"Artistoo script. This converter handles anything in the configuration " +
			"object of your " + this.mode + ", such as spatial settings, time settings " +
			"and CPM parameters. It also handles the initial configuration. But " +
			"if you perform extra actions between steps " +
			"(such as dividing cells, killing cells, producing chemokines, etc.)," +
			" these are not automatically added to the converted model. " +
			"Please check your script manually for such actions; they should be " +
			"added manually in the destination framework (please consult that framework's " +
			"documentation to see how).\n\n"


		this.build()
	}


	setModelInfo(){
		this.modelInfo.title = "ArtistooImport"
		this.modelInfo.desc = "Please add a description of your model here."
		this.conversionWarnings.modelInfo.push(
			"Cannot set model title and description automatically from an HTML page; " +
			"please add these manually to your model."
		)
	}

	setTimeInfo(){


		this.timeInfo.start = 0
		if( this.simsettings.hasOwnProperty("BURNIN") ){
			this.timeInfo.start += this.simsettings["BURNIN"]
		}

		if( this.simsettings.hasOwnProperty( "RUNTIME" ) ){
			this.timeInfo.stop = this.timeInfo.start + this.simsettings.RUNTIME
		} else if (this.simsettings.hasOwnProperty( "RUNTIME_BROWSER" ) ){
			this.timeInfo.stop = this.timeInfo.start + this.simsettings.RUNTIME_BROWSER
		} else {
			this.timeInfo.stop = 100
			this.conversionWarnings.time.push(
				"Could not find any information of runtime; setting the simulation to " +
				"100 MCS for now. Please adjust manually."
			)
		}

		this.timeInfo.duration = this.timeInfo.stop - this.timeInfo.start
		if( this.timeInfo.duration < 0 ){
			throw( "Error: I cannot go back in time; timeInfo.stop must be larger than timeInfo.start!")
		}
	}

	setGridInfo(){
		this.grid.ndim = this.C.grid.extents.length
		this.grid.extents = this.C.grid.extents
		this.grid.geometry = "square"
		if( this.grid.ndim === 3 ){
			this.grid.geometry = "cubic"
		}
		this.grid.neighborhood = { order: 2 }
		const torus = this.C.grid.torus
		let bounds = []
		for( let t of torus ){
			if(t){
				bounds.push( "periodic" )
			} else {
				bounds.push( "noflux" )
			}
		}
		this.grid.boundaries = bounds
	}

	setCellKindNames(){

		this.cellKinds.count = undefined

		// If there are simsettings, NRCELLS contains info on number of cellkinds.
		/*if( this.simsettings.hasOwnProperty("NRCELLS" ) ){
			this.cellKinds.count = this.simsettings.NRCELLS.length + 1

		// Otherwise, try getting it from the constraint parameters.
		} else {*/
		let found = false
		const constraints = this.C.getAllConstraints()

		// If there's an adhesion constraint, we can get the info from the J matrix.
		if( constraints.hasOwnProperty( "Adhesion" ) ){
			found = true
			this.cellKinds.count = this.C.getConstraint("Adhesion").conf.J.length

		// Otherwise, loop through constraints to find a parameter starting
		// with LAMBDA and use that.
		} else {
			for( let cn of Object.keys( constraints ) ){
				let cc = this.C.getConstraint(cn).conf
				// Find index of first param that starts with LAMBDA;
				// returns -1 if there are none.
				const lambdaIndex = Object.keys(cc).findIndex(
					function (k) {
						return ~k.indexOf("LAMBDA")
					})
				if (lambdaIndex > -1) {
					// there is a lambda parameter, assume specified per cellkind
					found = true
					const parmName = Object.keys(cc)[lambdaIndex]
					this.cellKinds.count = cc[parmName].length
				}
				if (found) {

					break
				}
			}
			// if we get here, still no success. Now try to read how many
			// cellKinds there are from the initialized grid.

			let kinds = {}
			for( let cid of this.C.cellIDs() ){
				if( !kinds.hasOwnProperty( this.C.cellKind(cid) ) ){
					kinds[this.C.cellKind(cid)] = true
				}
			}
			this.cellKinds.count = Object.keys( kinds ).length + 1
			this.conversionWarnings.cells.push(
				"Could not find how many CellKinds there are automatically! " +
				"Counting the number of cellKinds on the initialized grid, but " +
				"if the simulation introduces new cellKinds only after initialization " +
				"then the output will be wrong. Please check manually! " +
				"As a workaround, you can add an Adhesion constraint to the model" +
				"with all-zero contact energies; this will not change the model " +
				"but will define the number of cellkinds properly."
			)


			//}
		}

		// if still undefined, don't add any except background an add a warning.
		if( typeof this.cellKinds.count === "undefined" ){
			this.cellKinds.count = 1
			this.conversionWarnings.cells.push(
				"Could not find how many CellKinds there are automatically! " +
				"Ignoring everything except background, output will be wrong. " +
				"As a workaround, you can add an Adhesion constraint to the model" +
				"with all-zero contact energies; this will not change the model " +
				"but will define the number of cellkinds properly."
			)
		}

		this.cellKinds.index2name = {}
		this.cellKinds.name2index = {}
		for( let k = 0; k < this.cellKinds.count; k++ ){
			if( k === 0 ){
				this.cellKinds.index2name[k] = "medium"
				this.cellKinds.name2index["medium"] = k
			} else {
				this.cellKinds.index2name[k] = "celltype" + k
				this.cellKinds.name2index["celltype"+k ] = k
			}
		}

		// empty object for each cellkind.
		this.cellKinds.properties = {}
		for( let n of Object.keys( this.cellKinds.name2index ) ){
			this.cellKinds.properties[n] = {}
		}


	}

	setCPMGeneral(){

		// Random Seed
		this.kinetics.seed = this.C.conf.seed

		// Temperature
		this.kinetics.T = this.C.conf.T

	}

	setConstraints(){

		const constraints = this.C.getAllConstraints()
		for( let cName of Object.keys( constraints ) ){
			this.constraints.constraints[cName] = []
			let index = 0
			while( typeof this.C.getConstraint( cName, index ) !== "undefined"){
				let cc = this.C.getConstraint( cName, index ).conf
				this.constraints.constraints[cName].push( cc )
				index++
			}
		}
	}

	setGridConfiguration(){

		// If the supplied model is a Simulation; this is the most robust method
		// because we can reset the model and export the grid configuration
		// directly after initializeGrid has been called.
		if( typeof this.sim !== "undefined" ){
			// stop the simulation
			this.sim.toggleRunning()
			// remove any cells from the grid and reinitialize
			this.sim.C.reset()
			this.sim.initializeGrid()
			this.readPixelsByCell()
			// Reset time to just after initialisation
			this.sim.C.time -= this.sim.time
			this.sim.time -= this.sim.time
			this.sim.runBurnin()
			this.sim.toggleRunning()
		} else {
			this.conversionWarnings.init.push(
				"You have supplied a CPM rather than a Simulation object; " +
				"reading the initial settings directly from the CPM. This is " +
				"slightly less robust than reading it from the Simulation since " +
				"I cannot go back to time t = 0 to read the exact initial setup."
			)
			this.readPixelsByCell()
		}

	}

	readPixelsByCell(){

		const cellPix = this.C.getStat( PixelsByCell )
		for( let cid of Object.keys( cellPix ) ){
			if( cellPix[cid].length > 0 ) {
				const cki = this.C.cellKind(cid)
				this.setup.init.push({
					setter: "pixelSet",
					kind: cki,
					kindName: this.getKindName(cki),
					cid: cid,
					pixels: cellPix[cid]
				})
			}
		}
	}

}

export default ArtistooImport