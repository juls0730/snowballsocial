const checkAuth = require('../middleware/check-auth');
const controller = require("../controllers/conversation");
const multer = require("multer");

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg'
};

const messageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid mime type");

        if (isValid) {
            error = null;
        }
        cb(new Error("you cannot upload a file via messages yet"), "backend/images/messages");
    },

    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().replace(/[^a-zA-Z0-9 _\-]/g, '').split(' ').join('_');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    }
});

const messageparser = multer({
    storage: messageStorage
}).single('image');

module.exports = function (app) {
    app.post("/api/conversation", [checkAuth], controller.startConversation);
    app.post("/api/conversation/:id/message", [checkAuth, messageparser], controller.message);
    app.put("/api/conversation/:id", [checkAuth], controller.updateConversation);
    app.get("/api/conversation/:id", [checkAuth], controller.getConversation);
    app.get("/api/conversations", [checkAuth], controller.getUsersConversations);
    app.delete("/api/conversation/:id", [checkAuth], controller.deleteConversation);
}