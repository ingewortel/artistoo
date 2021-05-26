const artistooBuild = process.argv[2]

let CPM = require(artistooBuild)
//let CPM = require("../build/artistoo-cjs.js")
console.log("1000x1000 model, collective migration large Act cells, torus, 100 MCS")


let w = 1000

// Create a new CPM, canvas, and stats object
C = new CPM.CPM( [w,w], {
	seed : 1,
	T : 20,
})
C.add( new CPM.Adhesion({J : [ 
	[0,20], 
	[20,0] // Act cells
]}) )
C.add( new CPM.VolumeConstraint({
	LAMBDA_V : [0,50], V : [0,500]
}) )
C.add( new CPM.PerimeterConstraint({P: [0,340], LAMBDA_P:[0,2]}) )
C.add( new CPM.ActivityConstraint({MAX_ACT: [0,20], 
	LAMBDA_ACT:[0,140],
	ACT_MEAN: "geometric" }) )


let Ci = new CPM.GridManipulator(C)
let i = 500
while( i-- > 0 ){
	Ci.seedCell(1)
}

console.time("execution")
for( i = 0 ; i < 100 ; i ++ ){
	C.monteCarloStep()
}
console.timeEnd("execution")

let Cim = new CPM.Canvas( C )
Cim.clear( "FFFFFF" )
Cim.drawCellBorders( 1, "CCCCCC" )
Cim.drawCells( 2, "FF0000" )

Cim.writePNG( "test.png" )
