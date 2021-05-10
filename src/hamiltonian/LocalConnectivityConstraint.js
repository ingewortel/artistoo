

import HardConstraint from "./HardConstraint.js"
import ParameterChecker from "./ParameterChecker.js"

/** Version of the {@link ConnectivityConstraint} which only checks local
 * connectivity.
 * @experimental
 * */
class LocalConnectivityConstraint extends HardConstraint {

	/** The constructor of the LocalConnectivityConstraint requires a conf
	 * object with one parameter.
	 * @param {object} conf - parameter object for this constraint.
	 * @param {PerKindBoolean} conf.CONNECTED - should the cellkind be connected
	 * or not?
	 * */
	constructor( conf ){
		super(conf)
	}
	

	/** This method checks that all required parameters are present in the
	 * object supplied to the constructor, and that they are of the right
	 * format. It throws an error when this is not the case.
	 * */
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "CONNECTED", "KindArray", "Boolean" )
	}
	
	/** Get the connected components of a set of pixels.
	 * @param {object} pixelObject - an object with as keys the
	 * {@link IndexCoordinate}s of the pixels to check.
	 * @return {object} an array with an element for every connected component,
	 * which is in turn an array of the {@link ArrayCoordinate}s of the pixels
	 * belonging to that component.
	 * */
	connectedComponentsOf( pixelObject ){
	
		let cbpi = Object.keys( pixelObject )
		
		let visited = {}, k=0, pixels = [], C = this.C
		let labelComponent = function(seed, k){
			let q = [seed]
			let cellId = C.grid.pixti(q)
			visited[q[0]] = 1
			pixels[k] = []
			while( q.length > 0 ){
				let e = q.pop()
				pixels[k].push(C.grid.i2p(e) )
				let ne = C.grid.neighi( e )
				for( let i = 0 ; i < ne.length ; i ++ ){
					if( C.grid.pixti( ne[i] ) === cellId &&
						!(ne[i] in visited) && (ne[i] in pixelObject) ){
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

	
	/** This method checks if the connectivity still holds after pixel tgt_i is
	 * changed from tgt_type to src_type.
	 * @param {IndexCoordinate} tgt_i - the pixel to change.
	 * @param {CellId} src_type - the new cell for this pixel.
	 * @param {CellId} tgt_type - the cell the pixel belonged to previously.
	 * */
	checkConnected( tgt_i, src_type, tgt_type ){
	
		// Get neighbors of the target pixel
		let nbh = this.C.grid.neighi( tgt_i )
		
		// object storing the neighbors of tgt_type
		let nbhObj = {}
		
		for( let n of nbh ){
		
			// add it and its neighbors to the neighborhood object
			if( this.C.grid.pixti(n) === tgt_type ){
				nbhObj[n] = true
			}
			
			/*for( let i of this.C.grid.neighi(n) ){
			
				if( ( this.C.grid.pixti(i) == tgt_type ) && !( i == tgt_i ) ){
					nbhObj[i] = true
				}
			}*/
		}
		
		// Get connected components.
		let conn = this.connectedComponentsOf( nbhObj )
		
		return ( conn.length === 1 )
		
	}

	/** Method for hard constraints to compute whether the copy attempt fulfills
	 * the rule.
	 * @param {IndexCoordinate} src_i - coordinate of the source pixel that
	 * tries to copy.
	 * @param {IndexCoordinate} tgt_i - coordinate of the target pixel the
	 * source is trying to copy into.
	 * @param {CellId} src_type - cellId of the source pixel.
	 * @param {CellId} tgt_type - cellId of the target pixel.
	 * @return {boolean} whether the copy attempt satisfies the constraint.
	 * */
	fulfilled( src_i, tgt_i, src_type, tgt_type ){
		// connectedness of src cell cannot change if it was connected in the first place.
		
		// connectedness of tgt cell
		if( tgt_type !== 0 && this.cellParameter("CONNECTED",tgt_type) ){
			return this.checkConnected( tgt_i, src_type, tgt_type )
		}
		
		return true
	}
}

export default LocalConnectivityConstraint
