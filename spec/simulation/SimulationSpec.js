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

		/** @test {Simulation#initializeGrid} */
		describe("initializeGrid method:", function () {
			it( "should correctly clear up stats if called twice", function(){

				sim.C.getStat( CPM.PixelsByCell )
				sim.C.reset()
				sim.initializeGrid()

				// check that cids of PixelsByCell are still correct
				let undef = 0
				for( let cid of Object.keys( sim.C.getStat( CPM.PixelsByCell ) ) ){
					if( typeof sim.C.cellKind(cid) === "undefined" ){
						undef++
					}
				}
				expect( undef ).toEqual(0)

			})

			it( "should reset C if called twice", function(){

				sim.C.reset()
				sim.initializeGrid()
				const n0 = sim.C.t2k.length -1
				// second call
				sim.initializeGrid()
				const n1 = sim.C.t2k.length -1

				expect( n0 ).toEqual(n1)

			})
		})


	})
})