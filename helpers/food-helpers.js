const { response } = require('../app');
var db = require('../config/connection');
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt');
const res = require('express/lib/response');
const moment = require('moment');

module.exports = {


    addFood: (food, callback) => {
        console.log(food);
        db.get().collection(collection.FOOD_COLLECTION).insertOne(food).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllFood: () => {
        return new Promise(async (resolve, reject) => {
            let food = await db.get().collection(collection.FOOD_COLLECTION).find().toArray()
            resolve(food)
        })
    },
    deleteFood: (fudId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.FOOD_COLLECTION).deleteOne({ _id: objectId(fudId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getFoodDetails: (fudId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.FOOD_COLLECTION).findOne({ _id: objectId(fudId) }).then((food) => {
                resolve(food)
            })
        })
    },
    getFoodDetailss: (fudId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.FOOD_COLLECTION).findOne({ _id: objectId(fudId) }).then((food) => {
                resolve(food)
            })
        })
    },

    updateFood: (fudId, fudDetails) => {
        fudDetails.Price = parseInt(fudDetails.Price)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.FOOD_COLLECTION)
                .updateOne({ _id: objectId(fudId) }, {
                    $set: {
                        Name: fudDetails.Name,
                        Category: fudDetails.Category,
                        Price: fudDetails.Price
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },
    updateCategory: (fudId, fudDetails) => {
        fudDetails.Price = parseInt(fudDetails.Price)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({ _id: objectId(fudId) }, {
                    $set: {
                        Category: fudDetails.Category
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },
    //category
    addCategory: (category, callback) => {
        console.log(category);
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllCategories: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })
    },

    getCatDetails: (cat) => {
        return new Promise(async (resolve, reject) => {
            let catproducts = await db.get().collection(collection.FOOD_COLLECTION).find({ Category: cat }).toArray()
            resolve(catproducts)
        })
    },
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {
                resolve(response)
            })
        })
    }
}  