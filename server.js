// Full Name: Adrian Iorga
// Student #: 124180191
// Seneca Email: aiorga - at - myseneca.ca
// Class: WEB322 NAA
// Assignment - Meal Kit Website
// ********************************


const path = require("path");
const fs = require('fs');
const express = require("express");
const session = require('express-session');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
dotenv.config({path:"./config/keys.env"});
const port = process.env.PORT || 8080;

const bcrypt = require("bcryptjs");

const app = express();

//serve static files
app.use(express.static(path.join(__dirname, 'public')));

//express handlebars settings
app.engine('hbs', hbs({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: "views/layouts",
    partialsDir: "views/partials"
}));
app.set('view engine', 'hbs');

//body-parser + fileupload
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());

//sessions - error keeping for now
app.use(session({secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true}));


//MongoDB connection
var mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_DB_CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log("MongoDB connection established.");
}).catch((err) => {
    console.log("MongoDB connection error: "+err);
});

const userModel = require("./models/user");
//create intial clerk account
const clerkModel = require("./models/clerk");
const mealModel = require("./models/meal");
const e = require("express");




//Routes
let onPage = '';

//redirect to page where form was filled from
let errorRedirect = (res, page) => {
    if(page == 'index')
        res.redirect("/");
    else if(page == 'on-the-menu')
        res.redirect("/on-the-menu");
    else
        res.redirect("/");
    return;
}

// authenticate user
function isLoggedIn(req, res, next) {
    if (req.session.user){
        if(req.session.user.loggedIn == true)
            return next();
    }

    let errors = {};
    errors.login = true;
    errors.no_permission = true;
    req.session.errors = errors;
    errorRedirect(res, 'index');
}

//Main Page
app.get("/", (req,res) => {
    onPage = 'index';

    mealModel.find({top: true}).sort({dateAdded:-1}).lean().then(allMeals => {

            allMeals.forEach(m => {
                m.included = m.included.split(",").map(function(item) {
                    return item.trim();
                });
            })

            let errors = req.session.errors;
            res.render('index', {
                title: 'EasyChef Meal Kits - WEB322 Assignment 3',
                meal: allMeals,
                user: req.session.user,
                onPage: 'index',
                errors
            });
            req.session.errors = null;
    }).catch(err=>{console.log('error loading main page');})
}); 

//On The Menu Page
app.get("/on-the-menu", (req,res) => {
    //lets create a grouped array for meals by category
    const groupBy = (data, key) => {
        return data.reduce((group, currentMeal) => {
            (group[currentMeal[key]] = group[currentMeal[key]] || []).push(currentMeal);
            return group;
        }, {});
    };

    mealModel.find().lean().then(allMeals => {
        allMeals.forEach(m => {
            m.included = m.included.split(",").map(function(item) {
                return item.trim();
            });
        });
        const category = groupBy(allMeals, 'category');

        onPage = 'on-the-menu';
        let errors = req.session.errors;
        res.render('on-the-menu', {
            title: 'On The Menu - EasyChef Meal Kit',
            category,
            user: req.session.user,
            onPage,
            errors
        });
        req.session.errors = null;
    })
});

//Dashboard Page
app.get("/dashboard", (req,res) => {
    onPage = 'dashboard';
    dashboardPage = "dashboard";
    let mealKits = {};

    //if not logged in
    if(req.session.user){
        //check if user is a clerk
        if(req.session.user.clerk){
            mealModel.find({}).sort({dateAdded:-1}).lean().exec({}, (err, allMeals) => {

                //capitalize meal type
                allMeals.forEach(e => {
                    e.type = e.type.charAt(0).toUpperCase() + e.type.slice(1);
                });

                //capitalize meal category
                allMeals.forEach(e => {
                    e.category = e.category.charAt(0).toUpperCase() + e.category.slice(1);
                });

                res.render('clerk-dashboard', {
                    title: 'Clerk Dashboard - EasyChef Meal Kit',
                    user: req.session.user,
                    meals: allMeals,
                    onPage
                });
            });
        }
        else {

            let checkoutMsg = false;
            if(req.session.userCheckout == true){
                checkoutMsg = true;
                req.session.userCheckout = false;
            }

            res.render('dashboard', {
                title: 'Account Dashboard - EasyChef Meal Kit',
                user: req.session.user,
                checkout: checkoutMsg,
                onPage
            });
        }
    }
    else {
        let errors = {};
        errors.login = true;
        errors.unauthorized = true;
        req.session.errors = errors;
        errorRedirect(res, 'index');
    }
});


//meal page
app.get("/meal/:slug", (req,res) =>{

    let slug = req.params.slug;

    mealModel.findById({_id: slug}).lean().then(meal => {

        meal.included = meal.included.split(",").map(function(item) {
            return item.trim();
        });

        mealModel.find({
            category: meal.category,
            _id: {$ne: slug}
        }).lean().then(extraMeals => {
            extraMeals.forEach(m => {
                m.included = m.included.split(",").map(function(item) {
                    return item.trim();
                });
            })
            res.render('meal-page', {
                title: 'Buy ' +meal.title + ' Meal Kit - EasyChef',
                user: req.session.user,
                meal,
                extraMeals
            });
        }).catch(err=>{console.log("Error getting extra meals");})
    }).catch(err => {
        res.send("Error, 404!");
    });
});



//shoppingCart
app.get("/cart", (req,res) => {

    mealModel.find({top: true}).sort({dateAdded:1}).lean().then(allMeals => {

        allMeals.forEach(m => {
            m.included = m.included.split(",").map(function(item) {
                return item.trim();
            });
        })

        if(req.session.cartAmount){
            // console.log(req.session.cartAmount);
            let userCart = req.session.cartAmount;
            let meals_list = Object.keys(req.session.cartAmount);
            
            mealModel.find({_id: {$in: meals_list}}).lean().then(meals => {
                var cart_total = parseFloat(0);
                meals.forEach(e => {
                    e.cart_qty = parseInt(userCart[e._id]);
                    e.cart_sub_total = parseFloat(e.cart_qty * e.price).toFixed(2);
                    cart_total += parseFloat(e.cart_sub_total);
                });
                meals.total = parseFloat(cart_total).toFixed(2);
    
                req.session.cartTotal = meals.total;
    
                res.render('shopping-cart', {
                    title: 'Meal Kit Shopping Cart - EasyChef',
                    meal: allMeals,
                    user: req.session.user,
                    cart: req.session.cart,
                    cartMeals: meals
                });
            });
        }
        else{
            res.render('shopping-cart', {
                title: 'Meal Kit Shopping Cart - EasyChef',
                meal: allMeals,
                user: req.session.user,
                cart: req.session.cart,
                cartMeals: {}
            });
        }

    }).catch(err=>{console.log('error loading cart');})
});

//add-to-cart
app.post("/add-to-cart/:mealid", isLoggedIn, (req,res)=>{
    let meal_id = req.params.mealid;
    let cart = [];

    //if cart exists, load the array
    if(req.session.cart !== undefined && req.session.cart !== null){
        cart = req.session.cart;
    }

    //NEED TO FIX THIS -> check if valid meal_id
    if(meal_id){
        cart.push(meal_id);
    }

    //cart.reverse();
    var cartAmount = cart.reduce((map, val) => {map[val] = (map[val] || 0)+1; return map}, {} );
    
    req.session.cartAmount = cartAmount;
    req.session.cart = cart;    

    res.json({ success: cartAmount[meal_id] });
});

//remove-from-cart
app.post("/remove-from-cart/:mealid", isLoggedIn, (req,res)=>{
    let meal_id = req.params.mealid;
    let cart = [];

    //if cart exists, load the array
    if(req.session.cart !== undefined && req.session.cart !== null){
        cart = req.session.cart;
    }

    cart = cart.filter(meal => meal !== meal_id);

    var cartAmount = cart.reduce((map, val) => {map[val] = (map[val] || 0)+1; return map}, {} );
    req.session.cartAmount = cartAmount;
    req.session.cart = cart;

    res.json({
        success: '1'
    });
});

//checkout
app.get("/checkout-cart", isLoggedIn, (req,res)=>{

    if(req.session.cartAmount){
        let email_msg = "";
        let userCart = req.session.cartAmount;
        let meals_list = Object.keys(req.session.cartAmount);
        
        mealModel.find({_id: {$in: meals_list}}).lean().then(meals => {
            email_msg += "Thanks for placing your <b>EasyChef</b> order! <br><br>";
            email_msg += "<b><u>Order Details:</u></b> <br>";

            var cart_total = parseFloat(0);
            meals.forEach(e => {
                e.cart_qty = parseInt(userCart[e._id]);
                e.cart_sub_total = parseFloat(e.cart_qty * e.price).toFixed(2);
                cart_total += parseFloat(e.cart_sub_total);
                email_msg += " - " + e.title + " x " + e.cart_qty + " - $"+e.price+"/Meal<br>";
            });
            meals.total = parseFloat(cart_total).toFixed(2);

            email_msg += "<br><b>Order Total: $" + meals.total + "</b><br>";

            userModel.findOne({
                _id: req.session.user.id
            }).then((user) => {
                //send email
                const sendgridMail = require("@sendgrid/mail");
                sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

                const msg = {
                    to: user.email,
                    from: 'aiorga@myseneca.ca',
                    subject: 'Your EasyChef Order Has Been Placed!',
                    html: email_msg
                };

                sendgridMail.send(msg)
                .then(() => {
                    req.session.cart = null;
                    req.session.cartAmount = null;
                    req.session.userCheckout = true;
                    res.redirect("/dashboard");
                }).catch(err=>{console.log('error sending checkout-email');});
            }).catch(err=>{console.log("could not find user("+req.session.user.id+") to email");});
        });
    }
});



// authenticate clerk for meal adding, editing, etc
function isClerk(req, res, next) {
    if (req.session.user){
        if(req.session.user.clerk == true)
            return next();
    }

    let errors = {};
    errors.login = true;
    errors.no_permission = true;
    req.session.errors = errors;
    errorRedirect(res, 'index');
}

//editMeal
app.post("/dashboard/editMeal/", isClerk, (req,res)=>{
    let {meal_id, title, description, included, cookingTime, servings, price, calories, category, type, top} = req.body;
    
    cookingTime = (cookingTime > 0) ? cookingTime : 0;
    servings = (servings > 0) ? servings : 0;
    price = (price > 0) ? price : 0;
    calories = (calories > 0) ? calories : 0;

    var newImage = null;

    //is the image being changed?
    if(req.files){
        let extension = path.extname(req.files.image.name);
        if(extension == '.jpg' || extension == '.jpeg' || extension == '.png' || extension == '.gif'){
            newImage = req.files.image.name;
        }
        else{
            res.send('error, invalid image type');
        }
    }

    mealModel.findById(meal_id).then(result => {
        if(result != null){

            top = (top == 1) ? true:false;
            let image = null;
            if(newImage != null){
                //delete old image
                fs.unlinkSync(`public/images/meals/${result.image}`);
                //copy new image
                req.files.image.mv(`public/images/meals/${req.files.image.name}`);

                image = newImage;
            }
            else {
                image = result.image;
            }

            mealModel.findByIdAndUpdate({_id: meal_id}, {
                title: title,
                description: description,
                included: included,
                cookingTime: cookingTime,
                servings: servings,
                price: price,
                calories: calories,
                category: category,
                type: type,
                top: top,
                image: image
            }, (err, result) => {
                if(err) {
                    res.send(err);
                }
                else {
                    res.redirect('/dashboard');
                }
            });

        }
        else {
            res.redirect('/dashboard');
        }
    }).catch(err=> {
        console.log("Error fetching meal kit into: "+err);
    })
});

//addMeal
app.post("/dashboard/addMeal", isClerk, (req,res)=>{
    let {title, description, included, cookingTime, servings, price, calories, category, type, top} = req.body;
    
    cookingTime = (cookingTime > 0) ? cookingTime : 0;
    servings = (servings > 0) ? servings : 0;
    price = (price > 0) ? price : 0;
    calories = (calories > 0) ? calories : 0;

    //is the image being changed?
    if(req.files){
        let extension = path.extname(req.files.image.name);
        if(extension == '.jpg' || extension == '.jpeg' || extension == '.png' || extension == '.gif'){
            
            req.files.image.mv(`public/images/meals/${req.files.image.name}`);
            let image = req.files.image.name;

            var newMeal = new mealModel({
                title: title,
                description: description,
                included: included,
                cookingTime: cookingTime,
                servings: servings,
                price: price,
                calories: calories,
                category: category,
                type: type,
                top: top,
                image: image
            });

            newMeal.save().then(meal => {
                res.redirect('/dashboard');
            }).catch(err=>{res.send('ERROR: Could not save new meal: '+err)})

        }
        else{
            res.send('ERROR: Invalid Image Type ['+extension+']');
        }
    }
    else {
        res.send('ERROR: No Image Provided');
    }
});

//deleteMeal
app.post("/dashboard/deleteMeal", isClerk, (req, res) => {
    let { meal_id } = req.body;
    mealModel.findById(meal_id).then(result => {
        if(result != null){
            //delete meal image
            fs.unlinkSync(`public/images/meals/${result.image}`);

            //attempting to use async function.. it works!
            async function deleteMeal(){
                try{
                    const result = await mealModel.deleteOne({_id: meal_id});

                    if(result.deletedCount === 1){
                        res.json({success: 'deleted'});
                    }
                    else {
                        res.json({error: '0'});
                    }
                }catch {
                    res.json({error: '0'});
                }
            }
            deleteMeal().catch(err=>{res.json({error: 'error deleting meal'})});
        }
        else {
            res.json({error: 'unable to delete'});
        }
    }).catch(err=>{res.send("ERROR: Could not delete meal.")});
});






/*************************
 * 
 * LOGIN + REGISTRATION
 * 
*************************/


//Logout / Clear Session
app.get("/logout", (req,res)=>{
    req.session.destroy();
    res.redirect("/");
});

//Login form validation
app.post("/login", (req,res) =>{
    let { email, password, on_page: onPage } = req.body;
    let errors = {};
    errors.found = 0;

    //email null check
    if(!email){
        errors.email = true;
        errors.found++;
    }
    //password null check
    if(!password){
        errors.password = true;
        errors.found++;
    }

    //errors found
    if(errors.found > 0){
        errors.login = true;
        errors.data = req.body;

        //save error sesssion to display on next page
        req.session.errors = errors;
        
        //redirect to page where form was filled from
        errorRedirect(res, onPage);
    }
    else {
        //no errors found
        //lets check collection for user login info
        let userInfo = {};

        userModel.findOne({
            email: email
        }).then((user) => {
            //user found
            if(user == null){
                errors.login = true;
                errors.user_not_found = true;
                errors.data = req.body;
                req.session.errors = errors;
                errorRedirect(res, onPage);
            }
            else{
                bcrypt.compare(password, user.password).then((matched) => {
                    if(matched){
                        clerkModel.findOne({userId: user._id}).then(e => {
                            userInfo.loggedIn = true;
                            userInfo.fName = user.firstName;
                            userInfo.lName = user.lastName;
                            userInfo.id = user._id;

                            //check if user is clerk
                            userInfo.clerk = (e!=null);

                            req.session.user = userInfo;
                            res.redirect("/dashboard");
                        });
                    }
                    else {
                        errors.login = true;
                        errors.pw_no_match = true;
                        errors.data = req.body;
                        req.session.errors = errors;
                        errorRedirect(res, onPage);
                    }
                });
            }
        }).catch((err) => {
            console.log("Error logging in.");
        });
    }

});


//Register form validation
app.post("/register", (req,res) =>{
    //req.session.destroy();
    let { firstName, lastName, email, password, on_page: onPage } = req.body;
    let errors = {};
    errors.found = 0;

    //firstName null check
    if(!firstName){
        errors.firstName = true;
        errors.found++;
    }

    //lastName null check
    if(!lastName){
        errors.lastName = true;
        errors.found++;
    }   

    //email null check
    if(!email){
        errors.email = true;
        errors.found++;
    }
    else {
        //minimum email length a@b.cd
        if(email.length < 6){
            errors.email_length = true;
            errors.found++;
        }
    }

    //password null check
    if(!password){
        errors.password = true;
        errors.found++;
    }
    else{
        //advanced checks
        //1. validate password length
        if(password.length < 6 || password.length > 12){
            errors.password_length = true;
            errors.found++;
        }
        //2. if length okay, validate contents of password
        else{
            if(!/^[A-Za-z0-9]+$/.test(password)) {
                errors.password_contains = true;
                errors.found++;
            }
        }
    }


    //errors found
    if(errors.found > 0){
        errors.register = true;
        errors.data = req.body;

        //save error sesssion to display on next page
        req.session.errors = errors;
        
        //redirect to page where form was filled from
        errorRedirect(res, onPage);
    }
    else {
        //no errors, register valid!

        //lets register user in our database
        const user = new userModel({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            dateRegistered: Date.now()
        });

        let userInfo = {};

        let errors = {};
        userModel.findOne({
            email: req.body.email
        }).exec().then((userFound) => {
            //user found
            if(userFound != null){
                errors.found++;
                errors.register = true;
                errors.user_exists = true;
                errors.data = req.body;
                req.session.errors = errors;
                errorRedirect(res, onPage);
                return;
            }
            else{
                user.save().then(()=>{
                    console.log("New user registered.");
                    let userInfo = {};
                    userInfo.loggedIn = true;
                    userInfo.fName = user.firstName;
                    userInfo.lName = user.lastName;
                    userInfo.id = user._id;
                    req.session.user = userInfo;

                    //send email
                    const sendgridMail = require("@sendgrid/mail");
                    sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

                    const msg = {
                        to: email,
                        from: 'aiorga@myseneca.ca',
                        subject: 'Welcome to EasyChef',
                        html:
                            `
                            You're ready to be a chef, ${firstName} ${lastName}! <br>
                            Select a meal kit plan from our dashboard page and enjoy cooking like a real chef!
                            `
                    };

                    sendgridMail.send(msg)
                    .then(() => {
                        res.redirect("/dashboard");
                        console.log("New user emailed.");
                    })
                    .catch(err => {
                        console.error(`Error sending email: ${err}`);
                        //IF the above email validation passes, but the email is truly NOT valid
                        //the site will hang and throw an error in the background
                        //this is to deal with that error
                        if(err.code == 400){
                            errors.register = true;
                            errors.data = req.body;
                            errors.email_invalid = true;
                            req.session.errors = errors;
                            errorRedirect(res, onPage);
                        }
                    });


                }).catch((err)=>{
                    console.log("Error registering user: "+err);
                });
            }
        }).catch((err) => {
            console.log("ERROR: registering - " + err);
        });    
    }
});

//make server listen to port specified
app.listen(port, () => {
    console.log(`Express listening on port: ${port}`);
});