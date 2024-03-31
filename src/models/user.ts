import mongoose from "mongoose";
//validator ki help se hum email check kr skte h ki shi h ya nhi
import validator from "validator";

interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
    photo: string;
    role: "admin" | "user";
    gender:"male" | "female";
    dob: Date;
    //ye dono timestamps se aaye h
    createdAt: Date;
    updatedAt: Date;
    //virtual attribute
    age: number;
}

const Schema = new mongoose.Schema({
    _id: {
        type: String,
        required: [true,"Please enter ID"],
    },
    name:{
        type:String,
        required:[true,"Please enter your name"],
    },
    email:{
        type:String,
        unique:[true,"Email already exists"],
        required:[true,"Enter your Email"],
        validate:validator.default.isEmail,
    },
    photo: {
        type: String,
        required: [true,"Please add photo"],
    },
    role:{
        type:String,
        enum: ["admin","user"],
        default:"user"
    },
    gender:{
        type: String,
        enum: ["Male","Female"],   
        required: [true,"Please enter gender"]
    },
    dob:{
        type: Date,
        required:[true,"Please enter Date of birth"]
    },
   
},{
    //ye mongoose ko btaiye ga ki createdAt and updatedAt field ko manage krle, jis time data store ho mongodb me vo time allocate krde
    timestamps: true,
});

//hum virtual attribute bnaye ge age jo ki date of birth humne jo diya h us se age derive krdega apne aap
Schema.virtual("age").get(function () {
    //today me aaj ki date lege
    const today = new Date();

    //yuvraj ne dob di h toh yuvraj ki dob hi lenge this keyword ki help se
    const  dob :Date = this.dob;

    //age nikale ge dob vale saal me se aaj k saal me se
    let age = today.getFullYear() - dob.getFullYear();

    //yadi aaj ki date ka month dob vale month se chota h ya fir month same h lekin date choti h toh age me se 1 minus krdege
    if(today.getMonth() < dob.getMonth() || (today.getMonth() == dob.getMonth() && today.getDate() < dob.getDate())){
        age--;
    }
    return age;
})

export const User = mongoose.model<IUser>("User",Schema);