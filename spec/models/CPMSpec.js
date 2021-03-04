/** Some tests for the CPM class.
 *
 * @test {CPM}*/
describe("CPM", function () {
	let CPM = require("../../build/artistoo-cjs.js")
	let cpm

	beforeEach( function() {
		// Build a cpm and a ca
		cpm = new CPM.CPM( [50,50],
			{	T:20,
				J : [[0,20],[20,0]]
			} )
	})

	describe( "[ Unit tests ]", function() {
		/* Testing the connected components method for specific cases */
		/** @test {CPM#setpixi} */
		describe("method [ setpixi ]", function () {

			it("shouldn't mess up cell kinds", function () {
				const doublePixels = [[2,2]]
				const cid = cpm.makeNewCellID(1)
				for( let p of doublePixels ){
					cpm.setpix( p, cid )
				}

				expect(cpm.cellKind( cpm.pixt( [2,2] ) ) ).toBeDefined()
			})

			it("shouldn't mess up cell kinds if called twice on same pixel", function () {
				const doublePixels = [[2,2],[2,2]]
				const cid = cpm.makeNewCellID(1)
				for( let p of doublePixels ){
					cpm.setpix( p, cid )
				}

				expect(cpm.cellKind( cpm.pixt( [2,2] ) ) ).toBeDefined()
			})


		})
	})


})

