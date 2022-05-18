var db = require("../config/connection");
var collection = require("../config/collection");
var bcrypt = require("bcrypt");
const { CART_COLLECTION } = require("../config/collection");
const { ORDER_COLLECTION } = require("../config/collection");
const moment = require('moment');

const { response } = require("../app");
const res = require("express/lib/response");
var objectId = require("mongodb").ObjectId;
const Razorpay = require('razorpay');
const { AsyncLocalStorage } = require("async_hooks");
const { resolve } = require("path");
var instance = new Razorpay({
  key_id: 'rzp_test_NAYzYcMc8iOjjS',
  key_secret: 'fjCHumvAf69jF5GHGqtlrmlz',
});

module.exports = {

  verify: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })

      resolve(user)

    })
  },

  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      if (userData.wallet) {
        let mainUser = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: userData.referedBy })
        if (mainUser.wallet <= 100) {
          await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: userData.referedBy },
            { $inc: { wallet: 50 } }
          )
        }
      }
      userData.wallet = userData.wallet ? userData.wallet : 0
      userData.Password = await bcrypt.hash(userData.Password, 10);
      user = {
        Name: userData.Name,
        Email: userData.Email,
        Mobile: `+91${userData.Mobile}`,
        Password: userData.Password,
        wallet: userData.wallet,
        status: userData.status,
        refer: userData.refer,
        referedBy: userData.referedBy
      };


      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(user)
        .then((data) => {
          resolve(data.insertId);
        });
    });
  },
  checkReferal: (referal) => {
    return new Promise(async (resolve, reject) => {
      let refer = await db.get().collection(collection.USER_COLLECTION).find({ refer: referal }).toArray()
      if (refer) {
        resolve(refer)
      } else {
        resolve(err)
      }
    })
  },
  checkemail: (mail) => {
    return new Promise(async (resolve, reject) => {
      let find = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: mail })
      resolve(find)
    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};

      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
  getUserdetails: (No) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Mobile: No });
      resolve(user);
    });
  },
  addToWish: (fudId, userId) => {
    let proObj = {
      item: objectId(fudId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userWish = await db
        .get()
        .collection(collection.WISH_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userWish) {
        let proExist = userWish.food.findIndex(food => food.item == fudId);
        console.log(proExist);

        if (proExist != -1) {
          db.get()
            .collection(collection.WISH_COLLECTION)
            .updateOne({ user: objectId(userId), 'food.item': objectId(fudId) },
              {
                $inc: { 'food.$.quantity': 1 },
              }).then(() => {
                resolve()
              })
        } else {
          db.get().collection(collection.WISH_COLLECTION).updateOne({ user: objectId(userId) }, {
            $push: { food: proObj }
          }).then((response) => {
            resolve()
          })
        }
      } else {
        let wishObj = {
          user: objectId(userId),
          food: [proObj],
        };
        db.get()
          .collection(collection.WISH_COLLECTION)
          .insertOne(wishObj)
          .then((response) => {
            resolve();
          });
      }
    })
  },
  getWishProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishItems = await db
        .get()
        .collection(collection.WISH_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) }
          },
          {
            $unwind: '$food',
          },
          {
            $project: {
              item: '$food.item',
              quantity: '$food.quantity',
            },
          },
          {
            $lookup: {
              from: collection.FOOD_COLLECTION,
              localField: 'item',
              foreignField: '_id',
              as: 'food'
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              food: { $arrayElemAt: ['$food', 0] },
            }
          }
        ]).toArray()
      // console.log(wishItems[0]);
      resolve(wishItems)
    })
  },
  getWishCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let wish = await db
        .get()
        .collection(collection.WISH_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (wish) {
        count = wish.food.length;
      }
      resolve(count);
    });
  },

  getWishFoodList: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let wish = await db.get().collection(collection.WISH_COLLECTION).find({ user: objectId(userId) })
      resolve(wish.food)
    })
  },
  getWishlist: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.WISH_COLLECTION).findOne({ user: objectId(userId) }).then((output) => {
        resolve(output)
      })
    })
  },
  handleWishlist: (wish, food) => {
    return new Promise((resolve, reject) => {
      if (wish?.food) {
        wish = wish.food.map((food) => food.item.toString());
        food.forEach((food) => {
          if (wish.includes(food._id.toString())) {
            food.wish = true;
          }
        });
      }
      resolve(food);
    });
  },
  addWallet: (userId, total) => {
    let Total = parseInt(total)
    return new Promise((res, rej) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $inc: { wallet: Total } }).then((response) => {
        res(response)
      })
    })
  },
  getLocation: (location, orderId) => {
    return new Promise(async (resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
        {
          $set: {
            location: location
          }
        }).then((ressponse) => {
          resolve(response)
        })


    })
  },
  applyWallet: (val, user) => {
    let value = parseInt(val)
    return new Promise((res, rej) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(user) }, { $inc: { wallet: -value } }).then((response) => {
        res(response)
      })
    })
  },

  cancelOrder: (body) => {
    let orderId = body.orderId
    let userId = body.userId
    return new Promise((res, rej) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
        $set: {
          status: "canceled",
          cancel: true
        }
      }).then((response) => {
        res({ cancelOrder: true })
      }).catch((response) => {
        res(error)
      })
    })
  },
  addToCart: (fudId, userId) => {
    let proObj = {
      item: objectId(fudId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.food.findIndex(food => food.item == fudId);
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne({ user: objectId(userId), 'food.item': objectId(fudId) },
              {
                $inc: { 'food.$.quantity': 1 },
              }).then(() => {
                resolve()
              })
        } else {
          db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
            $push: { food: proObj }
          }).then((response) => {
            resolve()
          })
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          food: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    })
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) }
          },
          {
            $unwind: '$food',
          },
          {
            $project: {
              item: '$food.item',
              quantity: '$food.quantity',
            },
          },
          {
            $lookup: {
              from: collection.FOOD_COLLECTION,
              localField: 'item',
              foreignField: '_id',
              as: 'food'
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              food: { $arrayElemAt: ['$food', 0] },
            }
          }
        ]).toArray()
      // console.log(cartItems[0]);
      resolve(cartItems)

    })
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.food.length;
      }
      resolve(count);
    });
  },
  deleteCart: (fudId, userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
        {
          $pull: { food: { item: objectId(fudId) } }
        }).then(() => {
          resolve();
        })
    })
  },
  deleteWish: (fudId, userId) => {
    return new Promise(async (resolve, reject) => {
      db.get().collection(collection.WISH_COLLECTION).updateOne({ user: objectId(userId) },
        {
          $pull: { food: { item: objectId(fudId) } }
        }).then(() => {
          resolve()
        })
    })
  },


  changeFoodQuantity: (details) => {
    details.count = parseInt(details.count)
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
          {
            $pull: { food: { item: objectId(details.food) } }
          }).then((response) => {
            resolve({ removeFood: true })
          })
      } else {
        db.get().collection(collection.CART_COLLECTION)
          .updateOne({ _id: objectId(details.cart), 'food.item': objectId(details.food) },
            {
              $inc: { 'food.$.quantity': details.count }
            }
          ).then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  getCartAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) }
          },
          {
            $unwind: '$food',
          },
          {
            $project: {
              item: '$food.item',
              quantity: '$food.quantity',
            },
          },
          {
            $lookup: {
              from: collection.FOOD_COLLECTION,
              localField: 'item',
              foreignField: '_id',
              as: 'food'
            }
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              food: { $arrayElemAt: ['$food', 0] },
            }
          },
          {
            $group: {
              _id: null,
              // total:{$sum:{$multiply:['$quantity','$food.Price']}}

              total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$food.Price' }] } }
            }
          }
        ]).toArray()
      resolve(total[0].total)
    })
  },
  placeOrder: (order, food, total, location) => {
    return new Promise(async (resolve, reject) => {
      console.log(order, food, total, location);
      let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: {
          Mobile: order.Mobile,
          location: order.location

        },
        userId: objectId(order.userId),
        paymentMethod: order['payment-method'],
        food: food,
        total: total,
        status: status,
        date: moment(new Date()).format('YYYY-MM-DD')
      }

      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
        db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
        resolve(response.insertedId)
      })
    })
  },
  getCartFoodList: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })


      resolve(cart?.food)
    })
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {

      let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).sort({ $natural: -1 }).toArray()


      resolve(orders)
    })
  },

  getOrderFoods: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { _id: objectId(orderId) }
        },
        {
          $unwind: '$food',
        },
        {
          $project: {
            item: '$food.item',
            quantity: '$food.quantity'
          }
        },
        {
          $lookup: {
            from: collection.FOOD_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'food'
          }
        },
        {
          $project: {
            item: 1, quantity: 1, food: { $arrayElemAt: ['$food', 0] }
          }
        }
      ]).toArray()
      console.log(orderItems);
      resolve(orderItems)
    })
  },
  generateRazorpay: (orderId, total) => {

    return new Promise(async (resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId
      };
      instance.orders.create(options, function (err, order) {

        if (err) {
          console.log(err);
        } else {

          resolve(order)

        }
      });
    })
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");

      let hmac = crypto.createHmac("sha256", "fjCHumvAf69jF5GHGqtlrmlz")
      hmac.update(details.response.razorpay_order_id + "|" + details.response.razorpay_payment_id);
      hmac = hmac.digest("hex")

      if (hmac == details.response.razorpay_signature) {

        resolve()

      } else {
        reject()
      }
    })
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
        {
          $set: {
            status: "placed",
          }
        }
      ).then(() => {
        resolve()
      })
        .catch((err) => {
          resolve(err);
        })
    })
  },
  updateProfile: (userId, userDetails) => {
    userDetails.Mobile = parseInt(userDetails.Mobile)
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION)
        .updateOne({ _id: objectId(userId) }, {
          $set: {
            Name: userDetails.Name,
            Email: userDetails.Email,
            Mobile: `+${userDetails.Mobile}`
          }
        }).then((response) => {
          resolve()
        })
    })
  },
  userProfile: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
        resolve(user)
      })
    })
  },
  getUserDetailss: (UId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(UId) }).then((userDetails) => {
        resolve(userDetails)
      })
    })
  },
  addAddress: (userId, address) => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
      if (user) {
        address._id = objectId()
        if (user.address) {
          db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
            {
              $push: { address: address }

            }).then((response) => {
              resolve()
            })
        } else {
          let add = [address]
          db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
            {
              $set: { address: add }
            }
          ).then((response) => {
            resolve()
          })
        }
      }
    })

  },

  userAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userr = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
      resolve(userr.address)

    })
  },

  deleteAddress: (addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
        {
          $pull: { address: { _id: objectId(addressId) } }
        }).then(() => {
          resolve()
        })
    })
  },
  chooseAddress: (addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
        {
          $push: { address: { _id: objectId(addressId) } }
        }).then(() => {
          resolve()
        })
    })
  },
  orderUserAddress: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let userr = await db.get().collection(collection.ORDER_COLLECTION).findOne({ id: objectId(orderId) })
      res(userr.deliveryDetails)
    })
  },


  updatestatuss: (status, id) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) },
        {
          $set: {
            status: status,
            cancel: true,
            deliver: true
          }
        }).then((response) => {
          resolve(response)
        })
    })
  },

  changePassword: (userId, details) => {

    return new Promise(async (resolve, reject) => {

      let response = {}
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })

      if (user) {
        data1 = await bcrypt.hash(details.New, 10)


        bcrypt.compare(details.Password, user.Password).then((status) => {
          if (status) {

            response.status = true
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
              $set: {
                Password: data1
              }
            }).then(() => {
              resolve(response)
            })
          } else {
            response.status = false
            resolve(response)
          }
        })
      }
    })
  },
};
