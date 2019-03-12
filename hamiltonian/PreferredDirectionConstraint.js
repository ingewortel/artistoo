/**
 * Implements the preferred direction constraint.
 */

import SoftConstraint from "./SoftConstraint.js"

class PreferredDirectionConstraint extends SoftConstraint {
	constructor( conf ){
		super( conf )
		this.cellcentroids = {}
		this.cellcentroidlists = {}
		this.celldirections = {} 
	}
	deltaH ( sourcei, targeti, src_type ) {
		if( src_type == 0 || !(src_type in this.celldirections) ) return 0
		const src_kind = this.C.cellKind(src_type)
		let ld = this.conf["LAMBDA_DIR"][src_kind]
		let b = this.celldirections[src_type]
		let p1 = this.C.grid.i2p(sourcei), p2 = this.C.grid.i2p(targeti)

		let a = []
		for( let i = 0 ; i < p1.length ; i ++ ){
			a[i] = p2[i]-p1[i]
		}

		let dp = 0
		for( let i = 0 ; i < a.length ; i ++ ){
			dp += a[i]*b[i]
		}

		return -ld * dp
	}
	postSetpixListener( i, t_old, t_new ){
		let p = this.C.grid.i2p(i)
		if( t_new != 0 && !(t_new in this.cellcentroids ) ){
			this.cellcentroids[t_new] = [0,0]
			let rang = this.C.random()*Math.PI*2
			this.celldirections[t_new] = [Math.cos(rang),Math.sin(rang)]
		}

		for( let i = 0 ; i < p.length ; i ++ ){
			if( t_new != 0 ){
				this.cellcentroids[t_new][i] +=
					(p[i]-this.cellcentroids[t_new][i])/
					this.C.getVolume(t_new)
			}
			if( t_old != 0 ){
				let vv = this.C.getVolume(t_old)
				if( vv == 0 ){
					delete this.cellcentroids[t_old]
				}
				this.cellcentroids[t_old][i] -=
					(p[i]-this.cellcentroids[t_old][i])/
					(vv+1)
			}
		}
	}
	normalize( a ){
		let norm = 0
		for( let i = 0 ; i < a.length ; i ++ ){
			norm += a[i]*a[i]
		}
		for( let i = 0 ; i < a.length ; i ++ ){
			a[i] /= norm
		}
		return a
	}
	postMCSListener(){
		for( let i of Object.keys( this.cellcentroidlists ) ){
			if( !(i in this.cellcentroids ) ){
				delete this.cellcentroidlists[i]
			}
		}
		for( let i of Object.keys( this.cellcentroids ) ){
			if( !(i in this.cellcentroidlists ) ){
				this.cellcentroidlists[i] = []
			}
			this.cellcentroidlists[i].unshift(this.cellcentroids[i].slice(0))
			if( this.cellcentroidlists[i].length == 10 ){
				let l = this.cellcentroidlists[i].pop(), d = []
				for( let j = 0 ; j < l.length ; j ++ ){
					d[j] = this.cellcentroids[i][j] - l[j]
				}
				let per = this.conf["PERSIST"][this.C.cellKind(i)]
				d = this.normalize(d)
				for( let j = 0 ; j < d.length ; j ++ ){
					d[j] = (1-per)*d[j] + per*this.celldirections[i][j]
				}
				this.celldirections[i] = this.normalize(d)
			}
		}
	}
}

export default PreferredDirectionConstraint
