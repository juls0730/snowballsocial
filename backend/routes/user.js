// this is where we define the routes and the controllers for the backend, having a vulnerability in the backend can be a security risk be careful what you write
const express = require("express");
const asyncify = require("express-asyncify")
const user = require("../models/user");
const router = asyncify(express.Router());
const bcrypt = require("bcrypt");
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis')
const redisClient = new Redis()
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/auth.config");
const post = require("../models/post");
const checkAuth = require("../middleware/check-auth");

const loginLimiter = rateLimit({
    windowMs: 90 * 60 * 1000, // 90 minutes
    max: 70, // Limit each IP to 70 login requests per `window` (here, per 90 minutes)
    message:
        'Too many login attempts from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

router.post("/signup", async (req, res, next) => {
    await bcrypt.hash(req.body.password, 10)
        .then(async (hash) => {
            const NewUser = user({
                email: req.body.email,
                username: req.body.username,
                password: hash
            });
            await user.find({ $or: [{ email: req.body.email }, { username: req.body.username }] })
                .then(async (user) => {
                    if (user.length >= 1) {
                        return res.status(409).json({
                            message: "User already exists"
                        });
                    }
                })
            await NewUser.save()
                .then(async (result) => {
                    return res.status(201).json({
                        message: "User Created",
                        result: await result
                    });
                });
        }).catch(err => {
            return res.status(500).json({
                message: "Cannot Create user!"
            });
        });
});

let fetchedUser;
router.post("/login", loginLimiter, async (req, res, next) => {
    await user.findOne({ $or: [{ email: req.body.usernameemail }, { username: req.body.usernameemail }] })
        .then(async (user) => {
            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }
            fetchedUser = await user;
            return await bcrypt.compare(req.body.password, user.password)
        })
        .then(async (result) => {
            if (!result) {
                return res.status(403).json({
                    message: "Auth failed",
                    result: await result
                });
            }

            if (!fetchedUser) {
                return res.status(404).json({
                    message: "User not found",
                })
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
                token: await token,
                expiresIn: 604800,
                userId: await fetchedUser._id
            });
        }).catch(err => {
            if (!err) {
                return;
            }
            if (!fetchedUser) {
                return;
            }
            return res.status(500).json({
                message: "Internal server error"
            })
        })
})

router.get('/:id', async (req, res, next) => {
    redisClient.get('cache-user-' + req.params.id, async (err, reply) => {
        if (reply == null || err) {
            await user.findById({ _id: req.params.id }, '-password -__v -email')
                .then(async (user) => {
                    if (!user) {
                        return res.status(404).json({
                            message: "User not found"
                        });
                    }

                    redisClient.set('cache-user-' + req.params.id, JSON.stringify(user))
                    return res.status(200).json({
                        user: await user
                    });
                })
        } else {
            res.status(200).json({
                message: "Post fetched successfully",
                user: JSON.parse(reply)
            });
        }
    })
})

router.get('/:id/posts', async (req, res, next) => {
    await post.find({ creator: req.params.id }).lean().exec(async (err, posts) => {
        if (err) {
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        for (let i = 0; i < posts.length; i++) {
            await redisClient.get('cache-user-' + posts[i].creator, (err, reply) => {
                if (reply == null || err) {
                    user.findById(posts[i].creator, '-password -__v -email', async function (err, user) {
                        if (err) {
                            return res.status(500).json({
                                message: "Fetching posts failed"
                            });
                        }

                        posts[i].creator = user;
                        redisClient.set('cache-user-' + posts[i].creator._id, JSON.stringify(user))
                    })
                } else {
                    posts[i].creator = JSON.parse(reply)
                }
            })
            if (i === posts.length - 1) {
                // maxPosts: await maxPosts
                return res.status(200).json({
                    message: "Posts fetched successfully",
                    posts: await posts,
                });
            }
        }
    })
})

router.post('/:userId/togglefollow', checkAuth, async (req, res, next) => {
    if (!req.userData.userId) {
        return res.status(401).json({
            message: "Auth failed"
        });
    }
    await user.findById({ _id: req.params.userId }, '-password, -email').exec(async (err, fetchedUserasd) => {
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

        if (req.userData.userId == req.params.userId) {
            return res.status(401).json({
                message: "Cannot follow yourself"
            });
        }

        if (await fetchedUserasd.followers.includes(req.userData.userId)) {
            user.updateOne({ _id: req.params.userId }, { $pull: { followers: req.userData.userId } }, async (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message: "Cannot unfollow user"
                    });
                }

                redisClient.get('cache-user-' + req.params.userId, async (err, reply) => {
                    let data = JSON.parse(reply)
                    let array = data.followers
                    array = array.filter(function(item) {
                        return item !== req.userData.userId
                    })
                    data.followers = array
                    redisClient.set('cache-user-' + req.params.userId, JSON.stringify(data))
                })
                user.updateOne({ _id: req.userData.userId }, { $pull: { following: req.params.userId } }, async (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Cannot unfollow user"
                        });
                    }

                    redisClient.get('cache-user-' + req.userData.userId, async (err, reply) => {
                        let data = JSON.parse(reply)
                        let array = data.following
                        array = array.filter(function(item) {
                            return item !== req.params.userId
                        })
                        data.following = array
                        redisClient.set('cache-user-' + req.userData.userId, JSON.stringify(data))
                    })
                    return res.status(200).json({
                        message: "User unfollowed"
                    });
                })
            })
        } else {
            user.updateOne({ _id: req.params.userId }, { $push: { followers: req.userData.userId } }, async (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message: "Cannot follow user!"
                    });
                }

                redisClient.get('cache-user-' + req.params.userId, async (err, reply) => {
                    let data = JSON.parse(reply)
                    let array = data.followers
                    array.push(req.userData.userId)
                    data.followers = array
                    redisClient.set('cache-user-' + req.params.userId, JSON.stringify(data))
                })
                user.updateOne({ _id: req.userData.userId }, { $push: { following: req.params.userId } }, async (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Cannot follow user!"
                        });
                    }

                    redisClient.get('cache-user-' + req.userData.userId, async (err, reply) => {
                        let data = JSON.parse(reply)
                        let array = data.following
                        array.push(req.params.userId)
                        data.following = array
                        redisClient.set('cache-user-' + req.userData.userId, JSON.stringify(data))
                    })
                    return res.status(200).json({
                        message: "User followed"
                    });
                })
            })
        }
    })
})

module.exports = router;  