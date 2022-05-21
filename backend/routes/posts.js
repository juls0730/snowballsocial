const asyncify = require("express-asyncify")
const express = require("express");
const postmodel = require('../models/post');
const replymodel = require('../models/reply');
const usermodel = require('../models/user');
const rateLimit = require('express-rate-limit');
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const Jimp = require("jimp");

const router = asyncify(express.Router());
const checkAuth = require("../middleware/check-auth");

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid Mime Type");
        if (isValid) {
            error = null;
        }
        cb(error, "backend/images/posts");
    },

    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('_');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    }
});

const repliesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid Mime Type");
        if (isValid) {
            error = null;
        }
        cb(error, "backend/images/replies");
    },

    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('_');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    }
});

const createPostLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 create post requests per `window` (here, per 5 minutes)
    message:
        'Too many posts created from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

router.post("", checkAuth, multer({ storage: storage }).single("image"), createPostLimiter, async (req, res, next) => {
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
                if (err) throw err;

                image.quality(60)
                    .write(path.join(__dirname, '../images/posts/', name + '.jpg'));
                fs.rm(path.join(__dirname, '../images/posts/', req.file.filename), (err) => {
                    if (err) throw err;
                })
            })
            compressedImg = name + '.jpg';
        }
        if (fileext == 'jpg') {
            const filePath = path.join(__dirname, '../images/posts/', req.file.filename);
            const name = req.file.filename.split('.').shift();
            Jimp.read(filePath, function (err, image) {
                if (err) throw err;

                image.quality(60)
                    .write(path.join(__dirname, '../images/posts/', name + '.jpg'));
            })
        }
        post = new postmodel({
            content: req.body.content,
            imagePath: url + "/images/posts/" + compressedImg,
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
    }).catch(err => {
        res.status(500).json({
            message: "Creating a post failed, try again later!"
        });
    });
});

/*
Old code for getting all posts, does not include username
router.get('', (req, res, next) => {
    const PageSize = +req.query.pagesize;
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
    let posts;
    postquery
        .then((documents) => {
            posts = documents;
            return postmodel.count();
        }).then(count => {
            // add username to posts
            res.status(200).json({
                message: "Posts fetched successfully",
                posts: posts,
                maxPosts: count
            });
        }).catch(err => {
            console.log(err);
            res.status(500).json({
                message: "Fetching posts failed"
            });
        });
});
*/

router.get('', async (req, res, next) => {
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

            if (!((posts.length / 15) > 0)) {
                return res.status(406).json({
                    message: "Not enough posts to fill that many pages"
                })
            }

            if (posts.length == 0) {
                return res.status(200).json({
                    message: "Fetching posts failed",
                    posts: await posts
                });
            }

            postmodel.count().then(async (count) => {
                maxPosts = await count;
            })

            for (let i = 0; i < posts.length; i++) {
                usermodel.findById(posts[i].creator, '-password -__v -followers -following -email', async function (err, user) {
                    if (err) {
                        return res.status(500).json({
                            message: "Fetching posts failed"
                        });
                    }
                    posts[i].creator = user;
                    if (i === posts.length - 1) {
                        return res.status(200).json({
                            message: "Posts fetched successfully",
                            posts: await posts,
                            maxPosts: await maxPosts
                        });
                    }
                })
            }
        })
    } catch {

    }
})

router.delete("/:id", checkAuth, async (req, res, next) => {
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
                            return res.status(500).json({
                                message: "Internal server error"
                            })
                        }
                    });
                }

                await replymodel.find({ post: req.params.id }).then(async (replyResult) => {
                    await replymodel.deleteMany({ post: req.params.id }).then(async (deleteReply) => {
                        if (replyResult.imagePath) {
                            const imagePath = "backend/" + replyResult.imagePath.split('/').splice(3).join('/');
                            fs.unlink(imagePath, function (err) {
                                if (err) {
                                    return res.status(500).json({
                                        message: "Internal server error"
                                    })
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
    }).catch(err => {
        res.status(500).json({
            message: "Deleting post failed"
        });
    });
});

router.get("/:id", async (req, res, next) => {
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
            usermodel.findById(await result.creator, '-password -__v -followers -following -email', async function (err, user) {
                if (err) {
                    return res.status(500).json({
                        message: "Fetching posts failed"
                    });
                }
                result.creator = await user;
                res.status(200).json({
                    message: "Post fetched successfully",
                    post: await result
                });
            })
        }
    })
})

router.put("/:id/togglelike", checkAuth, async (req, res, next) => {
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
})

router.get('/:postId/replies', async (req, res, next) => {
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
                usermodel.findById(replies[i].creator, '-password -__v -followers -following -email', async function (err, user) {
                    if (err) {
                        return res.status(500).json({
                            message: "Fetching replies failed"
                        });
                    }
                    replies[i].creator = await user;
                    if (i === replies.length - 1) {
                        return res.status(200).json({
                            message: "Replies fetched successfully",
                            replies: await replies,
                        });
                    }
                })
            }
        })
})

router.post('/:postId/reply', multer({ storage: repliesStorage }).single("image"), checkAuth, async (req, res, next) => {
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
        res.status(201).json({
            message: "Reply added successfully",
            reply: await result
        });
        await postmodel.updateOne({ id: req.params.postId }, { $addToSet: { replies: await result._id } })
            .then(async (data) => {
                // added reply
            })
    })
        .catch(err => {
            res.status(500).json({
                message: "Failed to add reply",
                error: err
            });
        });
})

router.delete('/reply/:id', checkAuth, async (req, res, next) => {
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
            await postmodel.updateOne({ id: await reply.post }, { $pull: { replies: await reply._id } })
                .then(async (data) => {
                    // removed reply
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
})

router.put('/reply/:id/togglelike', checkAuth, async (req, res, next) => {
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
})

module.exports = router;  