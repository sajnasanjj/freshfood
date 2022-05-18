
var db = require('../config/connection');
var collection = require('../config/collection')
var bcrypt = require("bcrypt")
var objectId = require('mongodb').ObjectId
const moment = require('moment');

module.exports = {
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).find().sort({ $natural: -1 }).toArray()
            resolve(user)
        })
    },

    updateUser: (fudId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(fudId) }, {
                    $set: {
                        status: "block"
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },
    updateUserr: (fudId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(fudId) }, {
                    $set: {
                        status: "unblock"
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },

    addBanner: (banner, callback) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((data) => {
                callback(data.insertedId)
            })
        })
    },
    getBannerDetails: (BId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).findOne({ _id: objectId(BId) }).then((banners) => {
                resolve(banners)
            })
        })
    },
    getBanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collection.BANNER_COLLECTION).find().sort({ $natural: -1 }).toArray()
            resolve(banner)
        })
    },
    deleteBanner: (BId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).deleteOne({ _id: objectId(BId) }).then((response) => {
                resolve(response)
            })
        })
    },
    updateBanner: (BId, bannerDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION)
                .updateOne({ _id: objectId(BId) }, {
                    $set: {
                        Subtitle: bannerDetails.Subtitle,
                        Heading: bannerDetails.Heading
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },
    getOrderDetails: () => {
        return new Promise((resolve, reject) => {

            let orders = db.get().collection(collection.ORDER_COLLECTION).find().sort({ $natural: -1 }).toArray()
            resolve(orders)
        })

    },
    getOrderDetailss: (details) => {
        return new Promise((resolve, reject) => {
            let end = moment(details.EndDate).format('YYYY-MM-DD');
            let start = moment(details.StartDate).format('YYYY-MM-DD')
            let orders = db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte: start, $lte: end} }).sort({ $natural: -1 }).toArray()
            resolve(orders)
        })
    },
    updatecancel: (status, id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) },
                {
                    $set: {
                        status: status,
                        cancel: true,

                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },
    updatedeliver: (status, id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) },
                {
                    $set: {
                        status: status,
                        deliver: true
                    }
                }).then((response) => {
                    resolve(response)

                })
        })

    },
    updatestatus: (status, id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) },
                {
                    $set: {
                        status: status,


                    }
                }).then((response) => {
                    resolve(response)

                })
        })

    },
    getAllProduct: () => {
        return new Promise((resolve, reject) => {
            let food = db.get().collection(collection.FOOD_COLLECTION).find().sort({ $natural: -1 }).toArray()
            resolve(food)
        })
    },
    addProductOffer: (data) => {
        return new Promise(async (resolve, reject) => {
            data.start = moment(data.StartDate).format('YYYY/MM/DD')
            data.end = moment(data.EndDate).format('YYYY/MM/DD')
            let response = {}
            let exist = await db.get().collection(collection.FOOD_COLLECTION).findOne({ Name: data.Name, Offer: { $exists: true } });
            if (exist) {
                response.exist = true
                resolve(response)
            } else {
                db.get().collection(collection.PRODUCT_OFFER_COLLECTION).insertOne(data).then((response) => {
                    resolve(response)
                }).catch((err) => {
                    rej(err)
                })
            }
        })

    },

    getAllProductOffers: () => {
        return new Promise((resolve, reject) => {
            let productoff = db.get().collection(collection.PRODUCT_OFFER_COLLECTION).find().toArray()
            resolve(productoff)
        })
    },
    deleteProductOffer: (Id) => {
        return new Promise(async (resolve, reject) => {
            let productoff = await db.get().collection(collection.PRODUCT_OFFER_COLLECTION).findOne({ _id: objectId(Id) })

            let proname = productoff.Name;

            let food = await db.get().collection(collection.FOOD_COLLECTION).findOne({ Name: proname })
            db.get().collection(collection.PRODUCT_OFFER_COLLECTION).deleteOne({ _id: objectId(Id) })
            db.get().collection(collection.FOOD_COLLECTION).updateOne({ Name: proname }, {
                $set: {
                    Price: food?.actualPrice
                },
                $unset: {
                    actualPrice: "",
                    offer: "",
                    percentage: ""
                }
            }).then(() => {
                resolve()
            }).catch((err) => {
                res(err)
            })
        })

    },
    startProductOffer: (today) => {
        let proStartDate = moment(today).format('YYYY/MM/DD')
        return new Promise(async (res, rej) => {
            let data = await db.get().collection(collection.PRODUCT_OFFER_COLLECTION).find({ StartDate: { $lte: proStartDate } }).toArray();

            if (data) {
                await data.map(async (onedata) => {
                    let food = await db.get().collection(collection.FOOD_COLLECTION).findOne({ Name: onedata.Name, offer: { $exists: false } })

                    if (food) {
                        let actualPrice = food.Price
                        let newP = (((food.Price) * (onedata.percentage)) / 100)
                        let newPrice = actualPrice - newP;

                        newPrice = newPrice.toFixed()
                        console.log(actualPrice, newPrice, onedata.percentage);
                        db.get().collection(collection.FOOD_COLLECTION).updateOne({ _id: objectId(food._id) }, {
                            $set: {
                                actualPrice: actualPrice,
                                Price: newPrice,
                                offer: true,
                                percentage: onedata.percentage
                            }
                        })
                        res()
                    } else {
                        res()
                    }

                })

            } else {
                res()
            }
        })
    }, 
    dashboard: (userId) => {
        return new Promise(async (resolve, reject) => {
            let today = new Date();
            let end = moment(today).format('YYYY-MM-DD');
            let start = moment(end).subtract(30, 'days').format('YYYY-MM-DD')
            let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $ne: "canceled" } }).toArray()
            let totalOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
            let cancelledOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: "canceled" }).toArray()
            let pendingOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: "pending" }).toArray()
            let totalUser = await db.get().collection(collection.USER_COLLECTION).find().toArray();
            let totalCategories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();
            let totalMenu = await db.get().collection(collection.FOOD_COLLECTION).find().toArray()
            let total = 0;
            let Razorpay = 0;
            let paypal = 0;
            let COD = 0;
            let totalOrderSuccess = orderSuccess.length
            let orderLength = totalOrder.length
            let userLength = totalUser.length
            let catLength = totalCategories.length
            let menuLength = totalMenu.length
            let cancelOrder = cancelledOrder.length
            let pending = pendingOrder.length
            for (let i = 0; i < totalOrderSuccess; i++) {
                total = total + orderSuccess[i].total;
                if (orderSuccess[i].paymentMethod == 'paypal') {
                    paypal++;
                } else if (orderSuccess[i].paymentMethod == 'Razorpay') {
                    Razorpay++;
                } else {
                    COD++;
                }
            }
            var data = {
                today: today,
                start: start,
                end: end,
                userLength: userLength,
                catLength: catLength,
                menuLength: menuLength,
                orderLength: orderLength,
                totalOrderSuccess: totalOrderSuccess,
                cancelOrder: cancelOrder,
                pending: pending,
                Razorpay: Razorpay,
                paypal: paypal,
                COD: COD,
                total: total
            }
            resolve(data)
        })
    },
    salesReport: (details) => {
        return new Promise(async (resolve, reject) => {
            let end = moment(details.EndDate).format('YYYY-MM-DD');
            let start = moment(details.StartDate).format('YYYY-MM-DD')
            let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $ne: "canceled" } }).toArray()
            let totalOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
            let cancelledOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: "canceled" }).toArray()
            let pendingOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: "pending" }).toArray()
            let totalUser = await db.get().collection(collection.USER_COLLECTION).find().toArray();
            let totalCategories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();
            let totalMenu = await db.get().collection(collection.FOOD_COLLECTION).find().toArray()
            let total = 0;
            let Razorpay = 0;
            let paypal = 0;
            let COD = 0;
            let totalOrderSuccess = orderSuccess.length
            let orderLength = totalOrder.length
            let userLength = totalUser.length
            let catLength = totalCategories.length
            let menuLength = totalMenu.length
            let cancelOrder = cancelledOrder.length
            let pending = pendingOrder.length

            for (let i = 0; i < totalOrderSuccess; i++) {
                total = total + orderSuccess[i].total;
                if (orderSuccess[i].paymentMethod == 'paypal') {
                    paypal++;
                } else if (orderSuccess[i].paymentMethod == 'Razorpay') {
                    Razorpay++;
                } else {
                    COD++;
                }
            }

            var data = {

                start: start,
                end: end,
                userLength: userLength,
                catLength: catLength,
                menuLength: menuLength,
                orderLength: orderLength,
                totalOrderSuccess: totalOrderSuccess,
                cancelOrder: cancelOrder,
                pending: pending,
                Razorpay: Razorpay,
                paypal: paypal,
                COD: COD,
                total: total
            }
            resolve(data)
        })
    },
    monthlyReport: () => {
        return new Promise(async (resolve, reject) => {
            let today = new Date();
            let end = moment(today).format('YYYY-MM-DD');
            let start = moment(end).subtract(30, 'days').format('YYYY-MM-DD')
            let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $ne: "canceled" } }).toArray()
            let totalOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
            let cancelledOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: "canceled" }).toArray()
            let pendingOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: "pending" }).toArray()
            let totalUser = await db.get().collection(collection.USER_COLLECTION).find().toArray();
            let totalCategories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();
            let totalMenu = await db.get().collection(collection.FOOD_COLLECTION).find().toArray()
            let total = 0;
            let Razorpay = 0;
            let paypal = 0;
            let COD = 0;
            let totalOrderSuccess = orderSuccess.length
            let orderLength = totalOrder.length
            let userLength = totalUser.length
            let catLength = totalCategories.length
            let menuLength = totalMenu.length
            let cancelOrder = cancelledOrder.length
            let pending = pendingOrder.length

            for (let i = 0; i < totalOrderSuccess; i++) {
                total = total + orderSuccess[i].total;
                if (orderSuccess[i].paymentMethod == 'paypal') {
                    paypal++;
                } else if (orderSuccess[i].paymentMethod == 'Razorpay') {
                    Razorpay++;
                } else {
                    COD++;
                }
            }


            var data = {

                start: start,
                end: end,
                userLength: userLength,
                catLength: catLength,
                menuLength: menuLength,
                orderLength: orderLength,
                totalOrderSuccess: totalOrderSuccess,
                cancelOrder: cancelOrder,
                pending: pending,
                Razorpay: Razorpay,
                paypal: paypal,
                COD: COD,
                total: total
            }
            resolve(data)
        })
    },// //Category Offers
    getAllCategory: () => {
        return new Promise((resolve, reject) => {
            let category = db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()

            resolve(category)
        })
    },
    getAllCategoryOffers: () => {
        return new Promise((resolve, reject) => {
            let catOffer = db.get().collection(collection.CATEGORY_OFFER_COLLECTION).find().sort({ $natural: -1 }).toArray()

            resolve(catOffer)
        })
    },
    addCategoryOffer: (data) => {
        data.EndDate = moment(data.EndDate).format('YYYY/MM/DD')
        data.StartDate = moment(data.StartDate).format('YYYY/MM/DD')
        return new Promise(async (resolve, reject) => {
            let exist = await db.get().collection(collection.CATEGORY_OFFER_COLLECTION).findOne({ category: data.category })
            console.log(exist)
            if (exist) {
                resolve()
            } else {

                db.get().collection(collection.CATEGORY_OFFER_COLLECTION).insertOne(data).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    deleteCategoryOffer: (id) => {
        return new Promise(async (res, rej) => {
            let categoryOffer = await db.get().collection(collection.CATEGORY_OFFER_COLLECTION).findOne({ _id: objectId(id) })
            let catName = categoryOffer.category
            let product = await db.get().collection(collection.FOOD_COLLECTION).find({ Category: catName }, { offer: { $exists: true } }).toArray()
            if (product) {
                db.get().collection(collection.CATEGORY_OFFER_COLLECTION).deleteOne({ _id: objectId(id) }).then(async () => {
                    await product.map((product) => {

                        db.get().collection(collection.FOOD_COLLECTION).updateOne({ _id: objectId(product._id) }, {
                            $set: {
                                Price: product.actualPrice
                            },
                            $unset: {
                                offer: "",
                                percentage: '',
                                actualPrice: ''
                            }
                        }).then(() => {
                            res()
                        })
                    })
                })
            } else {
                res()
            }

        })

    },

    startCategoryOffer: (date) => {
        let catStartDate = moment(date.StartDate).format('YYYY/MM/DD')

        return new Promise(async (res, rej) => {
            let data = await db.get().collection(collection.CATEGORY_OFFER_COLLECTION).find({ StartDate: { $lte: catStartDate } }).toArray();
            if (data.length > 0) {
                await data.map(async (onedata) => {

                    let products = await db.get().collection(collection.FOOD_COLLECTION).find({ Category: onedata.Category, offer: { $exists: false } }).toArray();
                    await products.map(async (product) => {
                        let actualPrice = product.Price
                        let newPrice = (((product.Price) * (onedata.percentage)) / 100)
                        newPrice = newPrice.toFixed()
                        console.log(actualPrice, newPrice, onedata.percentage);
                        db.get().collection(collection.FOOD_COLLECTION).updateOne({ _id: objectId(product._id) },
                            {
                                $set: {
                                    actualPrice: actualPrice,
                                    Price: (actualPrice - newPrice),
                                    offer: true,
                                    percentage: onedata.percentage
                                }
                            })
                    })
                })
                res();
            } else {
                res()
            }
        })
    },
    //coupon
    getAllCoupons: () => {
        return new Promise(async (res, rej) => {
            let coupons = await db.get().collection(collection.COUPON).find().sort({ $natural: -1 }).toArray()
            res(coupons)
        })
    },
    addCoupon: (data) => {
        return new Promise(async (res, rej) => {
            let startDateIso = new Date(data.Starting)
            let endDateIso = new Date(data.Expiry)
            let expiry = moment(data.Expiry).format('YYYY-MM-DD')
            let starting = moment(data.Starting).format('YYYY-MM-DD')
            let dataobj = {
                Coupon: data.Coupon,
                percentage: data.percentage,
                Starting: starting,
                Expiry: expiry,
                startDateIso: startDateIso,
                endDateIso: endDateIso,
                Users: []
            }
            db.get().collection(collection.COUPON).insertOne(dataobj).then((data) => {
                res()
            }).catch((err) => {
                res(err)
            })
        })
    },
    deleteCoupons: (Id) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.COUPON).deleteOne({ _id: objectId(Id) })
            resolve()
        })

    },
    startCouponOffers: (date) => {
        let couponStartDate = new Date(date);
        return new Promise(async (res, rej) => {
            let data = await db.get().collection(collection.COUPON).find({ startDateIso: { $lte: couponStartDate } }).toArray()

            if (data.length > 0) {
                await data.map((onedata) => {
                    db.get().collection(collection.COUPON).updateOne({ _id: objectId(onedata._id) }, {
                        $set: {
                            Available: true
                        }
                    }).then(() => {
                        res()
                    })

                })
            } else {
                res()
            }
        })


    },


    couponValidate: (data, user) => {
        return new Promise(async (res, rej) => {
            obj = {}
            let date = new Date()
            date = moment(date).format('YYYY-MM-DD')
            let coupon = await db.get().collection(collection.COUPON).findOne({ Coupon: data.Coupon, Available: true })

            if (coupon) {
                let users = coupon.Users
                let userChecker = users.includes(user)

                if (userChecker) {
                    obj.couponUsed = true;
                    res(obj)

                } else {
                    if (date <= coupon.Expiry) {


                        let total = parseInt(data.Total)
                        let percentage = parseInt(coupon.percentage)
                        let discountVal = ((total * percentage) / 100).toFixed()
                        obj.total = total - discountVal

                        obj.success = true
                        res(obj)

                        db.get().collection(collection.COUPON).updateOne({ _id: objectId(coupon._id) },
                            {
                                $push: { Users: user }
                            }).then((response) => {
                                res(obj)
                            })
                    } else {
                        obj.couponExpired = true
                        res(obj)
                    }
                }
            } else {
                obj.invalidCoupon = true
                res(obj)

            }
        })
    },

}

