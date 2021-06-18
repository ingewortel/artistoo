#!/bin/bash


examplename=$1
templatefile=simulation-files/$examplename.js



echo '<!DOCTYPE html>'
echo '<html lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
echo '<title>'$examplename'</title>'
echo '<style type="text/css">'
echo 'body{'
echo -e '\t	font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue",'
echo -e '\t\t Helvetica, Arial, "Lucida Grande", sans-serif;'
echo -e '\t padding : 15px;'
echo -e '\t max-width: 600px;'
echo -e '\t margin: auto;'
echo "}"
echo "td {"
echo -e '\t padding: 10px;'
echo -e '\t vertical-align: top;'
echo "}"
echo '</style>'
echo -e "\n"
echo '<script src="./artistoo.js"></script>'
echo '<script src="./fpsmeter.min.js"></script>'
awk -f extract-require.awk $templatefile | grep "#html" | awk -F "::" '{gsub(/ /, "", $2); print "<script src=\"" $2 "\"></script>"}'
echo '<script>'
echo '"use strict"'
echo -e "\n"

sed -e '1,/START CLASS DEFINITION/d' -e '/END CLASS DEFINITION/,$d' $templatefile

sed -e '1,/START CONFIGURATION/d' -e '/END CONFIGURATION/,$d' $templatefile



echo let sim, meter
echo -e "\n"

echo "function initialize(){"

if [[ $( cat $templatefile | grep "START METHODS OBJECT" | wc -l) -eq 0 ]] ; then 
	echo -e '\tsim = new CPM.Simulation( config, {} )'
else
	sed -e '1,/START METHODS OBJECT/d' -e '/END METHODS OBJECT/,$d' $templatefile | \
		awk '{print "\t",$0}'
	echo -e '\tsim = new CPM.Simulation( config, custommethods )'
fi

sed -e '1,/START ADDCONSTRAINTS/d' -e '/END ADDCONSTRAINTS/,$d' $templatefile
echo -e "\n"


echo -e '\tmeter = new FPSMeter({left:"auto", right:"5px"})'
echo -e '\tstep()'
echo '}'
echo -e "\n"

echo "function step(){"

echo -e '\tsim.step()'
echo -e '\tmeter.tick()'
echo -e '\t'if'( sim.conf["RUNTIME_BROWSER"] == "Inf" | sim.time+1 < sim.conf["RUNTIME_BROWSER"] ){'
echo -e '\t\trequestAnimationFrame( step )'
echo -e '\t}'
echo '}'
echo -e "\n"


sed -e '1,/START METHODS DEFINITION/d' -e '/END METHODS DEFINITION/,$d' $templatefile



echo "</script>"
echo "</head>"
echo '<body onload="initialize()">'
awk -f extract-description.awk $templatefile
echo "</body>"
echo "</html>"
