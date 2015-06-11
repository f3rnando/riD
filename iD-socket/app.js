var http = require("http");
var app = require("express")();
var server = http.createServer(app);
var sockets = require("./lib/sockets")(app, server);

server.listen(process.env.PORT || 3008);