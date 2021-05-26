/** Tests for Persistence Constraint
 *
 * @test {PersistenceConstraint}*/
describe("PersistenceConstraint", function () {
    let CPM = require("../../build/artistoo-cjs.js")
    //eslint-disable-next-line no-unused-vars
    let sim, config1, config2

    let setupSim = function ( ) {

        config = {
            field_size : [50,50],
            conf : {
                // Basic CPM parameters
                torus : [true,true],
                T : 10,
                LAMBDA_VRANGE_MIN : [0,1],			// MIN/MAX volume for the hard volume constraint
                LAMBDA_VRANGE_MAX : [0,1],
                LAMBDA_DIR : [0,500],
                PERSIST : [0,0.5],
                DELTA_T : [0,1],
            },

            // Simulation setup and configuration
            simsettings : {
                NRCELLS : [1],
                BURNIN : 0,
                RUNTIME : 10,
                CANVASCOLOR : "eaecef",
                STATSOUT : { browser: false, node: false },
            }
        }
        sim = new CPM.Simulation( config, {} )
        sim.C.add( new CPM.HardVolumeRangeConstraint( config.conf ) )
        sim.C.add( new CPM.PersistenceConstraint( config.conf ) )

        sim.initializeGrid()
    }

    describe(" [ unit tests ] ", function () {

        /** @test {PersistenceConstraint} */
        it("does not crash when cell doesn't move for a while:", function() {
            setupSim()
            sim.run()
            const pc = sim.C.getConstraint("PersistenceConstraint")
            for( let cid of sim.C.cellIDs() ){
                for( let d = 0; d < sim.C.extents.length; d++ ){
                    expect( Number.isNaN( pc.celldirections[cid][d] ) ).not.toBeTruthy()
                }
            }
        })
    })
})