var i3 = require('../lib/node-i3');
var c = i3.connect('/home/badboy/.i3/ipc.sock');

c.on('connect', function() {
  console.log('connected to i3 ipc');
});

// The client queues up any message, so just fire them off.
c.command('3'); // switch to workspace 3

c.on('data', function(data) {
  console.log(data);
  c.end();
});
