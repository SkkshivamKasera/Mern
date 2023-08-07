const ErrorHandler = require("../utills/errorHandler")

module.exports = (err, req, res, next) => {
    err.message = err.message || "Interal Server Error"
    res.json({
        success: false,
        message: err.message
    })
}