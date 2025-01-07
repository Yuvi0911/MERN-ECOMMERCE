//file for connecting to database

import mongoose from "mongoose";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { myCache, redis } from "../app.js";
import { Product } from "../models/products.js";
import { Order } from "../models/order.js";
import { Document, Schema } from "mongoose";
import {v2 as cloudinary, UploadApiResponse} from "cloudinary";
import ErrorHandler from "./utility-class.js";
import { Review } from "../models/review.js";
import {Redis} from "ioredis";

const getBase64 = (file: Express.Multer.File) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadFilesToCloudinary = async (files: Express.Multer.File[]) => {
    // yadi hume keval 1 file upload krni ho toh cloudinary pr
    // const result = await cloudinary.uploader.upload(getBase64(files[0]));

    const uploadPromises = files.map(async(file)=>{
        return new Promise<UploadApiResponse>((resolve, reject) => {
           cloudinary.uploader.upload(
                getBase64(file),(error, result) => {
                    if(error) return reject(error);
                    resolve(result!);
                }
            )
        })
    });

    try {
        const results = await Promise.all(uploadPromises);
 

        return results.map((result) => ({
            public_id: result.public_id,
            url: result.secure_url,
        }));

    } catch (error) {
        throw new Error("Error uploading files to cloudinary");
    }
}

export const deleteFilesFromCloudinary = async(publicIds: string[])=>{
    try{
        const deletePromises = publicIds.map((publicId)=>{
            return new Promise<void>((resolve, reject) => {
                cloudinary.uploader.destroy(publicId, (error, result) => {
                    if(error) return reject(error);
                    resolve();
                })
            })
        })


        await Promise.all(deletePromises);
        console.log("Files deleted successfully");
    }
    catch(error){
        console.log("Error deleting files from cloudinary:", error);
        throw new Error("Error deleting files to cloudinary");
    }
}

export const connectRedis = (redisURI: string) => {
    const redis = new Redis(redisURI);

    redis.on("connect", () => console.log("Redis Connected"));
    redis.on("error", (e) => console.log("Redis Error", e));

    return redis;
}

export const connectDB = (mongoURI: string) => {
    mongoose.connect(mongoURI,{
        dbName: "Ecom",
    })
    .then((c)=> console.log(`DB Connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

//Revalidate on New, Update, Delete Product and on New Order
// hum jab bhi New, Update, Delete Product and on New Order krege toh humne jo data cache me phle se save kr rhka h ushe delete krege
export const invalidateCache = async ({product, order, admin, review, userId, orderId, productId} : InvalidateCacheProps) =>{
    // jab bhi review me change hoga kuch bhi toh cache ko invalidate krege.
    if(review){
        await redis.del([`reviews-${productId}`]);
    }

    // yadi product ki value update hogi toh purani product ki value jo ki cache me store h ushe delete kr dege.
    if(product){
        const productKeys: string[] = ["latest-products", "categories", "admin-products",`product-${productId}`];

        // const product_id = await Product.find({}).select("_id");
        
        // product_id.forEach((i) => {
        //     productKeys.push(`product-${i._id}`);
        // })

        if(typeof productId === "string"){
            productKeys.push(`product-${productId}`);
        }

        if(typeof productId === "object"){
            productId.forEach((i) => productKeys.push(`product-${i}`))
        }

        // myCache.del(productKeys);
        await redis.del(productKeys)
    }
     // yadi order ki value update hogi toh purani order ki value jo ki cache me store h ushe delete kr dege.
    if(order){
        const orderKeys: string[] = ["all-orders",`my-orders-${userId}`,`order-${orderId}`];

        // myCache.del(orderKeys);
        await redis.del(orderKeys);
    }
     // yadi admin ki value update hogi toh purani admin ki value jo ki cache me store h ushe delete kr dege.
    if(admin){
        // myCache.del(["admin-stats", "admin-pie-charts", "admin-bar-charts", "admin-line-charts", ])
        await redis.del(["admin-stats", "admin-pie-charts", "admin-bar-charts", "admin-line-charts", ])
    }
};


export const reduceStock = async (orderItems: OrderItemType[]) => {
    //humne jitne order kiye h un sabhi pr traverse krege
    for(let i = 0;i< orderItems.length; i++){
        //hum 1-1 kr k sbhi orederItems ko order me store krege
        const order = orderItems[i];
        //order kiye gye product ko uski id (jo ki orderItems me store h) k basics pr find krege.
        const product = await Product.findById(order.productId);
        //yadi product nhi milta toh error bhej dege
        if(!product) {
            throw new Error("Product Not Found");
        }
        //product mil jata h toh product k stock me se user ne jitni qun=antity me product order kiye h unhe subtract krde ge.
        product.stock -= order.quantity;

        //stock me se quantity subtract kr k database me save kr dege.
        await product.save();
    }
}

export const calculatePercentage = (thisMonth:number,lastMonth:number) => {

    if(lastMonth === 0){
        return thisMonth * 100;
    }

    const percent = (thisMonth / lastMonth) * 100;

    return Number(percent.toFixed(0));
};

export const getInventories = async ({
     categories,
     productsCount,
    }:{
        categories:string[];
        productsCount: number;
    }) =>{
     //isme hum different categories me kitne product h vo calculate krege. hum ishe promise bnaye ge kyoki hum parallely products ko calculate krne chathe h sbhi categories k vajah 1-1 category k products k.
     const categoriesCountPromise =  categories.map((category) => Product.countDocuments({category}));
     const categoriesCount = await Promise.all(categoriesCountPromise);

     const categoryCount:Record<string,number>[] = [];

     categories.forEach((category, i) => {
         categoryCount.push({
             [category]: Math.round((categoriesCount[i] / productsCount) * 100),
         })
     })

     return categoryCount;
}



interface MyDocument extends Document {
    createdAt: Date;
    discount ?: number;
    total ?: number;
}
type FuncProps = {
    length: number;
    docArr: MyDocument[];
    today: Date;
    property ?: "discount" | "total";
}
export const getChartData = ({length, docArr, today, property}: FuncProps) => {
          //humne 0-5 tak ki 1 array bna li h jisme hum array k index pr us month me jitne order placed hue h uske revenue ko store krege.
          const data: number[] = new Array(length).fill(0);

          docArr.forEach((i) => {
              const creationDate = i.createdAt;
              //hum order ki creation date ka month aur aaj ki date ka month ka difference nikale ge 
              const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

              //yadi vo differece 6 se kam hoga toh hum chart pr uska data show krege
              if(monthDiff < length){

                if(property){
                    // data array ka us month k index me discount ki value add ho jaiye gi 
                    data[length - monthDiff - 1] += i[property]!;
                     // i[property]! me ! ka matlab h ki ye undefined nhi ho skta kbhi bhi
                }
                else{
                    // data array ka us month ka index 1 se bdha dege 
                    data[length - monthDiff - 1] += 1;
                }
                 
                 
                 
              }
          })

          return data;
}

export const findAverageRatings = async (productId: mongoose.Types.ObjectId) => {
    let totalRating = 0;

    const reviews = await Review.find({ product: productId});

    reviews.forEach((review) => {
        totalRating += review.rating;
    })

    const averageRating = Math.floor(totalRating/reviews.length) || 0;

    return{
        numOfReviews: reviews.length,
        ratings: averageRating,
    }

}