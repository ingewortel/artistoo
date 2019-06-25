import SoftConstraint from "./SoftConstraint.js"

class ChemotaxisConstraint extends SoftConstraint {
	set CPM(C){
		this.C = C
	}

	constructor( conf ){
		super( conf )
		this.conf = conf
		this.field = conf.field
	}

        /* To bias a copy attempt p1 -> p2 in the direction of vector 'dir'.
         * This implements a linear gradient rather than a radial one as with pointAttractor. */
        linAttractor ( p1, p2, dir ){
                let r = 0., d1 = 0., d2 = 0., norm1 = 0., norm2 = 0.
                // loops over the coordinates x,y,(z)
                for( let i = 0; i < p1.length ; i++ ){
                        // direction of the copy attempt on this coordinate is from p1 to p2
                        d1 = p2[i] - p1[i]
			norm1 += d1 * d1
                        // direction of the gradient
                        d2 = dir[i]
                        r += d1 * d2
			norm2 += d2 * d2
                }
		if( norm2 < 1e-40 ) return 0
                return r / Math.sqrt( norm1 ) / Math.sqrt( norm2 )
        }

	deltaH( sourcei, targeti, src_type, tgt_type ){
		let sp = this.C.grid.i2p( sourcei )
		let gradientvec = this.field.gradient( sp )
                let bias = 
                        this.linAttractor( sp, 
				this.C.grid.i2p(targeti), gradientvec )
                let lambdachem
                if( src_type != 0 ){
                        lambdachem = this.conf["LAMBDA_CHEMOTAXIS"][this.C.cellKind(src_type)]
                } else {
                        lambdachem = this.conf["LAMBDA_CHEMOTAXIS"][this.C.cellKind(tgt_type)]
                }
                return -bias*lambdachem
	}
}

export default ChemotaxisConstraint
