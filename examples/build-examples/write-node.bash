#!/bin/bash

examplename=$1
templatefile=simulation-files/$examplename.js

if [[ $( cat $templatefile | grep "START CONFIGURATION" | wc -l ) -eq 0 ]]; then
	bash write-simple-node.bash $examplename	
else 
	bash write-example-node.bash $examplename
fi
