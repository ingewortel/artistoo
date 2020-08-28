/** Some tests for the DiceSet class.
 *
 * @test {DiceSet}*/
describe("DiceSet", function () {
	let CPM = require("../build/artistoo-cjs.js")
	let cpm

	beforeEach( function() {
		// Build a cpm and a ca
		cpm = new CPM.CPM( [100,1], [true,false],
			{	T:20,
				J : [[0,20],[20,0]]
			} )
	})

	it( " should start empty", function(){

		expect( cpm.borderpixels.elements.length ).toEqual( 0 )

	})

	it( " should be empty after an element is added and removed", function(){

		cpm.borderpixels.insert( 1 )
		cpm.borderpixels.remove( 1 )
		expect( cpm.borderpixels.elements.length ).toEqual( 0 )

	})

})

