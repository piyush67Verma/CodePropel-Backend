const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const User = require("../models/user");
const adminMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        //checking if its in blocklist or not 
        // if token exist in redis db then its stolen token 
        const isBlocked = await redisClient.exists(`token:${token}`);
        if(isBlocked){
            throw new Error("Invalid token");
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const {_id, role} = payload;
        if(!_id){
            throw new Error('Invalid token');
        }
        if(role!='admin'){
            console.log("Role problem")
            throw new Error('Invalid token');
        }
        const result = await User.findById(_id);
        if(!result){
            throw new Error('User does not exist');
        }
        req.result = result;
        next();
    }
    catch (err) {
        console.log(err);
        res.status(401).send(err);
    }
}

module.exports = adminMiddleware;