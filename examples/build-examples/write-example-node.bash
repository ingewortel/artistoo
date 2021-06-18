#!/bin/bash

examplename=$1

templatefile=simulation-files/$examplename.js


echo 'let CPM = require("../../build/artistoo-cjs.js")'
echo -e '\n'
awk -f extract-require.awk $templatefile | grep "#node" | awk -F "::" '{gsub(/ /, "", $2); print "let" $3 " = require( \"" $2 "\" ) "}'

sed -e '1,/START CLASS DEFINITION/d' -e '/END CLASS DEFINITION/,$d' $templatefile

sed -e '1,/START CONFIGURATION/d' -e '/END CONFIGURATION/,$d' $templatefile
echo -e '\n'

if [[ $( cat $templatefile | grep "Custom-methods:" | grep "true" | wc -l) -eq 0 ]] ; then 
	echo 'let sim = new CPM.Simulation( config, {} )'
else
	sed -e '1,/START METHODS OBJECT/d' -e '/END METHODS OBJECT/,$d' $templatefile 
	echo  'let sim = new CPM.Simulation( config, custommethods )'
fi
sed -e '1,/START ADDCONSTRAINTS/d' -e '/END ADDCONSTRAINTS/,$d' $templatefile
echo -e "\n"


echo -e '\n'

sed -e '1,/START METHODS DEFINITION/d' -e '/END METHODS DEFINITION/,$d' $templatefile
echo -e '\n'

echo "sim.run()"