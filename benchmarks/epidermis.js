let CPM = require("../build/artistoo-cjs.js")
console.log("1000x1000 model, small epidermal cells (only volume constraint), torus, 100 MCS")


let w = 1000

// Create a new CPM, canvas, and stats object
C = new CPM.CPM( [w,w], {
	seed : 1,
	LAMBDA_V : [0,100],
	V : [0,120],
	J : [ [0,50], 
		[500,1000] // epidermal cells
	],
	T : 100,
})
C.add( new CPM.Adhesion(C.conf) )
C.add( new CPM.VolumeConstraint(C.conf) )

let Ci = new CPM.GridManipulator(C)
let i = 8820
while( i-- > 0 ){
	Ci.seedCell(1)
}

console.time("execution")
for( i = 0 ; i < 100 ; i ++ ){
	C.monteCarloStep()
}
console.timeEnd("execution")

