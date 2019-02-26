/** Class for outputting various statistics from a CPM simulation, as for instance
    the centroids of all cells (which is actually the only thing that's implemented
    so far) */

function Stats( C ){
	this.C = C
	this.ndim = this.C.ndim
}

Stats.prototype = {

	// ------------  FRC NETWORK 

	// for simulation on FRC network. Returns all cells that are in contact with
	// a stroma cell.
	cellsOnNetwork : function(){
		var px = this.C.cellborderpixels.elements, i,j, N, r = {}, t
		for( i = 0 ; i < px.length ; i ++ ){
			t = this.C.pixti( px[i] )
			if( r[t] ) continue
			N = this.C.neighi(  px[i] )
			for( j = 0 ; j < N.length ; j ++ ){
				if( this.C.pixti( N[j] ) < 0 ){
					r[t]=1; break
				}
			}
		}
		return r
	},
	
	
	// ------------  CELL LENGTH IN ONE DIMENSION
	// (this does not work with a grid torus).
		
	// For computing mean and variance with online algorithm
	updateOnline : function( aggregate, value ){
		
		var delta, delta2

		aggregate.count ++
		delta = value - aggregate.mean
		aggregate.mean += delta/aggregate.count
		delta2 = value - aggregate.mean
		aggregate.sqd += delta*delta2

		return aggregate
	},
	newOnline : function(){
		return( { count : 0, mean : 0, sqd : 0 } ) 
	},
	// return mean and variance of coordinates in a given dimension for cell t
	// (dimension as 0,1, or 2)
	cellStats : function( t, dim ){

		var aggregate, cpt, j, stats

		// the cellpixels object can be given as the third argument
		if( arguments.length == 3){
			cpt = arguments[2][t]
		} else {
			cpt = this.cellpixels()[t]
		}

		// compute using online algorithm
		aggregate = this.newOnline()

		// loop over pixels to update the aggregate
		for( j = 0; j < cpt.length; j++ ){
			aggregate = this.updateOnline( aggregate, cpt[j][dim] )
		}

		// get mean and variance
		stats = { mean : aggregate.mean, variance : aggregate.sqd / ( aggregate.count - 1 ) }
		return stats
	},
	// get the length (variance) of cell in a given dimension
	// does not work with torus!
	getLengthOf : function( t, dim ){
		
		// get mean and sd in x direction
		var stats = this.cellStats( t, dim )
		return stats.variance

	},
	// get the range of coordinates in dim for cell t
	// does not work with torus!
	getRangeOf : function( t, dim ){

		var minc, maxc, cpt, j

		// the cellpixels object can be given as the third argument
		if( arguments.length == 3){
			cpt = arguments[2][t]
		} else {
			cpt = this.cellpixels()[t]
		}

		// loop over pixels to find min and max
		minc = cpt[0][dim]
		maxc = cpt[0][dim]
		for( j = 1; j < cpt.length; j++ ){
			if( cpt[j][dim] < minc ) minc = cpt[j][dim]
			if( cpt[j][dim] > maxc ) maxc = cpt[j][dim]
		}
		
		return( maxc - minc )		

	},
	
	// ------------  CONNECTEDNESS OF CELLS
	// ( compatible with torus )
	
	// Compute connected components of the cell ( to check connectivity )
	getConnectedComponentOfCell : function( t, cellindices ){
		if( cellindices.length == 0 ){ return }

		var visited = {}, k=1, volume = {}, myself = this

		var labelComponent = function(seed, k){
			var q = [parseInt(seed)]
			visited[q[0]] = 1
			volume[k] = 0
			while( q.length > 0 ){
				var e = parseInt(q.pop())
				volume[k] ++
				var ne = myself.C.neighi( e )
				for( var i = 0 ; i < ne.length ; i ++ ){
					if( myself.C.pixti( ne[i] ) == t &&
						!visited.hasOwnProperty(ne[i]) ){
						q.push(ne[i])
						visited[ne[i]]=1
					}
				}
			}
		}

		for( var i = 0 ; i < cellindices.length ; i ++ ){
			if( !visited.hasOwnProperty( cellindices[i] ) ){
				labelComponent( cellindices[i], k )
				k++
			}
		}

		return volume
	},
	getConnectedComponents : function(){
	
		let cpi
	
		if( arguments.length == 1 ){
			cpi = arguments[0]
		} else {
			cpi = this.cellpixelsi()
		}

		const tx = Object.keys( cpi )
		let i, volumes = {}
		for( i = 0 ; i < tx.length ; i ++ ){
			volumes[tx[i]] = this.getConnectedComponentOfCell( tx[i], cpi[tx[i]] )
		}
		return volumes
	},	
	
	// Compute probabilities that two pixels taken at random come from the same cell.
	getConnectedness : function(){
	
		let cpi
	
		if( arguments.length == 1 ){
			cpi = arguments[0]
		} else {
			cpi = this.cellpixelsi()
		}
	
		const v = this.getConnectedComponents( cpi )
		let s = {}, r = {}, i, j
		for( i in v ){
			s[i] = 0
			r[i] = 0
			for( j in v[i] ){
				s[i] += v[i][j]
			}
			for( j in v[i] ){
				r[i] += (v[i][j]/s[i]) * (v[i][j]/s[i])
			}
		}
		return r
	},	
	
	// ------------  PROTRUSION ANALYSIS: PERCENTAGE ACTIVE / ORDER INDEX 
	// ( compatible with torus )
	
	// Compute percentage of pixels with activity > threshold
	getPercentageActOfCell : function( t, cellindices, threshold ){
		if( cellindices.length == 0 ){ return }
		var i, count = 0

		for( i = 0 ; i < cellindices.length ; i ++ ){
			if( this.C.pxact( cellindices[i] ) > threshold ){
				count++
			}
		}
		return 100*(count/cellindices.length)
	
	},
	getPercentageAct : function( threshold ){
	
		let cpi
	
		if( arguments.length == 2 ){
			cpi = arguments[1]
		} else {
			cpi = this.cellpixelsi()
		}
	
		const tx = Object.keys( cpi )
		let i, activities = {}
		for( i = 0 ; i < tx.length ; i ++ ){
			activities[tx[i]] = this.getPercentageActOfCell( tx[i], cpi[tx[i]], threshold )
		}
		return activities
	
	},
	// Computing an order index of the activity gradients within the cell.
	getGradientAt : function( t, i ){
	
		var gradient = []
		
		// for computing index of neighbors in x,y,z dimension:
		var diff = [1, this.C.dy, this.C.dz ] 
		
		var d, neigh1, neigh2, t1, t2, ai = this.C.pxact( i ), terms = 0
		
		for( d = 0; d < this.C.ndim; d++ ){
			// get the two neighbors and their types
			neigh1 = i - diff[d]
			neigh2 = i + diff[d]
			t1 = this.C.cellpixelstype[ neigh1 ]
			t2 = this.C.cellpixelstype[ neigh2 ]
			
			// start with a zero gradient
			gradient[d] = 0.00
			
			// we will average the difference with the left and right neighbor only if both
			// belong to the same cell. If only one neighbor belongs to the same cell, we
			// use that difference. If neither belongs to the same cell, the gradient
			// stays zero.
			if( t == t1 ){
				gradient[d] += ( ai - this.C.pxact( neigh1 ) )
				terms++
			}
			if( t == t2 ){
				gradient[d] += ( this.C.pxact( neigh2 ) - ai )
				terms++
			}
			if( terms != 0 ){
				gradient[d] = gradient[d] / terms
			}		
						
		}
		
		return gradient
		
	},
	// compute the norm of a vector (in array form)
	norm : function( v ){
		var i
		var norm = 0
		for( i = 0; i < v.length; i++ ){
			norm += v[i]*v[i]
		}
		norm = Math.sqrt( norm )
		return norm
	},
	getOrderIndexOfCell : function( t, cellindices ){
	
		if( cellindices.length == 0 ){ return }
		
		// create an array to store the gradient in. Fill it with zeros for all dimensions.
		var gradientsum = [], d
		for( d = 0; d < this.C.ndim; d++ ){
			gradientsum.push(0.0)
		}
		
		// now loop over the cellindices and add gi/norm(gi) to the gradientsum for each
		// non-zero local gradient:
		var j
		for( j = 0; j < cellindices.length; j++ ){
			var g = this.getGradientAt( t, cellindices[j] )
			var gn = this.norm( g )
			// we only consider non-zero gradients for the order index
			if( gn != 0 ){
				for( d = 0; d < this.C.ndim; d++ ){
					gradientsum[d] += 100*g[d]/gn/cellindices.length
				}
			}
		}
		
		
		// finally, return the norm of this summed vector
		var orderindex = this.norm( gradientsum )
		return orderindex	
	},
	getOrderIndices : function( ){
		var cpi = this.cellborderpixelsi()
		var tx = Object.keys( cpi ), i, orderindices = {}
		for( i = 0 ; i < tx.length ; i ++ ){
			orderindices[tx[i]] = this.getOrderIndexOfCell( tx[i], cpi[tx[i]] )
		}
		return orderindices
	
	},
	
	// ------------  CENTROIDS
	// ( compatible with torus )
	//
	// computation of cell centroid is more complicated when the grid is a torus.
	// We compute connected components of the cell with the option torus = false in
	// the computation of neighbourhoods, which means that pixels crossing the border
	// are not considered neighbours (see CPM.js ). We then compute the total centroid as
	// a weighted average of the centroids of the connected components, which we correct
	// separately if they cross the grid borders. 
	
	// Return connected components of the cell ( to compute centroids )
	returnConnectedComponentOfCell : function( t, cellindices ){
		if( cellindices.length == 0 ){ return }

		var visited = {}, k=1, pixels = {}, myself = this

		var labelComponent = function(seed, k){
			var q = [parseInt(seed)]
			visited[q[0]] = 1
			pixels[k] = []
			while( q.length > 0 ){
				var e = parseInt(q.pop())
				pixels[k].push( myself.C.i2p(e) )
				var ne = myself.C.neighi( e, false )
				for( var i = 0 ; i < ne.length ; i ++ ){
					if( !isNaN( ne[i] ) ){
						if( myself.C.pixti( ne[i] ) == t &&
							!visited.hasOwnProperty(ne[i]) ){
							q.push(ne[i])
							visited[ne[i]]=1
						}
					
					}

				}
			}
		}

		for( var i = 0 ; i < cellindices.length ; i ++ ){
			if( !visited.hasOwnProperty( cellindices[i] ) ){
				labelComponent( cellindices[i], k )
				k++
			}
		}

		return pixels
	},
	// converts an array of pixel coordinates to its centroid
	pixelsToCentroid : function( cellpixels ){
		let cvec, j

		// fill the array cvec with zeros first
		cvec = Array.apply(null, Array(this.ndim)).map(Number.prototype.valueOf,0)

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
	},

	// computes the centroid of a cell when grid has a torus.
	getCentroidOfCellWithTorus : function( t, cellindices ){
		
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
	},	
	// center of mass of cell t; cellpixels object can be given as the second argument
	getCentroidOf : function( t ){
		var cvec, cpt
		if( arguments.length == 2 ){
			cpt = arguments[1]
		} else {
			cpt = this.cellpixelsi()
		}
		
		cvec = this.getCentroidOfCellWithTorus( t, cpt[t] )

		return cvec
	},
	// center of mass (return)
	getCentroids : function(){
		
		let cpi
	
		if( arguments.length == 1 ){
			cpi = arguments[0]
		} else {
			cpi = this.cellpixelsi()
		}
	
		const tx = Object.keys( cpi )
		let cvec, r = [], current, i

		// loop over the cells in tx to get their centroids
		for( i = 0; i < tx.length; i++ ){
			cvec = this.getCentroidOf( tx[i], cpi[tx[i]] )

			// output depending on ndim
			current = { id : tx[i], x : cvec[0], y : cvec[1] }
			if( this.ndim == 3 ){
				current["z"] = cvec[2]			
			}
			r.push( current )
		}
		return r
	},
	// center of mass (print to console)
	centroids : function(){
		var cp = this.cellpixelsi()
		var tx = Object.keys( cp )	
		var cvec, i

		// loop over the cells in tx to get their centroids
		for( i = 0; i < tx.length; i++ ){
			cvec = this.getCentroidOf( tx[i], cp[tx[i]] )

			// eslint-disable-next-line no-console
			console.log( 
				tx[i] + "\t" +
				this.C.time + "\t" +
				this.C.time + "\t" +
				cvec.join("\t")
			)

		}
	},

	// returns a list of all cell ids of the cells that border to "cell" and are of a different type
	// a dictionairy with keys = neighbor cell ids, and 
	// values = number of "cell"-pixels the neighbor cell borders to
	cellNeighborsList : function( cell, cbpi ) {
		if (!cbpi) {
			cbpi = this.cellborderpixelsi()[cell]
		} else {
			cbpi = cbpi[cell]
		}
		let neigh_cell_amountborder = {}
		//loop over border pixels of cell
		for ( let cellpix = 0; cellpix < cbpi.length; cellpix++ ) {
			//get neighbouring pixels of borderpixel of cell
			let neighbours_of_borderpixel_cell = this.C.neighi(cbpi[cellpix])
			//don't add a pixel in cell more than twice
			//loop over neighbouring pixels and store the parent cell if it is different from
			//cell, add or increment the key corresponding to the neighbor in the dictionairy
			for ( let neighborpix = 0; neighborpix < neighbours_of_borderpixel_cell.length;
				neighborpix ++ ) {
				let cell_id = this.C.pixti(neighbours_of_borderpixel_cell[neighborpix])
				if (cell_id != cell) {
					neigh_cell_amountborder[cell_id] = neigh_cell_amountborder[cell_id]+1 || 1
				}
			}
		}
		return neigh_cell_amountborder
	},

	// ------------ HELPER FUNCTIONS
	
	// returns an object with a key for each celltype (identity). 
	// The corresponding value is an array of pixel coordinates per cell.
	cellpixels : function(){
		var cp = {}
		var px = Object.keys( this.C.cellpixelstype ), t, i
		for( i = 0 ; i < px.length ; i ++ ){
			t = this.C.cellpixelstype[px[i]]
			if( !(t in cp ) ){
				cp[t] = []
			}
			cp[t].push( this.C.i2p( px[i] ) )
		}
		return cp
	},

	cellpixelsi : function(){
		var cp = {}
		var px = Object.keys( this.C.cellpixelstype ), t, i
		for( i = 0 ; i < px.length ; i ++ ){
			t = this.C.cellpixelstype[px[i]]
			if( !(t in cp ) ){
				cp[t] = []
			}
			cp[t].push( px[i] )
		}
		return cp
	},
  
	cellborderpixelsi : function(){
		let cp = {}, t
		const px = this.C.cellborderpixels.elements
		for( let i = 0; i < px.length; i++ ){
			t = this.C.cellpixelstype[px[i]]
			if( !(t in cp ) ){
				cp[t] = []
			}
			cp[t].push( px[i] )
		}
		return cp		
	}

}


export default Stats

