// this is where we define the routes and the controllers for the backend, having a vulnerability in the backend can be a security risk be careful what you write
const express = require("express");
const user = require("../models/user");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/auth.config");

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

/*
router.post("/login", (req, res, next) => {
    // look for a user with an email or a username
    console.log(req.body)
    user.findOne({ $or: [{ email: req.body.usernameemail }, { username: req.body.usernameemail }] })
        .then(user => {
            console.log(user)
            if (!user) {
                return res.status(401).json({
                    error: "User not found"
                });
            }
            fetchedUser = user;
            // compare the password
            return bcrypt.compare(req.body.password, fetchedUser.password)
        })
        .then(result => {
            if (!result) {
                return res.status(401).json({
                    error: "Password is incorrect"
                });
            }
            // if the password is correct, create a token
            const token = jwt.sign(
                {
                    email: fetchedUser.email,
                    username: fetchedUser.username,
                    userId: fetchedUser._id
                },
                authConfig.jwtSecret,
                {
                    expiresIn: "7d"
                }
            );
            res.status(200).json({
                token: token,
            });
        }).catch(err => {
            res.status(401).json({
                error: err
            });
        }
        );
})*/

module.exports = router;  