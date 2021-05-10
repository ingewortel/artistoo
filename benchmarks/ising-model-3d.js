/** Run a basic 3D Ising model. 
 * 
 * This is just for benchmarking, so does not 
 * log anything or draw any images. */
let CPM = require("../build/artistoo-cjs.js")
let w = 100
console.log("100x100x100 3D Ising model, torus, 5 MCS")
// Create a new CPM, canvas, and stats object
let C = new CPM.CPM( [w,w,w], {
	seed : 1,
	T : 10
})

C.add( new CPM.Adhesion( { J:[ [NaN,1], [1,1] ] } ) )

let cid = C.makeNewCellID(1)
// For all non-stromaborder pixels in the grid: assign it randomly
// to either background or cell.
for( let i = 0 ; i < C.extents[0] ; i ++ ){
	for( let j = 0 ; j < C.extents[1] ; j ++ ){
		for( let k = 0 ; k < C.extents[2] ; k ++ ){
			if( C.random() <= 0.5 ){
				C.setpix( [i, j, k], cid )
			}
		}
	}
}
console.time("execution")
for( i = 0 ; i < 5 ; i ++ ){
	C.monteCarloStep()
}
console.timeEnd("execution")
