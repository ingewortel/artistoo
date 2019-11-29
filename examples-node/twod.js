/** Run a CPM in 2D, and print centroids of all cells. 
 * Also save an image each [framerate=10] monte carlo steps
 * after a burnin phase of [burnin=50] Monte Carlo Steps. */

let CPM = require("../build/cpm-cjs.js")

let burnin=50, maxtime=5000

let nrCells = parseInt(process.argv[2]) || 10
let fieldSize = parseInt(process.argv[3]) || 1000
let framerate = parseInt(process.argv[4]) || 100

let C = new CPM.CPM( [fieldSize,fieldSize], {
	T : 20
})
C.add( new CPM.Adhesion({J : [[0,20],[20,100]]}) )
C.add( new CPM.VolumeConstraint({V : [0,500], LAMBDA_V : [0,50]})  )
C.add( new CPM.PerimeterConstraint({P : [0,340], LAMBDA_P : [0,2]}) )
C.add( new CPM.ActivityConstraint({
	LAMBDA_ACT : [0,140], 
	MAX_ACT : [0,44], 
	ACT_MEAN : "geometric"}) )

//C.addStromaBorder()
//var Cstat = new CPM.Stats( C )
let Cim = new CPM.Canvas( C )
let t = 0


let Ci = new CPM.GridInitializer( C )
// Seed cells
for( let i = 0 ; i < nrCells ; i ++ ){
	Ci.seedCell( 1 )
}

// burnin phase (let cells gain volume)
for( let i = 0 ; i < burnin ; i ++ ){
	C.monteCarloStep()
}

// actual simulation
for( i = 0 ; i < maxtime ; i ++ ){
	C.monteCarloStep()
	Cstat.centroids()
	//console.log( Cstat.getConnectedness() )
	if( i % framerate == 0 ){
		console.log( i )
		Cim.clear( "FFFFFF" )
		//Cim.drawCells( 2, "990000" )
		Cim.drawCells( 1, "CCCCCC" )

		Cim.drawCellBorders( 1, "FFFFFF" )
		Cim.writePNG( "output/2d-"+t+".png" )
		t ++
	}
}
