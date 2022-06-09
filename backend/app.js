const asyncify = require("express-asyncify")
const express = require('express');
const app = asyncify(express());
const userrouter = require('./controllers/user');
const postsrouter = require('./controllers/posts');
const bodyParser = require('body-parser');
const path = require("path");
const cors = require('cors');
var http = require('http')
var https = require('https')
const server = http.createServer(app);
const mongoose = require('mongoose');
var compression = require('compression');
const helmet = require('helmet')
const fs = require('fs')
const cookieParser = require('cookie-parser')
const colors = ['\x1b[32m%s\x1b[0m', '\x1b[33m%s\x1b[0m', '\x1b[31m%s\x1b[0m']

require('dotenv').config({ path: __dirname + '/.env' });
const imageTTL = 31556926000; // 1 year in milliseconds
imageDirs = ['posts', 'replies', 'users', 'messages']

mongoose.connect('mongodb://localhost:27017/snowballsocial')
    .then(() => {
        console.log(colors[0], "Connected to database");
    })
    .catch(() => {
        console.log(colors[2], "Connection Failed");
    });

app.use(bodyParser.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));
app.use(cors())
app.use(helmet())
app.use(cookieParser())
var http = require("http").Server(app)

/*
var csrf = require('csurf')
var csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
*/

//app.set("trust proxy", 1); // trust linode
app.disable('x-powered-by')

const shouldCompress = (req, res) => {
    if (req.headers['x-no-compression'] === 'true') {
        // don't compress responses with this request header
        return false
    }

    // fallback to standard filter function
    return compression.filter(req, res)
}

app.use(compression({ filter: shouldCompress, threshold: 0 }))
const io = require('socket.io')(server, {
    cors: {
        origin: "https://" + process.env['SERVER_LOCATION']
    },
    extraHeaders: {
        'Access-Control-Allow-Origin': 'https://' + process.env['SERVER_LOCATION'],
    },
    wsEngine: require("eiows").Server
});

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://" + process.env['SERVER_LOCATION']);
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE, OPTIONS");
    next();
});

app.use("/images", express.static(path.join("backend/images"), {
    maxAge: imageTTL
}));

/*
app.get('/api/getcsrftoken', function (req, res) {
    return res.json({ csrfToken: req.csrfToken() });
});
*/

require('./routes/posts')(app);
require('./routes/user')(app);
require('./routes/conversation')(app)
require('./websocket-routes/conversation')(io)

// Not found page
app.use(function (req, res, next) {
    res.status(404);

    // respond with json
    if (req.accepts('json')) {
        res.json({ error: 'Not found' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
});

for (let i = 0; i < imageDirs.length; i++) {
    if (fs.existsSync(path.join(__dirname, 'images/' + imageDirs[i]))) {
    } else {
        fs.mkdir(path.join(__dirname, 'images/' + imageDirs[i]), (err) => {
            if (err) {
                return console.error(colors[2], err);
            }
        })
    }
}

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

server.on("error", onError);
server.on("listening", onListening);
server.listen(port);  
