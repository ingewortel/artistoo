let CPM = require("../../build/artistoo-cjs.js")


/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let config = {

	// Grid settings
	ndim : 2,
	field_size : [200,200],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],				// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		D :0.0001, 							// diffusion coefficient
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.

		
		// Adhesion parameters:
		J: [[0,20,20,20,20], 
			[20,100,20,100,20], 
			[20,20,20,20,20], 
			[20,100,20,100,20], 
			[20,20,20,20,20]],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50,50,50,50],				// VolumeConstraint importance per cellkind
		V : [0,125,300,125,300],					// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P : [0,2,20,2,20],				// PerimeterConstraint importance per cellkind
		P : [0,100,180,100,180]					// Target perimeter of each cellkind
		
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [10,1,10,1],					// Number of cells to seed for all
		// non-background cellkinds.
		// Runtime etc
		BURNIN : 500,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["FF0000","000000","0000FF","008800"],
		SHOWBORDERS : [true,true,true,true],// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/ManyCellsDiffusion",	// ... And save the image in this folder.
		EXPNAME : "ManyCellsDiffusion",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */


let sim = new CPM.Simulation( config, {} )
sim.g1 = new CPM.Grid2D([sim.C.extents[0]/10,sim.C.extents[1]/10], config.torus, "Float32")
sim.gi1 = new CPM.CoarseGrid( sim.g1, 10 )
//sim.g1 = new CPM.Grid2D([sim.C.extents[0],sim.C.extents[1]], config.torus, "Float32")
//sim.gi1 = sim.g1
sim.g2 = new CPM.Grid2D([sim.C.extents[0]/10,sim.C.extents[1]/10], config.torus, "Float32" )
sim.gi2 = new CPM.CoarseGrid( sim.g2, 10 )

sim.C.add( new CPM.ChemotaxisConstraint( {
	LAMBDA_CH: [0,100,0,0,0],
	CH_FIELD : sim.gi1 }
) )
sim.C.add( new CPM.ChemotaxisConstraint( {
	LAMBDA_CH: [0,0,0,100,0],
	CH_FIELD : sim.gi2 }
) )





/* The following custom methods will be added to the simulation object*/

// Produce, diffuse, and decay the two chemokines during every monte carlo step.
function postMCSListener(){
	
	// Cells of kind 2 produce the the chemokine on the first grid.
	// Cells of kind 4 produce the chemokine on the second grid.
	let cellpixels = this.C.getStat( CPM.BorderPixelsByCell )
	for( let cell of Object.keys( cellpixels ) ){
		if( this.C.cellKind( cell ) == 2 ){
			for( let pix of cellpixels[cell] ){
				//let pos = [Math.floor(pix[0]/10), Math.floor(pix[1]/10)]
				this.gi1.addValue( pix, 1000  )
			}
		} else if ( this.C.cellKind(cell) == 4 ){
			for( let pix of cellpixels[cell] ){
				//let pos = [Math.floor(pix[0]/10), Math.floor(pix[1]/10)]
				this.gi2.addValue( pix, 1000 )
			}
		}
	}
	
	// Diffuse both grids
	let diffusionsteps = 10, D1 = this.C.conf["D"]*Math.pow( this.gi1.upscale,2 ), 
		D2 = this.C.conf["D"]*Math.pow( this.gi2.upscale,2 )
	for( let i = 1 ; i <= diffusionsteps ; i ++ ){
		this.g1.diffusion( D1/diffusionsteps )
		this.g2.diffusion( D2/diffusionsteps )
	}
	
	// Decay chemokine on both grids
	this.g1.multiplyBy( 0.9 )
	this.g2.multiplyBy( 0.9 )
}

function drawCanvas(){
	
		
	
	// Add the canvas if required
	if( !this.helpClasses["canvas"] ){ this.addCanvas() }
		
	// Clear canvas and draw stroma border
	this.Cim.clear( this.conf["CANVASCOLOR"] || "FFFFFF" )
		
	// Chemokines
	this.Cim.drawFieldContour( this.gi1, 5, "555555" )
	this.Cim.drawFieldContour( this.gi2, 5, "00FF00" )
		
	// Draw each cellkind appropriately
	let cellcolor=( this.conf["CELLCOLOR"] || [] ), actcolor=this.conf["ACTCOLOR"], 
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
				bordercol = this.conf["BORDERCOL"][cellkind] || "000000"
			}
			this.Cim.drawCellBorders( cellkind+1, bordercol )
		}
			

	}
		
		
		
		
		
}



sim.run()
