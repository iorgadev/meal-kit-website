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
const port = process.env.PORT || 8080;

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

//Routes
let onPage = '';

app.get("/", (req,res) => {
    onPage = 'index';
    res.render(onPage, {
        title: 'EasyChef Meal Kits - WEB322 Assignment 1',
        onPage,
        meal: meals
    });
});

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

    res.render('on-the-menu', {
        title: 'On The Menu - EasyChef Meal Kit',
        category
    });
});

//process login form
app.post("/login", (req,res) =>{
    let { email, password, on_page: onPage } = req.body;
    let errors = {};
    errors.found = 0;

    if(!email){
        errors.email = "Please enter a valid email address.";
        errors.found++;
    }
    
    if(!password){
        errors.password = "Please enter a password.";
        errors.found++;
    }

    if(errors.found > 0){
        res.render(onPage, {
            title: 'EasyChef Meal Kits - WEB322 Assignment 1',
            meal: meals,
            errors
        });
    }
    else {
        res.json({from: onPage});
    }

})

//make server listen to port specified
app.listen(port, () => {
    console.log(`Express listening on port: ${port}`);
});