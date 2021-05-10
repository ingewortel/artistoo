

import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"

/** This constraint encourages that cells stay 'connected' throughout any copy attempts.
In contrast to the hard version of the {@link ConnectivityConstraint}, this version does
not completely forbid copy attempts that break the cell connectivity, but punishes them
through a positive term in the Hamiltonian. 
@experimental
*/
class SoftConnectivityConstraint extends SoftConstraint {

	/** The constructor of the ConnectivityConstraint requires a conf object with one parameter.
	@param {object} conf - parameter object for this constraint.
	@param {PerKindBoolean} conf.LAMBDA_CONNECTIVITY - should the cellkind be connected or not?
	*/
	constructor( conf ){
		super(conf)
		
		/** Object tracking the borderpixels of each cell. This is kept up to date after
		every copy attempt.
		@type {CellObject}*/
		this.borderpixelsbycell = {}
		
		this.components = []
	}
	
	/** The set CPM method attaches the CPM to the constraint. */
	set CPM(C){
		super.CPM = C
		
		/** Private property used by {@link updateBorderPixels} to track borders. 
		@private
		@type {Uint16Array} */
		this._neighbours = new Uint16Array(this.C.grid.p2i(this.C.extents))
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "LAMBDA_CONNECTIVITY", "KindArray", "NonNegative" )
	}
	
	/** Update the borderpixels when pixel i changes from t_old into t_new.
	@param {IndexCoordinate} i - the pixel to change
	@param {CellId} t_old - the cell the pixel belonged to previously
	@param {CellId} t_new - the cell the pixel belongs to now. */
	updateBorderPixels( i, t_old, t_new  ){
		if( t_old == t_new ) return
		if( !(t_new in this.borderpixelsbycell) ){
			this.borderpixelsbycell[t_new] = {}
		}
		const Ni = this.C.grid.neighi( i )
		const wasborder = this._neighbours[i] > 0
		// current neighbors of pixel i, set counter to zero and loop over nbh.
		this._neighbours[i] = 0
		for( let ni of Ni  ){
			// type of the neighbor.
			const nt = this.C.grid.pixti(ni)
			
			// If type is not the t_new of pixel i, nbi++ because the neighbor belongs
			// to a different cell. 
			if( nt != t_new ){
				this._neighbours[i] ++ 
			}
			
			// If neighbor type is t_old, the border of t_old may have to be adjusted. 
			// It gets an extra neighbor because the current pixel becomes t_new.
			if( nt == t_old ){
				// If this wasn't a borderpixel of t_old, it now becomes one because
				// it has a neighbor belonging to t_new
				if( this._neighbours[ni] ++ == 0 ){
					if( !(t_old in this.borderpixelsbycell) ){
						this.borderpixelsbycell[t_old] = {}
					}
					this.borderpixelsbycell[t_old][ni] = true
				}

			}
			// If type is t_new, the neighbor may no longer be a borderpixel
			if( nt == t_new ){
				if( --this._neighbours[ni] == 0 && ( ni in this.borderpixelsbycell[t_new] ) ){
					delete this.borderpixelsbycell[t_new][ni]
				}
			}
		}
		// Case 1: 
		// If current pixel is a borderpixel, add it to those of the current cell.
		if( this._neighbours[i] > 0 ){
			this.borderpixelsbycell[t_new][i]=true
		}
		
		// Case 2:
		// Current pixel was a borderpixel. Remove from the old cell. 
		if( wasborder ){
			// It was a borderpixel from the old cell, but no longer belongs to that cell.
			if( i in this.borderpixelsbycell[t_old] ){ 
				delete this.borderpixelsbycell[t_old][i]
			}
		}
		
	}
	
	/** Get the connected components of the borderpixels of the current cell.
	@param {CellId} cellid - cell to check the connected components of.
	@return {object} an array with an element for every connected component, which is in
	turn an array of the {@link ArrayCoordinate}s of the pixels belonging to that component.  */
	connectedComponentsOfCellBorder( cellid ){
	
		/* Note that to get number of connected components, we only need to look at cellborderpixels. */
		if( !( cellid in this.borderpixelsbycell ) ){
			return []
		}
		
		//let cbpi = Object.keys( this.borderpixelsbycell[cellid] ), cbpobject = this.borderpixelsbycell[cellid]
		return this.connectedComponentsOf( this.borderpixelsbycell[cellid] )
	}
	
	/** Get the connected components of a set of pixels.
	@param {object} pixelobject - an object with as keys the {@link IndexCoordinate}s of the pixels to check.
	@return {object} an array with an element for every connected component, which is in
	turn an array of the {@link ArrayCoordinate}s of the pixels belonging to that component.  */
	connectedComponentsOf( pixelobject ){
	
		let cbpi = Object.keys( pixelobject )
		
		let visited = {}, k=0, pixels = [], C = this.C
		let labelComponent = function(seed, k){
			let q = [seed]
			let cellid = C.pixti(q)
			visited[q[0]] = 1
			pixels[k] = []
			while( q.length > 0 ){
				let e = q.pop()
				pixels[k].push(C.grid.i2p(e) )
				let ne = C.grid.neighi( e )
				for( let i = 0 ; i < ne.length ; i ++ ){
					if( C.pixti( ne[i] ) == cellid &&
						!(ne[i] in visited) && (ne[i] in pixelobject) ){
						q.push(ne[i])
						visited[ne[i]]=1
					}
				}
			}
		}
		for( let i = 0 ; i < cbpi.length ; i ++ ){
			let pi = parseInt( cbpi[i] )
			if( !(pi in visited) ){
				labelComponent( pi, k )
				k++
			}
		}
		return pixels
	}
		
	/** The postSetpixListener of the ConnectivityConstraint updates the internally
	tracked borderpixels after every copy.
	@param {IndexCoordinate} i - the pixel to change
	@param {CellId} t_old - the cell the pixel belonged to previously
	@param {CellId} t - the cell the pixel belongs to now.	
	*/
	postSetpixListener(  i, t_old, t ){
		this.updateBorderPixels( i, t_old, t )
	}	
	
	
	/** To speed things up: first check if a pixel change disrupts the local connectivity
	in its direct neighborhood. If local connectivity is not disrupted, we don't have to
	check global connectivity at all. This currently only works in 2D, so it returns 
	false for 3D (ensuring that connectivity is checked globally).
	@param {IndexCoordinate} tgt_i - the pixel to change
	@param {CellId} tgt_type - the cell the pixel belonged to before the copy attempt.
	@return {boolean} does the local neighborhood remain connected if this pixel changes?
	*/
	localConnected( tgt_i, tgt_type ){
	
		// Get neighbors of the target pixel
		let nbh = this.C.grid.neighi( tgt_i )
		
		// object storing the neighbors of tgt_type
		let nbhobj = {}
		
		for( let n of nbh ){
		
			// add it and its neighbors to the neighborhood object
			if( this.C.pixti(n) == tgt_type ){
				nbhobj[n] = true
			}
		}
		
		// Get connected components.
		let conn = this.connectedComponentsOf( nbhobj )
		this.components = conn
		//console.log(conn.length)
		
		let connected = ( conn.length == 1 )
		//console.log(connected)
		return connected
		
	}
	
	/** Compute the 'connectivity' of a cell; a number between 0 and 1. If the cell
	is completely connected, this returns 1. A cell split into many parts gets a 
	connectivity approaching zero. It also matters how the cell is split: splitting
	the cell in two near-equal parts results in a lower connectivity than separating
	one pixel from the rest of the cell.
	@param {Array} components - an array of arrays (one array per connected component, 
	in which each entry is the {@link ArrayCoordinate} of a pixel belonging to that component).
	@param {CellId} cellid - the cell these components belong to.
	@return {number} connectivity of this cell.*/
	connectivity( components, cellid ){
		if( components.length <= 1 ){
			return 1
		} else {
			
			let Vtot = Object.keys( this.borderpixelsbycell[cellid] ).length
			let Ci = 0
			for( let c of components ){
				let Vc = c.length
				Ci += (Vc/Vtot)*(Vc/Vtot)
			}
			//console.log( Ci )
			return Ci
			
		}
	}
	
	/** This method checks the difference in connectivity when pixel tgt_i is changed from
	tgt_type to src_type. 
	@param {IndexCoordinate} tgt_i - the pixel to change
	@param {CellId} src_type - the new cell for this pixel.
	@param {CellId} tgt_type - the cell the pixel belonged to previously. 	
	@return {number} conndiff - the difference: connectivity_after - connectivity_before.
	*/
	checkConnected( tgt_i, src_type, tgt_type ){
	
		//return this.localConnected( tgt_i, tgt_type )
		
	
		
		if( this.localConnected( tgt_i, tgt_type ) ){
			return 0
		} 
		
		/*else {
			let conn_new = this.connectivity( this.components, tgt_type )
			
			// current components
			let nbh = this.C.grid.neighi( tgt_i )
			let nbhobj = {}
			nbhobj[tgt_i] = true
		
			for( let n of nbh ){
				if( this.C.pixti(n) == tgt_type ){
					nbhobj[n] = true
				}
			}
			
			this.components = this.connectedComponentsOf( nbhobj )
			let conn_old = this.connectivity( this.components, tgt_type )
			
			let conndiff = conn_old - conn_new
			return conndiff
			
			
			
		}*/
		
		
	
		let comp1 = this.connectedComponentsOfCellBorder( tgt_type )
		let conn1 = Math.pow( (1-this.connectivity( comp1, tgt_type )),2 )
	
		// Update the borderpixels as if the change occurs
		this.updateBorderPixels( tgt_i, tgt_type, src_type )
		let comp = this.connectedComponentsOfCellBorder( tgt_type )
		let conn2 = Math.pow((1-this.connectivity( comp, tgt_type )),2)
		
		
		let conndiff = conn2 - conn1
		/*if( conn2 > conn1 ){
			conndiff = -conndiff
		} */
		
		// Change borderpixels back because the copy attempt hasn't actually gone through yet.
		this.updateBorderPixels( tgt_i, src_type, tgt_type )
		
		return conndiff
		
	}

	/** Method for hard constraints to compute whether the copy attempt fulfills the rule.
	 @param {IndexCoordinate} src_i - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} tgt_i - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. 
	 @return {boolean} whether the copy attempt satisfies the constraint.*/ 
	deltaH( src_i, tgt_i, src_type, tgt_type ){
		// connectedness of src cell cannot change if it was connected in the first place.
		
		let lambda = this.cellParameter("LAMBDA_CONNECTIVITY", tgt_type)
		
		// connectedness of tgt cell
		if( tgt_type != 0 && lambda > 0 ){
			return lambda*this.checkConnected( tgt_i, src_type, tgt_type )
		}
		
		return 0
	}
}

export default SoftConnectivityConstraint
