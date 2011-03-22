var sys = require('sys');
var net = require('net');

var EventEmitter = require('events').EventEmitter;

var utils = {
  listeners: function listeners(target, handlers) {
    for (var i in handlers) if (handlers.hasOwnProperty(i))
      target.addListener(i, handlers[i]);
  },

  packInt: function packInt() {
    var args = Array.prototype.slice.call(arguments);
    var result = '';
    args.forEach(function(e) {
      result += String.fromCharCode(e & 0xFF);
      result += String.fromCharCode(e >> 8 & 0xFF);
      result += String.fromCharCode(e >> 16 & 0xFF);
      result += String.fromCharCode(e >> 24 & 0xFF);
    });
    return result;
  },

  unpackInt: function unpackInt(str) {
    var b1 = str.charCodeAt(0) & 0xFF;
    var b2 = str.charCodeAt(1) & 0xFF;
    var b3 = str.charCodeAt(2) & 0xFF;
    var b4 = str.charCodeAt(3) & 0xFF;

    return (((((b4 << 8) + b3) << 8) + b2) << 8) + b1;
  }
}
exports.utils = utils;

function i3(path) {
  EventEmitter.call(this);

  this.path = path;
  this.socket = net.createConnection(this.path);

  this.in_progress = false;
  this.last_msg = [];
  this.queued_messages = [];

  var self = this;
  utils.listeners(this.socket, {
    connect: function() {
      if(self.queued_messages.length > 0) {
        self.queued_messages.forEach(function(m) {
          self.socket.write(msg);
        });
      }
      self.emit('connect');
    },
    error: function(e) { self.emit('error', e); },
    drain: function() { self.emit('drain'); },
    close: function() { self.emit('close'); },
    end: function() { self.emit('end'); },
    data: function(data) {
      data = self._parseFormat(data);
      if(data.event)
        self.emit('event', data);
      else
        self.emit('data', data);

      if(self.last_msg.length > 0) {
        self.in_progress = false;
        self.write(self.last_msg.shift());
      }
      self.in_progress = false;
    }
  });
};
sys.inherits(i3, process.EventEmitter);
exports.i3 = i3;

/* constants */
var constants = {
  MAGIC_STRING: "i3-ipc",
  TYPES: {
    COMMAND        : 0,
    GET_WORKSPACES : 1,
    SUBSCRIBE      : 2,
    GET_OUTPUTS    : 3,
  },
  EVENTS: {
    WORKSPACE: 0,
    OUTPUT   : 1
  }
}
exports.MAGIC_STRING = constants.MAGIC_STRING;
exports.TYPES = constants.TYPES;
exports.EVENTS = constants.EVENTS;

i3.prototype._parseFormat = function(data) {
  if(data.slice(0, constants.MAGIC_STRING.length).toString() != constants.MAGIC_STRING) {
    return { error: 'wrong magic code' };
  }

  var size = utils.unpackInt(data.slice(constants.MAGIC_STRING.length, constants.MAGIC_STRING.length + 4).toString());
  var type = utils.unpackInt(data.slice(constants.MAGIC_STRING.length+4, constants.MAGIC_STRING.length + 8).toString());

  /**
   * Everything after `size` is discarded.
   * Maybe re-enqueue the left-over data;
   * this way the whole communication could work
   * without queueing the messages internally.
   **/
  var answer = data.slice(constants.MAGIC_STRING.length+8, constants.MAGIC_STRING.length+8+size);

  var json = {};
  json.data = JSON.parse(answer.toString());
  json.size = size;

  /**
   * got an event? high bit is set!
   * the implemantation of unpackInt
   * seems a little bit wrong;
   * should return 1 here, right?
   **/
  if((type >> 31) == -1) {
    json.event = true;
    type = type & 0x7f;
  }
  json.type = type;

  return json;
}

i3.prototype._format = function(type, payload) {
  var size = payload ? payload.length : 0;
  msg = constants.MAGIC_STRING;
  msg += utils.packInt(size, type);
  if(payload)
    msg += payload;
  return msg;
}

i3.prototype.end = function(msg) {
  this.socket.end(msg);
}

i3.prototype.write = function(msg) {
  if(this.socket.writable) {
    if(!this.in_progress) {
      this.in_progress = true;
      this.socket.write(msg);
    } else {
      this.last_msg.push(msg);
    }
  } else {
    this.queued_messages.push(msg);
  }
}

i3.prototype.command = function(payload) {
  this.write(this._format(constants.TYPES.COMMAND, payload));
  return this;
}
i3.prototype.workspaces = function() {
  this.write(this._format(constants.TYPES.GET_WORKSPACES));
  return this;
}
i3.prototype.outputs = function() {
  this.write(this._format(constants.TYPES.GET_OUTPUTS));
  return this;
}
i3.prototype.subscribe = function(list) {
  this.write(this._format(constants.TYPES.SUBSCRIBE, JSON.stringify(list)));
  return this;
}

exports.connect = function(path) {
  var i = new i3(path);
  return i;
}
