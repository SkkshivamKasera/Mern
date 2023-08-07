const jwt = require('jsonwebtoken')
const Users = require('../models/userModel')
const ErrorHandler = require('../utills/errorHandler')
exports.isAuthenticatedUser = async (req, res, next) => {
    try{
        const { token } = req.cookies
        if(!token){
            return next(new ErrorHandler("Token is missing"))
        }
        const decodeData = jwt.verify(token, process.env.SIGN)
        req.user = await Users.findById(decodeData.id)
        next()
    }catch(error){
        return next(new ErrorHandler(error.message))
    }
}

exports.authorizeRoles = (...roles) => {
    return (req, res, next)=>{
        if(!roles.includes(req.user.role)){
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource`))
        }
        next()
    }
}