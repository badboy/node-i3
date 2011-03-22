/**
 * simple web-control panel using node-i3
 * the only thing you can do for now is switching workspaces
 **/

var sys = require('sys');
var i3 = require('../lib/node-i3');
var path     = require('path');
var http     = require('http');

/**
 * external dependecies
 * get them via
 *   npm install socket.io
 *   npm install paperboy
 **/
var io       = require('socket.io');
var paperboy = require('paperboy');

/* change this */
var c = i3.connect('/home/badboy/.i3/ipc.sock');

c.on('connect', function() {
  console.log('connected');
  sendSocket({writable: true});
});
c.subscribe(['workspace']);

c.on('event', function(data) {
  if(data.type == i3.EVENTS.WORKSPACE) {
    console.log("reload workspaces");
    c.workspaces();
  }
});

c.on('data', function(data) {
  console.log((+new Date), "type", data.type);

  sendSocket(data);
});

c.on('end', function() {
  console.log("@@@ ended");
  sendSocket({info: 'end'});
});

c.on('error', function(e) {
  console.log("@@@ error:", e);
  sendSocket({error: e});
});

var latest_client;
function sendSocket(msg) {
  if(latest_client) {
    console.log("latest_client:", latest_client.sessionId);
    latest_client.send(JSON.stringify(msg));
  }
}

/* paperboy log method */
function log(statCode, url, ip, err) {
  var logStr = statCode + ' - ' + url + ' - ' + ip;
  if (err)
    logStr += ' - ' + err;
  console.log(logStr);
}

var PORT = 8000;
var WEBROOT = path.dirname(__filename) + '/public';

var server = http.createServer(function(req, res) {
  var ip = req.connection.remoteAddress;
  paperboy
  .deliver(WEBROOT, req, res)
  .after(function(statCode) {
    log(statCode, req.url, ip);
  })
  .error(function(statCode, msg) {
    res.writeHead(statCode, {'Content-Type': 'text/plain'});
    res.end("Error " + statCode);
    log(statCode, req.url, ip, msg);
  })
  .otherwise(function(err) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end("Error 404: File not found");
    log(404, req.url, ip, err);
  });
})
server.listen(PORT);
console.log("paperboy serving on http://localhost:"+PORT);

var socket = io.listen(server);
socket.on('connection', function(client) {
  console.log("Connection from "+client.sessionId);
  latest_client = client;

  client.on('disconnect', function() {
    latest_client = false;
    console.log("Client "+client.sessionId+ " disconnected");
  });

  if(c.socket.writable) {
    sendSocket({writable: true});
  } else {
    sendSocket({writable: false});
  }

  client.on('message', function(data) {
    data = JSON.parse(data);
    console.log("got message:", data);

    if(data.type == "command")
      c.command(data.payload);
    else if(data.type == "workspaces")
      c.workspaces();
    else if(data.type == "outputs")
      c.outputs();
    else
      sendSocket({error: "type "+data.type + " unkown"});
  });
});
