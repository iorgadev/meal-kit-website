// Full Name: Adrian Iorga
// Student #: 124180191
// Seneca Email: aiorga - at - myseneca.ca
// Class: WEB322 NAA
// Assignment - Meal Kit Website
// ********************************


const path = require("path");
const express = require("express");
const app = express();
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');
dotenv.config({path:"./config/keys.env"});
const port = process.env.PORT || 8080;

//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

//static meals data module file
const meals = require(__dirname + '/meals.js');
//lets create a grouped array for meals by category
//to send to the on-the-menu page
const groupBy = (data, key) => {
    return data.reduce((group, currentMeal) => {
        (group[currentMeal[key]] = group[currentMeal[key]] || []).push(currentMeal);
        return group;
    }, {});
};
const category = groupBy(meals, 'category');

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
app.use(session({secret: 'secret-meal-kits', resave: false, saveUninitialized: true}));

//Routes
let onPage = '';

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
    req.session.errors = null;//clear errors
});

//On The Menu page
app.get("/on-the-menu", (req,res) => {
    onPage = 'on-the-menu';
    let errors = req.session.errors;
    res.render('on-the-menu', {
        title: 'On The Menu - EasyChef Meal Kit',
        category,
        onPage,
        errors
    });
    req.session.errors = null;//clear errors
});

//Dashboard
app.get("/dashboard", (req,res) => {
    res.render('dashboard', {
        title: 'Dashboard - EasyChef Meal Kit'
    });
});

//Login form validation
app.post("/login", (req,res) =>{
    let { email, password, on_page: onPage } = req.body;
    let errors = {};
    errors.found = 0;

    if(!email){
        errors.email = true;
        errors.found++;
    }
    
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
        
        //redirect to index page
        if(onPage == 'index'){
            res.redirect("/");
        }
        //redirect to on the menu page
        else if(onPage == 'on-the-menu'){
            res.redirect("/on-the-menu")
        }
    }
    //no errors found
    else {
        //redirect to dashboard!
        res.redirect("/dashboard");
    }

});


//Register form validation
app.post("/register", (req,res) =>{
    let { firstName, lastName, email, password, on_page: onPage } = req.body;
    let errors = {};
    errors.found = 0;

    //firstName
    if(!firstName){
        errors.firstName = true;
        errors.found++;
    }

    //lastName
    if(!lastName){
        errors.lastName = true;
        errors.found++;
    }   

    //email
    if(!email){
        errors.email = true;
        errors.found++;
    }
    else {
        if(email.length < 6){
            errors.email_length = true;
            errors.found++;
        }
    }

    //password
    if(!password){
        errors.password = true;
        errors.found++;
    }
    else{
        //validate password length
        if(password.length < 6 || password.length > 12){
            errors.password_length = true;
            errors.found++;
        }
        //if length okay, validate contents of password
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
        
        //redirect to index page
        if(onPage == 'index'){
            res.redirect("/");
        }
        //redirect to on the menu page
        else if(onPage == 'on-the-menu'){
            res.redirect("/on-the-menu")
        }
    }
    else {
        //no errors, register valid!

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
            });
    }

});

//make server listen to port specified
app.listen(port, () => {
    console.log(`Express listening on port: ${port}`);
});