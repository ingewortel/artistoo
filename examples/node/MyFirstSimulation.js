let CPM = require('../../build/artistoo-cjs.js')

let config = {
    ndim: 2,
    field_size: [100,100],
    conf: {
        T: 20,
        J: [[0,100,20], 
            [100,75,200], 
            [20,200,50]],
        LAMBDA_V: [0,100,50],
        V: [0,500,300]
    },
    simsettings: {
        NRCELLS: [6],
        CELLCOLOR: ["000000", "FF0000"],
        RUNTIME: 50,
        CANVASCOLOR: "eaecef",
        zoom: 4
    }
}

let sim = new CPM.Simulation(config)
sim.run()
