import CPM from "../models/CPM.js"
import Canvas from "../Canvas.js"
import GridManipulator from "../grid/GridManipulator.js"
import CentroidsWithTorusCorrection from "../stats/CentroidsWithTorusCorrection.js"

class Simulation {
	constructor( config, custommethods ){
	
		custommethods = custommethods || {}
	
		// overwrite default method if methods are supplied in custommethods
		// these can be initializeGrid(), drawCanvas(), logStats(),
		// postMCSListener().
		for( let m of Object.keys( custommethods ) ){
			this[m] = custommethods[m]
		}
		
	
		// Configuration of the simulation environment
		this.conf = config.simsettings
		this.imgrate = this.conf["IMGFRAMERATE"] || 1
		this.lograte = this.conf["LOGRATE"] || 1
		
		// See if code is run in browser or via node, which will be used
		// below to determine what the output should be.
		if( typeof window !== "undefined" && typeof window.document !== "undefined" ){
			this.mode = "browser"
		} else {
			this.mode = "node"
		}
		
		// Log stats or not
		this.logstats = this.conf["STATSOUT"] || { browser: false, node: true }
		this.logstats = this.logstats[this.mode]
		
		// Saving images
		this.saveimg = this.conf["SAVEIMG"] || false
		this.savepath = this.conf["SAVEPATH"] || "undefined"
		
		if( this.saveimg && this.savepath === "undefined" ){
			throw( "You need to specify the SAVEPATH option in the configuration object of your simulation!")
		}
		
		// Save the time of the simulation.
		this.time = 0
		this.running = true
		
		// Make CPM object and add constraints
		this.C = new CPM( config.field_size, config.conf )
				
		// To add canvas / gridmanipulator automatically when required. This will set
		// their values in helpClasses to 'true', so they don't have to be added again.
		this.helpClasses = { gm: false, canvas: false }
		
		// Initialize the grid and run the burnin.
		this.initializeGrid()
		this.runBurnin()
		
	}

	// Add GridManipulator/Canvas objects when required.
	addGridManipulator(){
		this.gm = new GridManipulator( this.C )
		this.helpClasses[ "gm" ] = true
	}
	addCanvas(){
		let zoom = this.conf.zoom || 2
		this.Cim = new Canvas( this.C, {zoom:zoom} )
		this.helpClasses[ "canvas" ] = true
	}
	
	// Method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){
	
		// add the initializer if not already there
		if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
		let nrcells = this.conf["NRCELLS"], cellkind, i
		
		// Seed the right number of cells for each cellkind
		for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
			
			for( i = 0; i < nrcells[cellkind]; i++ ){
				// first cell always at the midpoint. Any other cells
				// randomly.				
				if( i == 0 ){
					this.gm.seedCellAt( cellkind+1, this.C.midpoint )
				} else {
					this.gm.seedCell( cellkind+1 )
				}
			}
		}


	}
	
	runBurnin(){
		// Simulate the burnin phase
		let burnin = this.conf["BURNIN"] || 0
		for( let i = 0; i < burnin; i++ ){
			this.C.monteCarloStep()
		}
	}

	
	// draw the canvas
	drawCanvas(){
	
		// Add the canvas if required
		if( !this.helpClasses["canvas"] ){ this.addCanvas() }
	
		// Clear canvas and draw stroma border
		this.Cim.clear( this.conf["CANVASCOLOR"] )
		
		

		// Draw each cellkind appropriately
		let cellcolor=this.conf["CELLCOLOR"], actcolor=this.conf["ACTCOLOR"], 
			nrcells=this.conf["NRCELLS"], cellkind, cellborders = this.conf["SHOWBORDERS"]
		for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		
			// draw the cells of each kind in the right color
			if( cellcolor[ cellkind ] != -1 ){
				this.Cim.drawCells( cellkind+1, cellcolor[cellkind] )
			}
			
			// Draw borders if required
			if(  cellborders[ cellkind  ]  ){
				let bordercol = "000000"
				if( this.conf.hasOwnProperty("BORDERCOL") ){
					bordercol = this.conf["BORDERCOL"][cellkind]
				}
				this.Cim.drawOnCellBorders( cellkind+1, bordercol )
			}
			
			// if there is an activity constraint, draw activity values depending on color.
			if( this.C.conf["LAMBDA_ACT"] !== undefined && this.C.conf["LAMBDA_ACT"][ cellkind + 1 ] > 0 ){ //this.constraints.hasOwnProperty( "ActivityConstraint" ) ){
				if( actcolor[ cellkind ] ){
					this.Cim.drawActivityValues( cellkind + 1 )//, this.constraints["ActivityConstraint"] )
				}			
			}

		}
		
	}
	
	// Computing and logging stats
	logStats(){
		
		// compute centroids for all cells
		let allcentroids = this.C.getStat( CentroidsWithTorusCorrection )
		
		for( let cid of this.C.cellIDs() ){
		
			let thecentroid = allcentroids[cid]
			
			// eslint-disable-next-line no-console
			console.log( this.time + "\t" + cid + "\t" + 
				this.C.cellKind(cid) + "\t" + thecentroid.join("\t") )
			
		}

	}
	
	// Listener for something that needs to be done after every monte carlo step.
	postMCSListener(){
	
	}
	
	// Function for creating outputs
	createOutputs(){
		// Draw the canvas every IMGFRAMERATE steps
		if( this.imgrate > 0 && this.time % this.imgrate == 0 ){
			
			if( this.mode == "browser" ){
				this.drawCanvas()
			}
			
			// Save the image if required and if we're in node (not possible in browser)
			if( this.mode == "node" && this.saveimg ){
				this.drawCanvas()
				let outpath = this.conf["SAVEPATH"], expname = this.conf["EXPNAME"] || "mysim"
				this.Cim.writePNG( outpath +"/" + expname + "-t"+this.time+".png" )
			}
		}
		
		// Log stats every LOGRATE steps
		if( this.logstats && this.time % this.lograte == 0 ){
			this.logStats()
		}
	}
	
	// Run a montecarlostep and produce outputs if required.
	step(){
		if( this.running ){
			this.C.monteCarloStep()
			this.postMCSListener()
			this.createOutputs()
			this.time++
		}
	}
	
	// toggle running
	toggleRunning(){
		this.running = !this.running
	}
	
	// Run the entire simulation.
	run(){
		while( this.time < this.conf["RUNTIME"] ){
		
			this.step()
			
		}
	}
	
}


export default Simulation