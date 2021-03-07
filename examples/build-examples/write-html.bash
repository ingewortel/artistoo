#!/bin/bash

examplename=$1
templatefile=simulation-files/$examplename.js

if [[ $( cat $templatefile | grep "START CONFIGURATION" | wc -l ) -eq 0 ]]; then
	bash write-simple-html.bash $examplename	
else 
	bash write-example-html.bash $examplename
fi
