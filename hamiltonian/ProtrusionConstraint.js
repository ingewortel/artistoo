/* 
	
 */

import SoftConstraint from "./SoftConstraint.js"

class ProtrusionConstraint extends SoftConstraint {
	constructor( conf ){
		super( conf )

		this.cellpixelsact = {} // activity of cellpixels with a non-zero activity
		
		// Wrapper: select function to compute activities based on ACT_MEAN in conf
		if( this.conf.ACT_MEAN == "arithmetic" ){
			this.activityAt = this.activityAtArith
		} else {
			this.activityAt = this.activityAtGeom
		}
		
	}
	
	confChecker(){
		this.confCheckCellNonNegative( "P_DETACH" )
		this.confCheckCellNonNegative( "G_PROTRUSION" )
	}
	
	isFocalPoint( i ){
	
	}
	
	G( kind ){
		return this.conf["G_PROTRUSION"][kind]
	}
	
	distance( p1, p2 ){
		let dim = p1.length
		let distance = 0
		for( let d = 0; d < dim; d++ ){
			distance += ( p1[d] - p2[d] )*( p1[d] - p2[d] )
		}
		return Math.sqrt( distance )
	}
	
	getCentroid( cellid ){
		let centroids = this.C.getStat( CentroidsWithTorusCorrection )
		return centroids[cellid] 
	}
	
	/* ======= Protrusion constraint ======= */

	/* Hamiltonian computation */ 
	deltaH ( sourcei, targeti, src_type, tgt_type ){

		let deltaH = 0
		const src_kind = this.C.cellKind( src_type )
		const tgt_kind = this.C.cellKind( tgt_type )
		
		// Penalty P_detach if a focal point detaches (if the copy goes into
		// a focal point)
		if( this.isFocalPoint( targeti ) ){
			deltaH += this.conf["P_DETACH"][tgt_kind]
		}
		
		// If the source is a focal point, this means the focal point will move.
		// This will change its distance to the center of mass of the cell, and thus
		// the potential in H. Update it accordingly. 
		if( this.isFocalPoint( sourcei ) ){
			let centroid = this.getCentroid( src_type )
		
			let sourcep = this.C.grid.i2p( sourcei )
			let targetp = this.C.grid.i2p( targeti )
		
			let H_before = this.G( src_kind ) / this.distance( sourcep, centroid )
			let H_after = this.G( src_kind ) / this.distance( targetp, centroid )
			
			deltaH += H_after - H_before
			
		}
		
		return deltaH
	}


}

export default ProtrusionConstraint
