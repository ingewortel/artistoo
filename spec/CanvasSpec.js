/** Some tests for drawing methods in the Canvas class.
 *
 * @test {Canvas}*/
describe("Canvas", function () {
	let CPM = require("../build/artistoo-cjs.js")
	let cpm, ca, cpmCanvas, caCanvas, cpmGM

	let rgbToHex = function ( rgbArray ) {

		let totalString = ""

		for( let i = 0; i < 3; i++ ){
			let hex = Number(rgbArray[i] ).toString(16)
			if (hex.length < 2) {
				hex = "0" + hex
			}
			totalString += hex
		}

		return totalString
	}

	function getPixelOnCanvas( p, canvas ){
		canvas.getImageData()
		const dy = canvas.zoom*canvas.width
		const off = (p[1]*dy + p[0])*4
		let rgb = [ canvas.px[off], canvas.px[off+1], canvas.px[off+2] ]
		return rgbToHex( rgb ).toUpperCase()
	}

	beforeEach( function() {
		// Build a cpm and a ca
		cpm = new CPM.CPM( [200,200], [true,true],
			{	T:20,
				J : [[0,20],[20,0]],
				V : [0,100],
				LAMBDA_V:[0,50]
			} )
		ca = new CPM.CA( [100,100], {
			/**
			 * @return {number}
			 */
			"UPDATE_RULE": 	function(p,N){
				let nAlive = 0
				for( let pn of N ){
					nAlive += (this.pixt(pn)===1)
				}
				if( this.pixt(p) === 1 ){
					if( nAlive === 2 || nAlive === 3 ){
						return 1
					}
				} else {
					if( nAlive === 3 ) return 1
				}
				return 0
			}
		})

		// initialize the canvas and grid manipulators
		cpmCanvas = new CPM.Canvas( cpm, {zoom:1} )
		caCanvas = new CPM.Canvas( ca, {zoom:1} )
		cpmGM = new CPM.GridManipulator( cpm )

		// initialize the grids somehow
		cpmGM.seedCell(1 )
		ca.setpix( [0,0], 1 )
		ca.setpix( [0,1], 1 )
		ca.setpix( [0,2], 2 )

	})

	it( "drawCells should draw cells on CPM", function(){

		// draw cellkind 1 in red
		cpmCanvas.drawCells(1,"FF0000")

		// check that the pixels are indeed red
		let cp = cpm.getStat( CPM.PixelsByCell )
		for( let p of cp[1] ){
			expect( getPixelOnCanvas( p, cpmCanvas ) ).toEqual( "FF0000" )
		}

	})

	it( "drawCells should draw cells on CA", function(){
		caCanvas.drawCells(1,"FF0000")

		// check that the pixels are indeed black
		expect( getPixelOnCanvas( [0,0], caCanvas ) ).toEqual( "FF0000" )

		// check that other pixels are not colored
		expect( getPixelOnCanvas( [2,2], caCanvas ) ).not.toEqual( "00FF00")
	})

	it( "drawOnCellBorders should draw borders on CPM", function(){

		// draw cellkind 1 in red
		cpmCanvas.drawOnCellBorders(1,"00FF00")

		// check that the pixels are indeed red
		let cp = cpm.getStat( CPM.BorderPixelsByCell )
		for( let p of cp[1] ){
			expect( getPixelOnCanvas( p, cpmCanvas ) ).toEqual( "00FF00" )
		}

	})

	it( "drawOnCellBorders should draw borders on CA", function(){
		caCanvas.drawOnCellBorders(1,"00FF00")

		// check that the pixels are indeed colored
		expect( getPixelOnCanvas( [0,0], caCanvas ) ).toEqual( "00FF00" )

		// check that other pixels are not colored
		expect( getPixelOnCanvas( [2,2], caCanvas ) ).not.toEqual( "00FF00")
	})

	it( "drawCellBorders should work on CPM and CA", function(){
		expect( function() { cpmCanvas.drawCellBorders(1,"00FF00") } ).not.toThrow()
		expect( function(){ caCanvas.drawCellBorders(1,"00FF00") } ).not.toThrow()
	})


})

