#!/bin/bash

examplename=$1
templatefile=simulation-files/$examplename.js

cat <<END
let CPM = require("../../build/artistoo-cjs.js")
END

cat $templatefile | grep -v FPSMeter | grep -v meter.tick

cat <<END
// all steps
function run(){
	while( t < conf.RUNTIME ){
		step() 
	}
}
initialize()
END
