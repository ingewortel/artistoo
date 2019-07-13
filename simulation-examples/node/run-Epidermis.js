let CPM = require("../../build/cpm-cjs.js")
let config = require("../simulation-files/Epidermis-config.js")
let Epidermis = require ("../simulation-files/Epidermis.js")


let sim = new Epidermis( config )
sim.run()
