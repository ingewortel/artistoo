var fpath = 'frames/'
var port = 1337

var fs = require('fs');
if (!fs.existsSync(fpath)) {
	console.log("Please make a folder 'frames/' for me to drop the frames into!")
	process.exit(1)
}

var WebSocketServer = require('websocket').server;
var http = require('http');
var util = require('util')

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(port, function() { });

console.log("Server listening on port "+port)

var current_frame = 0

// create the server
wsServer = new WebSocketServer({
    httpServer: server,
    maxReceivedFrameSize: 0x100000
});

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            // process WebSocket message
            current_frame ++ 
            if( current_frame < 5000 ){
		var base64Data = message.utf8Data.replace(/^data:image\/png;base64,/, "");
		require("fs").writeFile( fpath+pad(current_frame,5)+".png", base64Data, 
			'base64', function(err) { if( err ) console.log(err); console.log( current_frame ) });
	    }
        }
    });

    connection.on('close', function(connection) {
        // close user connection
    });
});
