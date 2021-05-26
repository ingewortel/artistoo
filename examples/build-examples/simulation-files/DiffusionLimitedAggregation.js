/* globals CPM, FPSMeter */

/* 	================= DESCRIPTION ===================== */
/* This text is printed on the HTML page. */
/** @file
 * <h1>Diffusion-limited aggregation</h1>
 * <p>
 * In this example, we see freely diffusing particles (blue) aggregate into a crystal (white). 
 * This is implemented as two communicating grids: one CPM (blue) and one CA (white).<br><br> 
 * The "diffusion" is implemented as a Cellular Potts Model (CPM) with a hard volume range constraint, such that 
 * each "cell" can only be 1 or 2 pixels big. Without any other constraint, this ensures that
 * the particles follow Brownian motion. In a way, this is not really a CPM since there is
 * no Hamiltonian H, but it still follows the same copy attempt dynamics as a real CPM. <br><br>
 * 
 * The white crystal grows on a cellular automaton (CA), which has been seeded with a single 
 * point in the middle of the grid. Every step, this grid updates according to the following
 * rules:
 * <ol>
 * 	<li> A pixel of type 1 (crystal) remains type 1 (once a particle has aggregated, it cannot become
 *	free again) </li>
 * 	<li> A pixel of type 0 (background) becomes type 1 (crystal) if and only if:
 *		<ul>
 *			<li> it is a (Moore) neighbor of a pixel of the crystal (type 1), AND </li>
 *			<li> the CPM grid currently has a blue particle in this position </li>
 *		</ul>
 * 	</li>
 * </ol>
 * </p>
 */ 

"use strict"

/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let config = {

	// Grid settings
	ndim : 2,
	field_size : [150,150],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [false,false],				// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 4,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
			
		LAMBDA_VRANGE_MIN : [0,1],			// MIN/MAX volume for the hard volume constraint
		LAMBDA_VRANGE_MAX : [0,2]
	},
	
	// Simulation setup and configuration
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [2500],						// Number of cells to seed for all
		// non-background cellkinds.
		// Runtime etc
		BURNIN : 0,
		RUNTIME : 20000,
		
		// Visualization
		CANVASCOLOR : "000000",
		CRYSTALCOLOR : "FFFFFF",
		FREECOLOR : "3782fa",
		zoom : 2,							// zoom in on canvas with this factor.
		LOGSTATS : { browser: true, node: true },
		
		// Output images
		SAVEIMG : true,					// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 10,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/DiffusionLimitedAggregation",	// ... And save the image in this folder.
		EXPNAME : "DiffusionLimitedAggregation",				// Used for the filename of output images.


	}
}
/*	---------------------------------- */
let sim, meter, Fixed, Free, FreeGM, FreeCanvas, FixedCanvas
let conf, t = 0 


function initialize(){

	// The CPM with the diffusing particles (using hard volume range constraint)
	Free = new CPM.CPM( config.field_size, config.conf )
	let hardvolconstraint = new CPM.HardVolumeRangeConstraint( config.conf )
	Free.add( hardvolconstraint )
	FreeGM = new CPM.GridManipulator( Free )
	
	
	// The CA with the aggregate
	Fixed = new CPM.CA( config.field_size, {
		"UPDATE_RULE": 	function(p,N){
			
			if( this.pixt(p) == 0 ){
				let hasNeighbor = false
				for( let pn of N ){
					if( this.pixt(pn) == 1 ){
						hasNeighbor = true
						break
					}
				}
			
				if( Free.cellKind( Free.pixt(p) ) == 1 && hasNeighbor ){
				
					// remove this particle from the 'free' CPM:
					const cid = Free.pixt(p)
					FreeGM.killCell( cid )
					
					// and add it to the 'fixed' CA:
					return 1
				}
				
				return 0
			}
			return 1
			
			
		}
	})
	
	FreeCanvas = new CPM.Canvas( Free, {zoom:config.simsettings.zoom} )
	initializeGrids()
	meter = new FPSMeter({left:"auto", right:"5px"})
	conf = { RUNTIME : config.simsettings.RUNTIME }
	run()
}


function initializeGrids(){
	for( let i = 0; i < config.simsettings.NRCELLS[0]; i++ ){
		FreeGM.seedCell( 1 )
	}
	Fixed.setpix( Fixed.grid.midpoint, 1 )
}

function draw(){
	FreeCanvas.clear( config.simsettings.CANVASCOLOR )
		
	// Draw the crystal from the FixedCanvas on the FreeCanvas
	FreeCanvas.col( config.simsettings.CRYSTALCOLOR )
	FreeCanvas.getImageData()
	for( let x of Fixed.pixels() ){
		if( x[1] === 1 ){
			FreeCanvas.pxfi( x[0] )
		}
	}
	FreeCanvas.putImageData()
		
		
	FreeCanvas.drawCells( 1, config.simsettings.FREECOLOR )
	//FixedCanvas.drawCellsOfId( 1, "FFFFFF" )
}

function logStats(){
	const freeCells = Object.keys( Free.getStat( CPM.PixelsByCell ) ).length
	const fixedCells = Fixed.getStat( CPM.PixelsByCell )[1].length
	// eslint-disable-next-line
	console.log( Free.time + "\t" + freeCells + "\t" + fixedCells + "\t" + ( freeCells + fixedCells ) )
}

function step(){
	for( let i = 0; i < 1; i++ ){
		Fixed.timeStep()
		Free.timeStep()
		meter.tick()
		t++
	}
	draw()
	logStats()
}

