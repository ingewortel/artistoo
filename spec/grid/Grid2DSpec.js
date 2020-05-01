/** Rigorous tests for Grid2D-specific methods. See GridExtensionSpec.js for
 * more general tests.
 *
 * @test {Grid2D}*/
describe("Grid2D", function () {
	let CPM = require("../../build/artistoo-cjs.js")
	//eslint-disable-next-line no-unused-vars
	let grid2d, grid2dFloat, allPixelArray, simpleNeumanni, randomPixel,
		samplePixels, borderPixelSample


	let setupGrids = function(){
		grid2d = new CPM.Grid2D([100, 131])
		grid2dFloat = new CPM.Grid2D([200, 100], [false,false], "Float32" )
	}

	beforeEach(function () {
		setupGrids()
		allPixelArray = []
		for( let x = 0; x < grid2d.extents[0]; x++ ){
			for( let y = 0; y < grid2d.extents[1]; y++){
				allPixelArray.push( [x,y] )
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
		samplePixels = function( gridObject, n ){
			let pixelArray = []
			for( let i = 0; i < n; i++ ){
				pixelArray.push( randomPixel(gridObject) )
			}
			return pixelArray
		}

		// Return some border pixels on the grid to check torus handling
		borderPixelSample = function( gridObject ){
			let borderPixels = []
			borderPixels.push( [0,0] )
			borderPixels.push( [gridObject.extents[0]-1, 0 ] )
			borderPixels.push( [0, gridObject.extents[1]-1 ] )
			borderPixels.push( [gridObject.extents[0]-1, gridObject.extents[1]-1 ] )
			borderPixels.push( [0,gridObject.midpoint[1]] )
			borderPixels.push( [gridObject.midpoint[0],0] )
			borderPixels.push( [gridObject.extents[0]-1,gridObject.midpoint[1] ] )
			borderPixels.push( [gridObject.midpoint[0],gridObject.extents[1]-1 ] )
			return borderPixels
		}

		// A simple function for the neumann neighborhood is used for testing.
		simpleNeumanni = function* (i, grid){
			let p = grid.i2p(i), x = p[0], y = p[1]

			// left
			let l = [ x-1, y ]
			if( l[0] >= 0 ){
				yield grid.p2i(l)
			} else {
				if( grid.torus[0] ){
					l[0] += grid.extents[0]
					yield grid.p2i(l)
				}
			}

			// right
			let r = [x+1,y]
			if( r[0] < grid.extents[0] ){
				yield grid.p2i(r)
			} else {
				if( grid.torus[0] ){
					r[0] -= grid.extents[0]
					yield grid.p2i(r)
				}
			}

			// top
			let t = [ x, y-1 ]
			if( t[1] >= 0 ){
				yield grid.p2i(t)
			} else {
				if( grid.torus[1] ){
					t[1] += grid.extents[1]
					yield grid.p2i(t)
				}
			}

			// bottom
			let b = [x,y+1]
			if( b[1] < grid.extents[1] ){
				yield grid.p2i(b)
			} else {
				if( grid.torus[1] ){
					b[1] -= grid.extents[1]
					yield grid.p2i(b)
				}
			}
		}
	})

	describe( " [ unit tests ] ", function () {

		/** @test {Grid2D#pixelsi} */
		it( "pixelsi generator reports correct IndexCoordinates", function(){
			let k = 0
			for( let i of grid2d.pixelsi() ){
				expect( grid2d.i2p(i) ).toEqual( allPixelArray[k] )
				k++
			}
		})

		/** @test {Grid2D#neighi}
		 * @test {Grid2D#neighiSimple} */
		it( "neighi method should return same results as neighiSimple", function(){

			let checkNeighi = function( gridObject ){

				// Test neighi for a sample of pixels on the grid.
				for( let pix of samplePixels( gridObject, 100 ) ){
					const i = gridObject.p2i( pix )
					let neigh1 = gridObject.neighiSimple( i )
					let neigh2 = gridObject.neighi( i )
					expect( neigh1.sort() ).toEqual( neigh2.sort() )
				}

				// Specifically check some pixels at the borders as well
				for( let p of borderPixelSample( gridObject ) ){
					const i = gridObject.p2i( p )
					let neigh1 = gridObject.neighiSimple( i )
					let neigh2 = gridObject.neighi( i )
					expect( neigh1.sort() ).toEqual( neigh2.sort() )
				}
			}

			checkNeighi( grid2d )
			checkNeighi( grid2dFloat )
		})

		/** @test {Grid2D#neighi}*/
		describe( "neighi method should return correct neighbors for specific cases: ", function(){

			let checkExpected = function( gridObject, p, torus, expectedNbh ){
				const nbh = gridObject.neighi( gridObject.p2i(p), torus )
				const expectedNbh2 = expectedNbh.map( function(p) {
					return gridObject.p2i(p)
				} )
				expect( nbh.length ).toEqual( expectedNbh2.length )
				expect( nbh.sort() ).toEqual( expectedNbh2.sort() )
			}

			// Check if neighborhoods are correct for different torus settings,
			// for all four corners of a gridObject.
			let checkNeighi = function( gridObject ) {

				const xMax = gridObject.extents[0] - 1, yMax = gridObject.extents[1] - 1
				it("...corner [0,0] ", function () {
					// case 1: corner point [0,0]
					checkExpected(gridObject, [0, 0], [false, false],
						[[0, 1], [1, 1], [1, 0]])
					checkExpected(gridObject, [0, 0], [false, true],
						[[0, 1], [1, 1], [1, 0], [0, yMax], [1, yMax]])
					checkExpected(gridObject, [0, 0], [true, false],
						[[0, 1], [1, 1], [1, 0], [xMax, 0], [xMax, 1]])
					checkExpected(gridObject, [0, 0], [true, true],
						[[0, 1], [1, 1], [1, 0],
							[xMax, 0], [xMax, 1], [0, yMax], [1, yMax], [xMax, yMax]])
				})
				it("...corner [xMax,0] ", function () {
					// case 2 : corner point [xMax,0]
					checkExpected( gridObject, [xMax, 0], [false, false],
						[[xMax - 1, 0], [xMax - 1, 1], [xMax, 1]])
					checkExpected( gridObject, [xMax,0], [false,true],
						[ [xMax - 1, 0], [xMax - 1, 1], [xMax, 1],
							[xMax-1,yMax], [xMax,yMax] ] )
					checkExpected( gridObject, [xMax,0], [true,false],
						[ [xMax - 1, 0], [xMax - 1, 1], [xMax, 1],
							[0,0], [0,1] ] )
					checkExpected( gridObject, [xMax,0], [true,true],
						[ [xMax - 1, 0], [xMax - 1, 1], [xMax, 1],
							[0,0], [0,1], [xMax-1,yMax], [xMax,yMax], [0,yMax] ] )
				})
				it("...corner [0,yMax] ", function () {
					checkExpected( gridObject, [0,yMax], [false, false],
						[[0, yMax-1], [1,yMax], [1,yMax-1]])
					checkExpected( gridObject, [0,yMax], [false,true],
						[ [0, yMax-1], [1,yMax], [1,yMax-1],
							[0,0], [1,0] ] )
					checkExpected( gridObject, [0,yMax], [true,false],
						[ [0, yMax-1], [1,yMax], [1,yMax-1],
							[xMax,yMax], [xMax,yMax-1] ] )
					checkExpected( gridObject, [0,yMax], [true,true],
						[  [0, yMax-1], [1,yMax], [1,yMax-1],
							[0,0], [1,0], [xMax,yMax-1], [xMax,yMax], [xMax,0] ] )
				})
				it("...corner [xMax,yMax] ", function () {
					checkExpected( gridObject, [xMax,yMax], [false, false],
						[[xMax, yMax-1], [xMax-1,yMax], [xMax-1,yMax-1]])
					checkExpected( gridObject, [xMax,yMax], [false, true],
						[[xMax, yMax-1], [xMax-1,yMax], [xMax-1,yMax-1],
							[xMax,0], [xMax-1,0] ] )
					checkExpected( gridObject, [xMax,yMax], [true,false],
						[[xMax, yMax-1], [xMax-1,yMax], [xMax-1,yMax-1],
							[0,yMax], [0,yMax-1] ] )
					checkExpected( gridObject, [xMax,yMax], [true,true],
						[[xMax, yMax-1], [xMax-1,yMax], [xMax-1,yMax-1],
							[0,yMax], [0,yMax-1], [xMax,0], [xMax-1,0], [0,0] ] )
				})

			}

			setupGrids()
			checkNeighi( grid2d )
			checkNeighi( grid2dFloat )

		})

		/** @test {Grid2D#neighNeumanni} */
		it( "neighNeumanni method should return correct neighbors", function(){

			let checkNeumanni = function( gridObject ){
				// test neighborhood of 100 random pixels
				for( let pix of samplePixels( gridObject, 100 ) ){
					const i = gridObject.p2i( pix )
					let arr1=[], arr2=[]
					for( let n of gridObject.neighNeumanni(i) ){ arr1.push(n) }
					for( let n of simpleNeumanni(i,gridObject) ){ arr2.push(n) }
					expect( arr1 ).toEqual( arr2 )
				}

				// Specifically check some pixels at the borders as well
				for( let p of borderPixelSample( gridObject ) ){
					const i = gridObject.p2i( p )
					let arr1=[], arr2=[]
					for( let n of gridObject.neighNeumanni(i) ){ arr1.push(n) }
					for( let n of simpleNeumanni(i,gridObject) ){ arr2.push(n) }
					expect( arr1 ).toEqual( arr2 )
				}
			}

			checkNeumanni( grid2d )
			checkNeumanni( grid2dFloat )

		})
		/** @test {Grid2D#neighNeumanni}*/
		describe( "neighNeumanni method should return correct neighbors for specific cases: ", function(){

			let checkExpected = function( gridObject, p, torus, expectedNbh ){
				let nbh = []
				for( let n of gridObject.neighNeumanni( gridObject.p2i(p), torus ) ){
					nbh.push( n )
				}
				const expectedNbh2 = expectedNbh.map( function(p) {
					return gridObject.p2i(p)
				} )
				expect( nbh.length ).toEqual( expectedNbh2.length )
				expect( nbh.sort() ).toEqual( expectedNbh2.sort() )
			}

			// Check if neighborhoods are correct for different torus settings,
			// for all four corners of a gridObject.
			let checkNeighNeumanni = function( gridObject ) {

				const xMax = gridObject.extents[0] - 1, yMax = gridObject.extents[1] - 1
				it("...corner [0,0] ", function () {
					// case 1: corner point [0,0]
					checkExpected(gridObject, [0, 0], [false, false],
						[[0, 1], [1, 0]])
					checkExpected(gridObject, [0, 0], [false, true],
						[[0, 1], [1, 0], [0, yMax] ])
					checkExpected(gridObject, [0, 0], [true, false],
						[[0, 1], [1, 0], [xMax, 0] ])
					checkExpected(gridObject, [0, 0], [true, true],
						[[0, 1], [1, 0], [xMax, 0], [0, yMax] ])
				})
				it("...corner [xMax,0] ", function () {
					// case 2 : corner point [xMax,0]
					checkExpected( gridObject, [xMax, 0], [false, false],
						[[xMax - 1, 0], [xMax, 1]])
					checkExpected( gridObject, [xMax,0], [false,true],
						[ [xMax - 1, 0], [xMax, 1], [xMax,yMax] ] )
					checkExpected( gridObject, [xMax,0], [true,false],
						[ [xMax - 1, 0], [xMax, 1], [0,0] ] )
					checkExpected( gridObject, [xMax,0], [true,true],
						[ [xMax - 1, 0], [xMax, 1], [0,0], [xMax,yMax] ] )
				})
				it("...corner [0,yMax] ", function () {
					checkExpected( gridObject, [0,yMax], [false, false],
						[[0, yMax-1], [1,yMax] ])
					checkExpected( gridObject, [0,yMax], [false,true],
						[ [0, yMax-1], [1,yMax], [0,0] ] )
					checkExpected( gridObject, [0,yMax], [true,false],
						[ [0, yMax-1], [1,yMax], [xMax,yMax] ] )
					checkExpected( gridObject, [0,yMax], [true,true],
						[  [0, yMax-1], [1,yMax], [0,0], [xMax,yMax] ] )
				})
				it("...corner [xMax,yMax] ", function () {
					checkExpected( gridObject, [xMax,yMax], [false, false],
						[[xMax, yMax-1], [xMax-1,yMax] ])
					checkExpected( gridObject, [xMax,yMax], [false, true],
						[[xMax, yMax-1], [xMax-1,yMax], [xMax,0] ] )
					checkExpected( gridObject, [xMax,yMax], [true,false],
						[[xMax, yMax-1], [xMax-1,yMax], [0,yMax] ] )
					checkExpected( gridObject, [xMax,yMax], [true,true],
						[[xMax, yMax-1], [xMax-1,yMax],
							[0,yMax], [xMax,0] ] )
				})

			}

			setupGrids()
			checkNeighNeumanni( grid2d )
			checkNeighNeumanni( grid2dFloat )

		})

		/** @test {Grid2D#gradienti} */
		it( "gradienti method should return correct gradients", function(){

			let simpleGradienti = function(i, grid){

				let p = grid.i2p(i)
				let vi = grid.pixti(i), dx, dy

				let nbh = []
				for( let n of simpleNeumanni(i,grid) ){
					nbh.push(n)
				}

				let xNeighbors = [NaN, NaN]
				let yNeighbors = [NaN, NaN]
				// check which neighbors there are
				for( let n of nbh ){
					let pn = grid.i2p(n)
					// x neighbors
					if( pn[1] === p[1] ){
						if( pn[0] < p[0] ){
							xNeighbors[0] = n
						} else {
							xNeighbors[1] = n
						}
					}

					// y neighbors
					if( pn[0] === p[0] ){
						if( pn[1] < p[1]){
							yNeighbors[0] = n
						} else {
							yNeighbors[1] = n
						}
					}
				}

				// this shouldn't happen.
				if( isNaN( xNeighbors[0] ) && isNaN(xNeighbors[1] ) ){
					throw( "no x neighbors found!")
				}
				if( isNaN( yNeighbors[0] ) && isNaN(yNeighbors[1] ) ){
					throw( "no y neighbors found!")
				}

				// compute gradients
				let grad = function( nArr ){
					if( isNaN( nArr[0] ) ){
						return grid.pixti(nArr[1]) - vi
					}
					if( isNaN( nArr[1] ) ){
						return vi - grid.pixti(nArr[0])
					}
					return ( ( grid.pixti(nArr[1]) - vi  ) + ( vi - grid.pixti(nArr[0])  ) )/2
				}

				dx = grad( xNeighbors )
				dy = grad( yNeighbors )

				return [dx,dy]
			}


			let checkGradienti = function( gridObject ){

				// set some random values on the float grid
				for( let i of gridObject.pixelsi() ){
					gridObject.setpixi( i, Math.random()*1000 )
				}

				// test neighborhood of 100 random pixels
				for( let pix of samplePixels( gridObject, 100 ) ){
					const i = gridObject.p2i( pix )
					expect( gridObject.gradienti(i) ).toEqual( simpleGradienti(i,gridObject) )
				}


				// Specifically check some pixels at the borders as well
				for( let p of borderPixelSample( gridObject ) ){
					const i = gridObject.p2i( p )
					expect( gridObject.gradienti(i) ).toEqual( simpleGradienti(i,gridObject) )
				}
			}

			checkGradienti( grid2dFloat )

		})

	})
})