const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const postroutes = require('./routes/posts');
const userRoutes = require("./routes/user");
const path = require("path");
const cors = require('cors');
const mongoose = require('mongoose');
var compression = require('compression')
require('dotenv').config({path: __dirname + '/.env'});

mongoose.connect('mongodb://localhost:27017/snowballsocial')
    .then(() => {
        console.log("Connected to database");
    })
    .catch(() => {
        console.log("Connection Failed");
    });

app.use(bodyParser.json({ limit: '100mb' }));
app.use(cors())
app.use(compression({ filter: shouldCompress }))
//app.set("trust proxy", 1); // trust linode

function shouldCompress(req, res) {
    if (req.headers['x-no-compression']) {
        // don't compress responses with this request header
        return false
    }

    // fallback to standard filter function
    return compression.filter(req, res)
}

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://" + process.env['SERVER_LOCATION']);
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE, OPTIONS");
    next();
});
app.use("/images", express.static(path.join("backend/images")));

app.use("/api/posts", postroutes);
app.use("/api/user", userRoutes);


module.exports = app;  