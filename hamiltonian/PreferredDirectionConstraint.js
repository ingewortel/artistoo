/**
 * Implements the preferred direction constraint.
 */

import SoftConstraint from "./SoftConstraint.js"

class PreferredDirectionConstraint extends SoftConstraint {
	constructor( conf ){
		super( conf )
		this.cellcentroidlists = {}
		this.celldirections = {}
		this.Cs = conf.pixeltracker
	}
	set CPM(C){
		this.halfsize = new Array(C.ndim).fill(0)
		this.C = C
		for( let i = 0 ; i < C.ndim ; i ++ ){
			this.halfsize[i] = C.extents[i]/2
		}

	}
	deltaH ( sourcei, targeti, src_type ) {
		if( src_type == 0 || !(src_type in this.celldirections) ) return 0
		let b = this.celldirections[src_type]
		let p1 = this.C.grid.i2p(sourcei), p2 = this.C.grid.i2p(targeti)
		let a = []
		for( let i = 0 ; i < p1.length ; i ++ ){
			a[i] = p2[i]-p1[i]
			if( a[i] > this.halfsize[i] ){
				a[i] -= this.C.extents[i]
			} else if( a[i] < -this.halfsize[i] ){
				a[i] += this.C.extents[i]
			}
		}

		let dp = 0
		for( let i = 0 ; i < a.length ; i ++ ){
			dp += a[i]*b[i]
		}
		return - dp
	}
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
	// this function samples a random number from a normal distribution
	sampleNorm (mu=0, sigma=1) {
		let u1 = this.C.random()
		let u2 = this.C.random()
		let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(Math.PI*2 * u2)
		return z0 * sigma + mu
	}
	// this function samples a random direction vector with length 1
	randDir (n=3) {
		let dir = []
		while(n-- > 0){
			dir.push(this.sampleNorm())
		}
		this.normalize(dir)
		return dir
	}
	postMCSListener(){
		for( let t of this.C.cellIDs() ){
			const k = this.C.cellKind(t)
			let ld = this.conf["LAMBDA_DIR"][k]
			if( ld == 0 ){
				delete this.cellcentroidlists[t]
				delete this.celldirections[t]
				continue
			}
			if( !(t in this.cellcentroidlists ) ){
				this.cellcentroidlists[t] = []
				// this will work for all numbers of dimensions
				this.celldirections[t] = this.randDir(this.C.ndim)
				console.log(this.celldirections[t])
				// let rang = this.C.random()*Math.PI*2
				// this.celldirections[t] = [Math.cos(rang),Math.sin(rang)]
			}
			let ci = this.Cs.centroidWithTorusCorrection( t )
			this.cellcentroidlists[t].unshift(ci)
			if( this.cellcentroidlists[t].length == 10 ){
				let l = this.cellcentroidlists[t].pop(), dx = []
				for( let j = 0 ; j < l.length ; j ++ ){
					dx[j] = ci[j] - l[j]
				}
				let per = this.conf["PERSIST"][this.C.cellKind(t)]
				this.normalize(dx)
				this.normalize(this.celldirections[t])
				for( let j = 0 ; j < dx.length ; j ++ ){
					dx[j] = (1-per)*dx[j] + per*this.celldirections[t][j]
				}
				this.normalize(dx)
				for( let j = 0 ; j < dx.length ; j ++ ){
					dx[j] *= ld
				}
				this.celldirections[t] = dx
			}
		}
	}
}

export default PreferredDirectionConstraint
