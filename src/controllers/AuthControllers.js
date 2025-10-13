const User = require('../models/user');
const validateUser = require('../utils/userValidation');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const redisClient = require('../config/redis');
const Submission = require("../models/submission");

const isProduction = process.env.PROD === "true";

const register = async (req, res, next) => {
    try {
        validateUser(req.body);
        //hash the password before saving it into db
        let { password } = req.body;
        const hashString = await bcrypt.hash(password, 10);
        req.body.password = hashString;
        req.body.role = 'user';
        const user = await User.create(req.body);
        const reply = {
            firstName: user.firstName,
            emialId: user.emailId,
            _id: user._id,
            role: user.role
        }
        const { _id, emailId } = user;
        const token = jwt.sign({ _id, emailId, role: 'user' }, process.env.JWT_SECRET_KEY, { expiresIn: 60 * 60 });
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        // res.status(201).send("User registered successfully");
        res.status(201).json({
            user: { ...reply },
            message: "User registered successfully"
        })
    }
    catch (err) {
        res.status(400).send("Error: " + err.message);
    }
}

const login = async (req, res, next) => {
    try {
        const { emailId, password } = req.body;
        if (!emailId || !password) {
            throw new Error("Invalid Credentials");
        }
        const user = await User.findOne({ emailId });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid Credentials");
        }

        const reply = {
            firstName: user.firstName,
            emialId: user.emailId,
            _id: user._id,
            role: user.role
        }
        const token = jwt.sign({ _id: user._id, emailId, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: 60 * 60 });
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        // res.status(200).send("User logged in successfully");
        res.status(200).json({
            user: { ...reply },
            message: "User logged in successfully"
        })
    }
    catch (err) {
        res.status(401).send("Error: " + err.message);
    }
}

const logout = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        const payload = jwt.decode(token);

        // put the token in blocklist in  redis db and keep it there 
        // till expiration of token 
        await redisClient.set(`token:${token}`, "Blocked");
        await redisClient.expireAt(`token:${token}`, payload.exp);

        // expire the cookie
        res.cookie('token', '', {
            expires: new Date(0),
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        res.status(200).send("Logged out successfully");
    }
    catch (err) {
        res.status(500).send("Error: " + err.message);
    }

}


const adminRegister = async (req, res) => {
    try {
        validateUser(req.body);
        //hash the password before saving it into db
        let { password } = req.body;
        const hashString = await bcrypt.hash(password, 10);
        req.body.password = hashString;
        // req.body.role = 'admin';
        const user = await User.create(req.body);
        const { _id, emailId } = user;
        const token = jwt.sign({ _id, emailId, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: 60 * 60 });
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        res.status(201).send("User registered successfully");
    }
    catch (err) {
        res.status(400).send("Error: " + err.message);
    }
}

const deleteProfile = async (req, res) => {
    try {
        const userId = req.result._id;
        await User.findByIdAndDelete(userId);

        await Submission.deleteMany({ userId });
        res.status(200).send("Profile Deleted Successfully");
    }
    catch (err) {
        res.status(500).send("Error: " + err.message);
    }
}

// const getProfile = async (req, res, next) => {
//     // try{

//     // }
//     // catch(err){

//     // }

// }

module.exports = { register, login, logout, getProfile, adminRegister, deleteProfile };