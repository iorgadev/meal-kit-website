//User Schema
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    dateRegistered:{
        type:Date,
        default:Date.now()
    }
});

userSchema.methods.exists = function(_email) {
    return this.findOne({email : {$eq : _email}});
}

userSchema.pre("save", function(next){
    bcrypt.genSalt().then((salt) => {
        bcrypt.hash(this.password, salt).then((encryptPW) => {
            this.password = encryptPW;
            next();
        }).catch((err)=>{
            console.log("Error hasing password.");
        })
    }).catch((err) => {
        console.log("Error generating salt: "+err);
    })
});

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;