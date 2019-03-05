/** Run a basic Ising model. */

let CPM = require("../build/cpm-cjs.js")

let w = parseInt(process.argv[2]) || 500


// Create a new CPM, canvas, and stats object
let C = new CPM.CPM( 2, {x: w, y:w}, {
	seed : 1,
	J : [ [NaN,20], [20,100] ],
	T : 0.01
})

let cid = C.makeNewCellID(1)

// For all non-stromaborder pixels in the grid: assign it randomly
// to either background or cell.
for( let i = 0 ; i < C.field_size.x ; i ++ ){
	for( let j = 0 ; j < C.field_size.y ; j ++ ){
		if( C.random() <= 0.5 ){
			C.setpix( [i, j], cid )
		}
	}
}

console.time("execution")
// burnin phase (let cells gain volume)
for( i = 0 ; i < 10 ; i ++ ){
	console.log(i)
	C.monteCarloStep()
}
console.timeEnd("execution")

let Cim = new CPM.Canvas( C )
Cim.clear( "FFFFFF" )
Cim.drawCells( 1, "CCCCCC" )
Cim.writePNG( "ising.png" )

