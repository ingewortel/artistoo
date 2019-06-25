/* This class contains methods that should be executed once per monte carlo step.
   Examples are cell division, cell death etc.
 */


class GridInitializer {
	constructor( C ){
		this.C = C
	}
	/* Seed a new cell at a random position. Return 0 if failed, ID of new cell otherwise.
	 * Try a specified number of times, then give up if grid is too full. 
	 * The first cell will always be seeded at the midpoint of the grid. */
	seedCell( kind, max_attempts = 10000 ){
		let p = this.C.midpoint
		while( this.C.pixt( p ) != 0 && max_attempts-- > 0 ){
			for( let i = 0 ; i < p.length ; i ++ ){
				p[i] = this.C.ran(0,this.C.extents[i]-1)
			}
		}
		if( this.C.pixt(p) != 0 ){
			return 0 // failed
		}
		const newid = this.C.makeNewCellID( kind )
		this.C.setpix( p, newid )
		return newid
	}
	/* Seed a new cell of celltype "kind" onto position "p".*/
	seedCellAt( kind, p ){
		const newid = this.C.makeNewCellID( kind )
		this.C.setpix( p, newid )
		return newid
	}
	seedCellsInCircle( kind, n, center, radius, max_attempts = 10000 ){
		if( !max_attempts ){
			max_attempts = 10*n
		}
		let C = this.C
		while( n > 0 ){
			if( --max_attempts == 0 ){
				throw("too many attempts to seed cells!")
			}
			let p = center.map( function(i){ return C.ran(Math.ceil(i-radius),Math.floor(i+radius)) } )
			let d = 0
			for( let i = 0 ; i < p.length ; i ++ ){
				d += (p[i]-center[i])*(p[i]-center[i])
			}
			if( d < radius*radius ){
				this.seedCellAt( kind, p )
				n--
			}
		}
	}
}


export default GridInitializer

