let CPM = require("../../build/artistoo-cjs.js")
let colormap = require("../../build/colormap-cjs.js")

let config = {

	// Grid settings
	ndim : 2,
	field_size : [400,200],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [false,false],				// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 2,								// CPM temperature
        
        // used internally
        INIT_X : [0, 40, 40],
        INIT_Y: [0, 40, 40],
		INIT_V : [0, 150, 150],
		CELLS : ["empty", CPM.StochasticCorrector, CPM.StochasticCorrector],
		NOISE : [0,5,5],

        // only used in postMCSListener
        rX : [0, 1, 1],
        rY : [0, 0.8, 0.8],
        d : [0, 0.05, 0.05],
        speed_internal_dynamics : [0, 0.2, 0.2],
        Q : [0, 0.8, 0.8],
        

        division_volume : [0, 200, 300],
        shrink_rate : [0, 10, 10],
        y_growth_contribution : [0, 25, 25],

        
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
        
        // Adhesion parameters:
         J: [ [15,15,15], 
			[15,15,15], // epidermal cells
			[15,15,15] ],
		
		
		// VolumeConstraint parameters
		LAMBDA_V : [0, 1, 1],				// VolumeConstraint importance per cellkind
		V : [0,152, 152]					// Unused - are backup.
		
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [4, 4],						// Number of cells to seed for all
		// non-background cellkinds.
		// Runtime etc
		BURNIN : 100,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "EEEEEE",
		CELLCOLOR : ["AA1AAA","FFA000"],
		SHOWBORDERS : [true, true],				// Should cellborders be displayed?
		BORDERCOL : ["666666", "666666"],				// color of the cell borders
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/stochasticCorrector",	// ... And save the image in this folder.
		EXPNAME : "stochasticCorrector",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */
let sim

let custommethods = {
postMCSListener : postMCSListener,
initializeGrid : initializeGrid,
drawCanvas : drawCanvas
}
sim = new CPM.Simulation( config, custommethods )


step()



function step(){
	sim.step()
}



/* The following custom methods will be added to the simulation object*/
function postMCSListener(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	
	for( let i of this.C.cellIDs() ){
        updateInternalDynamics(this.C, i)
		if( this.C.getVolume(i) > this.C.conf.division_volume[this.C.cellKind(i)] ){
            this.gm.divideCell(i)
		}
	}
}

function updateInternalDynamics(C, i){
    let cell = C.getCell(i) 
    let vol = C.getVolume(cell.id)

    if ((cell.V - vol) < 10 && cell.X > 0){
        let V = cell.V + C.conf.y_growth_contribution[cell.kind]*(cell.Y/vol)/((cell.Y/vol)+0.1)
        V -= C.conf.shrink_rate[cell.kind]
        cell.setV(V)
    }
    
    // console.log(cell.X, " ",cell.Y, " ", cell.V, " ", vol)
    
   
    let dy = C.conf.rY[cell.kind]*cell.Y*(vol-cell.X-cell.Y)/vol*C.conf.speed_internal_dynamics[cell.kind]
    let X = cell.X + (1-C.conf.Q[cell.kind])*dy+( C.conf.rX[cell.kind]*cell.X*(vol-cell.X-cell.Y)/vol - C.conf.d[cell.kind]*cell.X )*C.conf.speed_internal_dynamics[cell.kind]
    let Y = cell.Y + C.conf.Q[cell.kind]*dy - C.conf.d[cell.kind]*cell.Y*C.conf.speed_internal_dynamics[cell.kind]
    // console.log("new", X, " ",Y)
    cell.setXY(X,Y)
}

function initializeGrid(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	let nrcells = this.conf["NRCELLS"], cellkind, i
		
	// Seed the right number of cells for each cellkind
	for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
			
		for( i = 0; i < nrcells[cellkind]; i++ ){
			// first cell always at the midpoint. Any other cells
			// randomly.				
			if( i == 0 ){
				this.gm.seedCellAt( cellkind+1, [this.C.midpoint[0]/2, this.C.midpoint[1] ] )
			} else {
				this.gm.seedCell( cellkind+1 )
			}
		}
	}


}

// Custom drawing function to draw the preferred directions.
function drawCanvas(){
	
	/* This part is the normal drawing function */
	
	// Add the canvas if required
	if( !this.helpClasses["canvas"] ){ this.addCanvas() }
	
	// Clear canvas and draw stroma border
	this.Cim.clear( this.conf["CANVASCOLOR"] )
		
	// Draw each cellkind appropriately
	var Cim = this.Cim
	this.C.cells.forEach(function (item) {
		colorByY(Cim, item)
	});

	let nrcells=this.conf["NRCELLS"], cellkind, cellborders = this.conf["SHOWBORDERS"]
	for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		// Draw borders if required
		if(  cellborders[ cellkind  ]  ){
			this.Cim.drawCellBorders( cellkind+1, "000000" )
		}
	}

}

function colorByY (Cim, cell) {
	
	if (cell.id < 0){
		return
	}
	const colors = colormap({
		colormap: 'viridis',
		nshades: 300,
		format: 'hex',
		alpha: 1
	})
	let c = Math.floor(cell.Y)
	if (c > 300){
		c = 300
	}
	// console.log(c)
	Cim.drawCellsOfId ( cell.id,  colors[c])
}

sim.run()
