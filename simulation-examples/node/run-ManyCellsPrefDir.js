let CPM = require("../../build/cpm-cjs.js")
let config = require("../simulation-files/ManyCellsPrefDir-config.js")
let ManyCellsPrefDir = require ("../simulation-files/ManyCellsPrefDir.js")


let sim = new ManyCellsPrefDir( config )
sim.run()
