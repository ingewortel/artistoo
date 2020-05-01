/** General tests that every Grid subclass should pass
 * @test {Grid2D}
 * @test {Grid3D} */
describe("Subclasses extending the Grid superclass", function () {
	/*
	Testing for having a _pixelArray, and the p2i/i2p/neighi methods and the
	pixels(i) generators.
	Other methods that should be implemented in grid subclasses (gradienti,
	laplaciani, neighNeumanni) are not enforced since they are not used by all
	CPMs.
	*/


	let CPM = require("../../build/artistoo-cjs.js")
	let testObjects = [], testNames = []
	let addTestObject = function( object, name ){
		testObjects.push( object )
		testNames.push( name )
	}

	// You can add your own grid subclasses to be tested here.
	addTestObject( new CPM.Grid2D( [50,50] ), "Grid2D (torus-Uint16)" )
	addTestObject( new CPM.Grid2D( [100,100],[false,false],"Float32" ),
		"Grid2D (noTorus-Float32)" )
	addTestObject( new CPM.Grid3D( [50,50,50] ), "Grid3D" )


	// Uncomment the following to see that the tests fail when the grid
	// extension does not implement the necessary methods.
	/*class MyGrid extends CPM.Grid {
		myMethod(){
			return 1
		}
	}
	addTestObject( new MyGrid( [50,50] ), "MyGrid" )*/


	for( let i = 0; i < testObjects.length; i++ ){

		let subclassName = " " + testNames[i] + ": "
		let obj = testObjects[i]
		let p = []
		for( let d = 0; d < obj.ndim; d++ ){
			p.push(0)
		}

		describe( subclassName, function(){

			it( "should all have a _pixelArray", function(){
				expect( obj._pixelArray ).toBeDefined()
				expect( obj._pixelArray.length ).toEqual( obj.p2i( obj.extents ) )
			})

			it( "should all have a p2i method", function(){
				expect( obj.p2i ).toBeDefined()
				expect( obj.p2i ).toEqual( jasmine.any(Function))
				expect( function() { obj.p2i(p) } ).not.toThrow(
					"A p2i method should be implemented in every Grid subclass!"
				)
			})

			it( "should all have an i2p method", function(){
				expect( obj.i2p ).toBeDefined()
				expect( obj.i2p ).toEqual( jasmine.any(Function))
				expect( function() { obj.i2p(0) } ).not.toThrow(
					"An i2p method should be implemented in every Grid subclass!"
				)
			})

			/** @test {Grid2D#i2p}
			 * @test {Grid2D#p2i}
			 * @test {Grid3D#p2i}
			 * @test {Grid3D#i2p} */
			it( "i2p and p2i should be inverse for valid grid coordinates", function(){

				// Test 10 randomly sampled pixels on the grid.
				for( let t = 0; t < 10; t++ ){

					// Pick random position on the grid
					let validPosition = []
					for( let d = 0; d < obj.ndim; d++ ){
						let posD = Math.round( Math.random()*(obj.extents[d]-1) )
						validPosition.push( posD )
					}

					// Check if inverse relation holds.
					let validPositionIndex = obj.p2i( validPosition )
					expect( obj.p2i( obj.i2p( validPositionIndex ) ) ).toEqual( validPositionIndex )
					expect( obj.i2p( obj.p2i( validPosition ) ) ).toEqual( validPosition )
				}

			})

			it( "should all have a neighi method", function(){
				expect( obj.neighi ).toBeDefined()
				expect( obj.neighi ).toEqual( jasmine.any(Function))
				expect( function(){ obj.neighi( 0 ) } ).not.toThrow(
					"A neighi method should be implemented in every Grid subclass!"
				)
			})

			it( "should all have pixels(i) generator methods", function(){
				expect( function() {
					let arr = []
					for( p of obj.pixelsi() ){
						arr.push(p)
					}
					return arr
				}).not.toThrow()
				expect( function() {
					let arr = []
					for( p of obj.pixels() ){
						arr.push(p)
					}
					return arr
				}).not.toThrow()
			})
		})

	}
})

/** Grid subclasses supporting diffusion.
 * @test {Grid2D} */
describe("Grid subclasses supporting diffusion", function () {

	let CPM = require("../../build/artistoo-cjs.js")
	let testObjects2 = [], testNames2 = []
	let addTestObject = function( object, name ){
		testObjects2.push( object )
		testNames2.push( name )
	}

	// You can add your own grid subclasses to be tested here.
	addTestObject( new CPM.Grid2D( [100,100],[false,false],"Float32" ),
		"Grid2D (noTorus-Float32)" )
	// 3D is not supported yet.
	//addTestObject( new CPM.Grid3D( [50,50,50], [false,false,false] ), "Grid3D" )

	for( let i = 0; i < testObjects2.length; i++ ) {

		let subclassName = " " + testNames2[i] + ": "
		let obj = testObjects2[i]
		let p = []
		for (let d = 0; d < obj.ndim; d++) {
			p.push(0)
		}

		describe( " [ subclass " + subclassName + " ] ", function () {

			it( "should support a Float datatype", function() {

				expect( obj.datatype ).toBeDefined()
				expect( obj.datatype ).toEqual( "Float32" )

			})

			it( "should be able to store Floating point and negative numbers", function(){

				expect( function() { obj.setpixi(0,-1) } ).not.toThrow()
				expect( obj.pixti(0) ).toEqual( -1 )
				expect( function() { obj.setpixi(0,12.45) } ).not.toThrow()
				expect( obj.pixti(0) ).toBeCloseTo( 12.45, 6 )

			})

			it( "should have a gradienti method", function(){
				expect( obj.gradienti ).toBeDefined()
				expect( obj.gradienti ).toEqual( jasmine.any(Function))
				expect( function(){ obj.neighi( 0 ) } ).not.toThrow(
					"method 'gradienti' not implemented! "
				)
			})

			it( "should have a neighNeumanni generator", function(){
				expect( obj.neighNeumanni ).toBeDefined()
				expect( obj.neighNeumanni ).toEqual( jasmine.any(Function))
				expect( function() {
					obj.neighNeumanni( 0 ).next()
				}).not.toThrow(
					"Trying to call the method neighNeumanni, but you haven't " +
					"implemented this method in the Grid subclass you are using!"
				)
			})


		})
	}
})
