#!/bin/bash


examplename=$1
templatefile=simulation-files/$examplename.js

cat <<END
<!DOCTYPE html>
<html lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>$examplename</title>
<style type="text/css">
body{
	font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue",
	Helvetica, Arial, "Lucida Grande", sans-serif;
	padding : 15px;
	max-width: 600px;
	margin: auto;
}
td {
	padding: 10px; vertical-align: top;
}
</style>
<script src="./artistoo.js"></script>
<script src="./fpsmeter.min.js"></script>
<script>
END

cat $templatefile

cat <<END
// Run the simulation
function run(){
	step(); 
	if( t < conf.RUNTIME ){ requestAnimationFrame( run ) }
}
END

cat <<END
</script>
</head>
<body onload="initialize()">

END
awk -f extract-description.awk $templatefile
cat <<END
</body>
</html>
END
