/** Rigorous tests for Grid3D-specific methods. See GridExtensionSpec.js for
 * more general tests.
 *
 * @test {Grid3D}*/
describe("Grid3D", function () {
	let CPM = require("../../build/artistoo-cjs.js")
	//eslint-disable-next-line no-unused-vars
	let grid3d, grid3dNoTorus, allPixelArray,  randomPixel //samplePixels, borderPixelSample, simpleNeumanni


	let setupGrids = function(){
		grid3d = new CPM.Grid3D([10, 13, 8] )
		grid3dNoTorus = new CPM.Grid3D([10, 13, 8], [false,false,false] )
	}

	beforeEach(function () {
		setupGrids()
		allPixelArray = []
		for( let x = 0; x < grid3d.extents[0]; x++ ){
			for( let y = 0; y < grid3d.extents[1]; y++){
				for( let z = 0; z < grid3d.extents[2]; z++ ) {
					allPixelArray.push( [x,y,z] )
				}
			}
		}

		// Return a random pixel
		randomPixel = function( gridObject ) {
			let p = []
			for( let d=0; d < gridObject.ndim; d++ ){
				p.push( Math.round( Math.random()*( gridObject.extents[d]-1 ) ) )
			}
			return p
		}

		// Return a sample of pixels
		/*samplePixels = function( gridObject, n ){
			let pixelArray = []
			for( let i = 0; i < n; i++ ){
				pixelArray.push( randomPixel(gridObject) )
			}
			return pixelArray
		}*/

		// Return corner pixels on the grid to check torus handling
		/*borderPixelSample = function( gridObject ){
			let borderPixels = []
			const xMax = gridObject.extents[0]-1
			const yMax = gridObject.extents[1]-1
			const zMax = gridObject.extents[2]-1

			// corners
			borderPixels.push( [0,0,0] )
			borderPixels.push( [xMax, 0, 0 ] )
			borderPixels.push( [0, yMax, 0 ] )
			borderPixels.push( [xMax,yMax,0 ] )
			borderPixels.push( [0,0,zMax] )
			borderPixels.push( [xMax, 0, zMax ] )
			borderPixels.push( [0, yMax, zMax ] )
			borderPixels.push( [xMax,yMax,zMax ] )
			return borderPixels
		}*/

	})

	describe( " [ unit tests ] ", function () {

		/** @test {Grid3D#pixelsi} */
		it( "pixelsi generator reports correct IndexCoordinates", function(){
			let k = 0
			for( let i of grid3d.pixelsi() ){
				expect( grid3d.i2p(i) ).toEqual( allPixelArray[k] )
				k++
			}
		})


		/** @test {Grid3D#neighi}*/
		describe( "neighi method should return correct neighbors for specific cases: ", function(){

			//noinspection DuplicatedCode
			let checkExpected = function( gridObject, p, torus, expectedNbh ){
				const nbh = gridObject.neighi( gridObject.p2i(p), torus )
				const expectedNbh2 = expectedNbh.map( function(p) {
					return gridObject.p2i(p)
				} )
				expect( nbh.length ).toEqual( expectedNbh2.length )
				expect( nbh.sort() ).toEqual( expectedNbh2.sort() )
			}

			// Check if neighborhoods are correct for different torus settings,
			// for two opposing corners of the cubic grid (covering all faces).
			let checkNeighi = function( gridObject ) {

				const xMax = gridObject.extents[0] - 1,
					yMax = gridObject.extents[1] - 1,
					zMax = gridObject.extents[2] - 1

				it("...corner [0,0,0] ", function () {
					checkExpected(gridObject, [0,0,0], [false,false,false],
						[ [1,0,0], [0,1,0], [0,0,1],
							[1,1,0], [1,0,1], [0,1,1], [1,1,1] ])
					checkExpected(gridObject, [0,0,0], [true, false, false],
						[ [1,0,0], [0,1,0], [0,0,1],
							[1,1,0], [1,0,1], [0,1,1], [1,1,1],
							[xMax,0,0], [xMax,1,0], [xMax,0,1], [xMax,1,1] ])
					checkExpected(gridObject, [0,0,0], [false, true, false],
						[ [1,0,0], [0,1,0], [0,0,1],
							[1,1,0], [1,0,1], [0,1,1], [1,1,1],
							[0,yMax,0], [1,yMax,0], [0,yMax,1], [1,yMax,1] ])
					checkExpected(gridObject, [0,0,0], [false, false, true],
						[ [1,0,0], [0,1,0], [0,0,1],
							[1,1,0], [1,0,1], [0,1,1], [1,1,1],
							[0,0,zMax], [1,0,zMax], [0,1,zMax], [1,1,zMax] ])
					checkExpected(gridObject, [0,0,0], [true, true, true],
						[ [1,0,0], [0,1,0], [0,0,1],
							[1,1,0], [1,0,1], [0,1,1], [1,1,1],
							[xMax,0,0], [xMax,1,0], [xMax,0,1], [xMax,1,1],
							[0,yMax,0], [1,yMax,0], [0,yMax,1], [1,yMax,1],
							[0,0,zMax], [1,0,zMax], [0,1,zMax], [1,1,zMax],
							[xMax,yMax,0], [xMax,0,zMax],  [0,yMax,zMax],
							[xMax,yMax,1], [xMax,1,zMax],  [1,yMax,zMax],
							[xMax,yMax,zMax] ])

				})
				it("...corner [xMax,yMax,zMax] ", function () {
					checkExpected(gridObject, [xMax,yMax,zMax], [false,false,false],
						[ [xMax-1,yMax,zMax], [xMax,yMax-1,zMax],
							[xMax,yMax,zMax-1], [xMax-1,yMax-1,zMax],
							[xMax-1,yMax,zMax-1], [xMax,yMax-1,zMax-1],
							[xMax-1,yMax-1,zMax-1] ])


					checkExpected(gridObject, [xMax,yMax,zMax], [true, true, true],
						[
							[xMax-1,0,0], [0,yMax-1,0], [0,0,zMax-1],
							[xMax-1,yMax-1,0], [xMax-1,0,zMax-1], [0,yMax-1,zMax-1], [xMax-1,yMax-1,zMax-1],
							[xMax,0,0], [xMax,yMax-1,0], [xMax,0,zMax-1], [xMax,yMax-1,zMax-1],
							[0,yMax,0], [xMax-1,yMax,0], [0,yMax,zMax-1], [xMax-1,yMax,zMax-1],
							[0,0,zMax], [xMax-1,0,zMax], [0,yMax-1,zMax], [xMax-1,yMax-1,zMax],
							[xMax,yMax,0], [xMax,0,zMax],  [0,yMax,zMax],
							[xMax,yMax,zMax-1], [xMax,yMax-1,zMax],  [xMax-1,yMax,zMax],
							[0,0,0]
						])

				})

			}

			setupGrids()
			checkNeighi( grid3d )
			checkNeighi( grid3dNoTorus )

		})


	})
})