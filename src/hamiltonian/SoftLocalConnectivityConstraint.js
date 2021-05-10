
import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"

/** Soft version of the {@link ConnectivityConstraint} which only checks local connectivity.
@experimental
*/
class SoftLocalConnectivityConstraint extends SoftConstraint {

	/** The constructor of the SoftLocalConnectivityConstraint requires a conf object with one or two parameters.
	@param {object} conf - parameter object for this constraint.
	@param {PerKindBoolean} conf.LAMBDA_CONNECTIVITY - strength of the penalty for breaking connectivity.
	#param {string} conf.NBH_TYPE - should a Neumann (default) or Moore neighborhood be used to determine
	whether the cell locally stays connected? The default is Neumann since the Moore neighborhood tends to
	give artefacts. Also, LAMBDA should be much higher if the Moore neighborhood is used. 
	*/
	constructor( conf ){
		super(conf)
		
		/** Should a Neumann or Moore neighborhood be used for determining connectivity?
		See {@link SoftLocalConnectivityConstraint#constructor} for details.
		@type {string}*/
		this.nbhtype = "Neumann"
	}
	
	/** The set CPM method attaches the CPM to the constraint. It checks whether the
	CPM is 2D or 3D, because this constraint is currently only tested in 2D. */
	set CPM(C){
		super.CPM = C
		
		if( this.C.ndim != 2 ){
			throw("You are trying to add a SoftLocalConnectivityConstraint to a 3D CPM, but this constraint is currently only supported in 2D!")
		}
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "LAMBDA_CONNECTIVITY", "KindArray", "NonNegative" )

		//
		if( "NBH_TYPE" in this.conf ){
			let v = this.conf["NBH_TYPE"]
			let values = [ "Neumann", "Moore" ]
			let found = false
			for( let val of values ){
				if( val == v ){
					found = true
					this.nbhtype = val
				}
			}
			if( !found ){
				throw( "In the SoftLocalConnectivityConstraint, NBH_TYPE must be either 'Neumann' or 'Moore'")
			}
		}

	}
	
	/** Get the connected components of a set of pixels.
	@param {object} pixelobject - an object with as keys the {@link IndexCoordinate}s of the pixels to check.
	@return {object} an array with an element for every connected component, which is in
	turn an array of the {@link ArrayCoordinate}s of the pixels belonging to that component.  */
	connectedComponentsOf( pixelobject ){
	
		let cbpi = Object.keys( pixelobject )
		
		let visited = {}, k=0, pixels = [], C = this.C, nbhtype = this.nbhtype
		let labelComponent = function(seed, k){
			let q = [seed]
			let cellid = C.pixti(q)
			visited[q[0]] = 1
			pixels[k] = []
			while( q.length > 0 ){
				let e = q.pop()
				pixels[k].push(C.grid.i2p(e) )
				
				if( nbhtype == "Neumann" ){
					for( let i of C.grid.neighNeumanni( e ) ){
						if( C.pixti( i ) == cellid &&
							!(i in visited) && (i in pixelobject) ){
							q.push(i)
							visited[i]=1
						}
					}
				} else {
					let ne = C.grid.neighi(e)
					for( let j = 0; j < ne.length; j++ ){
					
						let i = ne[j]
						if( C.pixti( i ) == cellid &&
							!(i in visited) && (i in pixelobject) ){
							q.push(i)
							visited[i]=1
						}
					}
				
				}
				
				
				
				//let ne = C.grid.neighi( e )
				
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

	/** This method checks if the connectivity still holds after pixel tgt_i is changed from
	tgt_type to src_type. 
	@param {IndexCoordinate} tgt_i - the pixel to change
	@param {CellId} src_type - the new cell for this pixel.
	@param {CellId} tgt_type - the cell the pixel belonged to previously. 	
	@return {number} 1 if connectivity is broken, 0 if the connectivity remains. 
	*/
	checkConnected( tgt_i, src_type, tgt_type ){
	
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
		//console.log(conn.length)
		
		let disconnected = 0
		if( conn.length > 1 ){
			disconnected = 1
		}
		return disconnected
		
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
		
		// connectedness of tgt cell. Only check when the lambda is non-zero.
		if( tgt_type != 0 && lambda > 0 ){
			return lambda*this.checkConnected( tgt_i, src_type, tgt_type )
		}
		
		return 0
	}

	

}

export default SoftLocalConnectivityConstraint
