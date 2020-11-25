const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const userModel = require("../models/user");

router.post("/login", (req,res) =>{
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
            console.log("Error logging in: "+err);
        });
    }

});

module.exports = router;