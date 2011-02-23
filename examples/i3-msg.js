var i3 = require('../lib/node-i3');

if(process.argv[2]) {
  var c = i3.connect('/home/badboy/.i3/ipc.sock');
  // The client queues up any message, so just fire them off.
  c.command(process.argv[2]);

  c.on('data', function(data) {
    console.log(data.data);
    c.end();
  });
} else {
  console.log("need arg");
}
