/** Run a CPM with just one cell. */

let CPM = require("../build/cpm-cjs.js")

let w = parseInt(process.argv[2]) || 500

// Create a new CPM, canvas, and stats object
let C = new CPM.CPM( [w,w], {
	seed : 1,
	T : 0.01
})

let P = new CPM.PerimeterConstraint( { P: [0,200], 
	LAMBDA_P: [0,5] } )
C.addTerm( new CPM.VolumeConstraint( { V: [0,100], 
	LAMBDA_V: [0,5] } ) )
C.addTerm( P )

console.log( P.cellperimeters )

let cid = C.makeNewCellID(1)
C.setpix( C.grid.midpoint, cid )
C.setpix( [C.grid.midpoint[0],C.grid.midpoint[1]+1], cid )

for( let c of C.cellPixels() ){
	console.log( c )
}

console.log( P.cellperimeters )


console.time("execution")
for( i = 0 ; i < 50 ; i ++ ){
	console.log(i)
	C.monteCarloStep()
}
console.timeEnd("execution")

let Cim = new CPM.Canvas( C )
Cim.clear( "FFFFFF" )
Cim.drawCells( 1, "CCCCCC" )
Cim.writePNG( "ising.png" )

