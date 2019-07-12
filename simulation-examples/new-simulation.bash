#!/bin/bash

examplename=$1

simclassfile=simulation-files/$examplename.js
configfile=simulation-files/$examplename-config.js

# Create the simulation file
cat simulation-files/SimulationTemplate.js | sed "s/SimulationTemplate/$examplename/g" > \
	simulation-files/$examplename.js
	
# Create the configuration file
cat simulation-files/configTemplate.js > simulation-files/$examplename-config.js

# Add the name to the makefile
cat Makefile | sed "s/EXAMPLES=/EXAMPLES=$examplename /g" > Makefile.tmp
mv Makefile.tmp Makefile