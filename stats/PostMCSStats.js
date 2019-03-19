
class PostMCSStats {
	constructor( conf ){
		this.conf = {
			trackpixels: true
		}
		Object.assign( this.conf, conf )
	}
	set CPM( C ){
		this.C = C
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
	 * component for the cell with type t */
	connectedComponentsOfCell( t, torus ){
		let visited = {}, k=0, pixels = [], C = this.C
		let labelComponent = function(seed, k){
			let q = [seed]
			visited[q[0]] = 1
			pixels[k] = []
			while( q.length > 0 ){
				let e = q.pop()
				pixels[k].push( C.grid.i2p(e) )
				let ne = C.neighi( e, torus )
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
	// converts an array of pixel coordinates to its centroid
	pixelsToCentroid( pixels ){
		let cvec, j
		// fill the array cvec with zeros first
		cvec = new Array(this.C.ndim).fill(0)
		// loop over pixels to sum up coordinates
		for( j = 0.; j < pixels.length; j++ ){
			// loop over coordinates x,y,z
			for( let dim = 0; dim < this.C.ndim; dim++ ){
				cvec[dim] += pixels[j][dim]
			}	
		}
		// divide to get mean
		for( let dim = 0; dim < this.C.ndim; dim++ ){
			cvec[dim] /= j
		}
		return cvec
	}
	centroid( t ){
		if( this.C.torus ){
			return this.centroidWithTorus( t )
		} else {
			return this.pixelsToCentroid( this.cellpixels[t] )
		}
	}
	// computes the centroid of a cell when grid has a torus.
	centroidWithTorus( t ){
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
