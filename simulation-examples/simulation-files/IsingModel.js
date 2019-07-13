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
class IsingModel extends CPM.Simulation {
	constructor( config ){
		
		super( config )
		this.cid = 0
		
	}

	
	// Implement some method to initialize the Grid should be implemented in each simulation.
	initializeGrid(){
	
	
		// Create a cell (other than background)
		this.cid = this.C.makeNewCellID(1)
		let cid = this.cid 
		
		// For all non-stromaborder pixels in the grid: assign it randomly
		// to either background or cell.
		for( let i = 1 ; i < this.C.extents[0] ; i ++ ){
			for( let j = 1 ; j < this.C.extents[1] ; j ++ ){	
				if( this.C.random() < 0.49 ){
					this.C.setpix( [ i,j ], cid )
				} else {
					if( this.C.pixt( [i,j] ) ){
						this.C.setpix( [i,j], 0 )
					}
				}
			}
		}


	}
	
	// Computing and logging stats.
	// Centroids are not really meaningful here so we'll log volume.
	logStats(){
		
		// compute volume of all non-background		
		for( let cid of this.C.cellIDs() ){
		
			let volume = this.C.getVolume( cid )
			
			// eslint-disable-next-line no-console
			console.log( this.time + "\t" + cid + "\t" + 
				this.C.cellKind(cid) + "\t" + volume )
			
		}

	}


	// Change step to reinitialize grid when one of the cells disappears
	step(){
		this.C.monteCarloStep()
		
		for( let cid of this.C.cellIDs() ){
			let vol = this.C.getVolume(cid)
			if( vol<=1 || vol==(this.C.extents[0]-1)*(this.C.extents[1]-1) ){
				this.initializeGrid()
			}
		}
		
		
		
		
		
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
	

	
}

/* This allows using the code in either the browser or with nodejs. */
if( typeof module !== "undefined" ){
	module.exports = IsingModel
}
