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
const port = process.env.PORT || 8080;

//static meals data module file
const meals = require(__dirname + '/meals.js');

app.use(express.static(path.join(__dirname, 'public')));
app.engine('hbs', hbs({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: "views/layouts",
    partialsDir: "views/partials"
}));
app.set('view engine', 'hbs');

//Routes
app.get("/", (req,res) => {
    res.render('index', {
        title: 'EasyChef Meal Kits - WEB322 Assignment 1',
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

//make server listen to port specified
app.listen(port, () => {
    console.log(`Express listening on port: ${port}`);
});