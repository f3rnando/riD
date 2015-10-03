var server = require('http').createServer(),
    io     = require('socket.io')(server);


io.on('connection', function(socket){

  var room = socket.handshake['query']['r_var'];

  socket.join(room);
  console.log('user joined georoom #'+room);

  io.to(room).emit('msg', {from:'riD', msg: 'o/'});

  socket.on('disconnect', function() {
    socket.leave(room)
    console.log('user disconnected');
  });

  socket.on('difference-out', function(data){
    io.to(room).emit('difference-in', data);
  });

  socket.on('msg', function(msg){
    io.to(room).emit('msg', msg);
  });

});

server.listen(process.env.PORT || 3008);