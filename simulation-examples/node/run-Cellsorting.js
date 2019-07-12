let CPM = require("../../build/cpm-cjs.js")
let config = require("../simulation-files/Cellsorting-config.js")
let Cellsorting = require ("../simulation-files/Cellsorting.js")


let sim = new Cellsorting( config )
sim.run()
