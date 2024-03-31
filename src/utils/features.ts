//file for connecting to database

import mongoose from "mongoose";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { myCache } from "../app.js";
import { Product } from "../models/products.js";
import { Order } from "../models/order.js";
import { Document, Schema } from "mongoose";

export const connectDB = () => {
    mongoose.connect("mongodb+srv://thunderyuvi911:Rajput11@cluster0.zydhdyp.mongodb.net/",{
        dbName: "Ecom",
    })
    .then((c)=> console.log(`DB Connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

//Revalidate on New, Update, Delete Product and on New Order
// hum jab bhi New, Update, Delete Product and on New Order krege toh humne jo data cache me phle se save kr rhka h ushe delete krege
export const invalidateCache =  ({product, order, admin, userId, orderId, productId} : InvalidateCacheProps) =>{
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

        myCache.del(productKeys);
    }
    if(order){
        const orderKeys: string[] = ["all-orders",`my-orders-${userId}`,`order-${orderId}`];

        myCache.del(orderKeys);
    }
    if(admin){
        myCache.del(["admiin-stats", "admin-pie-charts", "admin-bar-charts", "admin-line-charts", ])
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