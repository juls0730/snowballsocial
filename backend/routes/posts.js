const express = require("express");
const postmodel = require('../models/post');
const replymodel = require('../models/reply');
const rateLimit = require('express-rate-limit');
const multer = require("multer");
const fs = require('fs');
const path = require('path');

const router = express.Router();
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

router.post("", checkAuth, multer({ storage: storage }).single("image"), createPostLimiter, (req, res, next) => {
    let post;
    if (!req.file) {
        post = new postmodel({
            title: req.body.title,
            content: req.body.content,
            creator: req.userData.userId,
        });
    } else {
        const url = 'https://' + process.env['API_LOCATION'];
        post = new postmodel({
            title: req.body.title,
            content: req.body.content,
            imagePath: url + "/images/posts/" + req.file.filename,
            creator: req.userData.userId,
        });
    }
    console.log(post);
    if (req.body.title === undefined || req.body.content === undefined) {
        res.status(400).json({
            message: "Title and content are required"
        });
        return;
    }

    if (req.body.title.length > 50 || req.body.content.length > 500) {
        res.status(400).json({
            message: "Title or content are too long"
        });
        return;
    }
    post.save().then(result => {
        res.status(201).json({
            message: 'Post added successfully',
            post: result
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            message: "Creating a post failed, try again later!"
        });
    });
});

router.get('', (req, res, next) => {
    const PageSize = +req.query.pagesize;
    const CurentPage = +req.query.currentpage;
    const postquery = postmodel.find();
    if (PageSize && CurentPage) {
        postquery.skip(PageSize * (CurentPage - 1))
            .limit(PageSize);
    }
    let posts;
    postquery
        .then((documents) => {
            posts = documents;
            return postmodel.count();
        }).then(count => {
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

router.delete("/:id", checkAuth, (req, res, next) => {
    postmodel.findOne({ _id: req.params.id }).then(post => {
        if (!post || !post.creator || !req.userData.userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this post"
            });
        }
        if (req.userData.userId == post.creator) {
            postmodel.deleteOne({ _id: req.params.id }).then(result => {
                console.log(result);
                // delte the image from the server
                if (post.imagePath) {
                    const imagePath = "backend/" + post.imagePath.split('/').splice(3).join('/');
                    console.log(imagePath);
                    fs.unlink(imagePath, function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("File removed:", path);
                        }
                    });
                }

                res.status(200).json({
                    message: "Post deleted!"
                });
            });
        } else {
            res.status(401).json({
                message: "You are not authorized to delete this post"
            });
        }
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            message: "Deleting post failed"
        });
    });
});

router.get("/:id", (req, res, next) => {
    postmodel.findOne({ _id: req.params.id }).then(result => {
        if (!result) {
            res.status(404).json({
                message: "Post not found"
            });
        } else {
            res.status(200).json({
                message: "Post fetched!",
                post: result
            });
        }
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            message: "Fetching post failed"
        });
    });
})

router.put("/:id/togglelike", checkAuth, (req, res, next) => {
    postmodel.findOne({ _id: req.params.id }).then(post => {
        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (post.likes.includes(req.userData.userId)) {
            post.likes = post.likes.filter(like => like != req.userData.userId);
        } else {
            post.likes.push(req.userData.userId);
        }
        post.save().then(result => {
            res.status(200).json({
                message: "Post updated!",
                post: result
            });
        }).catch(err => {
            console.log(err);
            res.status(500).json({
                message: "Updating post failed"
            });
        });

    })
})

router.get('/:postId/replies', checkAuth, (req, res, next) => {
    if (!req.params.postId) {
        return res.status(400).json({
            message: "Post Id is required"
        });
    }
    replymodel.find({ post: req.params.postId })
        .then(replies => {
            res.status(200).json({
                message: "Replies fetched successfully",
                replies: replies
            });
        })
        .catch(err => {
            res.status(500).json({
                message: "Failed to fetch replies",
                error: err
            });
        });
})

router.post('/:postId/reply', multer({ storage: repliesStorage }).single("image"), checkAuth, (req, res, next) => {
    let reply;
    console.log(req.body)
    if (!req.params.postId) {
        return res.status(400).json({
            message: "Post Id is required"
        })
    }

    if (!req.body.reply) {
        console.log(req.body.reply);
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

    reply.save().then(result => {
        res.status(201).json({
            message: "Reply added successfully",
            reply: result
        });
    })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: "Failed to add reply",
                error: err
            });
        });
})

router.delete('/reply/:id', checkAuth, (req, res, next) => {
    replymodel.findOne({ _id: req.params.id }).then(reply => {
        if (!reply || !reply.creator || !req.userData.userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this reply"
            });
        }
        
        if (req.userData.userId != reply.creator) {
            return res.status(403).json({
                message: "You are not authorized to delete this reply"
            });
        }

        replymodel.deleteOne({ _id: req.params.id }).then(result => {
            res.status(200).json({
                message: "Reply deleted!"
            });
        }).catch(err => {
            console.log(err);
            res.status(500).json({
                message: "Deleting reply failed"
            });
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            message: "Deleting reply failed"
        });
    })
})

router.put('/reply/:id/togglelike', checkAuth, (req, res, next) => {
    replymodel.findOne({ _id: req.params.id }).then(reply => {
        if (!reply) {
            return res.status(404).json({
                message: "Reply not found"
            });
        }
        
        if (reply.likes.includes(req.userData.userId)) {
            reply.likes = reply.likes.filter(like => like != req.userData.userId);
        } else {
            reply.likes.push(req.userData.userId);
        }

        reply.save().then(result => {
            res.status(200).json({
                message: "Reply updated!",
                reply: result
            });
        }).catch(err => {
            console.log(err);
            res.status(500).json({
                message: "Updating reply failed"
            });
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            message: "Updating reply failed"
        });
    })
})

module.exports = router;  