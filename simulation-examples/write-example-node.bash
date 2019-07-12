#!/bin/bash

examplename=$1

simclassfile=simulation-files/$examplename.js

if test -f "$simclassfile"; then
    simclassname=$examplename
else
	simclassname=StandardSimulation
fi

simclassfile=simulation-files/$simclassname.js
configfile=simulation-files/$examplename-config.js


echo 'let CPM = require("../../build/cpm-cjs.js")'
echo 'let config = require("../'$configfile'")'
echo let $simclassname '= require ("../'$simclassfile'")'
echo -e '\n'


echo "let sim = new "$simclassname"( config )"
echo "sim.run()"