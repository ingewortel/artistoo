import SoftConstraint from "./SoftConstraint.js"
import Centroids from "../stats/Centroids.js"
import CentroidsWithTorusCorrection from "../stats/CentroidsWithTorusCorrection.js"
import ParameterChecker from "./ParameterChecker.js"

/**
 * This is a constraint in which each cell has a preferred direction of migration. 
 * This direction is only dependent on the cell, not on the specific pixel of a cell.
 * 
 * This constraint works with torus as long as the field size is large enough. 
 */
class PersistenceConstraint extends SoftConstraint {

	/** The constructor of the PersistenceConstraint requires a conf object with parameters.
	@param {object} conf - parameter object for this constraint
	@param {PerKindNonNegative} conf.LAMBDA_DIR - strength of the persistenceconstraint per cellkind.
	@param {PerKindNonNegative} [conf.DELTA_T = [10,10,...]] - the number of MCS over which the current direction is 
	determined. Eg if DELTA_T = 10 for a cellkind, then its current direction is given by
	the vector from its centroid 10 MCS ago to its centroid now.
	@param {PerKindProb} conf.PERSIST - persistence per cellkind. If this is 1, its new
	target direction is exactly equal to its current direction. If it is lower than 1, 
	angular noise is added accordingly. 
	*/
	constructor( conf ){
		super( conf )
		
		/** Cache centroids over the previous conf.DELTA_T MCS to determine directions.
		@type {CellObject}
		*/
		this.cellcentroidlists = {}
		/** Target direction of movement of each cell.
		@type {CellObject}
		*/
		this.celldirections = {}
	}
	
	/** Set the CPM attached to this constraint.
	@param {CPM} C - the CPM to attach.*/
	set CPM(C){
		
		/** @ignore */
		this.halfsize = new Array(C.ndim).fill(0)
		
		super.CPM = C
		
		for( let i = 0 ; i < C.ndim ; i ++ ){
			this.halfsize[i] = C.extents[i]/2
		}
		this.confChecker()
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		checker.confCheckParameter( "LAMBDA_DIR", "KindArray", "NonNegative" )
		checker.confCheckParameter( "PERSIST", "KindArray", "Probability" )
	}
	
	/** Method to compute the Hamiltonian for this constraint. 
	 @param {IndexCoordinate} sourcei - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} targeti - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. This argument is not used by this
	 method, but is supplied for consistency with other SoftConstraints. The CPM will always
	 call this method supplying the tgt_type as fourth argument.
	 @return {number} the change in Hamiltonian for this copy attempt and this constraint.*/ 
	/* eslint-disable no-unused-vars*/
	deltaH ( sourcei, targeti, src_type, tgt_type ) {
		if( src_type == 0 || !(src_type in this.celldirections) ) return 0
		let b = this.celldirections[src_type]
		let p1 = this.C.grid.i2p(sourcei), p2 = this.C.grid.i2p(targeti)
		let a = []
		for( let i = 0 ; i < p1.length ; i ++ ){
			a[i] = p2[i]-p1[i]
			// Correct for torus if necessary
			if( this.C.grid.torus[i] ){
				if( a[i] > this.halfsize[i] ){
					a[i] -= this.C.extents[i]
				} else if( a[i] < -this.halfsize[i] ){
					a[i] += this.C.extents[i]
				}
			}
		}
		let dp = 0
		for( let i = 0 ; i < a.length ; i ++ ){
			dp += a[i]*b[i]
		}
		return - dp
	}
	
	/** Normalize a vector a by its length.
	@param {number[]} a - vector to normalize.
	@return {number[]} normalized version of this vector.
	@private*/
	normalize( a ){
		let norm = 0
		for( let i = 0 ; i < a.length ; i ++ ){
			norm += a[i]*a[i]
		}
		norm = Math.sqrt(norm)
		for( let i = 0 ; i < a.length ; i ++ ){
			a[i] /= norm
		}
	}
	/** this function samples a random number from a normal distribution
	@param {number} [mu=0] - mean of the normal distribution.
	@param {number} [sigma=1] - SD of the normal distribution.
	@return {number} the random number generated.
	@private
	*/
	sampleNorm (mu=0, sigma=1) {
		let u1 = this.C.random()
		let u2 = this.C.random()
		let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(Math.PI*2 * u2)
		return z0 * sigma + mu
	}
	/** This function samples a random direction vector with length 1
	@param {number} [n=3] - number of dimensions of the space to make the vector in.
	@return {number[]} - a normalized direction vector.
	*/
	randDir (n=3) {
		let dir = []
		while(n-- > 0){
			dir.push(this.sampleNorm())
		}
		this.normalize(dir)
		return dir
	}
	/** Change the target direction of a cell to a given vector.
		@param {CellId} t - the cellid of the cell to change the direction of.
		@param {number[]} dx - the new direction this cell should get.
	*/
	setDirection( t, dx ){
		this.celldirections[t] = dx
	}
	
	/** After each MCS, update the target direction of each cell based on its actual
	direction over the last {conf.DELTA_T[cellkind]} steps, and some angular noise
	depending on {conf.PERSIST[cellkind]}.
	@listens {CPM#timeStep} because when the CPM has finished an MCS, cells have new 
	centroids and their direction must be updated. 
	*/
	postMCSListener(){
		let centroids
		if( this.C.conf.torus ){
			centroids = this.C.getStat( CentroidsWithTorusCorrection )
		} else {
			centroids = this.C.getStat( Centroids )
		}
		for( let t of this.C.cellIDs() ){
			let ld = this.cellParameter("LAMBDA_DIR", t)
			let dt = this.conf["DELTA_T"] && this.conf["DELTA_T"][this.C.cellKind(t)] ? // cannot convert this call easily to cellParameter
				this.cellParameter("DELTA_T", t) : 10
			if( ld == 0 ){
				delete this.cellcentroidlists[t]
				delete this.celldirections[t]
				continue
			}
			if( !(t in this.cellcentroidlists ) ){
				this.cellcentroidlists[t] = []
				this.celldirections[t] = this.randDir(this.C.ndim)
			}

			let ci = centroids[t]
			this.cellcentroidlists[t].unshift(ci)
			if( this.cellcentroidlists[t].length >= dt ){
				// note, dt could change during execution
				let l
				while( this.cellcentroidlists[t].length >= dt ){
					l = this.cellcentroidlists[t].pop()
				}
				let dx = []
				for( let j = 0 ; j < l.length ; j ++ ){
					dx[j] = ci[j] - l[j]
					
					// torus correction; do only if CPM actually has a torus in this dimension.
					if( this.C.grid.torus[j] ){
						if( dx[j] > this.halfsize[j] ){
							dx[j] -= this.C.extents[j]
						} else if( dx[j] < -this.halfsize[j] ){
							dx[j] += this.C.extents[j]
						}					
					}
				}
				// apply angular diffusion to target direction if needed
				let per = this.cellParameter("PERSIST", t)
				if( per < 1 ){
					this.normalize(dx)
					this.normalize(this.celldirections[t])
					for (let j = 0; j < dx.length; j++) {
						dx[j] = (1 - per) * dx[j] + per * this.celldirections[t][j]
					}
					this.normalize(dx)
					// this may lead to NaNs if the displacement was zero. If that's the case,
					// the cell hasn't moved and has lost its persistent "memory", so we give it
					// a new random direction.
					if( dx.some( d => Number.isNaN(d) ) ){
						this.celldirections[t] = this.randDir(this.C.ndim)
					} else {
						for (let j = 0; j < dx.length; j++) {
							dx[j] *= ld
						}
						this.celldirections[t] = dx
					}
				}
			}
		}
	}
}

export default PersistenceConstraint 
