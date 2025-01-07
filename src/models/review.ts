import mongoose from "mongoose";

const schema = new mongoose.Schema({
    comment: {
        type: String,
        maxlength: [200, "Comment must be less than 200 characters"]
    },
    rating: {
        type: Number,
        required: [true, "Please give Rating"],
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating must be at most 5"]
    },
    user: {
        type: String,
        ref: "User",
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    }
},{
    timestamps: true
})

export const Review = mongoose.model("Review", schema);