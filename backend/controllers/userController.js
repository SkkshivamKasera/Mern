const Users = require('../models/userModel')
const ErrorHandler = require('../utills/errorHandler')
const sendToken = require('../utills/jwtToken')
const sendEmail = require('../utills/sendEmail')
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const success = true

exports.registerUser = async (req, res, next) => {
    try {
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale"
        })
        const { name, email, password } = req.body
        let user = await Users.findOne({email: email})
        if (user) { return next(new ErrorHandler("Email is already exists"))}
        user = await Users.create({
            name: name,
            email: email,
            password: password,
            avatar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        })
        await sendEmail({
            email: user.email,
            subject: `🎉 Welcome to [Ecommerce] - Discover Amazing Deals Inside!`,
            message : `
            🎉 Welcome to Our Ecommerce Store! 🎉
                            
            🛍️ Shop Now and Discover Amazing Deals! 🛍️
                            
            ✨ We're thrilled to have you as a valued customer! ✨
                            
            🎁 Get 10% OFF on your first purchase with code: WELCOME10 🎁
                            
            🌟 Happy shopping! 🌟
                            
            🛒 Start exploring our products ➡️ [https://helpful-pika-3213fa.netlify.app]
                            
            💌 If you have any questions or need assistance, feel free to contact us. We're here to help! 💌
                            
            👋 Thank you for choosing us! Enjoy your shopping experience! 👋
            `
        })
        sendToken(user, req, res)
    } catch (error) {
        console.error("Error during signup:", error);
        return next(new ErrorHandler(error.message))
    }
}

exports.loginUser = async (req, res, next) => {
    try{
        const { email, password } = req.body
        if (!email || !password) { return next(new ErrorHandler("Please Enter Email & Password")) }
        const user = await Users.findOne({ email }).select("+password")
        if (!user) { 
            return next(new ErrorHandler("Not Found"))
        }
        const checkPassword = await user.comaparePassword(password)
        if (!checkPassword) { return next(new ErrorHandler("Not Found")) }
        sendToken(user, req, res)
        await sendEmail({
            email: user.email,
  subject: `🎉 Welcome to [Ecommerce] - Discover Amazing Deals Inside!`,
  message: `
🎉 Welcome to Our Ecommerce Store! 🎉

🛍️ Shop Now and Discover Amazing Deals! 🛍️

✨ We're thrilled to have you as a valued customer! ✨

🎁 Get 10% OFF on your first purchase with code: WELCOME10 🎁

🌟 Happy shopping! 🌟

🛒 Start exploring our products ➡️ [https://helpful-pika-3213fa.netlify.app]

💌 If you have any questions or need assistance, feel free to contact us. We're here to help! 💌

👋 Thank you for choosing us! Enjoy your shopping experience! 👋
`
})
    }catch(error){
        return next(new ErrorHandler(error.message))
    }
}

exports.logoutUser = async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.send({ success: success, message: "Logout Successfully" })
}

exports.forgotPassword = async (req, res, next) => {
    const user = await Users.findOne({ email: req.body.email })
    if (!user) { return next(new ErrorHandler("User Not Found")) }

    const resetToken = await user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    const resetPasswordLink = `${process.env.FRONTEND}/password/reset/${resetToken}`

    const message = `Your password reset link is :- \n\n${resetPasswordLink}\n\nIf you have not requested this email then, please ignore it`

    try {
        await sendEmail({
            email: user.email,
            subject: "Ecommerce Password Recovery",
            message
        })
        res.send({ success: success, message: `Email sent to ${user.email} successfully` })
    } catch (error) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save({ validateBeforeSave: false })
        return next(new ErrorHandler(error.message))
    }
}

exports.resetPassword = async (req, res, next) => {
    try{const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex")
    const user = await Users.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } })
    if (!user) { return next(new ErrorHandler("Token Expire")) }
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password not changable"))
    }
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    await sendEmail({
        email: user.email,
        subject: "Password Reset Successful",
        message: `Dear [${user.name}],

        We are writing to inform you that your password has been successfully reset.
        
        If you did not initiate this password reset, please contact our support team immediately at ${process.env.SMPT_MAIL} to secure your account.
        
        Thank you for using our services.
        
        Best regards,
        [Ecommerce]`
    })

    sendToken(user, req, res)}catch(error){
        return next(new ErrorHandler(error.message))
    }
}

exports.getUserDetails = async (req, res, next) => {
    try {
        const user = await Users.findById(req.user.id)
        if(!user) { return next(ErrorHandler("Please Login")) }
        res.send({ success: success, user: user})

    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.updatePassword = async (req, res, next) => {
    try {
        const user = await Users.findById(req.user.id).select("+password")
        const checkPassword = await user.comaparePassword(req.body.oldPassword)
        if (!checkPassword) { return next(new ErrorHandler("Old password is incorrect")) }
        if (req.body.newPassword !== req.body.confirmPassword) {
            return next(new ErrorHandler("Password does not match"))
        }
        user.password = req.body.newPassword
        await user.save()
        sendToken(user, req, res)
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.updateProfile = async (req, res, next) => {
    try{const newUserDate = {
        "name": req.body.name,
        "email": req.body.email,
    }
    console.log(req.body.avatar)
    if(req.body.avatar !== ""){
        const find_user = await Users.findById(req.user.id)
        const imageId = find_user.avatar.public_id
        await cloudinary.v2.uploader.destroy(imageId)
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale"
        })
        newUserDate.avatar={
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    }
    const user = await Users.findByIdAndUpdate(req.user.id, newUserDate, { new: true, runValidators: true })
    res.send({ success: success, message: "🎉🎉🎉Successfully🎉🎉🎉" })}
    catch(error){
        return next(new ErrorHandler(error.message))
    }
}

// Get all users. ==> Only Admin
exports.getAllUser = async (req, res) => {
    try {
        const users = await Users.find()
        res.send({ success: success, users: users })
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.getSingleUser = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id)
        if (!user) { return next(new ErrorHandler("Not Found")) }
        res.send({ success: success, user: user })
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.updateRole = async (req, res, next) => {
    try {
        const newUserData = {
            "name": req.body.name,
            "email": req.body.email,
            "role": req.body.role
        }
        const user = await Users.findByIdAndUpdate(req.params.id, newUserData, { new: true, runValidators: true })
        res.send({ success: success, message: "🎉🎉🎉Successfully🎉🎉🎉", user: user })
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.deleteUser = async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id)
        if (!user) { return next(new ErrorHandler("User Not Found" ))}
        const imageId = user.avatar.public_id
        await cloudinary.v2.uploader.destroy(imageId)
        await user.deleteOne()
        res.send({ success: success, message: "🎉🎉🎉Successfully🎉🎉🎉" })
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}