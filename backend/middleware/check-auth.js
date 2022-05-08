const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/auth.config");

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization
            .split(" ")[1];
        const decodedToken = jwt.verify(token, jwtSecret);
        req.userData = {
            email: decodedToken.email,
            username: decodedToken.username,
            userId: decodedToken.userId
        };
        next();
    } catch (error) {
        res.status(401).json({ message: "Auth Failed" });
    }
};  