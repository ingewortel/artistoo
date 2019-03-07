let CPM = require("../build/cpm-cjs.js")
let w = 20
// Create a CPM object
C = new CPM.CPM( [w, w, 2], {
	LAMBDA_VRANGE_MIN : [0,1],
	LAMBDA_VRANGE_MAX : [0,2],
	T : 4,
	seed: 7,
	torus: false
})
C.addTerm( new CPM.HardVolumeRangeConstraint( C.conf ) )
let Ci = new CPM.GridInitializer( C )
Ci.seedCellAt( 1, [C.field_size.x/2,C.field_size.y/2,C.field_size.z/2] )	

let t = 10000
while(t-- > 0){
	C.monteCarloStep()
	let c = [0,0,0], i = 0
	for( x of C.cellPixels() ){
		i++
		c[0]+=x[0][0]; c[1]+=x[0][1]; c[2]+=x[0][2]
	}
	console.log(c[0]/i,c[1]/i,c[2]/i)
}
