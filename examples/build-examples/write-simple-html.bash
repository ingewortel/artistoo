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
echo "}"
echo "td {"
echo -e '\t padding: 10px;'
echo -e '\t vertical-align: top;'
echo "}"
echo '</style>'
echo -e "\n"
echo '<script src="./cpm.js"></script>'
echo '<script src="./fpsmeter.min.js"></script>'
echo '<script>'
echo -e "\n"

sed -e '1,/START CODE/d' -e '/END CODE/,$d' $templatefile \

echo "// Run the simulation"
echo function run'(){'
echo -e '\t	step()'
echo -e '\t	if( t < conf.runtime ){ requestAnimationFrame( run ) }'
echo "}"




echo "</script>"
echo "</head>"
echo '<body onload="initialize()">'
echo '<h1>'$examplename'</h1>'
echo '<p>'
sed -e '1,/START DESCRIPTION/d' -e '/END DESCRIPTION/,$d' $templatefile
echo '</p>'
echo "</body>"
echo "</html>"