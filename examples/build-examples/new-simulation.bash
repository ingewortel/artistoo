#!/bin/bash
# This script sets up a new simulation.
# ARGUMENTS:
#	1	<examplename>		The name of the simulation to generate

examplename=$1


# Copy the template; replace <myexp> with the simulation name
cat simulation-files/Template.js | sed "s/<myexp>/$examplename/g" \
	> simulation-files/$examplename.js

# Add the name to the makefile
cat Makefile | sed "s/EXAMPLES=/EXAMPLES=$examplename /g" > Makefile.tmp
mv Makefile.tmp Makefile