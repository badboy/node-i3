node-i3
=======

inter-process communication with [i3][], the improved tiling window manager using [node.js][]' asynchronous programming style.


# What?

i3, a tiling window manager, uses a simple message layout for its ipc interface:

    "i3-ipc" <length> <type> <payload>

The response message is in the same format (see [i3/docs/ipc][docsipc] for more info) and the payload is always some JSON:

    { "success": true }

This makes the format perfectly for use within a javascript environment.

node-i3 tries to build a simple API for asynchronous usage of this ipc.

# Why?

Because I can?! :P

I really like the way node.js works (async!), I really like javascript and I needed something to work on; so I created this as a little fun project.

The code may not be perfect as I'm not a real pro in javascript and don't know all the idioms, but I like to learn, so fork and fix if you find something odd.

Do whatever you want with it. For example it's possible to build a web interface to control i3 (as soon as I switched to the [tree branch](http://code.stapelberg.de/git/i3?h=tree), I may improve node-i3 due to the improved ipc of i3 itself).

I created a small web interface using [Socket.IO](https://github.com/LearnBoost/Socket.IO) (and [Socket.IO-node](https://github.com/LearnBoost/Socket.IO-node)) to switch workspaces using my smartphone: [i3 web control poc](http://tmp.fnordig.de/node-i3-web-control-poc.png).

The script is included in the examples dir.

# Requirements

All you need is [node.js][]. node-i3 is tested on v0.3.6.

# Installation

node-i3 is not yet packaged properly, but will be available via [npm][] sometime.

For now just clone this repo:

    git clone https://github.com/badboy/node-i3.git

# Usage

A quick example how to use node-i3:

    var i3 = require('lib/node-i3');
    var c = i3.connect('/home/badboy/.i3/ipc.sock');
    
    c.on('connect', function() {
      console.log('connected to i3 ipc');
    });
    
    // The client queues up any message, so just fire them off.
    c.message('3'); // switch to workspace 3
    
    c.on('data', function(data) {
      console.log(data);
    });

See examples/ for more.

# API

For now the basic functionality is implemented. But keep in mind that the whole lib is in alpha for now and the API may change any time.

For a documentation of the available ipc commands for i3 see [i3/docs/ipc][docsipc].

## i3.connect(path)

Connects to the given unix domain socket and adds default events listeners. Some of them are proxied through, others are handled first.

Everything works on the returned object and all events are fired to it.

## Events

All of the following events are fired to the object returned by `i3.connect`

### "connect"
`function() {}`

node-i3 proxies the default socket event `connect`, but makes sure to send any queued message first.

### "error", "drain", "close", "end"
`function() {}`

This events are proxied without any internal handling.

### "data"
`function(data) {}`

The `data` event is fired, when node-i3 receives some input (which is not an `event`). The input is then parsed and emitted to the assigned callback.

The function's argument is an object like this:

    { type: 0, length: 16, data: object }

where the intern `data` is the JSON-parsed response.

`type` is one of `i3.TYPES` (as defined by i3):

    {
      COMMAND        : 0,
      GET_WORKSPACES : 1,
      SUBSCRIBE      : 2,
      GET_OUTPUTS    : 3,
    }

If an error occured, `data` will contain an error string describing what went wrong:

    { error: 'wrong magic code' }

### "event"
`function(data) {}`

The `event` event is fired whenever i3 responds to a former subscribed event (Whooo, a lot of "event" in here).

The `data` object is the same as in the `data` event, plus `data.event` is set to true (and a lot of "data" of course).

## end(msg)

Just executes the socket's `end`-method, so it is defined as:

> Half-closes the socket. I.E., it sends a FIN packet. It is possible the server will still send some data.
> If data is specified, it is equivalent to calling socket.write(data, encoding) followed by socket.end().
*(from node.js docs)*

## command(payload)

Sends a command message through the socket with `payload`.
`payload` should already be json-encoded (this may change soon).

## workspaces()

Gets the current workspaces. The reply received later will be a list of workspaces.

## outputs()

Gets the current outputs. The reply received later will be a list of outputs.

## subscribe(list)

Subscribes your connection to certain events. See the original docu for a description of this message and the concept of events.
`list` should be an Javascript array and will be formatted to JSON internally (this is why the `command` API may change).

## More

As the i3 ipc is using a synchronous connection, node-i3 makes sure to send new messages after the previous message got its response.

Each of the 4 message-sending methods returns the node-i3 object itself. This way you can chain the methods:

    # c is the node-i3 object
    c.command("3").command("h").command("m1").command("exec xterm");

Keep in mind that it may take some time for i3 to actually switch the workspace and grabbing the focus on the new window. 
Because of this the above line might not work as expected (I did not fully test this method chaining and may change this to a proper working solution some time).

If you really want to make sure that commands are executed in the proper order and taking the effect you want, fire the messages after receiving the previous response in the `data` callback. This should work more reliable for now.

# Contributing

Once you've made your great commits:

1. [Fork][] node-i3.
2. Create a topic branch - `git checkout -b my_branch`
3. Push to your branch - `git push origin my_branch`
4. Send me a pull request or create an [Issue][].
5. That's it!

# License

Copyright (c) 2011 Jan-Erik Rediger. See LICENSE for details.

[npm]: https://github.com/isaacs/npm
[docsipc]: http://i3.zekjur.net/docs/ipc.html
[i3]: http://i3.zekjur.net/
[fork]: http://help.github.com/forking/
[issue]: http://github.com/badboy/i3-ipc/issues
[node.js]: http://nodejs.org/
