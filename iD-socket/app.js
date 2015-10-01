var server = require('http').createServer(),
    io     = require('socket.io')(server);


io.on('connection', function(socket){

  var room = socket.handshake['query']['r_var'];

  socket.join(room);
  console.log('user joined georoom #'+room);

  socket.on('disconnect', function() {
    socket.leave(room)
    console.log('user disconnected');
  });

  socket.on('difference-out', function(data){
    io.to(room).emit('difference-in', data);
  });

});

server.listen(3008);