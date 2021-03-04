/** Tests for Grid Manipulator
 *
 * @test {GridManipulator}*/
describe("GridManipulator", function () {
	let CPM = require("../../build/artistoo-cjs.js")
	//eslint-disable-next-line no-unused-vars
	let C, G

	let setupSim = function ( ) {

		C = new CPM.CPM( [50,50], {
			T : 10,
			J: [[0,10], [10,0]],
			V : [0,10],
			LAMBDA_V : [0,5]
		} )

		G = new CPM.GridManipulator( C )
		G.seedCell(1 )
		for( let t = 0; t < 10; t++ ){ C.monteCarloStep() }
	}

	describe(" [ unit tests ] ", function () {

		/** @test {GridManipulator#seedCellAt} */
		it("seedCellAt should not throw error normally", function () {
			setupSim()
			expect( function() { G.seedCellAt( 1, [0,0] ) }).not.toThrow()
		})
		it("seedCellAt should throw error when trying to seed outside of grid", function () {
			setupSim()
			expect( function() { G.seedCellAt( 1, [300,-5]) }).toThrow()
		})

		/** @test {GridManipulator#killCell} */
		it("should remove a cellID from the grid", function () {
			setupSim()
			const cid = C.cellIDs().next().value
			expect( function() { G.killCell(cid) }).not.toThrow()
			let pixels = []
			for( let [p,i] of C.grid.pixels() ){

				if( i.toString() === cid ){
					pixels.push(p)
				}
			}
			expect( pixels.length ).toEqual( 0 )
		})

		it("should not mess up cellKinds etc", function () {
			setupSim()
			const cid = C.cellIDs().next().value

			// seed a second cell
			G.seedCellAt( 1, [1,1] )
			// kill the first cell
			G.killCell(cid)

			// check that all pixt() and cellKind() are still defined.
			for( let [p,i] of C.grid.pixels() ){
				expect( C.pixt(p) ).toBeDefined()
				expect( C.cellKind(i) ).toBeDefined()
				expect( C.cellKind(i) ).toEqual( 1 )
			}
		})

	})
})