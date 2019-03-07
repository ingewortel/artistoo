
let CPM=require("../build/cpm-cjs.js")

let G = new CPM.Grid3D([20,20,2],true)

let i = G.p2i([10,10,2])

for( let n of G.neighi(i) ){
	let p = G.i2p(n)
	console.log(p)
	if( p[1] > G.field_size.y ){
		throw("error: impossible y coordinate!")
	}
}
