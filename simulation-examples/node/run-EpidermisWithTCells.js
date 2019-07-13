let CPM = require("../../build/cpm-cjs.js")
let config = require("../simulation-files/EpidermisWithTCells-config.js")
let EpidermisWithTCells = require ("../simulation-files/EpidermisWithTCells.js")


let sim = new EpidermisWithTCells( config )
sim.run()
