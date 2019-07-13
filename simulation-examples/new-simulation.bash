#!/bin/bash
# This script sets up a new simulation.
# ARGUMENTS:
#	1	<examplename>		The name of the simulation to generate
#	2	<type>				Set 'basic' to use the StandardSimulation.js class,
#							or 'custom' to set up boilerplate for a custom simulation class.


examplename=$1
type=$2 # 'basic' to use the standard Simulation class, 'custom' to use your own.


configfile=simulation-files/$examplename-config.js

# Create the simulation file if custom simulation:
if [[ $type == "custom" ]] ; then
	simclassfile=simulation-files/$examplename.js
	cat simulation-files/SimulationTemplate.js | \
		sed "s/SimulationTemplate/$examplename/g" > \
		simulation-files/$examplename.js
fi
	
# Create the configuration file
cat simulation-files/configTemplate.js | \
	sed "s/myexp/$examplename/g" > simulation-files/$examplename-config.js

# Add the name to the makefile
cat Makefile | sed "s/EXAMPLES=/EXAMPLES=$examplename /g" > Makefile.tmp
mv Makefile.tmp Makefile