import CPM from "../models/CPM.js"
import CPMEvol from "../models/CPMEvol.js"
import Canvas from "../Canvas.js"
import GridManipulator from "../grid/GridManipulator.js"
import CentroidsWithTorusCorrection from "../stats/CentroidsWithTorusCorrection.js"
import Centroids from "../stats/Centroids.js"

/** 
This class provides some boilerplate code for creating simulations easily.
It comes with defaults for seeding cells, drawing, logging of statistics, saving output
images, and running the simulation. Each of these default methods can be overwritten
by the user while keeping the other default methods intact. See the {@link Simulation#constructor}
for details on how to configure a simulation.
@see ../examples
*/
class Simulation {
	/** The constructor of class Simulation takes two arguments.
		@param {object} config - overall configuration settings. This is an object
		with multiple entries, see below.
		@param {GridSize} config.field_size - size of the CPM to build.
	 	@param {Constraint[]} config.constraints - array of additional
	 		constraints to add to the CPM model.
		@param {object} config.conf - configuration settings for the CPM;
		see its {@link CPM#constructor} for details.
		@param {object} simsettings - configuration settings for the simulation 
		itself and for controlling the outputs. See the parameters below for details.
		@param {number[]} simsettings.NRCELLS - array with number of cells to seed for
			every non-background {@link CellKind}.
		@param {number} simsettings.BURNIN - number of MCS to run before the actual
			simulation starts (let cells get their target volume before starting).
		@param {number} simsettings.RUNTIME - number of MCS the simulation should run.
			Only necessary if you plan to use the {@link run} method.
		@param {number} [ simsettings.IMGFRAMERATE = 1 ]- draw the grid every [x] MCS.
		@param {number} [ simsettings.LOGRATE = 1 ] - log stats every [x] MCS.
		@param {object} [ simsettings.LOGSTATS = {browser:false,node:true} ] - 
			whether stats should be logged in browser and node.
		@param {boolean} [ simsettings.SAVEIMG = false ] - should images be saved? (node only).
		@param {string} [ simsettings.SAVEPATH ] - where should images be saved? You only have
			to give this argument when SAVEIMG = true. 
		@param {string} [ simsettings.EXPNAME = "myexp" ] - string used to construct the
			filename of any saved image. 
		@param {HexColor} [ simsettings.CANVASCOLOR = "FFFFFF" ] - color to draw the background in; defaults to white.
		@param {HexColor[]} [ simsettings.CELLCOLOR ] - color to draw each non-background 
			{@link CellKind} in. If left unspecified, the {@link Canvas} will use black.
		@param {boolean[]} [simsettings.ACTCOLOR ] - should activities of the {@link ActivityConstraint}
			be drawn for each {@link CellKind}? If left unspecified, these are not drawn.
		@param {boolean[]} [simsettings.SHOWBORDERS = false] - should borders of each {@link CellKind}
			be drawn? Defaults to false.
		@param {HexColor[]} [simsettings.BORDERCOL = "000000"] - color to draw cellborders of
			each {@link CellKind} in. Defaults to black. 
		*/
	constructor( config, custommethods ){

		/** To check from outside if an object is a Simulation; doing this with
		 * instanceof doesn't work in some cases. Any other object will
		 * not have this variable and return 'undefined', which in an
		 * if-statement equates to a 'false'.
		 * @type{boolean}*/
		this.isSimulation = true

		// ========= configuration and custom methods

		/** Custom methods added to / overwriting the default Simulation class.
		 * These are stored so that the ArtistooImport can check them.
		@type {object}*/
		this.custommethods = custommethods || {}
	
		// overwrite default method if methods are supplied in custommethods
		// these can be initializeGrid(), drawCanvas(), logStats(),
		// postMCSListener().
		for( let m of Object.keys( this.custommethods ) ){
		
			/** Any function suplied in the custommethods argument to
			the {@link constructor} is bound to the object. */
			this[m] = this.custommethods[m]
		}
		
		/** Configuration of the simulation environment 
		@type {object}*/
		this.conf = config.simsettings
		
		// ========= controlling outputs
		
		/** Draw the canvas every [rate] MCS.
		@type {number}*/
		this.imgrate = this.conf["IMGFRAMERATE"] || 1
		
		/** Log stats every [rate] MCS.
		@type {number}*/
		this.lograte = this.conf["LOGRATE"] || 1
		
		/** See if code is run in browser or via node, which will be used
			below to determine what the output should be.
			@type {string}*/
		this.mode = "node"
		if( typeof window !== "undefined" && typeof window.document !== "undefined" ){
			
			this.mode = "browser"
		} 
		
		/** Log stats or not.
		@type {boolean}*/
		this.logstats = false
		
		/** Log stats or not, specified for both browser and node mode.
		@type {object} */
		this.logstats2 = this.conf["STATSOUT"] || { browser: false, node: true }
		
		
		this.logstats = this.logstats2[this.mode]
		
		/** Saving images or not.
		@type {boolean}*/
		this.saveimg = this.conf["SAVEIMG"] || false
		/** Where to save images.
		@type {string}*/
		this.savepath = this.conf["SAVEPATH"] || "undefined"
		
		if( this.saveimg && this.savepath === "undefined" ){
			throw( "You need to specify the SAVEPATH option in the configuration object of your simulation!")
		}
		
		// ========= tracking simulation progress
		
		/** Track the time of the simulation. 
		@type {number}*/
		this.time = 0
		
		/** Should the simulation be running? Change this to pause;
		see the {@link toggleRunning} method.
		@private
		@type {boolean}*/
		this.running = true
		
		// ========= Attached objects
		
		/** Make CPM object based on configuration settings and attach it.
		@type {CPM} */
		if (((config || {}).conf || {})["CELLS"] !== undefined){
			this.C = new CPMEvol( config.field_size, config.conf )
		} else {
			this.C = new CPM( config.field_size, config.conf )
		}
				
		/** See if objects of class {@link Canvas} and {@link GridManipulator} already 
		exist. These are added automatically when required. This will set
		their values in helpClasses to 'true', so they don't have to be added again.
		@type {object}*/ 
		this.helpClasses = { gm: false, canvas: false }

		/** Add additional constraints.
		 * @type {Constraint[]}
		 * */
		this.constraints = config.constraints || []
		this.addConstraints()

		// ========= Begin.
		// Initialize the grid and run the burnin.
		this.initializeGrid()
		this.runBurnin()
		
	}

	/** Adds a {@link GridManipulator} object when required. */
	addGridManipulator(){
		/** Attached {@link GridManipulator} object.
		@type {GridManipulator}*/
		this.gm = new GridManipulator( this.C )
		this.helpClasses[ "gm" ] = true
	}
	
	/** Adds a {@link Canvas} object when required. */
	addCanvas(){
		//let zoom = this.conf.zoom || 2
		/** Attached {@link Canvas} object.
		@type {Canvas}*/
		this.Cim = new Canvas( this.C, this.conf )
		this.helpClasses[ "canvas" ] = true
	}

	/** Add additional constraints to the model before running; this
	 * method is automatically called and adds constraints given in
	 * the config object. */
	addConstraints(){
		for( let constraint of this.constraints ){
			this.C.add( constraint )
		}
	}
	
	/** Method to initialize the Grid should be implemented in each simulation. 
	The default method checks in the simsettings.NRCELLS array how many cells to
	seed for each {@CellKind}, and does this (at random positions). 
	
	Often you'll want to do other things here. In that case you can use the 
	custommethods argument of the {@link constructor} to overwrite this with your
	own initializeGrid method.
	*/
	initializeGrid(){
	
		// add the initializer if not already there
		if( !this.helpClasses["gm"] ){ this.addGridManipulator() }

		// reset C and clear cache (important if this method is called
		// again later in the sim).
		this.C.reset()

		let nrcells = this.conf["NRCELLS"], cellkind, i
		
		// Seed the right number of cells for each cellkind
		for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
			
			for( i = 0; i < nrcells[cellkind]; i++ ){
				// first cell always at the midpoint. Any other cells
				// randomly.				
				
				this.gm.seedCell( cellkind+1 )
				
			}
		}


	}
	
	/** Run the brunin period as defined by simsettings.BURNIN : run this number
	of MCS before the {@link time} of this simulation object starts ticking, and 
	before we start drawing etc. 
	*/	
	runBurnin(){
		// Simulate the burnin phase
		let burnin = this.conf["BURNIN"] || 0
		for( let i = 0; i < burnin; i++ ){
			this.C.monteCarloStep()
		}
	}

	
	/** Method to draw the canvas.
	The default method draws the canvas, cells, cellborders, and activityvalues
	as specified in the simsettings object (see the {@link constructor} for details).
	
	This will be enough for most scenarios, but if you want to draw more complicated stuff,
	you can use the custommethods argument of the {@link constructor} to overwrite 
	this with your own drawCanvas method.
	*/
	drawCanvas(){
	
		// Add the canvas if required
		if( !this.helpClasses["canvas"] ){ this.addCanvas() }
	
		// Clear canvas and draw stroma border
		this.Cim.clear( this.conf["CANVASCOLOR"] || "FFFFFF" )


		// Call the drawBelow method for if it is defined. 
		this.drawBelow()

		// Draw each cellkind appropriately
		let cellcolor=( this.conf["CELLCOLOR"] || [] ), actcolor=this.conf["ACTCOLOR"], 
			nrcells=this.conf["NRCELLS"], cellkind, cellborders = this.conf["SHOWBORDERS"]
		for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		
			// draw the cells of each kind in the right color
			if( cellcolor[ cellkind ] !== -1 ){
				this.Cim.drawCells( cellkind+1, cellcolor[cellkind] )
			}
			
			// Draw borders if required
			if(  this.conf.hasOwnProperty("SHOWBORDERS") && cellborders[ cellkind  ] ){
				let bordercol = "000000"
				if( this.conf.hasOwnProperty("BORDERCOL") ){
					bordercol = this.conf["BORDERCOL"][cellkind] || "000000"
				}
				this.Cim.drawCellBorders( cellkind+1, bordercol )
			}
			
			// if there is an activity constraint, draw activity values depending on color.
			if( this.C.conf["LAMBDA_ACT"] !== undefined && this.C.conf["LAMBDA_ACT"][ cellkind + 1 ] > 0 ){ //this.constraints.hasOwnProperty( "ActivityConstraint" ) ){
				let colorAct
				if( typeof actcolor !== "undefined" ){
					colorAct = actcolor[ cellkind ] || false
				} else {
					colorAct = false
				}
				if( ( colorAct ) ){
					this.Cim.drawActivityValues( cellkind + 1 )//, this.constraints["ActivityConstraint"] )
				}			
			}

		}
		
		// Call the drawOnTop() method for if it is defined. 
		this.drawOnTop()
		
	}
	
	/** Methods drawBelow and {@link drawOnTop} allow you to draw extra stuff below and
	on top of the output from {@link drawCanvas}, respectively. You can use them if you
	wish to visualize additional properties but don't want to remove the standard visualization.
	They are called at the beginning and end of {@link drawCanvas}, so they do not work
	if you overwrite this method. 
	*/
	drawBelow(){
	
	}
	
	/** Methods drawBelow and {@link drawOnTop} allow you to draw extra stuff below and
	on top of the output from {@link drawCanvas}, respectively. You can use them if you
	wish to visualize additional properties but don't want to remove the standard visualization.
	They are called at the beginning and end of {@link drawCanvas}, so they do not work
	if you overwrite this method. 
	*/
	drawOnTop(){
	
	}
	
	
	/** Method to log statistics.
	The default method logs time, {@link CellId}, {@link CellKind}, and the 
	{@ArrayCoordinate} of the cell's centroid to the console.
	
	If you want to compute other stats (see subclasses of {@link Stat} for options)
	you can use the custommethods argument of the {@link constructor} to overwrite 
	this with your own drawCanvas method.
	*/
	logStats(){
		
		// compute centroids for all cells
		let allcentroids 
		let torus = false
		for( let d = 0; d < this.C.grid.ndim; d++ ){
			if( this.C.grid.torus[d] ){
				torus = true
			}
		}
		if( torus ){
			allcentroids = this.C.getStat( CentroidsWithTorusCorrection )
		} else {
			allcentroids = this.C.getStat( Centroids )
		} 
		
		for( let cid of this.C.cellIDs() ){
		
			let thecentroid = allcentroids[cid]
			
			// eslint-disable-next-line no-console
			console.log( this.time + "\t" + cid + "\t" + 
				this.C.cellKind(cid) + "\t" + thecentroid.join("\t") )
			
		}

	}
	
	/** Listener for something that needs to be done after every monte carlo step.
	This method is empty but can be overwritten via the custommethods 
	argument of the {@link constructor}.*/
	postMCSListener(){
	
	}
	
	/** This automatically creates all outputs (images and logged stats) at the correct
	rates. See the {@link constructor} documentation for options on how to control these
	outputs. */
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
	
	/** Run a montecarlostep, produce outputs if required, run any {@link postMCSListener},
	and update the time. */
	step(){
		if( this.running ){
			this.C.monteCarloStep()
			this.postMCSListener()
			this.createOutputs()
			this.time++
		}
	}
	
	/** Use this to pause or restart the simulation from an HTML page. */
	toggleRunning(){
		this.running = !this.running
	}
	
	/** Run the entire simulation. This function is meant for nodejs, as you'll
	want to perform individual {@link step}s in a requestAnimationFrame for an 
	animation in a HTML page. */
	run(){
		while( this.time < this.conf["RUNTIME"] ){
		
			this.step()
			
		}
	}
	
}


export default Simulation