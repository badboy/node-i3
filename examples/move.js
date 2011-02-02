var i3 = require('../lib/node-i3');

var c = i3.connect('/home/badboy/.i3/ipc.sock');

c.on('connect', function() {
  console.log('connected');
});

c.command("9").command("m10");

i = 0;
c.on('data', function(data) {
  console.log((+new Date), "type:", data.type);
  console.log("     ", data.data);
  i++;

  // after both commands returned a response, exit
  if(i > 1) c.end();
});
