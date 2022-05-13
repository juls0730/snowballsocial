// this is where we define the routes and the controllers for the backend, having a vulnerability in the backend can be a security risk be careful what you write
const express = require("express");
const user = require("../models/user");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/auth.config");
const post = require("../models/post");

router.post("/signup", (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            console.log(req.body)
            const NewUser = user({
                email: req.body.email,
                username: req.body.username,
                password: hash
            });
            user.find({ $or: [{ email: req.body.email }, { username: req.body.username }] })
                .then(user => {
                    if (user.length >= 1) {
                        res.status(409).json({
                            message: "User already exists"
                        });
                    }
                })
            NewUser.save()
                .then(result => {
                    return res.status(201).json({
                        message: "User Created",
                        result: result
                    });
                });
        }).catch(err => {
            return res.status(500).json({
                message: "Cannot Create user!"
            });
        });
});

let fetchedUser;
router.post("/login", (req, res, next) => {
    user.findOne({ $or: [{ email: req.body.usernameemail }, { username: req.body.usernameemail }] })
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    error: "User not found"
                });
            }
            fetchedUser = user;
            console.log(fetchedUser)
            return bcrypt.compare(req.body.password, user.password)
        })
        .then(result => {
            console.log(fetchedUser)
            if (!result) {
                return res.status(403).json({
                    message: "Auth failed",
                    result: result
                });
            }

            const token = jwt.sign(
                {
                    email: fetchedUser.email,
                    username: fetchedUser.username,
                    userId: fetchedUser._id
                },
                jwtSecret,
                {
                    expiresIn: "7d"
                }
            );
            return res.status(200).json({
                token: token,
                expiresIn: 604800,
                userId: fetchedUser._id
            });
        }).catch(err => {
            return res.status(500).json({
                message: "Invalid Authentication Credentials!",
            });
        })
})

router.get('/:id', (req, res, next) => {
    // find user and remove password from the response

    user.findById({ _id: req.params.id }, '-password, -email')
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            return res.status(200).json({
                user: user
            });
        }).catch(err => {
            return res.status(500).json({
                message: "Cannot fetch user!"
            });
        })
})

router.get('/:id/posts', (req, res, next) => {
    user.findById({ _id: req.params.id }, '-password, -email').exec((err, user) => {
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (err) {
            return res.status(500).json({
                message: "Cannot fetch user!"
            });
        }

        post.find({ creator: user._id }).exec((err, posts) => {
            if (!posts) {
                return res.status(404).json({
                    message: "No posts found"
                });
            }

            if (err) {
                return res.status(500).json({
                    message: "Cannot fetch posts!"
                });
            }

            return res.status(200).json({
                posts: posts
            });
        })
    })
})

module.exports = router;  