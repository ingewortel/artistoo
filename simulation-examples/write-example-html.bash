#!/bin/bash

examplename=$1

simclassfile=simulation-files/$examplename.js
configfile=simulation-files/$examplename-config.js


echo '<!DOCTYPE html>'
echo '<html lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
echo '<title>'$examplename'</title>'
echo '<script src="../../build/cpm.js"></script>'
echo '<script src="../'$simclassfile'"></script>'
echo '<script type="text/javascript" src="../'$configfile'"></script>'
echo '<script>'
echo '"use strict"'
echo -e "\n"

echo let sim
echo -e "\n"

echo "function step(){"

echo -e '\tsim.step()'
echo -e '\t'if'( sim.time+1 < sim.conf["RUNTIME"] ){'
echo -e '\t\trequestAnimationFrame( step )'
echo -e '\t}'
echo '}'
echo -e "\n"

echo "function initialize(){"
echo -e '\tsim = new Microchannel( config )'
echo -e '\tstep()'
echo '}'
echo -e "\n"

echo "</script>"
echo "</head>"
echo '<body onload="initialize()">'
echo '<p>'$examplename'</p>'
echo "</body>"
echo "</html>"