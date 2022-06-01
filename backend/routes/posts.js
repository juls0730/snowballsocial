const rateLimit = require('express-rate-limit');
const multer = require("multer");
const controller = require("../controllers/posts");
const checkAuth = require("../middleware/check-auth");
const usercontroller = require("../controllers/user");

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg'
};

const postStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid Mime Type");
        if (isValid) {
            error = null;
        }
        cb(error, "backend/images/posts");
    },

    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().replace(/[^a-zA-Z0-9 _\-]/g, '').split(' ').join('_');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    }
});

const postparser = multer({
    storage: postStorage
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
        const name = file.originalname.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').split(' ').join('_');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    }
});

const replyparser = multer({
    storage: repliesStorage
});

const createPostLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 create post requests per `window` (here, per 5 minutes)
    message:
        'Too many posts created from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

module.exports = function (app) {
    app.post('/api/posts', [createPostLimiter, checkAuth, postparser.single('image')], controller.addPost);
    app.get('/api/posts', [checkAuth], controller.getAllPosts);
    app.delete('/api/posts/:id', [checkAuth], controller.deletePost);
    app.get('/api/posts/:id', controller.getPostById);
    app.put('/api/posts/:id/togglelike', [checkAuth], controller.likePost);
    app.get('/api/posts/:postId/replies', controller.getPostReplies);
    app.post('/api/posts/:postId/reply', [checkAuth, replyparser.single('image')], controller.addReply);
    app.delete('/api/posts/reply/:id', [checkAuth], controller.deleteReply);
    app.put('/api/posts/reply/:id/togglelike', [checkAuth], controller.likeReply);
};