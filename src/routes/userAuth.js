const express = require('express');
const authRouter = express.Router();
const { register, login, logout, getProfile, adminRegister, deleteProfile} = require("../controllers/AuthControllers");
const userMiddleware = require('../middleware/userMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
authRouter.post('/register', register)

authRouter.post('/login', login)

authRouter.post('/logout', userMiddleware, logout)

authRouter.get('/getProfile', getProfile);

authRouter.post('/admin/register', adminMiddleware, adminRegister);

authRouter.delete('/profile/delete', userMiddleware, deleteProfile);

authRouter.get('/check-auth', userMiddleware, (req, res)=>{
    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id:req.result._id,
        role:req.result.role,
    }
    res.status(200).json({
        user:{...reply},
        message:"Valid User"
    });
})

module.exports = authRouter; 