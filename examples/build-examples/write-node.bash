#!/bin/bash

examplename=$1
templatefile=simulation-files/$examplename.js

if [[ $( cat $templatefile | grep "START CODE" | wc -l ) -eq 1 ]]; then
	bash write-simple-node.bash $examplename	
else 
	bash write-example-node.bash $examplename
fi