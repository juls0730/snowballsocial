const express = require("express");
const postmodel = require('../models/post');
const rateLimit = require('express-rate-limit');
const multer = require("multer");

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
        cb(error, "backend/images");
    },

    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('_');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    }
});

const createPostLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 create post requests per `window` (here, per 15 minutes)
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
        });
    } else {
        const url = req.protocol + '://' + req.get("host");
        post = new postmodel({
            title: req.body.title,
            content: req.body.content,
            imagePath: url + "/images/" + req.file.filename,
            creator: req.userData.userId
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
            post: {
                ...result,
                id: result._id
            }
        });
    })
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
        });
});

router.delete("/:id", checkAuth, (req, res, next) => {
    postmodel.deleteOne({ _id: req.params.id }).then(result => {
        if (req.userData.userId === result.creator) {
            console.log(result);
            res.status(200).json({
                message: "Post deleted!"
            });
        } else {
            res.status(401).json({
                message: "You are not authorized to delete this post"
            });
        }
    });
});

router.get("/:id", (req, res, next) => {
    postmodel.findById({ _id: req.params.id }).then(result => {
        res.status(200).json({
            message: "Post fetched!"
        });
    })
})

module.exports = router;  