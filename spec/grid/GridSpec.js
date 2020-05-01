/** @test {Grid}*/
describe("Grid", function () {
	let CPM = require("../../build/artistoo-cjs.js")
	//eslint-disable-next-line no-unused-vars
	let grid2d, grid3d, grid

	beforeEach(function () {
		grid2d = new CPM.Grid2D([100, 100])
		grid3d = new CPM.Grid3D([100, 100, 100])
	})


	describe( " [ unit tests ] ", function (){
		/** @test {Grid#constructor} */
		describe( " constructor ", function(){
			/* Checking errors thrown by the constructor*/
			it("should throw an error when torus is specified for an incorrect number of dimensions", function () {
				expect(function () {
					grid = new CPM.Grid2D([100, 100], [true])
				}).toThrow("Torus should be specified for each dimension, or not at all!")
				expect(function () {
					//noinspection JSCheckFunctionSignatures
					grid = new CPM.Grid2D([100, 100], true)
				}).toThrow("Torus should be specified for each dimension, or not at all!")
				expect(function () {
					grid = new CPM.Grid2D([100, 100], [true, true, true])
				}).toThrow("Torus should be specified for each dimension, or not at all!")
				expect(function () {
					grid = new CPM.Grid3D([100, 100, 100], [true, true])
				}).toThrow("Torus should be specified for each dimension, or not at all!")
			})

			/* Checking properties set by the constructor*/
			it("should set a size for each dimension", function () {
				expect(grid2d.ndim).toEqual(grid2d.extents.length)
				expect(grid3d.ndim).toEqual(grid3d.extents.length)
			})

			it("should set a torus property in each dimension", function () {
				expect(grid2d.ndim).toEqual(grid2d.torus.length)
				expect(grid3d.ndim).toEqual(grid3d.torus.length)
			})

			it("should by default set torus = true in each dimension", function () {
				for (let i = 0; i < grid2d.ndim; i++) {
					expect(grid2d.torus[i] = true)
				}
				for (let i = 0; i < grid3d.ndim; i++) {
					expect(grid3d.torus[i] = true)
				}
			})

			it("should be able to handle different torus settings for each dimension", function () {
				let grid = new CPM.Grid2D([100, 100], [true, false])
				expect(grid.torus[0]).toBe(true)
				expect(grid.torus[1]).toBe(false)
			})

			it("should be able to handle a different size in each dimension", function () {
				let grid = new CPM.Grid2D([100, 300])
				expect(grid.extents[0]).not.toEqual(grid.extents[1])
			})

			it("should compute a midpoint at the correct position", function () {
				expect(grid2d.midpoint.length).toEqual(2)
				expect(grid3d.midpoint.length).toEqual(3)

				grid2d = new CPM.Grid2D([101, 101])
				expect((grid2d.midpoint[0] - grid2d.extents[0]/2) <= 1).toBeTruthy()
				expect((grid2d.midpoint[1] - grid2d.extents[1]/2) <= 1).toBeTruthy()
				expect((grid3d.midpoint[2] - grid3d.extents[2]/2) <= 1).toBeTruthy()
			})
		})

		/** @test {Grid#neigh} */
		describe( " neigh method ", function(){
			let g2D
			beforeEach( function() {
				// Create a grid 2D object with mock functions except neigh to test the
				// functionality of the Grid class independently of the
				// Grid2D and Grid3D subclasses.
				g2D = new CPM.Grid2D( [100,100] )
				//g2D = jasmine.createSpyObj("g2D", [ "neighi","p2i","i2p" ])
				// A mock neighi method for the unit test
				spyOn( g2D, "neighi" ).and.callFake( function ( i, torus ){
					let arr = []
					if( (i-1) >= 0 ){
						arr.push( i-1 )
					} else {
						for( let d = 0; d < torus.length; d++ ){
							if( torus[d] ) { arr.push( -(1+d )) }
						}
					}
					arr.push( i + 1 )

					return arr
				})
				spyOn( g2D, "i2p" ).and.callFake( function(i) {
					return( [0,i] )
				})
				spyOn( g2D, "p2i" ).and.callFake( function(p) {
					return p[1]
				})
			})

			it( " should return an array coordinate", function(){
				let nbh = g2D.neigh( [0,0] )
				for( let i = 0; i < nbh.length; i++ ){
					let n = nbh[i]
					expect( n.length ).toEqual( 2 )
				}
			})

			it( " should listen to torus for each dimension",
				function() {
					// the mock function adds a neighbor for each dim with a torus.
					// the mock function should return only one neighbor for [0,0]
					// when there is no torus.
					let nNeighbors = g2D.neigh( [0,0], [false,false] ).length
					expect( nNeighbors ).toEqual(1)
					nNeighbors = g2D.neigh( [0,0], [false,true] ).length
					expect( nNeighbors ).toEqual( 2 )
					nNeighbors = g2D.neigh( [0,0], [true,false] ).length
					expect( nNeighbors ).toEqual( 2 )
					nNeighbors = g2D.neigh( [0,0], [true,true] ).length
					expect( nNeighbors ).toEqual( 3 )

					// torus doesn't matter when not at 'border'
					nNeighbors =  g2D.neigh( [1,1], [false,false] ).length
					expect( nNeighbors ).toEqual( 2 )
					nNeighbors = g2D.neigh( [1,1], [true,true] ).length
					expect( nNeighbors ).toEqual( 2 )
				})
		})

		/** @test {Grid#setpix}
		 * @test {Grid#setpixi} */
		describe( " setpix(i) methods ", function() {
			let grid2D, grid2Db

			beforeEach( function(){
				grid2D = new CPM.Grid2D( [50,50] )
				grid2Db = new CPM.Grid2D( [50,50], [false,false],"Float32" )
				// mock functions of the p2i and i2p implemented in the subclass.
				spyOn( grid2D, "p2i" ).and.returnValue( 0 )
				spyOn( grid2D, "i2p" ).and.returnValue( [0,0] )
				spyOn( grid2Db, "p2i" ).and.returnValue( 0 )
				spyOn( grid2Db, "i2p" ).and.returnValue( [0,0] )
			})

			/**
			 * @test {Grid#setpix}
			 * @test {Grid#setpixi}
			 * */
			it( "can be called", function(){

				expect( grid2D.pixti( 0 ) ).toEqual( 0 )
				expect( function(){ grid2D.setpixi( 0, 1 ) } ).not.toThrow()
				expect( function(){ grid2D.setpix( [0,0], 2 ) } ).not.toThrow()
				expect( function(){ grid2Db.setpix( [0,0], -1 ) } ).not.toThrow()
			})

			/**
			 * @test {Grid#setpix}
			 * @test {Grid#setpixi}
			 * @test {Grid#_isValidValue}
			 * */
			it( " should prohibit setting an invalid type on the grid to avoid bugs", function() {
				expect( function(){ grid2D.setpix( [0,0], -1 ) } ).toThrow()
				expect( function(){ grid2D.setpix( [0,0], 2.5 ) } ).toThrow()
				expect( function(){ grid2D.setpixi( 0, -1 ) } ).toThrow()
				expect( function(){ grid2D.setpixi( 0, 2.5 ) } ).toThrow()

				// but small numeric differences are tolerated
				expect( function(){ grid2D.setpixi( 0, 1.00000001 )}).not.toThrow()
				expect( function(){ grid2D.setpix( [0,0], 1.00000001 )}).not.toThrow()
			})

			/**
			 * @test {Grid#setpix}
			 * @test {Grid#setpixi}
			 * */
			it( "store values in the Grid correctly", function(){

				// ---- Case 1 : Uint16 grid
				// Before setpix, values are zero:
				expect( grid2D.pixti( 0 ) ).toEqual( 0 )
				let randomInt1 = Math.round( Math.random()*100 )
				grid2D.setpixi( 0, randomInt1 )
				expect( grid2D.pixti( 0 ) ).toEqual( randomInt1 )

				let randomInt2 = Math.round( Math.random()*100 )
				grid2D.setpix( [0,0], randomInt2 )
				expect( grid2D.pixti( 0 ) ).toEqual( randomInt2 )

				// --- Case 2 : Float32 grid
				// It should be possible to set a negative value.
				expect( function(){ grid2Db.setpix( [0,0], -1 ) } ).not.toThrow()
				expect( grid2Db.pixti( 0 ) ).toEqual( -1 )

				// ... Or a floating point number
				let value = 2.345
				expect( function(){ grid2Db.setpix( [0,0], value ) } ).not.toThrow()
				expect( grid2Db.pixti( 0 ) ).toBeCloseTo( value, 6 )
			})



		})

		/** @test {Grid#pixt}
		 * @test {Grid#pixti} */
		describe( " pixt(i) methods ", function() {
			let grid2D

			beforeEach( function(){
				grid2D = new CPM.Grid2D( [50,50] )
				// mock functions of the p2i and i2p implemented in the subclass.
				spyOn( grid2D, "p2i" ).and.returnValue( 0 )
				spyOn( grid2D, "i2p" ).and.returnValue( [0,0] )
			})

			/**
			 * @test {Grid#pixt}
			 * @test {Grid#pixti}
			 * */
			it( "pixt(i) can show types on the grid.", function(){
				// before change, types are always zero.
				expect( grid2D.pixti( 0 ) ).toEqual( 0 )
				// pixt uses internally the p2i method from the grid subclass
				// (but not i2p)
				expect( grid2D.p2i ).not.toHaveBeenCalled()
				expect( grid2D.pixt( [0,0] ) ).toEqual( 0 )
				expect( grid2D.p2i ).toHaveBeenCalledWith( [0,0] )
				expect( grid2D.i2p ).not.toHaveBeenCalled()
			})
		})

		/** @test {Grid#pixelsBuffer} */
		describe( " pixelsBuffer method ", function() {
			let grid2D, grid2Db

			beforeEach( function(){
				grid2D = new CPM.Grid2D( [50,50] )
				grid2Db = new CPM.Grid2D( [100,100], [false,false], "Float32" )
			})

			it( "should work on Float32 and Uint16 grids", function(){
				// before change, there is no buffer yet
				expect( grid2D._pixelsbuffer === undefined ).toBeTruthy()
				expect( grid2Db._pixelsbuffer === undefined ).toBeTruthy()

				// after calling the method, there is.
				expect( function(){ grid2D.pixelsBuffer() } ).not.toThrow()
				expect( function(){ grid2Db.pixelsBuffer() } ).not.toThrow()
				expect( grid2D._pixelsbuffer === undefined ).toBeFalse()
				expect( grid2Db._pixelsbuffer === undefined ).toBeFalse()

			})
		})

		/** @test {Grid#laplaciani} */
		describe( " laplacian(i) method ", function() {
			let grid2Db, grid2D

			beforeEach( function(){
				grid2D =  new CPM.Grid2D( [100,100] )
				grid2Db = new CPM.Grid2D( [100,100], [false,false], "Float32" )
			})

			it( "should work on Float32 grids", function(){
				expect( function(){ grid2Db.laplaciani(1) } ).not.toThrow()
				expect( function(){ grid2Db.laplacian([1,1] ) } ).not.toThrow()
			})

			it( "should throw error when you try to call it on Uint16 grid", function(){
				expect( function(){ grid2D.laplaciani(1) } ).toThrow()
				expect( function(){ grid2D.laplacian([1,1] ) } ).toThrow()
			})

			describe( " should compute laplacian correctly ", function() {

				// spy on the neighNeumanni method by returning always pixels 1,2,3,4
				beforeEach( function (){
					grid2Db.neighNeumanni = function * (){
						for( let i = 0; i < 4; i++ ){
							yield i+1
						}
					}
				})


				it( " case 1 : everything zero ", function(){
					// spy on pixti method to let it always return 0
					spyOn( grid2Db, "pixti" ).and.returnValue(0)

					// check that the spying works, this value of 1000 should not
					// be detected.
					grid2Db.setpixi( 1, 1000 )

					// check that laplacian returns zero
					expect( grid2Db.laplaciani(0) ).toEqual(0)

				})

				it( " case 2 : everything a positive value ", function(){

					spyOn( grid2Db, "pixti" ).and.callFake( function( i ){
						return i*1000
					})
					expect( grid2Db.laplaciani(0) ).toEqual( 10000 )

				})

				it( " case 3 : everything a negative value ", function(){
					spyOn( grid2Db, "pixti" ).and.callFake( function( i ){
						return -i*1000
					})
					expect( grid2Db.laplaciani(0) ).toEqual( -10000 )
				})

				it( " case 4 : floating point values ", function(){
					spyOn( grid2Db, "pixti" ).and.callFake( function( i ){
						return i*1000 + 0.1* Math.random()
					})
					expect( grid2Db.laplaciani(0) ).toBeCloseTo( 10000, 0 )
				})

				it( " case 4 : positive and negative floating point values ", function(){
					spyOn( grid2Db, "pixti" ).and.callFake( function( i ){
						if( i >= 1 && i <= 4 ){
							let num = 1000 + 0.1* Math.random()
							if( i % 2 === 0 ){ return -num }
							return num
						}
						return 0
					})
					expect( grid2Db.laplaciani(0) ).toBeCloseTo( 0, 0 )
				})

			})

		})

		/** @test {Grid#diffusion} */
		describe( " diffusion method ", function() {
			let grid2Db, grid2D

			beforeEach(function () {
				grid2D = new CPM.Grid2D([200, 200])
				grid2Db = new CPM.Grid2D([200, 200], [false, false], "Float32")
			})

			it("can be called on Float32 grids", function () {
				expect(function () {
					grid2Db.diffusion(0.01)
				}).not.toThrow()
			})

			it("should throw error when you try to call it on Uint16 grid", function () {
				let message = "Diffusion/laplacian methods do not work on a Uint16 grid! " +
					"Consider setting datatype='Float32'."
				expect(function () {
					grid2D.diffusion(1)
				}).toThrow(message)
			})

		})


	})

	describe( " [ class extension ] ", function (){
		let g

		class MyGrid extends CPM.Grid {
			myMethod(){
				return 1
			}
		}
		beforeEach( function(){
			g = new MyGrid( [50,50] )
		})

		it( "should be possible to extend with a method", function() {
			expect( g.myMethod() ).toEqual(1)
		})

		it( "should be possible to build a custom Grid subclass" , function(){
			//eslint-disable-next-line no-unused-vars
			expect( function(){ new MyGrid( [ 50,50 ] ) } ).not.toThrow()
			let g = new MyGrid( [ 50,50 ] )
			expect( g.extents[0] ).toEqual(50)
		})

		/** @test {Grid#_pixels} */
		it( "should throw an error when _pixelArray is not set in subclass", function(){
			expect( function(){ g._pixels }).toThrow()
		})

		/**
		 * @test {Grid#p2i}
		 * @test {Grid#i2p}
		 */
		it( "superclass should throw error when p2i/i2p not implemented", function() {
			expect( function(){ g.p2i( [0,0] ) }).toThrow()
			expect( function(){ g.i2p( 0 )}).toThrow()
		})

		/** @test{Grid#neighi}
		 * @test {Grid#neigh}
		 * */
		it( "should throw error when neighi not implemented", function(){
			expect( function(){g.neigh([0,0])}).toThrow()
			expect( function(){g.neighi(0)}).toThrow()

			// but it should work as soon as p2i, i2p, and neighi are defined.
			spyOn( g, "p2i" ).and.returnValue( 0 )
			spyOn( g, "i2p" ).and.returnValue( [0,0] )
			spyOn( g, "neighi" ).and.returnValue( [0] )
			expect( function(){ g.neigh([0,0])} ).not.toThrow()
		})

		/** @test{Grid#pixelsi}
		 * @test {Grid#pixels}
		 * */
		it( "should throw error when pixels/pixelsi not implemented", function(){

			let pixels = []
			expect( function(){ for( let p of g.pixels() ){ pixels.push(p) } }).toThrow()
			expect( function(){ for( let p of g.pixelsi() ){ pixels.push(p) } }).toThrow()
			expect( pixels.length ).toEqual(0)
		})

		/** @test{Grid#gradienti}
		 * @test {Grid#gradient}
		 * */
		it( "should throw error when gradienti not implemented", function(){
			expect( function(){g.gradient([0,0])}).toThrow()
			expect( function(){g.gradienti(0)}).toThrow()
		})

		/** @test{Grid#gradienti}
		 * @test {Grid#gradient}
		 * */
		it( "gradient should work as soon as gradienti and p2i are implemented.", function(){
			spyOn( g, "p2i" ).and.returnValue( 0 )
			spyOn( g, "gradienti" ).and.callFake( function(i){ return i + 10 } )
			expect( function(){ g.gradient([0,0] ) } ).not.toThrow()
			expect( g.gradient( [0,0] ) ).toEqual(10)
		})

		/** @test{Grid#neighNeumanni}
		 * @test {Grid#laplacian}
		 * @test {Grid#laplaciani}
		 * */
		it( "laplaciani should throw error when neighNeumanni not implemented", function(){
			let message = "Trying to call the method neighNeumanni, but you haven't " +
				"implemented this method in the Grid subclass you are using!"
			expect( function(){g.laplaciani(0)}).toThrow(message)
		})

		/** @test{Grid#neighNeumanni}
		 * @test {Grid#laplacian}
		 * @test {Grid#laplaciani}
		 * */
		it( "laplacian should throw error when p2i/neighNeumanni not implemented", function(){
			let message = "A p2i method should be implemented in every Grid subclass!"
			expect( function(){g.laplacian([0,0] ) } ).toThrow(message)

			// should still throw error when p2i is implemented but neighNeumanni is not
			spyOn( g, "p2i" ).and.returnValue(0)
			message = "Trying to call the method neighNeumanni, but you haven't " +
				"implemented this method in the Grid subclass you are using!"
			expect( function(){g.laplacian([0,0] ) } ).toThrow(message)
		})

		/** @test{Grid#neighNeumanni}
		 * @test {Grid#laplacian}
		 * @test {Grid#laplaciani}
		 * */
		it( "laplacian(i) should work if p2i, neighNeumanni, and _pixelArray exist", function(){

			spyOn( g, "p2i" ).and.returnValue(0)
			g.neighNeumanni = function* (){
				for( let k = 0; k < 4; k++ ){ yield k + 1 }
			}
			g._pixelArray = new Float32Array(1000)
			expect( function(){g.laplacian([0,0] ) } ).not.toThrow()

		})

	})


})
