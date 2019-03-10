/** Run a CPM with just one cell. */

let CPM = require("../build/cpm-cjs.js")

let w = parseInt(process.argv[2]) || 1000

// Create a new CPM, canvas, and stats object
let C = new CPM.CPM( [w,w], {
	seed : 1,
	T : 2
})

C.add( new CPM.VolumeConstraint( { V: [0,100], 
	LAMBDA_V: [0,5] } ) )
C.add( new CPM.PerimeterConstraint( { P: [0,200], 
	LAMBDA_P: [0,5] } ) )

new CPM.GridInitializer(C).seedCell(1)


console.time("executing 1000 MCS")
for( i = 0 ; i < 1000 ; i ++ ){
	C.monteCarloStep()
}
console.timeEnd("executing 1000 MCS")

let Cim = new CPM.Canvas( C )
Cim.clear( "FFFFFF" )
Cim.drawCells( 1, "CCCCCC" )
Cim.writePNG( "output/singlecell.png" )

