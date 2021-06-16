let CPM = require("../../build/artistoo-cjs.js")


/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/

let config = {

	// Grid settings
	ndim : 2,
	field_size : [250,250],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],				// Should the grid have linked borders?
		seed : 5,							// Seed for random number generation.
		T : 20,								// CPM temperature
        
	
		// Give the Cell class per kind - in this way you can also implement different subclasses of super- and subcell within the same simulation
		CELLS : ["empty", SuperCell, SubCell],
		
		// Internal adhesion (within host) all interacting with background can be NaN
        J_INT:  [ [NaN, NaN, NaN],
						[NaN, 15,15], 
            			[NaN, 15,150] ],

		// External adhesion. High penalties for not encapsulating subcells are preferable
        J_EXT:  [ [15,15,1500], 
						[15,15,1500], 
            			[1500, 1500,1500] ],

		// Some volume parameters. Cells detect that they can grow if the target volume-current volume is within VOLCHANGE_THRESHOLD range
		VOLCHANGE_THRESHOLD : 10,
		// Cells increase their volume if they can grow by VOLSTEP amount
		VOLSTEP : [0, 1, 10],
		
		LAMBDA_V : [0, 1, 1],				// VolumeConstraint importance per cellkind
		V : [0,902, 400],					// Initialization target V

		division_volume: [100, 1100, 500]
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : { 
	
		// Cells on the grid
		NRCELLS : [15, 5],						// Number of supercells, and number of subcells per supercell to seed 
		// non-background cellkinds. 
		// Runtime etc
		BURNIN : 0,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "EEEEEE",
		CELLCOLOR : ["9E60BE", "FFAAEA"],
		SHOWBORDERS : [true, true],				// Should cellborders be displayed?
		BORDERCOL : ["CCCCCC", "444444"],				// color of the cell borders
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/SuperCells",	// ... And save the image in this folder.
		EXPNAME : "SuperCells",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */

let custommethods = {
    postMCSListener : postMCSListener,
    initializeGrid : initializeGrid
}

let sim = new CPM.Simulation( config, custommethods )

sim.C.add( new SubCellConstraint( config["conf"] ) )

/** Seeds the subcells (not an extendable function currently as it assumes that subcells are only celltype 1)
 */
function seedSubCells(){
    if (!sim.gm){
        sim.addGridManipulator()
    } 
    let cellpixelsbyid = sim.C.getStat(CPM.PixelsByCell)
    for (let cid of Object.keys(cellpixelsbyid)) {
        if (sim.C.cellKind(cid) == 1){
            for (let i =0; i < sim.conf["NRCELLS"][1]; i++){
                let coord = cellpixelsbyid[cid][Math.floor(sim.C.mt.random()*cellpixelsbyid[cid].length)]
                let nid = sim.gm.seedCellAt( 2, coord )
				sim.C.cells[nid].host = cid
            }
        }
    }
    sim.C.stat_values = {} // remove cached stats or this will crash!!!
}

/** computes target volume algorithm and triggers cell division
*/
function postMCSListener(){
    if (sim.time == 100){
        seedSubCells()
    }
	if (sim.time < 200){
		// extra burnin time for seeding subcells
		return
	}
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	for( let cid of this.C.cellIDs() ){
		let cell = this.C.cells[cid]

		if (cell.V-cell.vol < this.C.conf["VOLCHANGE_THRESHOLD"]){
			cell.V += this.C.conf["VOLSTEP"][cell.kind]
		} 
		if( this.C.getVolume(cid) > this.C.conf.division_volume[this.C.cellKind(cid)] && sim.time > 200){
			if (cell instanceof SuperCell){
				cell.divideHostCell()
			} else{
				let nid = this.gm.divideCell(cid)
			}
		}
	}
}

/** Seeds SuperCells*/
function initializeGrid(){
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }

    let nrcells = this.conf["NRCELLS"][0], i
    for( i = 0; i < nrcells; i++ ){			
        if( i == 0 ){
            this.gm.seedCellAt( 1, [this.C.midpoint[0]/2, this.C.midpoint[1] ] )
        } else {
            this.gm.seedCell(1)
        }
    }
}

sim.run()
