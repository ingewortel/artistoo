#!/bin/bash

examplename=$1
templatefile=simulation-files/$examplename.js


echo 'let CPM = require("../../build/cpm-cjs.js")'
echo -e '\n'

sed -e '1,/START CODE/d' -e '/END CODE/,$d' $templatefile | grep -v FPSMeter | \
	grep -v "meter.tick()"


echo "initialize()"