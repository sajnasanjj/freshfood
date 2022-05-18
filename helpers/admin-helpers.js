var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { reject, promise } = require('bcrypt/promises')
var objectId = require('mongodb').ObjectId
const moment = require('moment');


const { resolve } = require('path')


module.exports = {

    doSignup: (adminData) => {
        return new Promise(async (resolve, reject) => {

            adminData.Password = await bcrypt.hash(adminData.Password, 10)
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data) => {
                resolve(data.insertedId)

            })
        })
    },
    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}


            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminData.Email })
            if (admin) {
                bcrypt.compare(adminData.Password, admin.Password).then((status) => {
                    if (status) {
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })

            } else {
                resolve({ status: false })
            }
        })
    }


}