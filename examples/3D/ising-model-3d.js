/** Run a basic Ising model. */

let CPM = require("../../build/artistoo-cjs.js")

let w = parseInt(process.argv[2]) || 100


// Create a new CPM, canvas, and stats object
let C = new CPM.CPM( [w,w,w], {
	seed : 1,
	T : 0.01
})
C.add( new CPM.Adhesion( { J:[ [NaN,20], [20,100] ] } ) )

let cid = C.makeNewCellID(1)

// For all non-stromaborder pixels in the grid: assign it randomly
// to either background or cell.
for( let i = 0 ; i < C.extents[0] ; i ++ ){
	for( let j = 0 ; j < C.extents[1] ; j ++ ){
		for( let k = 0 ; k < C.extents[2]; k ++ ){ 
			if( C.random() <= 0.5 ){
				C.setpix( [i, j, k], cid )
			}
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

const {createCanvas} = require("canvas")
let el = createCanvas( w, w )
let ctx = el.getContext("2d")
ctx.fillStyle="#FFFFFF"
ctx.fillRect( 0,0, w,w )

ctx.fillStyle="#FF0000"
for( let i = 0 ; i < C.extents[0] ; i ++ ){
	for( let j = 0 ; j < C.extents[1] ; j ++ ){
		if( C.pixt( [i,j,0]) ){
			ctx.fillRect( i, j, 1, 1 )
		}
	}
}
require("fs").writeFileSync("ising.png", el.toBuffer())

