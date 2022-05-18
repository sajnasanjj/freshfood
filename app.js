let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let hbs= require('express-handlebars')
let fileUpload = require('express-fileupload')
let db = require('./config/connection');
let session= require('express-session');
let bodyParser = require('body-parser')
const otpAuth=require('./config/otp_auth')
const moment = require('moment');
require('dotenv').config();


let Swal = require('sweetalert2')


let userRouter = require('./routes/user');
let adminRouter = require('./routes/admin');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/',helpers:{
  inc: function(value,opt){
    return parseInt(value)+1;
  }
}}))
  
app.use(fileUpload());
app.use(session({secret:"Key",cookie:{maxAge:600000},resave:false,saveUninitialized:true}))

app.use(logger('dev'));
app.use(express.urlencoded({ extended : true }));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '')));
app.use(express.static('public')); 
   
db.connect((err)=>{
  if (err) console.log('Error'+err);
  else console.log('Database is connected');

})
app.use('/', userRouter);
app.use('/admin', adminRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('404');
});

module.exports = app;



// else if (req.body['Payment'] == 'Paypal'){
//   console.log("this is the paypal felad",req.body);
//   val = total / 74
//   total = val.toFixed(2)
//   let totals = total.toString()
//   console.log(totals);
//   req.session.total = totals

 
//   const create_payment_json = {
//     "intent": "sale",
//     "payer": {
//         "payment_method": "paypal"
//     },
//     "redirect_urls": {
//         "return_url": "http://localhost:3000/success",
//         "cancel_url": "http://localhost:3000/cancel"
//     },
//     "transactions": [{
//         "item_list": {
//             "items": [{
//                 "name": "Cart items",
//                 "sku": "001",
//                 "price": totals,
//                 "currency": "U…
// [0:17 pm, 20/04/2022] +91 95399 20559: $.ajax({
//             url:'/place-order',
//             method:'post',
//             data:$('#checkout-form').serialize(),
//             success:(response)=>{
//                 if(response.codSuccess){
//                     location.href='/order-success'

                    
//                 }else if(response.razorpay){

//                     razorpayPayment(response.resp)
                    
//                 }else if(response) {
//                     location.href = response.url
//                 }
//             }
//         })
//     }
// })
