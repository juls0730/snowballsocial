const user = require("../models/user");
const bcrypt = require("bcrypt");
const Redis = require('ioredis')
const redisClient = new Redis()
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/auth.config");
const post = require("../models/post");

exports.login = async function (req, res) {
    let fetchedUser;
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
}

exports.signup = async function (req, res) {
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
}

exports.findOne = async function (req, res) {
    const ObjectId = require('mongoose').Types.ObjectId;
    if (!req.params.id || !ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            message: "Invalid request"
        });
    }
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
}

exports.getUserPosts = async function (req, res) {
    const ObjectId = require('mongoose').Types.ObjectId;
    if (!req.params.id || !ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            message: "Invalid request"
        });
    }
    let maxPosts;
    const CurentPage = +req.query.currentpage;
    const postquery = post.find({}, '-__v');
    if (CurentPage) {
        postquery.skip(15 * (CurentPage - 1))
            .limit(15);
    } else {
        return res.status(400).json({
            message: "Currentpage not defined"
        })
    }
    await postquery.find({ creator: req.params.id }).lean().exec(async (err, posts) => {
        if (err) {
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        if (posts.length == 0) {
            return res.status(200).json({
                message: "Posts empty",
                posts: []
            });
        }

        if (!((posts.length / 15) > 0)) {
            return res.status(406).json({
                message: "Not enough posts to fill that many pages"
            })
        }

        post.count().then(async (count) => {
            maxPosts = await count;
        })
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
                    maxPosts: await maxPosts
                });
            }
        }
    })
}

exports.followUser = async function (req, res) {
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
                    array = array.filter(function (item) {
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
                        array = array.filter(function (item) {
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
}

exports.search = async function (req, res) {
    if (!req.query.search) {
        return res.status(400).json({
            message: "Search query not defined"
        })
    }

    await user.find({ username: { $regex: req.query.search, $options: 'i' } }).lean().exec(async (err, users) => {
        if (err) {
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        if (users.length == 0) {
            return res.status(404).json({
                message: "No users found"
            })
        }

        for (let i = 0; i < users.length; i++) {
            await redisClient.get('cache-user-' + users[i]._id, (err, reply) => {
                if (reply == null || err) {
                    user.findById(users[i]._id, '-password -__v -email', async function (err, user) {
                        if (err) {
                            return res.status(500).json({
                                message: "Fetching posts failed"
                            });
                        }

                        users[i] = user;
                        redisClient.set('cache-user-' + users[i]._id, JSON.stringify(user))
                    })
                } else {
                    users[i] = JSON.parse(reply)
                }
            })
            if (i === users.length - 1) {
                return res.status(200).json({
                    message: "Users fetched successfully",
                    users: users
                });
            }
        }
    })
}