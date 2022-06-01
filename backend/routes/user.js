const rateLimit = require('express-rate-limit');
const checkAuth = require("../middleware/check-auth");
const controller = require("../controllers/user");

const loginLimiter = rateLimit({
    windowMs: 90 * 60 * 1000, // 90 minutes
    max: 70, // Limit each IP to 70 login requests per `window` (here, per 90 minutes)
    message:
        'Too many login attempts from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const signupLimiter = rateLimit({
    windowMs: 8 * 60 * 60 * 1000, // 8 hours
    max: 5, // Limit each IP to 5 login requests per `window` (here, per 8 hours)
    message:
        'Too many signup requests from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

module.exports = function(app) {
    app.post('/api/user/login', [loginLimiter], controller.login);
    app.post('/api/user/signup', [signupLimiter], controller.signup);
    app.get('/api/user/:id', controller.findOne);
    app.get('/api/user/:id/posts', controller.getUserPosts);
    app.post('/api/user/:userId/follow', [checkAuth], controller.followUser);
};