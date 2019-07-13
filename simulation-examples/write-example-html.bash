#!/bin/bash


examplename=$1

simclassfile=simulation-files/$examplename.js

if test -f "$simclassfile"; then
    simclassname=$examplename
else
	simclassname=StandardSimulation
fi

simclassfile=simulation-files/$simclassname.js
configfile=simulation-files/$examplename-config.js


echo '<!DOCTYPE html>'
echo '<html lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
echo '<title>'$examplename'</title>'
#echo '<style type="text/css">'
#echo 'canvas{ border: 1px solid black }'
#echo '</style>'
echo '<script src="../../build/cpm.js"></script>'
echo '<script src="../'$simclassfile'"></script>'
echo '<script src="../fpsmeter.min.js"></script>'
echo '<script type="text/javascript" src="../'$configfile'"></script>'
echo '<script>'
echo '"use strict"'
echo -e "\n"

echo let sim, meter
echo -e "\n"

echo "function step(){"

echo -e '\tsim.step()'
echo -e '\tmeter.tick()'
echo -e '\t'if'( sim.conf["RUNTIME_BROWSER"] == "Inf" | sim.time+1 < sim.conf["RUNTIME"] ){'
echo -e '\t\trequestAnimationFrame( step )'
echo -e '\t}'
echo '}'
echo -e "\n"

echo "function initialize(){"
echo -e '\tsim = new' $simclassname'( config )'
echo -e '\tmeter = new FPSMeter({left:"auto", right:"5px"})'
echo -e '\tstep()'
echo '}'
echo -e "\n"

echo "</script>"
echo "</head>"
echo '<body onload="initialize()">'
echo '<p>'$examplename'</p>'
echo "</body>"
echo "</html>"