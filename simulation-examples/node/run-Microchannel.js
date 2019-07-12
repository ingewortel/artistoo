let CPM = require("../../build/cpm-cjs.js")
let config = require("../simulation-files/Microchannel-config.js")
let Microchannel = require ("../simulation-files/Microchannel.js")


let sim = new Microchannel( config )
sim.run()
