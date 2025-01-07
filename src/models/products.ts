import mongoose from "mongoose";

const schema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter product name"],
    },
//     photos:[
//         {
//         public_id:{
//             type: String,
//             required: [true, "Please ener Public ID"],
//         },
//         url:{
//             type: String,
//             required: [true, "Please enter URL"],
//         }
//     },
// ],
    photos: {
        type: Array,
    },
    price:{
        type:Number,
        required:[true,"Please enter product price"],
        },
    stock:{
        type:Number,
        required:[true,"Please enter product stock"],
        default:1
        },
  
    category:{
        type:String,
        required:[true,"Please enter product category"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Please enter Description"]
    },
    ratings: {
        type: Number,
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0
    }
   
},
{
    timestamps: true,
})

export const Product = mongoose.model("Product",schema);