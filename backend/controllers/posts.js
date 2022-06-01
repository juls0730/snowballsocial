const postmodel = require('../models/post');
const replymodel = require('../models/reply');
const usermodel = require('../models/user');
const Redis = require('ioredis')
const multer = require('multer');
const redisClient = new Redis()
const fs = require('fs');
const path = require('path');
const Jimp = require("jimp");

exports.addPost = async function (req, res) {
    let post;
    if (!req.file) {
        post = new postmodel({
            content: req.body.content,
            creator: req.userData.userId,
        });
    } else {
        let compressedImg = req.file.filename;
        const url = 'https://' + process.env['API_LOCATION'];
        let fileext = req.file.filename.split('.').pop();
        if (fileext == 'png') {
            const filePath = path.join(__dirname, '../images/posts/', req.file.filename);
            const name = req.file.filename.split('.').shift();
            Jimp.read(filePath, function (err, image) {
                if (err) {
                    throw err;
                }
                image.quality(60)
                    .write(path.join(__dirname, '../images/posts/', name + '.jpg'));
                fs.rm(path.join(__dirname, '../images/posts/', req.file.filename), (err) => {
                    if (err) {
                        throw err;
                    }
                })
            })
            compressedImg = name + '.jpg';
        }
        if (fileext == 'jpg') {
            const filePath = path.join(__dirname, '../images/posts/', req.file.filename);
            const name = req.file.filename.split('.').shift();
            Jimp.read(filePath, function (err, image) {
                if (err) {
                    throw err;
                }

                image.quality(60)
                    .write(path.join(__dirname, '../images/posts/', name + '.jpg'));
            })
        }
        post = new postmodel({
            content: req.body.content,
            imagePath: url + "/images/posts/" + compressedImg.toLowerCase().replace(/[^a-zA-Z0-9 _.\-]/g, '').split(' ').join('_'),
            creator: req.userData.userId,
        });
    }
    if (req.body.content === undefined) {
        res.status(400).json({
            message: "Title and content are required"
        });
        return;
    }

    if (req.body.content.length > 500) {
        res.status(400).json({
            message: "Title or content are too long"
        });
        return;
    }

    await post.save().then(async (result) => {
        await usermodel.findById(req.userData.userId, '-password -__v -followers -following -email').then(async (user) => {
            if (!user) {
                res.status(404).json({
                    message: "User not found"
                });
                return;
            }
            res.status(201).json({
                message: "Post created",
                post: {
                    ...result._doc,
                    creator: await user
                }
            });
        })
    })
}

exports.getAllPosts = async (req, res) => {
    try {
        let maxPosts;
        const CurentPage = +req.query.currentpage;
        const postquery = postmodel.find({}, '-__v');
        if (CurentPage) {
            postquery.skip(15 * (CurentPage - 1))
                .limit(15);
        } else {
            return res.status(400).json({
                message: "Currentpage not defined"
            })
        }
        await postquery.lean().exec(async function (err, posts) {
            if (err) {
                return res.status(500).json({
                    message: "Fetching posts failed"
                });
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

            postmodel.count().then(async (count) => {
                maxPosts = await count;
            })
            for (let i = 0; i < posts.length; i++) {
                await redisClient.get('cache-user-' + posts[i].creator, (err, reply) => {
                    if (reply == null || err) {
                        usermodel.findById(posts[i].creator, '-password -__v -email', async function (err, user) {
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
                    return res.status(200).json({
                        message: "Posts fetched successfully",
                        posts: await posts,
                        maxPosts: await maxPosts
                    });
                }
            }
        })
    } catch {

    }
}

exports.deletePost = async (req, res) => {
    await postmodel.findOne({ _id: req.params.id }).then(async (post) => {
        if (!post || !post.creator || !req.userData.userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this post"
            });
        }
        if (req.userData.userId == post.creator) {
            await postmodel.deleteOne({ _id: req.params.id }).then(async (result) => {
                // delte the image from the server
                if (post.imagePath) {
                    const imagePath = "backend/" + post.imagePath.split('/').splice(3).join('/');
                    fs.unlink(imagePath, function (err) {
                        if (err) {
                            res.status(500).json({
                                message: "Internal server error"
                            })
                            return
                        }
                    });
                }

                await replymodel.find({ post: req.params.id }).then(async (replyResult) => {
                    await replymodel.deleteMany({ post: req.params.id }).then(async (deleteReply) => {
                        if (replyResult.imagePath) {
                            const imagePath = "backend/" + replyResult.imagePath.split('/').splice(3).join('/');
                            fs.unlink(imagePath, function (err) {
                                if (err) {
                                    res.status(500).json({
                                        message: "Internal server error"
                                    })
                                    return
                                }
                            });
                        }
                    })
                })

                return res.status(200).json({
                    message: "Post deleted!"
                });
            });
        } else {
            return res.status(401).json({
                message: "You are not authorized to delete this post"
            });
        }
    })
}

exports.getPostById = async (req, res) => {
    await postmodel.findOne({ _id: req.params.id }).lean().exec(async function (err, result) {
        if (err) {
            return res.status(500).json({
                message: "Fetching post failed"
            });
        }
        if (!result) {
            res.status(404).json({
                message: "Post not found"
            });
        } else {
            redisClient.get('cache-user-' + result.creator, async (err, reply) => {
                if (reply == null || err) {
                    usermodel.findById(await result.creator, '-password -__v -email', async function (err, user) {
                        if (err) {
                            return res.status(500).json({
                                message: "Fetching posts failed"
                            });
                        }
                        redisClient.set('cache-user-' + result.creator, JSON.stringify(user))
                        result.creator = await user;
                        res.status(200).json({
                            message: "Post fetched successfully",
                            post: await result
                        });
                    })
                } else {
                    result.creator = JSON.parse(reply)
                    res.status(200).json({
                        message: "Post fetched successfully",
                        post: await result
                    });
                }
            })
        }
    })
}

exports.likePost = async (req, res) => {
    await postmodel.findOne({ _id: req.params.id }).then(async (post) => {
        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (await post.likes.includes(req.userData.userId)) {
            post.likes = post.likes.filter(like => like != req.userData.userId);
        } else {
            post.likes.push(req.userData.userId);
        }
        await post.save().then(async (result) => {
            res.status(200).json({
                message: "Post updated!",
                post: await result
            });
        }).catch(err => {
            res.status(500).json({
                message: "Updating post failed"
            });
        });

    })
}

exports.getPostReplies = async (req, res) => {
    if (!req.params.postId) {
        return res.status(400).json({
            message: "Post Id is required"
        });
    }
    await replymodel.find({ post: req.params.postId })
        .lean().exec(async (err, replies) => {
            if (err) {
                return res.status(500).json({
                    message: 'Internal server error'
                })
            }

            if (replies.length <= 0) {
                return res.status(200).json({
                    message: 'No replies yet!',
                    replies: []
                })
            }

            for (let i = 0; i < replies.length; i++) {
                await redisClient.get('cache-user-' + replies[i].creator, (err, reply) => {
                    if (reply == null || err) {
                        usermodel.findById(replies[i].creator, '-password -__v -email', async function (err, user) {
                            if (err) {
                                return res.status(500).json({
                                    message: "Fetching posts failed"
                                });
                            }

                            replies[i].creator = user;
                            redisClient.set('cache-user-' + replies[i].creator._id, JSON.stringify(user))
                        })
                    } else {
                        replies[i].creator = JSON.parse(reply)
                    }
                })
                if (i === replies.length - 1) {
                    return res.status(200).json({
                        message: "replies fetched successfully",
                        replies: await replies
                    });
                }
            }
        })
}

exports.addReply = async (req, res) => {
    let reply;
    if (!req.params.postId) {
        return res.status(400).json({
            message: "Post Id is required"
        })
    }

    if (!req.body.reply) {
        return res.status(400).json({
            message: "Reply is required",
            body: req.body
        })
    }

    if (req.file) {
        const url = 'https://' + process.env['API_LOCATION'];
        reply = new replymodel({
            content: req.body.reply,
            imagePath: url + "/images/posts/" + req.file.filename,
            creator: req.userData.userId,
        });
    } else {
        reply = new replymodel({
            content: req.body.reply,
            post: req.params.postId,
            creator: req.userData.userId
        });
    }

    await reply.save().then(async (result) => {
        let data = result.toObject();
        await redisClient.get('cache-user-' + result.creator, async (err, reply) => {
            if (reply == null || err) {
                usermodel.findById(result.creator, '-password -__v -email', async function (err, user) {
                    if (err) {
                        return res.status(500).json({
                            message: "Fetching posts failed"
                        });
                    }

                    data.creator = user;
                    redisClient.set('cache-user-' + result.creator._id, JSON.stringify(user))
                    res.status(201).json({
                        message: "Reply added successfully",
                        reply: await data
                    });
                })
            } else {
                data.creator = JSON.parse(reply)
                res.status(201).json({
                    message: "Reply added successfully",
                    reply: await data
                });
            }
        })
        // append reply._id to post.replies
        await postmodel.findOne({ _id: req.params.postId }).then(async (post) => {
            post.replies.push(result._id);
            await post.save()
        })
    })
}

exports.deleteReply = async (req, res) => {
    await replymodel.findOne({ _id: req.params.id }).then(async (reply) => {
        if (!reply || !reply.creator || !req.userData.userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this reply"
            });
        }

        if (req.userData.userId != await reply.creator) {
            return res.status(403).json({
                message: "You are not authorized to delete this reply"
            });
        }

        await replymodel.deleteOne({ _id: req.params.id }).then(async (result) => {
            res.status(200).json({
                message: "Reply deleted!"
            });
            // remove reply._id from post.replies
            await postmodel.findOne({ _id: reply.post }).then(async (post) => {
                post.replies = post.replies.filter(reply => reply != req.params.id);
                await post.save()
            })
        }).catch(err => {
            res.status(500).json({
                message: "Deleting reply failed"
            });
        });
    }).catch(err => {
        res.status(500).json({
            message: "Deleting reply failed"
        });
    })
}

exports.likeReply = async (req, res) => {
    await replymodel.findOne({ _id: req.params.id }).then(async (reply) => {
        if (!reply) {
            return res.status(404).json({
                message: "Reply not found"
            });
        }

        if (await reply.likes.includes(req.userData.userId)) {
            reply.likes = reply.likes.filter(like => like != req.userData.userId);
        } else {
            reply.likes.push(req.userData.userId);
        }

        await reply.save().then(async (result) => {
            res.status(200).json({
                message: "Reply updated!",
                reply: await result
            });
        }).catch(err => {
            res.status(500).json({
                message: "Updating reply failed"
            });
        });
    }).catch(err => {
        res.status(500).json({
            message: "Updating reply failed"
        });
    })
}