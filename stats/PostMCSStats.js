
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
	connectedComponentsOfCell( t ){
		let visited = {}, k=1, pixels = {}, C = this.C
		let labelComponent = function(seed, k){
			let q = [seed]
			visited[q[0]] = 1
			pixels[k] = []
			while( q.length > 0 ){
				let e = q.pop()
				pixels[k].push( C.grid.i2p(e) )
				let ne = C.neighi( e, false )
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
	pixelsToCentroid( cellpixels ){
		let cvec, j
		// fill the array cvec with zeros first
		cvec = new Array(this.C.ndim).fill(0)

		// loop over pixels to sum up coordinates
		for( j = 0; j < cellpixels.length; j++ ){
			// loop over coordinates x,y,z
			for( let dim = 0; dim < this.ndim; dim++ ){
				cvec[dim] += cellpixels[j][dim]
			}	
		}
		// divide to get mean
		for( let dim = 0; dim < this.ndim; dim++ ){
			cvec[dim] /= j
		}
		return cvec
	}
	// computes the centroid of a cell when grid has a torus.
	getCentroidOfCellWithTorus( t, cellindices ){
		
		if( cellindices.length == 0 ){ return }
		
		// get the connected components and the pixels in it
		let ccpixels = this.returnConnectedComponentOfCell( t, cellindices )
		
		// centroid of the first component
		let c = Object.keys( ccpixels )
		let centroid0 = this.pixelsToCentroid( ccpixels[ c[0] ] )

		// loop over the connected components to compute a weighted sum of their 
		// centroids.
		let n = 0, 
			centroid = Array.apply(null, Array(this.ndim)).map(Number.prototype.valueOf,0)
		const fs = [ this.C.field_size.x, this.C.field_size.y, this.C.field_size.z ]
		for( let j = 0; j < c.length; j++ ){
		
			let centroidc, nc, d
			centroidc = this.pixelsToCentroid( ccpixels[ c[j] ] )
			nc = ccpixels[ c[j] ].length
			n += nc
			
			// compute weighted sum. 
			for( d = 0; d < this.ndim; d++ ){
			
				// If centroid is more than half the field size away
				// from the first centroid0, it crosses the border, so we 
				// first correct its coordinates.
				if( centroidc[d] - centroid0[d] > fs[d]/2 ){
					centroidc[d] -= fs[d]
				}
				if( centroidc[d] - centroid0[d] < -fs[d]/2 ){
					centroidc[d] += fs[d]
				}
				
				centroid[d] += centroidc[d] * nc
			}
			
		}
		
		// divide by the total n to get the mean
		let d
		for( d = 0; d < this.ndim; d++ ){
			centroid[d] /= n
		}

		return centroid		
	}
}

export default  PostMCSStats 
