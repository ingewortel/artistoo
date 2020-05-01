let CPM = require("../../build/artistoo-cjs.js")
let w = 20
// Create a CPM object
C = new CPM.CPM( [w, w, 2], {
	LAMBDA_VRANGE_MIN : [0,1],
	LAMBDA_VRANGE_MAX : [0,2],
	T : 4,
	seed: 7,
	torus: [false,false,false]
})
C.add( new CPM.HardVolumeRangeConstraint( C.conf ) )
new CPM.GridManipulator( C ).seedCell( 1 )

let t = 1000
while(t-- > 0){
	C.monteCarloStep()
	let c = [0,0,0], i = 0
	for( x of C.cellPixels() ){
		i++
		c[0]+=x[0][0]; c[1]+=x[0][1]; c[2]+=x[0][2]
	}
	console.log(c[0]/i,c[1]/i,c[2]/i)
}
