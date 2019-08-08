/* 
	todo:
	- what about the potential when a focal point detaches?
	- postsetpixlistener needs sourcei. This is now done with a bit of a hack,
	by caching the source of every deltaH evaluation - which should be equal to
	the source used for the setpix event. But this may go wrong if things ever happen
	in parallel.
	Alternative: let the setpix method have an optional sourcei input argument that it
	can pass on to its listeners?
 */

import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"
import Centroids from "../stats/Centroids.js"
import CentroidsWithTorusCorrection from "../stats/CentroidsWithTorusCorrection.js"


/** @experimental */
class ProtrusionConstraint extends SoftConstraint {
	constructor( conf ){
		super( conf )

		this.focalpoints = { 
			num : {},
			points : {} } // track all the cell's focal points
		
		
		this._lastrequestedcopy = []
		
	}
	
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "P_DETACH", "KindArray", "NonNegative" )
		checker.confCheckParameter( "G_PROTRUSION", "KindArray", "NonNegative" )
		// add one for N_Protrusion.
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
	
		let centroids
		if( this.C.torus ){
			centroids = this.C.getStat( CentroidsWithTorusCorrection )
		} else {
			centroids = this.C.getStat( Centroids )
		}
		
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
		
		this._lastrequestedcopy = [sourcei, targeti, src_type, tgt_type]
		
		return deltaH
	}
	
	addFocalPoint( i, cellid ){
		if( !( cellid in this.focalpoints["num"] ) ){
			this.focalpoints["num"][cellid] = 0
		}
		
		if( i in this.focalpoints["points"] ){
			throw( "Cannot add focal point i " + i + " : is already a focal point!")
		}
		if( this.C.grid.pixti(i) != cellid ){
			throw("Something went wrong! point " + i + " does not belong to cellid " + cellid + "!")
		}
		
		this.focalpoints["points"][i] = true
		this.focalpoints["num"][cellid]++
	}
	removeFocalPoint( i, cellid ){
		if( !(i in this.focalpoints["points"] ) ){
			this.log( cellid )
			this.log( this.C.grid.pixti(i))
			throw("Cannot remove focalpoint " + i + " : i is not a focal point!")

		}
		if( !( this.C.grid.pixti(i) == cellid ) ){
			this.log( cellid )
			this.log( this.C.grid.pixti(i))
			throw("Something went wrong! focalpoint " + i + " does not belong to cellid " + cellid + "!")
		}
	
		delete this.focalpoints["points"][i]
		this.focalpoints["num"][cellid]--
	}
	currentNumberFocalPoints( cellid ){
		if( cellid in this.focalpoints["num"] ){
			return this.focalpoints["num"][cellid]
		}
		return 0
	}
	isFocalPoint( i ){
		return ( i in this.focalpoints["points"] )
	}
	lastSource(){
		return this._lastrequestedcopy[0] || NaN
	}
	log( message ){
		/* eslint-disable no-console*/
		console.log(message)
	}

	/* eslint-disable no-unused-vars*/
	postSetpixListener( i, t_old, t ){
		
		let kind = this.C.cellKind( t )
		
		// If i was a focalpoint of t_old, it is now lost.
		if( this.isFocalPoint(i) ){
			this.removeFocalPoint( i, t_old )
		}
		
		// The point can only become a focal point if N_PROTRUSION of this kind is nonzero
		// and if the new cell is non-background
		if( t != 0 && this.conf["N_PROTRUSION"][kind] > 0 ){
			// This point becomes a focal point of the new cell t in two cases: 
		
			// 1) A copy from a focal point moves that focal point from the sourcei to i,
			// but only if the number of focal points is not already too large. If that is the
			// case, drop it. (This should only happen when the N_PROTRUSION) changes during
			// the simulation, eg via HTML controls.
			let sourcei = this.lastSource()
			if( this.isFocalPoint( sourcei ) && this.currentNumberFocalPoints(t) <= this.conf["N_PROTRUSION"][kind] ){
				this.removeFocalPoint( sourcei, t )
				this.addFocalPoint( i, t )
			}
		
			// 2) If the copy did not come from a focalpoint, but the cell that has just 
			// gained a pixel (t) has too few focal points, this pixel becomes a focalpoint.
			else if( this.currentNumberFocalPoints(t) < this.conf["N_PROTRUSION"][kind] ){
				this.addFocalPoint( i, t )
			}
		}
	}

}

export default ProtrusionConstraint
