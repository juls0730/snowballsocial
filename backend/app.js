const asyncify = require("express-asyncify")
const express = require('express');
const app = asyncify(express());
const bodyParser = require('body-parser');
const postroutes = require('./routes/posts');
const userRoutes = require("./routes/user");
const path = require("path");
const cors = require('cors');
const mongoose = require('mongoose');
var compression = require('compression');
const helmet = require('helmet')
const fs = require('fs')
const cookieParser = require('cookie-parser')

require('dotenv').config({ path: __dirname + '/.env' });
const imageTTL = 31556926000; // 1 year in milliseconds
imageDirs = ['posts', 'replies', 'users']

mongoose.connect('mongodb://localhost:27017/snowballsocial')
    .then(() => {
        console.log("Connected to database");
    })
    .catch(() => {
        console.log("Connection Failed");
    });

app.use(bodyParser.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));
app.use(cors())
app.use(helmet())
app.use(cookieParser())

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

app.use("/api/posts", postroutes);
app.use("/api/user", userRoutes);

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
                return console.error(err);
            }
        })
    }
}

module.exports = app;  