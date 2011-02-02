var s;
$(function() {
  $("#control").html("go go go");
  socket = new io.Socket();
  socket.connect();

  function sendSocket(msg) {
    socket.send(JSON.stringify(msg));
  }

  var cur_ws = 0;

  socket.on('message', function(data) {
    $("#control").html(data);
    data = JSON.parse(data);
    console.log(data);
    if(data.writable) {
      sendSocket({type: "workspaces"});
    }

    if(data.type == 1) { // workspaces
      var out = "<ul>";
      _.each(data.data, function(e) {
        out += "<li>" + e.name + " (" + e.num + ")";
        if(e.focused) {
          cur_ws = parseInt(e.num);
          out += ' (focused)';
        }
        else
          out += ' <a class="switch" id="ws'+e.num+'" href="javascript:void(0);">switch here</a>';

        out += "</li>";
      });
      out += "</ul>";

      $("#ws").html(out);
    }
    //if(data.type == 0) {
      //sendSocket({type: 'workspaces'});
    //}
  });

  $('#swipe').addSwipeEvents().
    bind('swipeup', function(evt, touch) {
      $("#swipe").text("swipeup");
      sendSocket({type: "workspaces"});
    }).
    bind('swiperight', function(evt, touch) {
      $("#swipe").text("swiperight");
      var new_ws = cur_ws - 1;
      sendSocket({type: 'command', payload: new_ws.toString()});
    });

  $("a.switch").live('click', function(e) {
    console.log(e.target);
    s = e.target;
    sendSocket({type: 'command', payload: s.id.substr(2)});
  });
});
