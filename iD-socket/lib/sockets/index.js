var debug = require("debug")("idsocket"),
    io = require("socket.io"),
    ioclient = require("socket.io-client");


module.exports = initSockets;

function initSockets(app, server) {
    var changes;

    var ioManager = io(server);
    changes = ioManager.of("/");
    changes.on("connection", function changesSocket(socket) {
        console.log('socket');
        debug("Client connected. Socket id: %s", socket.id);

        socket.on("difference-out", function(data) {
            debug(data.diff.transients);
            changes.emit("difference-in", data)
        });
        socket.on("diff-result", function(data) {
            debug(data);
            changes.emit("diff-result-in", data)
        });
    });
    return {
        io: ioManager,
        changes: changes
    };
}