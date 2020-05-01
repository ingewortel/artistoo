/** Tests for Grid Manipulator
 *
 * @test {GridManipulator}*/
describe("GridManipulator", function () {
	let CPM = require("../../build/artistoo-cjs.js")
	//eslint-disable-next-line no-unused-vars
	let sim

	let setupSim = function ( ) {

		let config = {
			field_size : [50,50],
			conf : {
				// Basic CPM parameters
				torus : [true,true],
				T : 10,
				J: [[0,10], [10,0]],
				LAMBDA_V: [0,5],
				V: [0,500],
				LAMBDA_P: [0,2],
				P : [0,260]
			},

			// Simulation setup and configuration
			simsettings : {
				NRCELLS : [1],
				BURNIN : 10,
				RUNTIME : 10,
				CANVASCOLOR : "eaecef",
				STATSOUT : { browser: false, node: false },
			}
		}


		sim = new CPM.Simulation( config, {} )
		sim.initializeGrid()
		sim.run()
	}

	describe(" [ unit tests ] ", function () {

		/** @test {GridManipulator#seedCellAt} */
		it("should throw error when trying to seed outside of grid", function () {
			setupSim()
			expect( function() { sim.gm.seedCellAt( 1, [300,-5]) }).toThrow()
		})

	})
})