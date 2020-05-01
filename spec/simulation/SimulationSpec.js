/** Tests for Simulation class.
 *
 * @test {Simulation}*/
describe("Simulation", function () {
	let CPM = require("../../build/artistoo-cjs.js")
	//eslint-disable-next-line no-unused-vars
	let sim


	let setupSim = function () {

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
				P : [0,260],
				LAMBDA_ACT : [0,300],
				MAX_ACT : [0,30],
				ACT_MEAN : "geometric"
			},

			// Simulation setup and configuration
			simsettings : {
				NRCELLS : [1],
				BURNIN : 0,
				RUNTIME : 10,
				CANVASCOLOR : "eaecef",
				CELLCOLOR : ["000000"],
				ACTCOLOR : [true],
				SHOWBORDERS : [false],

				// Output images
				SAVEIMG : false,

				// Output stats etc
				STATSOUT : { browser: false, node: false },
				LOGRATE : 10
			}
		}

		sim = new CPM.Simulation( config, {} )
		sim.initializeGrid()
		sim.run()

	}

	beforeEach(function () {
		setupSim()
	})

	describe(" [ unit tests ] ", function () {

		/** @test {Simulation#drawCanvas} */
		describe("drawCanvas has sensible defaults:", function () {
			it( "should not throw error if ACTCOLOR undefined", function(){
				sim.conf.ACTCOLOR = undefined
				expect( function() { sim.drawCanvas() }).not.toThrow()
			})
		})


	})
})