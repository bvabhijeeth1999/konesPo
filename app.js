//// TODO:
//and need to design a cart page to display them .
//in cart when the user clicks buy now...
//he should get redirected to his orders page.



const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://abhijeeth:test1234@cluster0-8qxkw.mongodb.net/konesi-po",{useNewUrlParser: true, useUnifiedTopology: true});

app.use(bodyParser.urlencoded({extended : true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

// users Schema .
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

//items Schema.
const itemSchema = new mongoose.Schema({
  name: String,
  url: String,
  price: Number,
  quantity: Number
});

//user with their orders and the products in cart.
//basically all the orders are stored in this cart.
const orderSchema = new mongoose.Schema({
  email: String, // user Email
  cart: [itemSchema]
});

// users model
const User = mongoose.model("User",userSchema);
//now you can create users object.

//items model
const Item = mongoose.model("Item",itemSchema);

//orders model
const Order = mongoose.model("Order",orderSchema);

const defaultUser = new User({
  email: "bvabhi@hello",
  password: "oyy"
});
//defaultUser.save();

app.get("/additem",function(req,res){
  res.render("additem");
});

app.get("/home/:email",function(req,res){
  let email = req.params.email;
  if(email === "owner@gmail.com"){
    Item.find({},function(err,results){
      if(!err){
        console.log(results);
        console.log("printing email from home " + email);
        res.render('owner',{customerEmail: email,itemArray: results});
      }
    });
  }
  else{
    Item.find({},function(err,results){
      if(!err){
        console.log(results);
        console.log("printing email from home " + email);
        res.render('home',{customerEmail: email,itemArray: results});
      }
    });
  }
});

app.get("/:email/cart",function(req,res){
  let email = req.params.email;
  Order.findOne({email: email},function(err,results){
    if(results){
      console.log(results.cart);
      console.log("printing email from cart " + email);
      let totalprice = 0;
      results.cart.forEach(function(element){
        totalprice += (Number(element.price)*Number(element.quantity));
      });
      totalprice = totalprice.toString();
      res.render('cart',{customerEmail: email,itemArray: results.cart,totalprice: totalprice});
    }
    else{
      res.render('emptycart',{customerEmail: email});
    }
  });
});

app.get("/",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/",function(req,res){
  let email = req.body.email;
  let password = req.body.password;
  User.findOne({ email: email, password: password }, function (err, result) {
    if(result){
      console.log(result);
      console.log("user is found");
      res.redirect("/home/" + email);
    }
    else{
      console.log("user not found");
      console.log(err);
      res.redirect("/");
    }
  });
});

app.post("/register",function(req,res){
  console.log("printing from register");
  console.log(req.body.email);
  console.log(req.body.password);
  const user = new User({
    email: req.body.email,
    password: req.body.password
  });
  user.save();
  console.log("user is saved");
  res.redirect("/");
});

app.post("/additem",function(req,res){
  itemName = req.body.itemName,
  itemURL = req.body.imageURL,
  itemPrice = req.body.itemPrice,
  itemNumber = req.body.itemNumber
  Item.findOne({ name: itemName }, function (err, result) {
    if(result){
      //implies that item is already there ...so just to update the URL,price and quantity.
      Item.updateOne({ name: itemName },{url: itemURL,price: itemPrice,quantity: itemNumber},function(err,result){
        if(!err){
          console.log(result);
        }
        else{
          console.log(err);
        }
      });
      console.log("Item details updated");
      res.redirect("/home/owner@gmail.com");
    }
    else{
      console.log(err);
      //not present in find one means add this item to items list.
      const item = new Item({
        name: itemName,
        url: itemURL,
        price: itemPrice,
        quantity: itemNumber
      });
      item.save();
      console.log("new item added");
      res.redirect("/home/owner@gmail.com");
    }
  });
});

app.post("/:email/cart",function(req,res){
  let quantityNeeded = req.body.quantityNeeded;
  let itemName = req.body.itemName;
  let itemPrice = req.body.itemPrice;
  let email = req.params.email;
  let itemURL = req.body.itemURL;
  console.log(quantityNeeded);
  console.log(itemName);
  console.log(itemPrice);
  console.log(email);
  //first we need to check if its a valid quantity or not.
  var hasquantity = 0;
  Item.findOne({name: itemName},function(err,result){
    if(result){
      hasquantity = result.quantity;
      console.log("printing wanted result");
      console.log(result.quantity);
      hasquantity = Number(hasquantity);
      if(hasquantity < Number(quantityNeeded) || (Number(quantityNeeded) <= 0)){
        console.log("you have enterted an invalid quantity ... please try again!!");
        res.redirect("/home/" + email);
      }
      else{
      //we need to subtract the quantityNeeded from the quantity we have.
      let quantity = hasquantity-Number(quantityNeeded);
      quantity = quantity.toString();
      Item.updateOne({name: itemName},{quantity: quantity},function(err,results){
        if(!err){
          console.log(results);
        }
        else{
          console.log(err);
        }
      });
      //now here need to add the item to the person cart.
      Order.findOne({email: email},function(err,result){
        if(result){
          console.log("printing the order item found");
          //result contains the whole found object.
          //check if the cart already contains the item.
          let founditem = 0;
          let quantity_new = 0;
          result.cart.forEach(function(element){
            if(element.name === itemName){
              founditem = 1;
              let quantity_previous = Number(element.quantity);
              quantity_new = quantity_previous + Number(quantityNeeded);
              element.quantity = quantity_new.toString();
              //need to update the quantity with quantity_new in database.
            }
          });

          if(founditem === 0){
            //implying that this is the first time that item is getting added to cart.
            console.log("Adding the item into the cart..since its not present before");
            result.cart.push(
              {
                name: itemName,
                url: itemURL,
                price: itemPrice,
                quantity: quantityNeeded
              }
            );
          }
          else{
            console.log("we are updating the quantity in the cart since the item is already present.");
          }
          Order.updateOne({email: email},{cart: result.cart},function(err,results){
              if(!err){
                console.log(results);
                res.redirect("/" + email + "/cart");
              }
              else{
                console.log(err);
              }
          });

        }
        else{
          const order = new Order({
            email: email,
            cart: [
              {
                name: itemName,
                url: itemURL,
                price: itemPrice,
                quantity: quantityNeeded
              }
            ]
          });
          order.save();
          console.log("this is the first time this user is adding into the cart.");
          res.redirect("/" + email + "/cart");
        }
      });
      }
    }
    else{
      console.log(err);
    }
  });
});

app.listen(process.env.PORT || 3000,function(){
  console.log("Server is running on port 3000");
});
