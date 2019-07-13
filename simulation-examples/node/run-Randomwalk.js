let CPM = require("../../build/cpm-cjs.js")
let config = require("../simulation-files/Randomwalk-config.js")
let StandardSimulation = require ("../simulation-files/StandardSimulation.js")


let sim = new StandardSimulation( config )
sim.run()
