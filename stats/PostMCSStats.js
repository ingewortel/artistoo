
class PostMCSStats {
	constructor( conf ){
		this.conf = {
			trackpixels: true
		}
		Object.assign( this.conf, conf )
	}
	set CPM( C ){
		this.C = C
		this.halfsize = new Array(C.ndim).fill(0)
		for( let i = 0 ; i < C.ndim ; i ++ ){
			this.halfsize[i] = C.extents[i]/2
		}
	}
	postMCSListener(){
		if( this.conf.trackpixels ){
			this.cellpixels = {}
			for( let i of this.C.cellIDs() ){
				this.cellpixels[i] = []
			}
			for( let [p,i] of this.C.cellPixels() ){
				this.cellpixels[i].push( p )
			}
		}
	}
	/* Return an array with the pixel coordinates of each connected
	 * component for the cell with type t
	 *
	 * TODO this function appears to be extremely slow. 
	 * Avoid calling this at all costs 
	 * if possible. */
	connectedComponentsOfCell( t, torus ){
		let visited = {}, k=0, pixels = [], C = this.C
		let labelComponent = function(seed, k){
			let q = [seed]
			visited[q[0]] = 1
			pixels[k] = []
			while( q.length > 0 ){
				let e = q.pop()
				pixels[k].push( C.grid.i2p(e) )
				let ne = C.grid.neighi( e, torus )
				for( let i = 0 ; i < ne.length ; i ++ ){
					if( C.pixti( ne[i] ) == t &&
						!(ne[i] in visited) ){
						q.push(ne[i])
						visited[ne[i]]=1
					}
				}
			}
		}
		for( let i = 0 ; i < this.cellpixels[t].length ; i ++ ){
			let pi = this.C.grid.p2i( this.cellpixels[t][i] )
			if( !(pi in visited) ){
				labelComponent( pi, k )
				k++
			}
		}
		return pixels
	}
	/* converts an array of pixel coordinates to its centroid.
	Includes a correction for pixels that are "too far apart", such
	   that meaningful centroids will be computed if the cell resides on 
	 a torus grid. */
	pixelsToCentroid( pixels ){
		let cvec = new Array(this.C.ndim).fill(0)
		for( let dim = 0 ; dim < this.C.ndim ; dim ++ ){
			let mi = 0.
			// compute mean per dimension with online algorithm
			for( let j = 0 ; j < pixels.length ; j ++ ){
				let dx = pixels[j][dim] - mi
				mi += dx/(j+1)
			}
			cvec[dim] = mi
		}
		return cvec
	}
	/*
	 * Computes a simple cell centroid.
	 */
	centroid( t ){
		return this.pixelsToCentroid( this.cellpixels[t] )
	}

	/*
	 * Computes the centroid of a cell when grid has a torus.
	 * Assumption: cell pixels never extend for more than half the
	 * size of the grid.
	 */
	centroidWithTorusCorrection( t ){
		const pixels = this.cellpixels[t]
		let cvec = new Array(this.C.ndim).fill(0)
		for( let dim = 0 ; dim < this.C.ndim ; dim ++ ){
			let mi = 0.
			const hsi = this.halfsize[dim], si = this.C.extents[dim]
			// compute mean per dimension with online algorithm
			for( let j = 0 ; j < pixels.length ; j ++ ){
				let dx = pixels[j][dim] - mi
				if( j > 0 ){
					if( dx > hsi ){
						dx -= si
					} else if( dx < -hsi ){
						dx += si
					}
				}
				mi += dx/(j+1)
			}
			if( mi < 0 ){
				mi += si
			} else if( mi > si ){
				mi -= si
			}
			cvec[dim] = mi
		}
		return cvec
	}


	/*
	 * Computes the centroid of a cell when grid has a torus.
	 * This is an older, slower implementation based on connected
	 * components. */
	centroidWithTorusSlow( t ){
		// get the connected components and the pixels in it
		let ccpixels = this.connectedComponentsOfCell( t, false )
	
		if( ccpixels.length == 0 ){
			return (void 0)
		}

		// centroid of the first component
		let centroid0 = this.pixelsToCentroid( ccpixels[ 0 ] )

		// loop over the connected components to compute a weighted sum of their 
		// centroids.
		let n = 0, 
			centroid = new Array(this.C.ndim).fill(0)
		const fs = this.C.extents
		for( let j = 0; j < ccpixels.length ; j++ ){
			let centroidc, nc, d
			centroidc = this.pixelsToCentroid( ccpixels[ j ] )
			nc = ccpixels[ j ].length
			n += nc


			// compute weighted sum. 
			for( d = 0; d < this.C.ndim; d++ ){
				// If centroid is more than half the field size away
				// from the first centroid0, it crosses the border, so we 
				// first correct its coordinates.
				if( centroidc[d] - centroid0[d] > fs[d]/2 ){
					centroidc[d] -= fs[d]
				} else if( centroidc[d] - centroid0[d] < -fs[d]/2 ){
					centroidc[d] += fs[d]
				}
				centroid[d] += centroidc[d] * nc
			}
			
		}
		
		// divide by the total n to get the mean
		for( let d = 0; d < this.C.ndim; d++ ){
			centroid[d] /= n
			while( centroid[d] < 0 ){
				centroid[d] += fs[d]
			}
			while( centroid[d] > fs[d] ){
				centroid[d] -= fs[d]
			}
		}

		return centroid		
	}
}

export default  PostMCSStats 
