/* This trick allows using the code in either the browser or with nodejs. */
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
let CPMbuild
if( !isBrowser ){
	CPMbuild = require( "../../build/cpm-cjs.js")
	let CPM
} else {
	CPMbuild = CPM
}
CPM = CPMbuild


/* Write an extension of the existing simulation class */
class ManyCellsPrefDir extends CPM.Simulation {
	constructor( config ){
		
		super( config )
		
	}

	
	// Implement some method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){
	
		// add the GridManipulator if not already there and if you need it
		if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	
		// CHANGE THE CODE BELOW TO FIT YOUR SIMULATION
	
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
				// Burnin for each cell
				for( let b = 0; b < 5; b++ ){
					this.C.monteCarloStep()
				}
			}
		}
	}
	
	/* Adjusted drawing function to display the preferred direction */
	
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
			


		}
		// For drawing the preferred directions
		let ctx = this.Cim.context(), zoom = this.conf["zoom"]
		let prefdir = ( this.C.conf["LAMBDA_DIR"][ cellkind+1 ] > 0  ) || false
		ctx.beginPath()
		ctx.lineWidth = 2*zoom
		let pdc = this.constraints["PreferredDirectionConstraint"]
		for( let i of this.C.cellIDs() ){
		
			// Only draw for cells that have a preferred direction.
			//if( i == 0 ) continue
			prefdir = ( this.C.conf["LAMBDA_DIR"][ this.C.cellKind( i ) ] > 0  ) || false
			if( !prefdir ) continue
			
			ctx.moveTo( 
				pdc.cellcentroidlists[i][0][0]*zoom,
				pdc.cellcentroidlists[i][0][1]*zoom,
		       	)
			ctx.lineTo( (pdc.cellcentroidlists[i][0][0]+.1*pdc.celldirections[i][0])*zoom,
				(pdc.cellcentroidlists[i][0][1]+.1*pdc.celldirections[i][1])*zoom,
		       	)
		}
		ctx.stroke()		
		
		
	}
	


	
}

/* This allows using the code in either the browser or with nodejs. */
if( typeof module !== "undefined" ){
	module.exports = ManyCellsPrefDir
}