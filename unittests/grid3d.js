
let CPM=require("../build/artistoo-cjs.js")

let G = new CPM.Grid3D([20,20,2],[true,true,true])

let i = G.p2i([10,10,2])

for( let n of G.neighi(i) ){
	let p = G.i2p(n)
	console.log(p)
	if( p[1] > G.extents[1] ){
		throw("error: impossible y coordinate!")
	}
}
