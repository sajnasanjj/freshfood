var express = require("express");

var router = express.Router();
const foodHelpers = require("../helpers/food-helpers");
const userHelpers = require("../helpers/user-helpers");
const addHelpers = require("../helpers/add-helpers");
const bodyParser = require("body-parser");
const otpAuth = require("../config/otp_auth");
const moment = require("moment");
const createReferal = require("referral-code-generator");
const successfulLookup = require('opencage-api-client');



const {
      AvailablePhoneNumberCountryInstance,
      } = require("twilio/lib/rest/api/v2010/account/availablePhoneNumber");

const paypal = require("paypal-rest-sdk");
const { route } = require("./admin");
const { Db, ReadConcernLevel } = require("mongodb");
const { response } = require("../app");
const { validateRequest } = require("twilio/lib/webhooks/webhooks");
const res = require("express/lib/response");

const serviceSID = process.env.serviceSID;
const accountSID = process.env.accountSID;
const authToken = process.env.authToken;
const client = require("twilio")(accountSID, authToken);
  const verifyLogin = (req, res, next) => {
   
   
     if (req.session.loggedIn) {
      let user = req.session.user;
      userHelpers.verify(user._id).then((user) => {
        if(user.status=="unblock"){
          next()
        }else{
          req.session.user=null;
          req.session.userBlockErr=true;
          res.redirect("/login")
          req.session.userBlockErr=false;
        }
      })
    }else{
     
      res.redirect("/login")
    }
  }
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:process.env.client_id,
  client_secret:process.env.client_secret
});
/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  let wishCount = null;
  foodHelpers.getAllFood().then(async (food) => {
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
      wishCount = await userHelpers.getWishCount(req.session.user._id);
      let output = await userHelpers.getWishlist(user._id);
      let filtered = await userHelpers.handleWishlist(output, food);
      food = filtered;
    }
    let today = new Date();
    addHelpers.startProductOffer(today).then(() => {
      addHelpers.startCategoryOffer(today).then(() => {
        addHelpers.startCouponOffers(today).then(() => {
          addHelpers.getBanner().then((banner) => {
            res.render("user/view-foods", {
              admin: false,
              food,
              user,
              cartCount,
              wishCount,
              banner,
            });
          });
        });
      });
    });
  });
});
router.get("/login", (req, res) => {
  if (req.session.user) {
    res.render("/");
  } else {
    res.render("user/login", {
      loginErr: req.session.userLoginErr,
      BlockErr:req.session.userBlockErr,
      userr: true,
    });
  }
  req.session.userLoginErr = false;
  req.session.userBlockErr = false;
});
router.get("/loginotp", async (req, res) => {
  if (req.session.loggedIn) {
    res.render("user/loginotp", { userr: true });
  } else {
    res.render("user/loginotp", { userr: true });
  }
});
router.post("/loginotp", (req, res) => {
  let number = req.body.Mobile;
  let no = `+91${number}`;
  userHelpers.getUserdetails(no).then((user) => {
    if (user) {
      if (user.status === "unblock") {
        client.verify
          .services(serviceSID)
          .verifications.create({
            to: `+91${req.body.Mobile}`,
            channel: "sms",
          })
          .then((resp) => {
            req.session.number = resp.to;
            res.redirect("/login/otp");
          });
        }
        else {
          req.session.userLoginErr = true;
          res.redirect("/loginotp");
        }
         }
      })
     }),
router.get("/login/otp", async (req, res) => {
  if (req.session.loggedIn) {
    res.render("/");
  } else {
    res.render("user/user-otp", {
      otp: true,
      invalidOtp: req.session.invalidOtp,
      userr: true,
    });
    req.session.invalidOtp = false;
  }
});
router.post("/login/otp", (req, res) => {
  const otp = req.body.otp;
  var number = req.session.number;
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: number,
      code: otp,
    })
    .then((response) => {
      if (response.valid) {
        userHelpers.getUserdetails(number).then((user) => {
          req.session.loggedIn = true;
          req.session.user = user;
          res.redirect("/");
        });
      } else {
        req.session.invalidOtp = true;
        res.redirect("/login/otp");
      }
    });
});
router.get("/signup", async(req, res) => {
  let refer= (req.query.refer) ? req.query.refer:null

  res.render("user/signup", { userr: true,refer});
});
router.get("/message", (req, res) => {
  res.render("user/message", { userr: true });
});
router.post("/signup", (req, res) => {
  let refer = createReferal.alphaNumeric("uppercase", 2, 3);
    req.body.refer = refer;
   
    if (req.body.referedBy != ""){
      userHelpers
        .checkReferal(req.body.referedBy)
        .then((data) => {
          req.body.referedBy = data[0]._id;
          req.body.wallet = 100;
          userHelpers.doSignup(req.body).then((response) => {
            req.session.loggedIn = true;
            userHelpers.addWallet(req.body.wallet,response)
            res.redirect("/login");
          });
        })
      }
   
  userHelpers.checkemail(req.body.Email).then((mail) => {
    if (mail) {
      let check = true;
      res.render("user/signup", { userr: true, check });
    } else {
      userHelpers.doSignup(req.body).then((response) => {
        console.log(response);
        req.session.loggedIn = true;
        req.session.user = response;
        res.redirect("/login");
      });
    }
  });
});
router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      if (response.user.status === "unblock") {
        req.session.loggedIn = true;0
        req.session.user = response.user;
        let sajna = response.user.status;
        console.log("sajna");
        res.redirect("/");
      } else {
        req.session.userBlockErr = true
        res.redirect("/login")
      

      }
    } else {
      req.session.userLoginErr = "Invalid username or Password";
      res.redirect("/login");
    }
  });
});
router.get("/user-profile", verifyLogin, async (req, res) => {
  let user = req.session.user;

  let id = user._id;
  let cartCount = null;
  let wishCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
  }
 

  userHelpers.updateProfile(req.params.id, req.body).then((userDetailss) => {
    userHelpers.getUserDetailss(req.session.user._id).then((userDetailss)=>{

    userHelpers.userAddress(id).then((address)=>{

      let refer = user.refer;
      let referLink = "http://freshfood.host/signup?refer="+refer;
      res.render("user/user-profile",{
        userDetailss,
        user,
        
        wishCount,
        cartCount,
        address,
        refer,
        referLink
    })
      })
      });
    });
  });


router.get("/edit-profile/:id", verifyLogin, (req, res) => {
  let user = req.session.user;
  id = user._id;
  let userDetails = userHelpers.getUserDetailss(id);
  userHelpers.userAddress(id).then((address) => {
    userHelpers.getUserDetailss(req.session.user._id).then((userDetailss)=>{

  res.render("user/edit-profile", { user,userDetails,address,userDetailss});
});
})
})
router.post("/edit-profile/:id", verifyLogin, (req, res) => {
  let userDetails = req.session.user._id;
  userHelpers.userAddress(id).then((address) => {
      
  userHelpers.updateProfile(req.params.id, req.body).then((userDetails) => {
    res.redirect("/user-profile");
  });
});
})
router.get("/changePassword/:id", verifyLogin, (req, res) => {

  let user = req.session.user;
  
    userHelpers.getUserDetailss(req.session.user._id).then((userDetailss)=>{
  
  res.render("user/changePassword", { user,userDetailss});
    
});
})
// req.session.currentPwdErr = false;
// req.session.pwdCompareErr = false;

router.post("/changePassword/:id", verifyLogin, (req, res) => {
  let userId = req.session.user._id;
  let pass1 = req.body.New
  let pass2 = req.body.Confirm
  if(pass1 == pass2){
    userHelpers.changePassword(userId,req.body).then((response)=>{
      if(response.status){
        req.session.destroy()
        res.redirect("/user-profile")
      }else{
        res.redirect("/changePassword")
      }
      req.session.pwdCompareErr =true;
    })
  }else{
    res.redirect("/changePassword")
  }
  req.session.currentPwdErr=true
})



router.get("/addAddress", verifyLogin, async (req, res) => {
  let user = req.session.user;

  id = user._id;
  userHelpers.userAddress(id).then(async(address) => {
  let wishCount = null;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
  }
  res.render("user/addAddress", { user, cartCount, wishCount,address });
});
})

router.post("/addAddress", verifyLogin, (req, res) => {
  let userId = req.session.user._id;
  userHelpers.addAddress(userId, req.body).then((response) => {
    res.redirect("/user-profile");
  });
});
router.get("/delete-address/:id", verifyLogin, (req, res) => {
  let userId = req.session.user._id;
  let addressId = req.params.id;
  userHelpers.deleteAddress(addressId, userId).then((response) => {
    res.redirect("/user-profile");
  });
});

router.get("/view-categoryy/:category", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let category = req.params.category;
  let wishCount = null;
  let cartCount = null;
  let today = new Date();
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
  }
 
  foodHelpers.getCatDetails(req.params.category).then((catproducts) => {
    foodHelpers.getAllCategories().then((categories) => {
      foodHelpers.getAllFood().then((food) => {
        addHelpers.startProductOffer(today).then(() => {
          addHelpers.startCategoryOffer(today).then(() => {
        foodHelpers.getCatDetails(category).then((catproduct) => {
          res.render("user/view-category", {
            categories,
            user: true,
            category,
            catproduct,
            user,
            cartCount,
            wishCount,
            food,
          })
        })
          });
        });
      });
    });
  });
});

router.get("/wishlist", verifyLogin, async (req, res) => {
  let food = await userHelpers.getWishProducts(req.session.user._id);

  userHelpers.handleWishlist();
  let cartCount = null;
  let wishCount = null;

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);

    wishCount = await userHelpers.getWishCount(req.session.user._id);
  }
  res.render("user/wishlist", {
    food,
    user: req.session.user,
    wishCount,
    cartCount,
  });
});
router.get("/delete-wish/:id", verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.deleteWish(req.params.id, user._id).then(() => {
    // userHelpers.updateWishh(req.params.id)
    res.json({ status: true });
  });
});
router.get("/add-to-wish/:id", verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.addToWish(req.params.id, req.session.user._id).then(() => {
    // userHelpers.updateWish(req.params.id)
    res.json({ status: true });
  });
});

router.get("/cartempty", verifyLogin, async (req, res) => {
  let cartCount = null;
  let wishCount = null;
  if (req.session.user) {
    wishCount = await userHelpers.getWishCount(req.session.user._id);
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  res.render("user/cartempty", {
    user: req.session.user,
    cartCount,
    wishCount,
  });
});
router.get("/cartt", verifyLogin, async (req, res) => {
  let user = req.session.user._id;
  let cartCount = null;
  if (req.session.user) {
    wishCount = await userHelpers.getWishCount(req.session.user._id);
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  if (cartCount == 0) {
    res.redirect("/cartempty");
  } else {
    if (req.session.user) {
      wishCount = await userHelpers.getWishCount(req.session.user._id);
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    let food = await userHelpers.getCartProducts(req.session.user._id);
    totalValue = await userHelpers.getCartAmount(req.session.user._id);

    res.render("user/cartt", {
      food,
      user: req.session.user._id,
      cartCount,
      totalValue,
      wishCount
    });
  }
});
router.get("/add-to-cart/:id", (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});
router.get("/delete-cart/:id", verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.deleteCart(req.params.id, user._id).then(() => {
    res.json({ status: true });
  });
});

router.post("/change-food-quantity", (req, res, next) => {
  userHelpers.changeFoodQuantity(req.body).then(async (response)=> {
    response.total = await userHelpers.getCartAmount(req.body.user);
    res.json(response);
  });
});
router.get("/placeorder", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let id = user._id;
  let cartCount = null;
  let wishCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
     }
  let total = await userHelpers.getCartAmount(req.session.user._id);
  let userDetails = await userHelpers.getUserDetailss(id);
  addHelpers.getAllCoupons().then((coupons) => {



  userHelpers.userAddress(id).then((address) => {
    res.render("user/placeorder", {
      user,
      total,
      user: req.session.user,
      wishCount,
      cartCount,
      address,
      userDetails,coupons
    })
    });
  });
});

router.post("/couponApply", verifyLogin, (req, res) => {
  let id = req.session.user._id;
  let user = id;

  addHelpers.couponValidate(req.body, id).then((response) => {
    

    if (response.success) {
      req.session.couponTotal = response.Total;
      res.json({ couponSuccess: true, total: response.total });
    } else if (response.couponUsed) {
      res.json({ couponUsed: true, total: response.total });
    } else if (response.couponExpired) {
      res.json({ couponExpired: true, total: response.total });
    } else {
      res.json({ invalidCoupon: true });
    }
   
  });
});
router.post("/applyWallet", async (req, res) => {
  let user = req.session.user._id;
  let ttl = parseInt(req.body.Total);
  let walletAmount = parseInt(req.body.wallet);
  let userDetails = await userHelpers.getUserDetailss(user);
  if (userDetails.wallet >= walletAmount) {
  var total = ttl-walletAmount;
  wallet=total
  let wallAmount = userDetails.wallet-walletAmount
        let walletTotal = userDetails.wallet
        let  walletminus = userDetails.wallet-walletAmount
  req.session.walltotal = total;
    userHelpers.applyWallet(walletAmount,user).then(() => {
      
        res.json({ walletSuccess: true,total,walletTotal,walletminus,wallAmount});
     }) 
    
  }else{
    res.json({ valnotCorrect: true });
  }
});
router.post("/locationss",async(req,res)=>{
  userHelpers.getLocation(req.body.location,req.session.orderId).then(()=>{
   
  res.json({response})

  })
  
}) 

router.post("/placeorder", async (req, res) => {
  let food = await userHelpers.getCartFoodList(req.body.userId);
  let location = await userHelpers.getLocation(req.body.location)
  if (req.session.couponTotal || req.session.walltotal) {
    if (req.session.couponTotal) {
      var total = req.session.couponTotal;
    } else if(req.session.walltotal){
      var total = req.session.walltotal;
    }

  } else {
    var total = await userHelpers.getCartAmount(req.body.userId);
  }
  userHelpers.placeOrder(req.body, food, total,location).then((orderId) => {
    req.session.orderId = orderId;
    if (req.body["payment-method"] === "COD") {
      res.json({ codSuccess: true });
    } else if (req.body["payment-method"] === "Razorpay") {
      userHelpers.generateRazorpay(orderId, total).then((response) => {
        res.json({...response,razorpay: true });
      });
    } else if (req.body["payment-method"] === "paypal"){
      let val = total / 74;
      total = val.toFixed(2);
      let totals = total.toString();
      req.session.total = totals;
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://freshfood.host/success",
          cancel_url: "http://freshfood.host/cancel",
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "Fresh Food",
                  sku: "001",
                  price: totals,
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: totals,
            },
            description: "Thankyou for visiting",
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              let url = payment.links[i].href;
              res.json({ url });
            } else {
              console.log("err");
            }
          }
        }
      });
    }
  });
});


router.get("/order-success", verifyLogin, async (req, res) => {
  res.render("user/order-success", { user: req.session.user });
});
router.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  let total = req.session.total;

  let totals = total.toString();
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: totals,
        },
      },
    ],
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        throw error;
      } else {
        console.log(JSON.stringify(payment));
        userHelpers.changePaymentStatus(req.session.orderId).then(() => {
          userHelpers.deleteCart(req.session.user._id).then(() => {
            res.redirect("/order-success");
          });
        });
      }
    }
  );
});
router.get("/cancel",verifyLogin,(req,res)=>{
  res.render("user/cancel",{ user: req.session.user })
})

router.post("/cancel-order",async (req, res) => {
  let total = req.body.total;
  let userId = req.session.user._id;
  let status = req.body.status;
  let paymentMethod=req.body.paymentMethod
  userHelpers.cancelOrder(req.body).then((response) => {

    if (paymentMethod == "paypal" || paymentMethod == "Razorpay") {
      {
      if (status == "pending") {
        res.json({ status: true });
      } else {
        userHelpers.addWallet(userId, total).then(() => {
          res.json(response);
        });
      }
    }
    } else {
      res.json(response);
    }
  });
});


router.get("/view-order", verifyLogin, async (req, res) => {
  let cartCount = null;
  let wishCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
  }
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  res.render("user/view-order", {
    user: req.session.user,
    orders,
    wishCount,
    cartCount,
  });
});
router.get("/view-order-pro/:id", verifyLogin, async (req, res) => {
  let cartCount = null;
  let wishCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
  }
  let food = await userHelpers.getOrderFoods(req.params.id);
  res.render("user/view-order-pro", {
    user: req.session.user,
    food,
    cartCount,
    wishCount,
  }); 
});

router.post("/verify-payment", (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
      userHelpers.changePaymentStatus(req.body.order.receipt).then(() => {
        res.json({ status: true });
      })
    })
     .catch((err) => {
      console.log(err);
      res.json({ status: false, errMsg: "payment failed" });
    });
});

router.get("/single/:id", verifyLogin, async function (req, res) {
  let user = req.session.user;
  let id = req.params.id;
  let cartCount = null;
  let wishCount = null;

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);

    wishCount = await userHelpers.getWishCount(req.session.user._id);
  }
  let details = await foodHelpers.getFoodDetailss(req.params.id);
  res.render("user/single", { details, user, id, cartCount, wishCount });
});

router.get("/status-change", verifyLogin, (req, res) => {
  console.log(req.query.id);
  console.log(req.query.name);
  let status = req.query.name;
  let id = req.query.id;
  if (status == "canceled") {
    userHelpers.updatestatuss(status, id).then((response) => {
      res.redirect("/view-order");
    });
  }
});




router.get("/logout", verifyLogin, (req, res) => {
  req.session.user=null
  res.redirect("/login");
});
module.exports = router;
