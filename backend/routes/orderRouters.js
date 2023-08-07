const express = require('express')
const { newOrder, getSingleOrderDetails, myOrders, getAllOrders, updateOrderStatus, deleteOrder } = require('../controllers/orderController')
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')
const router = express.Router()

router.route('/orders/new').post(isAuthenticatedUser, newOrder)
router.route('/orders/me').get(isAuthenticatedUser, myOrders)
router.route('/orders/:id').get(isAuthenticatedUser, getSingleOrderDetails)

router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders)
router.route('/admin/orders/:id').put(isAuthenticatedUser, authorizeRoles("admin"), updateOrderStatus).delete(isAuthenticatedUser, authorizeRoles("admin"), deleteOrder)

module.exports = router