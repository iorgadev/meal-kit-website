// Full Name: Adrian Iorga
// Student #: 124180191
// Seneca Email: aiorga - at - myseneca.ca
// Class: WEB322 NAA
// Assignment - Meal Kit Website
// ********************************


const path = require("path");
const express = require("express");
const session = require('express-session');
const hbs = require('express-handlebars');
const app = express();
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config({path:"./config/keys.env"});
const port = process.env.PORT || 8080;

const bcrypt = require("bcryptjs");

//static meals data module file
const meals = require(__dirname + '/meals.js');

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

//body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//sessions - error keeping for now
app.use(session({secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true}));


//MongoDB connection
var mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_DB_CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(() => {
    console.log("MongoDB connection established.");
}).catch((err) => {
    console.log("MongoDB connection error: "+err);
});

const userModel = require("./models/user");



//Routes
let onPage = '';

let errorRedirect = (res, page) => {
//redirect to page where form was filled from
if(page == 'index')
    res.redirect("/");
else if(page == 'on-the-menu')
    res.redirect("/on-the-menu");
else
    res.redirect("/");
}

//Main Page
app.get("/", (req,res) => {
    onPage = 'index';
    let errors = req.session.errors;
    res.render('index', {
        title: 'EasyChef Meal Kits - WEB322 Assignment 2',
        meal: meals,
        onPage: 'index',
        errors
    });
    req.session.errors = null;
});

//On The Menu Page
app.get("/on-the-menu", (req,res) => {
    //lets create a grouped array for meals by category
    //to send to the on-the-menu page
    const groupBy = (data, key) => {
        return data.reduce((group, currentMeal) => {
            (group[currentMeal[key]] = group[currentMeal[key]] || []).push(currentMeal);
            return group;
        }, {});
    };
    const category = groupBy(meals, 'category');   
     
    onPage = 'on-the-menu';
    let errors = req.session.errors;
    res.render('on-the-menu', {
        title: 'On The Menu - EasyChef Meal Kit',
        category,
        onPage,
        errors
    });
    req.session.errors = null;
});

//Dashboard Page
app.get("/dashboard", (req,res) => {
    onPage = 'dashboard';

    //if not logged in
    if(req.session.user){
        res.render('dashboard', {
            title: 'Account Dashboard - EasyChef Meal Kit',
            userInfo: req.session.user,
            onPage
        });
    }
    else {
        res.send("You are not authorized to access this page.");
    }
});

//Logout / Clear Session
app.get("/logout", (req,res)=>{
    req.session.user = null;
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
                        userInfo.loggedIn = true;
                        userInfo.fName = user.firstName;
                        userInfo.lName = user.lastName;

                        req.session.user = userInfo;
                        res.redirect("/dashboard");
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
        })
    }

});


//Register form validation
app.post("/register", (req,res) =>{
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
        else {
            userModel.findOne({
                email: email
            }).then((user) => {
                //user found
                if(user != null){
                    errors.user_exists = true;
                    errors.found++;
                }
            });
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
            password: password
        });

        user.save().then(()=>{
            console.log("New user registered.");
        }).catch((err)=>{
            console.log("Error registering user: "+err);
        });


        //send email
        const sendgridMail = require("@sendgrid/mail");
        sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: email,
            from: 'aiorga@myseneca.ca',
            subject: 'Welcome to EasyChef',
            html:
                `
                You're erady to be a chef, ${firstName} ${lastName}! <br>
                Select a meal kit plan from our dashboard page and enjoy cooking like a real chef!
                `
        };

        sendgridMail.send(msg)
        .then(() => {
            res.redirect("/dashboard");
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
                res.redirect("/");
            }
        });
    }
});

//make server listen to port specified
app.listen(port, () => {
    console.log(`Express listening on port: ${port}`);
});