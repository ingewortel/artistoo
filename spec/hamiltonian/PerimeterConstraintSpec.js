/** Tests for Perimeter Constraint
 *
 * @test {PerimeterConstraint}*/
describe("PerimeterConstraint", function () {
	let CPM = require("../../build/artistoo-cjs.js")
	//eslint-disable-next-line no-unused-vars
	let sim, config1, config2

	let setupSim = function ( withPC = true ) {

		config1 = {
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

		config2 = {
			field_size : [50,50],
			conf : {
				// Basic CPM parameters
				torus : [true,true],
				T : 10,
				J: [[0,10], [10,0]],
				LAMBDA_V: [0,5],
				V: [0,500]
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

		if( withPC ){
			sim = new CPM.Simulation( config1, {} )
		} else {
			sim = new CPM.Simulation( config2, {})
		}
		sim.initializeGrid()
		sim.runBurnin()
	}

	describe(" [ unit tests ] ", function () {

		/** @test {PerimeterConstraint} */
		it("can be added to a non-empty grid without crashing:", function () {
			setupSim(false )
			let pc = new CPM.PerimeterConstraint( {
				LAMBDA_P: [0,2],
				P : [0,260]
			} )
			sim.C.add(pc)
			expect( Object.keys( sim.C.getConstraint("PerimeterConstraint").cellperimeters ).length ).not.toEqual( 0 )
			expect( function() { sim.run() }).not.toThrow()
		})

		it( "can be added automatically through the conf object", function(){
			setupSim( true )
			expect( function() { sim.C.getConstraint("PerimeterConstraint" ) }).not.toThrow()

		})

	})
})