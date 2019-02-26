/** Run a CPM in 2D, and print centroids of all cells. Also save an image each [framerate=10] monte carlo steps
    after a burnin phase of [burnin=50] Monte Carlo Steps. */

let CPM = require("../build/cpm-cjs.js")

var burnin=50, maxtime=5000

var nrCells = parseInt(process.argv[2]) || 1
var fieldSize = parseInt(process.argv[3]) || 1000
var framerate = parseInt(process.argv[4]) || 10

var C = new CPM.CPM( 2, {x: fieldSize, y:fieldSize}, {
	LAMBDA_CONNECTIVITY : [0,0,0],
	LAMBDA_P : [0,2,1],
	LAMBDA_V : [0,50,50],
	LAMBDA_ACT : [0,140,0],
	MAX_ACT : [0,40,0],
	P : [0,340,100],
	V : [0,500,100],
	J_T_STROMA : [NaN,16,16],
	J_T_ECM : [NaN,20,20],
	J_T_T : [ [NaN,NaN,NaN], [NaN,100,-40], [NaN,-40,NaN] ],
	T : 20,
	ACT_MEAN : "geometric" 
})
//C.addStromaBorder()
var Cstat = new CPM.Stats( C )
var Cim = new CPM.Canvas( C )
var t = 0

// Seed cells
var i
for( i = 0 ; i < nrCells ; i ++ ){
	C.seedCell()
}

// burnin phase (let cells gain volume)
for( i = 0 ; i < burnin ; i ++ ){
	C.monteCarloStep()
}

// actual simulation
for( i = 0 ; i < maxtime ; i ++ ){
	C.monteCarloStep()
	Cstat.centroids()
	//console.log( Cstat.getConnectedness() )
	if( i % framerate == 0 ){
		Cim.clear( "FFFFFF" )
		//Cim.drawCells( 2, "990000" )
		Cim.drawCells( 1, "CCCCCC" )

		Cim.drawCellBorders( "FFFFFF" )
		Cim.writePNG( "output/2d-"+t+".png" )
		t ++
	}
}
