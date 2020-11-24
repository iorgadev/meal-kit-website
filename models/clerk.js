//Clerk Schema
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

const clerkSchema = new Schema({
    userId:{
        type:ObjectId,
        required:true,
        unique:true
    }
});

//add clerk account
const clerkModel = mongoose.model("clerks", clerkSchema);

//userId from our users collection
aiId = "5fb8052261192517d0140828";

var aiClerk = new clerkModel({
    // email: "aiorga@myseneca.ca"
    userId: aiId
});

clerkModel.findOne({userId: aiId}).then(e => {
    if(e == null){
        aiClerk.save((err) => {
            if(err)
            console.log("Error creating clerk account: "+err);
            else
            console.log("Clerk account created.");
        });
    }
});

module.exports = clerkModel;