let CPM = require("../build/artistoo-cjs.js")
console.log("1000x1000 model, mix T cells and epidermal cells, torus, 100 MCS")


let w = 1000

// Create a new CPM, canvas, and stats object
C = new CPM.CPM( [w,w], {
	seed : 1,
	T : 100,
})
C.add( new CPM.Adhesion({J : [ 
	[0,50,50], 
	[500,1000,1000], // epidermal cells
	[500,1000,1000] 
]}) )
C.add( new CPM.VolumeConstraint({
	LAMBDA_V : [0,100,100],
	V : [0,120,175]
}) )
C.add( new CPM.PerimeterConstraint({P: [0,0,190], LAMBDA_P:[0,0,20]}) )
C.add( new CPM.ActivityConstraint({MAX_ACT: [0,0,30], 
	LAMBDA_ACT:[0,0,500],
	ACT_MEAN: "geometric" }) )


let Ci = new CPM.GridManipulator(C)
let i = 8720*(w/1000)
while( i-- > 0 ){
	Ci.seedCell(1)
}
i = 100*(w/1000)
while( i-- > 0 ){
	Ci.seedCell(2)
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
