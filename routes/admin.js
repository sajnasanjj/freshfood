const express = require("express");
const foodHelpers = require("../helpers/food-helpers");
const userHelpers = require("../helpers/user-helpers");
const addHelpers = require("../helpers/add-helpers");
collection = require('../config/collection');
let bodyParser = require("body-parser");
const { redirect } = require("express/lib/response");
const { order } = require("paypal-rest-sdk");
const moment = require('moment');

const router = express.Router();
let Credential = {
  email: "admin@gmail.com",
  password: "12345",
};

const verifyAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect("/admin/admin-login");
  }
};

/* GET users listing. */
router.get("/", (req, res) => {
  if (req.session.adminLoggedIn) {
    res.render("admin/dashboard");
  } else {
    res.render("admin/admin-login", {
      loginErr: req.session.LoginErr,
      adminlogin: true,
    });
  }
  req.session.LoginErr = false;
});
router.get("/admin-login", (req, res) => {
  res.render("admin/admin-login", { adminlogin: true });
});
router.get("/view-foods", verifyAdmin, (req, res) => {
  if (req.session.adminLoggedIn) {
    foodHelpers.getAllFood().then((food) => {
      res.render("admin/view-foods", { admin: true, food });
    });
  } else {
    res.redirect("/admin/admin-login");
  }
});
router.post("/admin-login", function (req, res) {
  console.log(req.body);
  if (
    req.body.Email == Credential.email &&
    req.body.Password == Credential.password
  ) {
    req.session.adminLoggedIn = true;

    res.redirect("/admin/view-foods");
  } else {
    req.LoginErr = "Invalid username or Password";
    res.redirect("/admin");
  }
});
router.get("/banner", verifyAdmin, (req, res) => {
  addHelpers.getBanner().then((banner) => {
    res.render("admin/banner", { admin: true, banner });
  });
});
router.get("/addbanner", verifyAdmin, async (req, res) => {
  let banner = await addHelpers.getBanner().then();
  res.render("admin/addbanner", {admin: true, banner})
});
router.post("/addbanner", verifyAdmin, (req, res) => {
  addHelpers.addBanner(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/banner-images/" + id + ".jpg", (err, done) => {
      if (!err) res.redirect("/admin/banner");
      else console.log(err);
    }); 
  });
});

router.get("/editbanner/:id", verifyAdmin, async (req, res) => {
  let banner = await addHelpers.getBanner(req.params.id);
  let banners = await addHelpers.getBannerDetails(req.params.id);

  res.render("admin/editbanner", { admin: true, banner,banners});
});
router.post("/editbanner/:id",(req, res) => {
  let id = req.params.id;
  addHelpers.updateBanner(req.params.id,req.body).then(() => {

    res.redirect("/admin/banner")
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/banner-images/" + id + ".jpg");
    }
  });
});

router.get("/delete-banner/:id", verifyAdmin, (req, res) => {
  let BId = req.params.id;
  addHelpers.deleteBanner(BId).then((response) => {
    res.redirect("/admin/banner");
  });
});
router.get("/dashboard",verifyAdmin,async(req,res)=>{
  addHelpers.dashboard().then((data)=>{
    res.render("admin/dashboard",{admin:true,data})
})
})
router.get("/sales-report",verifyAdmin,(req,res)=>{
  addHelpers.monthlyReport().then((data)=>{
    addHelpers.getOrderDetails().then((order)=>{
      res.render("admin/sales-report",{admin:true,data,order})
})
})
})
router.post("/sales-report",verifyAdmin,(req,res)=>{
  addHelpers.salesReport(req.body).then((data)=>{
    addHelpers.getOrderDetailss(req.body).then((order)=>{
      res.render("admin/sales-report",{admin:true,data,order})
})
})
})
//product offers
router.get("/view-prooffer",verifyAdmin,(req,res)=>{
  addHelpers.getAllProductOffers().then((proOffer)=>{
    res.render("admin/view-prooffer",{admin:true,proOffer})
})
})
router.get('/productOffers',verifyAdmin,(req,res)=>{
  addHelpers.getAllProduct().then((food)=>{
    res.render('admin/productOffers',{admin:true,food})
  })
})
router.post('/productOffers',(req,res)=>{
  addHelpers.addProductOffer(req.body).then((response)=>{
    if(response.exist){
      req.session.proOfferExist=true
      res.redirect("/admin/view-prooffer") 
    }else{
    res.redirect("/admin/view-prooffer")    
    }
   })
})
router.get('/delete-productOffer',(req,res)=>{
    addHelpers.deleteProductOffer(req.query.id).then(()=>{
      res.redirect("/admin/view-prooffer")
  })
})
//category 
router.get('/offerCategory-view',(req,res)=>{
  addHelpers.getAllCategoryOffers().then((catOffers)=>{
    addHelpers.getAllCategory().then((category)=>{
      res.render("admin/offerCategory-view",{admin:true,catOffers})
    })
  })
})
router.get("/offerCategory",(req,res)=>{
  addHelpers.getAllCategory().then((category)=>{
  res.render("admin/offerCategory",{admin:true,category})
})
})
router.post("/offerCategory",(req,res)=>{
  addHelpers.addCategoryOffer(req.body).then((response)=>{
    res.redirect("/admin/offerCategory-view")
})
})
router.get("/deleteCategoryOffer",(req,res)=>{
  let Id=req.query.id
  addHelpers.deleteCategoryOffer(Id).then((response)=>{
    res.redirect("/admin/offerCategory-view")
  })
})
//offer
router.get("/addFoods", verifyAdmin, async (req, res) => {
  let category = await foodHelpers.getAllCategories().then();
  res.render("admin/add-foods", {admin: true,category})
});
router.get("/edit-foods/:id", verifyAdmin, async (req, res) => {
  let food = await foodHelpers.getFoodDetails(req.params.id);
  let category = await foodHelpers.getAllCategories().then();
  res.render("admin/edit-foods", { admin: true, food, category });
});
//category
router.get("/add-category", verifyAdmin, (req, res) => {
  res.render("admin/add-category", { admin: true });
});
router.get("/view-category", verifyAdmin, (req, res) => {
  foodHelpers.getAllCategories().then((category) => {
    res.render("admin/view-category", { admin: true, category });
  });
});
router.get("/view-users", verifyAdmin, (req, res) => {
  addHelpers.getAllUsers().then((user) => {
    user.map((user) => {
      user.isUnblocked = user.status === "unblock" ? true : false;
    });
    res.render("admin/view-users", { admin: true, user });
  });
});
router.post("/addFoods", verifyAdmin, (req, res) => {
  console.log(req.body);
  console.log(req.files.Image);
  foodHelpers.addFood(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/food-images/" + id + ".jpg", (err, done) => {
      if (!err) res.redirect("/admin/view-foods");
      else console.log(err);
    });
  });
});
router.post("/add-category", verifyAdmin, (req, res) => {
  foodHelpers.addCategory(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/category-images/" + id + ".jpg", (err) => {
      if (!err) res.redirect("/admin/view-category");
      else console.log(err);
    });
  });
});
router.get("/edit-user/:id", verifyAdmin, (req, res) => {
  let id = req.params.id;
  addHelpers.updateUser(req.params.id).then(() => {
    res.redirect("/admin/view-users");
  });
});
router.get("/editt-user/:id", verifyAdmin, (req, res) => {
  let id = req.params.id;
  addHelpers.updateUserr(req.params.id).then(() => {
    res.redirect("/admin/view-users");
  });
});
router.get("/delete-foods/:id", verifyAdmin, (req, res) => {
  let fudId = req.params.id;
  foodHelpers.deleteFood(fudId).then((response) => {
    res.redirect("/admin/foodDetails");
  });
});
router.get("/delete-category/:id", verifyAdmin, (req, res) => {
  let catId = req.params.id;
  foodHelpers.deleteCategory(catId).then((response) => {
    res.redirect("/admin/view-category");
  });
});
//coupons


router.get('/delete-productOffer',(req,res)=>{
    addHelpers.deleteProductOffer(req.query.id).then(()=>{
      res.redirect("/admin/view-prooffer")
  })
})
  router.get("/coupon",verifyAdmin,(req,res)=>{
      addHelpers.getAllCoupons().then((coupons) => {
      res.render('admin/coupon',{admin:true,coupons})
  })
})
  router.get("/addCoupon",verifyAdmin,(req,res)=>{
    addHelpers.getAllCoupons().then((coupons)=>{
      res.render("admin/addCoupon",{admin:true,coupons})
    })
  })

  router.post("/addCoupon",(req,res)=>{
    addHelpers.addCoupon(req.body).then((response)=>{
      res.redirect("/admin/coupon")
    })
  })
  router.get("/delete-coupon",verifyAdmin, (req, res) => {
    addHelpers.deleteCoupons(req.query.id).then(() => {
      res.redirect("/admin/coupon");
    });
  });

router.get("/edit-category/:id", verifyAdmin, async (req, res) => {
  let category = await foodHelpers.getCatDetails(req.params.id);
  res.render("admin/edit-category", { admin: true, category });
});
router.post("/edit-foods/:id", (req, res) => {
  let id = req.params.id;
  foodHelpers.updateFood(req.params.id, req.body).then(() => {
    res.redirect("/admin/view-foods");
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/food-images/" + id + ".jpg");
    }
  });
});
router.post("/edit-category/:id", (req, res) => {
  let id = req.params.id;
  foodHelpers.updateCategory(req.params.id, req.body).then(() => {
    res.redirect("/admin/view-category");
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/category-images/" + id + ".jpg");
    }
  });
});
router.get("/view-orders",verifyAdmin,async(req,res)=>{
  addHelpers.getOrderDetails().then((order)=>{;
res.render("admin/view-orders",{admin:true,order})
})
})


    
router.get('/status-change',verifyAdmin,(req,res)=>{
  console.log(req.query.id);
  console.log(req.query.name);
  let status=req.query.name;
  let id = req.query.id
  // if(status=="placed"){
  //   addHelpers.updatestatus(status,id).then((response)=>{
  //     res.redirect('/admin/view-orders')
  //   })
   if(status=="canceled"){
    addHelpers.updatecancel(status,id).then((response)=>{
      res.redirect('/admin/view-orders')
    })
  }else if(status=="placed"){
    addHelpers.updatestatus(status,id).then((response)=>{
      res.redirect('/admin/view-orders')
    })
  }else if(status=="delivered"){
    addHelpers.updatedeliver(status,id).then((response)=>{
      res.redirect('/admin/view-orders')
    })
  }
})



router.get("/admin-logout",verifyAdmin,(req, res) => {
  req.session.admin=null;
  res.redirect("/admin/admin-login");
});

module.exports = router;
