let CPM = require("../../build/cpm-cjs.js")
let config = require("../simulation-files/IsingModel-config.js")
let IsingModel = require ("../simulation-files/IsingModel.js")


let sim = new IsingModel( config )
sim.run()
