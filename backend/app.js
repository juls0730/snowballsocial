const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const postroutes = require('./routes/posts');
const userRoutes = require("./routes/user");
const path = require("path");
const cors = require('cors');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/snowballsocial')
    .then(() => {
        console.log("Connected to database");
    })
    .catch(() => {
        console.log("Connection Failed");
    });

app.use(bodyParser.json({ limit: '100mb' }));
app.use(cors())
//app.set("trust proxy", 1); // trust linode

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://localhost");
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