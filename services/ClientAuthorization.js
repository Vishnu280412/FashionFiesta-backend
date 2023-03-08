const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/envConfig");

class ClientAuthorization {
    authorize(req, res, next) {
        const headerToken = req.headers.clientauthorization;
        if(headerToken) {
            const token = headerToken.split("Bearer ")[1];
            const verified = jwt.verify(token, JWT_SECRET);
            if(verified?.admin === false) {
                next();
            } else {
                return res.status(401).json({errors: [{msg: "Please add a valid token"}]})
            }
        } else {
            return res.status(401).json({errors: [{msg: "Unauthorized access without token!"}]})
        }
    }
}

module.exports = new ClientAuthorization(); 