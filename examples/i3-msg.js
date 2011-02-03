var i3 = require('../lib/node-i3');
var c = i3.connect('/home/badboy/.i3/ipc.sock');

if(process.argv[2]) {
  // The client queues up any message, so just fire them off.
  c.command(process.argv[2]);

  c.on('data', function(data) {
    console.log(data.data);
    c.end();
  });
}
