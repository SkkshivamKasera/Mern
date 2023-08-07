const Products = require('../models/productModel')
const ApiFeatures = require('../utills/apifeatures')
const cloudinary = require('cloudinary')
const ErrorHandler = require('../utills/errorHandler')

const success = true

exports.createProducts = async (req, res, next) => {
    try {
        let images = []
        if(typeof req.body.images === "string"){
            images.push(req.body.images)
        }else{
            images = req.body.images
        }
        const imagesLink = []
        for(let i = 0; i < images.length; i++){
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products"
            })
            imagesLink.push({
                public_id: result.public_id,
                url: result.secure_url
            })
        }
        req.body.images = imagesLink
        req.body.user = req.user.id
        const product = await Products.create(req.body)
        res.status(201).json({ success: success, product })
    } catch (error) {
        console.log(error.message)
        return res.send({ success: (!success), errors: error.message })
    }
}

exports.getAllProducts = async (req, res, next) => {
    try {
        let resultPerPage = 5
        const apifeatures = new ApiFeatures(Products.find(), req.query).search().filter().pagination(resultPerPage)
        const products = await apifeatures.query
        const productsCount = await Products.countDocuments()
        res.status(200).json({
            success: true,
            products: products,
            resultPerPage: resultPerPage,
            productsCount: productsCount
        })
    } catch (error) {
        return next(new ErrorHandler(error.message));
    }
};


exports.getAdminAllProducts = async(req, res, next) => {
    try{
        const products = await Products.find()
        res.status(200).json({
            success: true,
            products
        })
    }
    catch(error){
        return next(new ErrorHandler(error.message))
    }
}

exports.getProductDetails = async (req, res, next) => {
    try {
        let product = await Products.findById(req.params.id)
        if (!product) {
            return next(new ErrorHandler("Product Not Found"))
        }
        res.send({success: success, product:product})
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.updateProducts = async (req, res, next) => {
    try {
        let product = await Products.findById(req.params.id)
        if (!product) {
            return next(new ErrorHandler("Product Not Found"))
        }

        let images = []
        if(typeof req.body.images === "string"){
            images.push(req.body.images)
        }else{
            images = req.body.images
        }

        if(images !== undefined){
            for(let i = 0; i < product.images.length; i++){
                await cloudinary.v2.uploader.destroy(product.images[i].public_id)
            }
            const imagesLink = []
            for(let i = 0; i < images.length; i++){
                const result = await cloudinary.v2.uploader.upload(images[i], {
                    folder: "products"
                })
                imagesLink.push({
                    public_id: result.public_id,
                    url: result.secure_url
                })
            }
            req.body.images = imagesLink
        }


        product = await Products.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        res.send({ success: success, message: "🎉🎉🎉Product updation successfully🎉🎉🎉" })
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.deleteProducts = async (req, res, next) => {
    try {
        let product = await Products.findById(req.params.id)
        if (!product) {
            return next(new ErrorHandler("Product Not Found"))
        }
        for(let i = 0; i < product.images.length; i++){
           await cloudinary.v2.uploader.destroy(product.images[i].public_id)
        }
        product = await Products.findByIdAndDelete(req.params.id)
        res.send({ success: success, message: "🎉🎉🎉Product delete successfully🎉🎉🎉" })
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.createProductReview = async (req, res) => {
    try {
        const { rating, comment, productId } = req.body
        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment
        }
        const product = await Products.findById(productId)
        const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString())
        if (isReviewed) {
            product.reviews.forEach(rev => {
                if (rev.user.toString() === req.user._id.toString()) {
                    rev.rating = rating
                    rev.comment = comment
                }
            })
        } else {
            product.reviews.push(review)
            product.numberOfReviews = product.reviews.length
        }
        let avg = 0
        product.reviews.forEach(rev => {
            avg += rev.rating
        })
        product.ratings = avg / product.reviews.length

        await product.save({ validateBeforeSave: false })
        res.send({ success: success, message: "🎉🎉🎉successfully🎉🎉🎉" })

    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.getAllreviewsOfSingleProduct = async (req, res) => {
    try {
        const product = await Products.findById(req.query.id)
        if (!product) {
            return next(new ErrorHandler("Product Not Found"))
        }
        res.send({ success: success, message: "🎉🎉🎉successfully🎉🎉🎉", reviews: product.reviews })
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}

exports.deleteReviewer = async (req, res) => {
    try {
        const product = await Products.findById(req.query.productId)
        if (!product) {
            return next(new ErrorHandler("Product Not Found" ))
        }
        const reviews = product.reviews.filter(rev => rev._id.toString() !== req.query.id.toString())

        let avg = 0
        reviews.forEach(rev => {
            avg += rev.rating
        })
        const ratings = avg / reviews.length

        const numOfReviews = reviews.length

        await Products.findByIdAndUpdate(req.query.productId, {reviews, ratings, numOfReviews}, {new:true, runValidators:true})

        res.send({ success: success, message: "🎉🎉🎉successfully🎉🎉🎉"})
    } catch (error) {
        return next(new ErrorHandler(error.message))
    }
}