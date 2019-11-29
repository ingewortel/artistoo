#!/bin/bash

examplename=$1
templatefile=simulation-files/$examplename.js


echo 'let CPM = require("../../build/cpm-cjs.js")'
echo -e '\n'

sed -e '1,/START CODE/d' -e '/END CODE/,$d' $templatefile | grep -v FPSMeter | grep -v meter.tick


echo "// all steps"
echo function run'(){'
echo -e '\t while( t < conf.runtime){'
echo -e '\t\t	step()'
echo -e '\t }'
echo "}"



echo "initialize()"