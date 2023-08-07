const express = require('express')
const router = express.Router()
const { isAuthenticatedUser } = require('../middleware/auth')
const { processPayment, sendStripeKey } = require('../controllers/paymentController')

router.route("/payment/process").post(isAuthenticatedUser, processPayment)
router.route("/stripeapikey").get(sendStripeKey)

module.exports = router