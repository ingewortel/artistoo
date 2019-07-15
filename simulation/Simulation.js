import CPM from "../models/CPM.js"
import Canvas from "../Canvas.js"
import GridManipulator from "../grid/GridManipulator.js"
import CentroidsWithTorusCorrection from "../stats/CentroidsWithTorusCorrection.js"

class Simulation {
	constructor( config ){
	
		// Configuration of the simulation environment
		this.conf = config.simsettings
		this.imgrate = this.conf["IMGFRAMERATE"] || -1
		this.lograte = this.conf["LOGRATE"] || -1
		if( typeof window !== "undefined" && typeof window.document !== "undefined" ){
			this.mode = "browser"
		} else {
			this.mode = "node"
		}
		
		
		// Save the time of the simulation.
		this.time = 0
		
		// Make CPM object and add constraints
		this.C = new CPM( config.field_size, config.conf )

		// Track which constraints are active. They are added automatically by 
		// the addConstraints() function.
		this.activeconstraints = config.conf.constraints
		this.constraints = {} // will contain the constraint objects
		this.addConstraints()
				
		// To add canvas / gridmanipulator automatically when required. This will set
		// their values in helpClasses to 'true', so they don't have to be added again.
		this.helpClasses = { gm: false, canvas: false }
		
		// initialize the grid.
		this.runChecks()
		this.initializeGrid()
		this.runBurnin()
		
	}
	
	
	/* TODO: Write some checks, such that all the parameters needed for the constraints
	have been defined, and that the path to save images to actually exists. */
	runChecks(){
	
		
		
	}
	
	
	// Add all the constraints from the array in Cset.constraints to the CPM object,
	// and also save their objects here.
	addConstraints() {
	
		// Add all the constraints specified in the config file.
		for( let cn of this.activeconstraints ){
		
			// Create the constraint, save its object in the simulation, and add it to
			// the CPM object.
			let cobject
			if( this.mode == "browser" ){
				cobject = new window["CPM"][ cn ]( this.C.conf )
			} else {
				cobject = new global["CPM"][ cn ]( this.C.conf )
			}
			this.constraints[cn] = cobject
			this.C.add( cobject )
		}
	}
	
	// Add GridManipulator/Canvas objects when required.
	addGridManipulator(){
		this.gm = new GridManipulator( this.C )
		this.helpClasses[ "gm" ] = true
	}
	addCanvas(){
		this.Cim = new Canvas( this.C, {zoom:this.conf.zoom} )
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
		for( let i = 0; i < this.conf["BURNIN"]; i++ ){
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
				this.Cim.drawCellBorders( cellkind+1, "000000" )
			}
			
			// if there is an activity constraint, draw activity values depending on color.
			if( this.constraints.hasOwnProperty( "ActivityConstraint" ) ){
				if( actcolor[ cellkind ] ){
					this.Cim.drawActivityValues( cellkind + 1, this.constraints["ActivityConstraint"] )
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
	
	// Run a montecarlostep and produce outputs if required.
	step(){
		this.C.monteCarloStep()
		
		// Draw the canvas every IMGFRAMERATE steps
		if( this.imgrate > 0 && this.time % this.conf["IMGFRAMERATE"] == 0 ){
			
			this.drawCanvas()
			
			// Save the image if required and if we're in node (not possible in browser)
			if( this.mode == "node" && this.conf["SAVEIMG"] ){
				let outpath = this.conf["SAVEPATH"], expname = this.conf["EXPNAME"]
				this.Cim.writePNG( outpath +"/" + expname + "-t"+this.time+".png" )
			}
		}
		
		// Log stats every LOGRATE steps
		if( this.conf["STATSOUT"][this.mode] && this.lograte > 0 && this.time % this.conf["LOGRATE"] == 0 ){
			this.logStats()
		}
		
		this.time++
	}
	
	
	// Run the entire simulation.
	run(){
		while( this.time < this.conf["RUNTIME"] ){
		
			this.step()
			
		}
	}
	
}


export default Simulation