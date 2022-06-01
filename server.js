const http = require('http');
const app = require('./backend/app');
const colors = ['\x1b[32m%s\x1b[0m', '\x1b[33m%s\x1b[0m', '\x1b[31m%s\x1b[0m']

const normalizePort = val => {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe  
        return val;
    }

    if (port >= 0) {
        // port number  
        return port;
    }

    return false;
};

const onError = error => {
    if (error.syscall !== "listen") {
        throw error;
    }
    const bind = typeof port === "string" ? "pipe " + port : "port " + port;
    switch (error.code) {
        case "EACCES":
            console.error(colors[2], bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(colors[2], bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const onListening = () => {
    const addr = server.address();
    const bind = typeof port === "string" ? "pipe " + port : "port " + port;
    console.log(colors[0], "Listening on " + bind);
};

const port = normalizePort(process.env.PORT || "3001");
app.set("port", port);

const server = http.createServer(app);  
server.on("error", onError);  
server.on("listening", onListening);  
server.listen(port);  
