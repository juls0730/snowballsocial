const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const postmodel = require('./models/post');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/snowballsocial')
    .then(() => {
        console.log("Connected to database");
    })
    .catch(() => {
        console.log("Connection Failed");
    });

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE, OPTIONS");
    next();
});

app.post('/api/posts', (req, res, next) => {
    const post = new postmodel({
        title: req.body.title,
        content: req.body.content
    });
    post.save().then(createdPost => {
        console.log(createdPost);
    });
    console.log(post);
    res.status(201).json({
        message: 'Post added successfully'
    });
});

app.get('/api/posts', (req, res, next) =>{  
    postmodel.find()  
    .then((documents)=>{  
      console.log(documents);  
      res.status(200).json({  
        message: 'Posts Fetched Successfully',  
        posts: documents  
      });  
    });  
  });  

module.exports = app;  