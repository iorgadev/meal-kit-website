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
const port = process.env.PORT || 8080;

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

//process login form
app.post("/login", (req,res) =>{
    let { email, password, on_page: onPage } = req.body;
    let errors = {};
    let formData = {};
    errors.found = 0;

    if(!email){
        errors.email = true;
        formData.email = email;
        errors.found++;
        errors.login = true;
    }
    
    if(!password){
        errors.password = true;
        formData.password = password;
        errors.found++;
        errors.login = true;
    }

    //errors found
    if(errors.found > 0){

        //save error sesssion to display on next page
        req.session.errors = errors;
        req.session.formData = formData;
        
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
        //no errors, login valid!
        res.json({from: onPage});
    }

})

//make server listen to port specified
app.listen(port, () => {
    console.log(`Express listening on port: ${port}`);
});