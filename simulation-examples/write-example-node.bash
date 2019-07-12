#!/bin/bash

examplename=$1

simclassfile=simulation-files/$examplename.js
configfile=simulation-files/$examplename-config.js


echo 'let CPM = require("../../build/cpm-cjs.js")'
echo 'let config = require("../'$configfile'")'
echo let $examplename '= require ("../'$simclassfile'")'
echo -e '\n'


echo "let sim = new "$examplename"( config )"
echo "sim.run()"