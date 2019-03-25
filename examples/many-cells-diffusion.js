let math = require('mathjs')
let CPM = require("../build/cpm-cjs.js")

let zoom=4, w = 200, t = 100, n1 = 10, n2 = 2, n3 = 10, n4 = 2

let C
function timestep(){
	while( t-- > 0){
		C.monteCarloStep()
	}
}

function initialize(){
	C = setupCPM({zoom:zoom,w:w})
	timestep()
}

let pdc, Cs, chem12, chem34
function setupCPM(conf){
	const zoom = conf.zoom || 1
	const w = conf.w || 40
	let C = new CPM.CPM( [w,w], {
		T : 20,
		torus : true
	})
	Cs = new CPM.PostMCSStats()
	C.add( Cs )

	C.add( new CPM.Adhesion( { J:
		[[0,20,20,20,20], [20,100,20,100,20], [20,20,20,20,20], [20,100,20,100,20], [20,20,20,20,20]] } ) )
	C.add( new CPM.VolumeConstraint( { V: [0,125,300,125,300],
		LAMBDA_V: [0,50,50,50,50] } ) )
	C.add( new CPM.PerimeterConstraint( { P: [0,100,200,100,200],
		LAMBDA_P: [0,2,2,2,2] } ) )
	chem12 = new CPM.ChemotaxisConstraint (
		{FIELD_SIZE: C.grid.field_size.x, MATHOBJ: math, SECRETOR: 2, RESOLUTION_DECREASE: 10, MM_PER_PIXEL: .38/600, SECOND_PER_MCS: 1,
		D: 6.2 * Math.pow(10, -5), DIFFUSION_PER_MCS: 10, SECRETION: 100, DECAY: .1, LAMBDA_CHEMOTAXIS: [0,500,0,0,0] } )
	chem34 = new CPM.ChemotaxisConstraint (
		{FIELD_SIZE: C.grid.field_size.x, MATHOBJ: math, SECRETOR: 4, RESOLUTION_DECREASE: 10, MM_PER_PIXEL: .38/600, SECOND_PER_MCS: 1,
		D: 6.2 * Math.pow(10, -5), DIFFUSION_PER_MCS: 10, SECRETION: 100, DECAY: .1, LAMBDA_CHEMOTAXIS: [0,0,0,500,0] } )
	C.add( chem12 )
	C.add( chem34 )

	let Cim = new CPM.Canvas( C, {zoom:zoom} )

	// C.add( { postMCSListener : function(){
	// 	// Clear the canvas (in the backgroundcolor white), and redraw:
	// 	Cim.clear( "FFFFFF" )
	// 	// draw the cells
	// 	Cim.drawCells( 1, "ff0000" )
	// 	Cim.drawCells( 2, "880000" )
	// 	Cim.drawCells( 3, "0000ff" )
	// 	Cim.drawCells( 4, "000088" )
	// 	// draw cell borders
	// 	Cim.drawCellBorders( 1, "000000" )
	// 	Cim.drawCellBorders( 2, "000000" )
	// 	Cim.drawCellBorders( 3, "000000" )
	// 	Cim.drawCellBorders( 4, "000000" )
	// }} )
	//
	// let Gi = new CPM.GridInitializer(C)
	// for( let i = 0 ; i < n1 ; i ++ ){
	// 	Gi.seedCell(1)
	// }
	// for( let i = 0 ; i < n2 ; i ++ ){
	// 	Gi.seedCell(2)
	// }
	// for( let i = 0 ; i < n3 ; i ++ ){
	// 	Gi.seedCell(3)
	// }
	// for( let i = 0 ; i < n4 ; i ++ ){
	// 	Gi.seedCell(4)
	// }

	// Start simulation
	return C
}

initialize()
