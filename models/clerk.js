//User Schema
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clerkSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true
    }
});

//add clerk account


const clerkModel = mongoose.model("clerks", clerkSchema);

var aiorga = new clerkModel({
    email: "aiorga@myseneca.ca"
});

clerkModel.findOne({email: 'aiorga@myseneca.ca'}).then(e => {
    if(e == null){
        aiorga.save((err) => {
            if(err)
            console.log("Error creating clerk account: "+err);
            else
            console.log("Clerk account created.");
        });
    }
});

module.exports = clerkModel;