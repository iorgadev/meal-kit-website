//User Schema
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mealSchema = new Schema({
    image:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    included:{
        type:String,
        required:true
    },
    description:{
        type:String,
        default: ''
    },
    category:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        default:0
    },
    cookingTime:{
        type:Number,
        default:0
    },
    servings:{
        type:Number,
        default:0
    },
    calories:{
        type:Number,
        default:0
    },
    type:{
        type:String,
        required:true
    },
    top:{
        type:Boolean,
        default:false
    },
    dateAdded:{
        type:Date,
        default:Date.now()
    }
});

const mealModel = mongoose.model("meals", mealSchema);

//Add Default Meals to our MEALS collection
//Using the meals.js we used in previous assignments
mealModel.find({}).countDocuments({}, (err, count) => {
    if(count === 0){
        mealModel.insertMany(meals).then(()=>{
            console.log('Default Meal Kits inserted into meals collection.');
        }).catch(err=>{ console.log('Error adding meals to collection: '+err)});
    }
    else {
        console.log('Meals already loaded.');
    }
}).catch(err=>{console.log("Unable to query meals collection: "+err)});

module.exports = mealModel;