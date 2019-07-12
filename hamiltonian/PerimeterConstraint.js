/** 
 * Implements the adhesion constraint of Potts models. 
 */

import SoftConstraint from "./SoftConstraint.js"

class PerimeterConstraint extends SoftConstraint {
	constructor( conf ){
		super( conf )
		this.cellperimeters = {}
	}
	confChecker(){
		this.confCheckCellNonNegative( "LAMBDA_P" )
		this.confCheckCellNonNegative( "P" )
	}
	
	postSetpixListener( i, t_old, t_new ){
		if( t_old == t_new ){ return }
		const Ni = this.C.neighi( i )
		let n_new = 0, n_old = 0
		for( let i = 0 ; i < Ni.length ; i ++  ){
			const nt = this.C.pixti(Ni[i])
			if( nt != t_new ){
				n_new ++ 
			}
			if( nt != t_old ){
				n_old ++
			}
			if( nt != 0 ){
				if( nt == t_old ){
					this.cellperimeters[nt] ++
				}
				if( nt == t_new ){
					this.cellperimeters[nt] --
				}
			}
		}
		if( t_old != 0 ){
			this.cellperimeters[t_old] -= n_old
		}
		if( t_new != 0 ){
			if( !(t_new in this.cellperimeters) ){
				this.cellperimeters[t_new] = 0
			}
			this.cellperimeters[t_new] += n_new
		}
	}
	deltaH( sourcei, targeti, src_type, tgt_type ){
		if( src_type == tgt_type ){
			return 0
		}
		const ts = this.C.cellKind(src_type)
		const ls = this.conf["LAMBDA_P"][ts]
		const tt = this.C.cellKind(tgt_type)
		const lt = this.conf["LAMBDA_P"][tt]
		if( !(ls>0) && !(lt>0) ){
			return 0
		}
		const Ni = this.C.neighi( targeti )
		let pchange = {}
		pchange[src_type] = 0; pchange[tgt_type] = 0
		for( let i = 0 ; i < Ni.length ; i ++  ){
			const nt = this.C.pixti(Ni[i])
			if( nt != src_type ){
				pchange[src_type]++ 
			}
			if( nt != tgt_type ){
				pchange[tgt_type]--
			}
			if( nt == tgt_type ){
				pchange[nt] ++
			}
			if( nt == src_type ){
				pchange[nt] --
			}
		}
		let r = 0.0
		if( ls > 0 ){
			const pt = this.conf["P"][ts],
				ps = this.cellperimeters[src_type]
			const hnew = (ps+pchange[src_type])-pt,
				hold = ps-pt
			r += ls*((hnew*hnew)-(hold*hold))
		}
		if( lt > 0 ){
			const pt = this.conf["P"][tt],
				ps = this.cellperimeters[tgt_type]
			const hnew = (ps+pchange[tgt_type])-pt,
				hold = ps-pt
			r += lt*((hnew*hnew)-(hold*hold))
		}
		// eslint-disable-next-line
		//console.log( r )
		return r
	}
}

export default PerimeterConstraint
