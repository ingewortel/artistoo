/** Run a basic 2D Ising model. 
 * 
 * This is just for benchmarking, so does not 
 * log anything or draw any images. */
let CPM = require("../build/artistoo-cjs.js")
let w = 1000
console.log("1000x1000 2D Ising model, torus, 20 MCS")



// Create a new CPM, canvas, and stats object
let C = new CPM.CPM( [w,w], {
	seed : 1,
	T : 10
})

C.add( new CPM.Adhesion( { J:[ [NaN,1], [1,1] ] } ) )

let cid = C.makeNewCellID(1)
// For all non-stromaborder pixels in the grid: assign it randomly
// to either background or cell.
for( let i = 0 ; i < C.extents[0] ; i ++ ){
	for( let j = 0 ; j < C.extents[1] ; j ++ ){
		if( C.random() <= 0.5 ){
			C.setpix( [i, j], cid )
		}
	}
}

console.time("execution")
for( i = 0 ; i < 20 ; i ++ ){
	C.monteCarloStep()
}
console.timeEnd("execution")
