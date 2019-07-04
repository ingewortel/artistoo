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
	/* Add an entire plane to an array of pixel coordinates. This array is given 
	as first argument but can be empty. The plane is specified by setting the x/y/z
	coordinate (coded by coord = 0/1/2 for x/y/z) to a fixed value [coordvalue], while
	letting the other coordinates range from their min value 0 to their max value. */
	makePlane ( voxels, coord, coordvalue ){
		let x,y,z
		let minc = [0,0,0]
		let maxc = [this.C.field_size.x-1, this.C.field_size.y-1, 0]
		if( this.C.ndim == 3 ){ maxc[2] = this.C.field_size.z-1 }
		minc[coord] = coordvalue
		maxc[coord] = coordvalue

		// For every coordinate x,y,z, loop over all possible values from min to max.
		// one of these loops will have only one iteration because min = max = coordvalue.
		for( x = minc[0]; x <= maxc[0]; x++ ){
			for( y = minc[1]; y<=maxc[1]; y++ ){
				for( z = minc[2]; z<=maxc[2]; z++ ){
					if( this.C.ndim == 3 ){
						voxels.push( [x,y,z] )	
					} else {
						//console.log(x,y)
						voxels.push( [x,y] )
					}
				}
			}
		}

		return voxels
	}
	/* Convert all pixels in a given array to a specific cellkind */
		/* Change the pixels defined by voxels (array of coordinates p) into
	   the given cellkind. */
	changeKind ( voxels, cellkind ){
		
		let newid = this.C.makeNewCellID( cellkind )
		for( let p of voxels ){
			this.C.setpix( p, newid )
		}
		
	}
}


export default GridInitializer

