import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
//inhe hum products ko filter krne k liye use krege
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { Product } from "../models/products.js";
import ErrorHandler from "../utils/utility-class.js";
//rm ki help se humne product ki jo photo apne computer ki storage me store ki h ushe remove kr skte h
import { rm } from "fs";

//myCache ki help se hum local storage me data ko store krva skte h. Hum unhi components me myCache ko use krege jin me hum database se kuch data le rhe h, hum un me ue nhi krege jinme hum database me kuch data de rhe h.
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";

//isko hum un sbhi components se niche le kr jaiye ge jin me caching use hui h.

// export const newProduct = TryCatch(async(req:Request<{},{},NewProductRequestBody>, res, next) =>{
//     const { name, price, stock, category } = req.body;

//     const photo = req.file;

//     //yadi kisi ne product ki photo nhi di toh errror aa jaiye ga
//     if(!photo){
//         return next(new ErrorHandler("Please add photo", 400));
//     }

//     //yadi user in me se koi bhi data nhi deta h product ka toh ushe error dege
//     if(!name || !price || !stock || !category){

//         // user ne product ki photo de rkhi h aur inme se koi data nhi de rkha toh photo humare disk me add ho chuki h uploads folder me toh hume phle ushe delete/remove krna hoga
//         rm(photo.path,()=>{
//             console.log("Deleted");
//         })


//         return next(new ErrorHandler("Please enter all fields",400));
//     }

//     //ye database me product create kr dega in details k saath
//     await Product.create({
//         name,
//         price,
//         stock,
//         category: category.toLowerCase(),
//         photo: photo.path,
//     })

//     invalidateCache({product: true});

//     // product ho jane pr api ye response send kregi
//     return res.status(201).json({
//         success: true,
//         message: "Product created successfully"
//     })
// })

//ishe hum front page pr latest product jo add hue h unko dikhane k liye use krege.
//Revalidate on New, Update, Delete Product and on New Order => kyoki hum cache me data store kr rhe h toh jab bhi hum product me kuch bhi change krege toh hume dobara cache me naya data store krna hoga.
export const getlatestProducts = TryCatch(async(req,res,next)=>{

    let products;

    //yadi cache me data store hoga toh directly vha se product me data aa jaiye ga.
    if(myCache.has("latest-products")){
        products = JSON.parse(myCache.get("latest-products") as string);
    }
    //yadi cache me data nhi hoga toh ushe database me find krege aur cache me store krva dege.
    else{
        
            //latest 5 product add huye h unko degi ye line sorted (descending) order me
            products = await Product.find({}).sort({createdAt: -1}).limit(5);

            //hum latest product k data ko cache(apne laptop ki local storage/ram) me store krva lege jisse jab user dobara ush data ko request kre ga toh hum if condition me likhi gyi line ki help se local storage me phle check krege ki data present h ya nhi. yadi data local storage me present hoga toh directly vha se aa jaiye ga database me search krne ki jagah. Is se humare website ki performance aur speed increase hogi. 
            myCache.set("latest-products",JSON.stringify(products));

    }

    return res.status(200).json({
        success: true,
        products, 
    })
})


//Revalidate on New, Update, Delete Product and on New Order => kyoki hum cache me data store kr rhe h toh jab bhi hum product me kuch bhi change krege toh hume dobara cache me naya data store krna hoga.
export const getAllCategories = TryCatch(async(req,res,next)=>{

    let categories;

    //yadi cache me categories ka data exist krta hoga toh directly cache se data le lege.
    if(myCache.has("categories")){
        categories = JSON.parse(myCache.get("categories") as string);
    }
    //yadi cache me data nhi hoga toh database me find krege aur cache me store krva de ge.
    else{
        //alag alag categories ko database se find krege aur categories variable me store krdege
        categories = await Product.distinct("category");

        // categories k data ko "categories" naam k cache me store kre ge
        myCache.set("categories",JSON.stringify(categories));
    }

    return res.status(200).json({
        success:true,
        categories,
    })
})

//Revalidate on New, Update, Delete Product and on New Order => kyoki hum cache me data store kr rhe h toh jab bhi hum product me kuch bhi change krege toh hume dobara cache me naya data store krna hoga.
export const getAdminProducts = TryCatch(async(req,res,next)=>{
    
    let products;

    if(myCache.has("admin-products")){
        products = JSON.parse(myCache.get("admin-products")!)
        //as string likhe ya (!) ye likhe same hi baat h. 
    }
    else{
        products = await Product.find({});

        myCache.set("admin-products",JSON.stringify(products));
    }

    return res.status(200).json({
        success:true,
        products,
    })
})

export const getSingleProduct = TryCatch(async(req,res,next)=>{

    let product;
    const id = req.params.id;

    if(myCache.has(`product-${id}`)){
        product = JSON.parse(myCache.get(`product-${id}`)!)
    }
    else{
        product = await Product.findById(id);

        if(!product){
            return next(new ErrorHandler("Product doesn't exist",404));
        }
        
        //isme hum id ko bhi check kre ge cache me store krte time kyoki yadi hum bina id k store krege toh jab hum naye product ko search krege toh if() vali condition hume baar baar vo product degi jo humne 1st no pr store kiya tha
        myCache.set(`product-${id}`,JSON.stringify(product));
    }

 

    return res.status(200).json({
        success: true,
        product
    })
})

export const newProduct = TryCatch(async(req:Request<{},{},NewProductRequestBody>, res, next) =>{
    const { name, price, stock, category } = req.body;

    const photo = req.file;

    //yadi kisi ne product ki photo nhi di toh errror aa jaiye ga
    if(!photo){
        return next(new ErrorHandler("Please add photo", 400));
    }

    //yadi user in me se koi bhi data nhi deta h product ka toh ushe error dege
    if(!name || !price || !stock || !category){

        // user ne product ki photo de rkhi h aur inme se koi data nhi de rkha toh photo humare disk me add ho chuki h uploads folder me toh hume phle ushe delete/remove krna hoga
        rm(photo.path,()=>{
            console.log("Deleted");
        })


        return next(new ErrorHandler("Please enter all fields",400));
    }

    //ye database me product create kr dega in details k saath
    await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo.path,
    })

    //jab bhi hum naya product bnaye ge toh cache me jo purana data store h ush delete krege.
    invalidateCache({product: true, admin: true});

    // product ho jane pr api ye response send kregi
    return res.status(201).json({
        success: true,
        message: "Product created successfully"
    })
})

export const updateProduct = TryCatch(async(req,res,next)=>{
    const {id} = req.params;
    const {name,price,stock,category} = req.body;
    const photo = req.file;

    const product = await Product.findById(id);

    if(!product) return next(new ErrorHandler("Product not found",404));

    if(photo){
        rm(product.photo,()=>{
            console.log("Old photo removed successfully")
        })

        product.photo = photo.path;
    }

        if(name) product.name = name;
        if(price) product.price = price;
        if(stock) product.stock = stock;
        if(category) product.category = category;

        await product.save();

        //hum jab bhi product me kuch update krege toh cache/local-storage me jo data store h ushe delete krege.
        invalidateCache({product: true, productId: String(product._id),admin: true});


        return res.status(200).json({
            success:true,
            message:"Product Updated Successfully"
        })
   
})

export const deleteProduct = TryCatch(async(req,res,next)=>{
    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler("Product not found",404));
    }

    //product ko delete krne se phle hum photo ko uploads folder se htaye ge
    rm(product.photo,()=>{
        console.log("Product photo deleted")
    });

    // product ko database se delete krdege
    await product.deleteOne();

    invalidateCache({product: true, productId: String(product._id), admin: true});


    return res.status(200).json({
        success:true,
        message:"Product deleted successfully",
    })
})

export const getSearchProducts = TryCatch(async(req: Request<{},{},{},SearchRequestQuery>,res,next)=>{
    const {search,sort,category,price} = req.query;

    const page = Number(req.query.page) || 1;

    //1 page pr kitne(8) element dikhaye ge 
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

    //yadi hum 3rd page pr h toh, (3-1)*8 = 16, toh hum phle 16 product ko skip krdege(16 k baad vaale product ko dikhaye ge); 
    const skip = (page - 1) * limit;

    //Basequery k ander humne 1 interface bnaya h jisme name, price aur category h aur unke datatype define kiye gye h, jinke basics pr hum apne product ko search krege. Humne usme optional parameter ka use kiya h jiski vjah se hume 3no field ek saath dene ki jrurt nhi h.
    const baseQuery: BaseQuery = {};

    if(search){
        //name k basics pr product ko search/filter krne k liye
        baseQuery.name ={
            //iski help se name me jo word h us k basics pr product ko search krega. For ex= "macbook" naam ka product h toh yadi hum "boo" bhi likhe ge toh vo product aa jaiye ga
            $regex: search,
             //iski help se hum case sensitivity ko hta skte h. yadi hum "BOO" capital me bhi likhe ge toh "macbook" naam vala product aa jaiye ga
            $options: "i"
        }
    }

    //price k basis pr product ko filter krne k liye
    if(price){
        baseQuery.price = {
            //price ki value se kam aur equal vale product ko search krega
            $lte: Number(price),
        }
    }

    if(category){
        //category me jo value dege ushi category k product aayge
        baseQuery.category = category;
    }

/* Hum in dono await vali line ko Promise.all me daal dege jisse ye dono parallely run ho jaiyegi.
Yadi hum ishi tarah se likhte h toh phle const products vali line execute hogi aur isme await use hua h toh ye aage k execution ko rook degi, aur jab ye complete hogi tab const filterOnlyProduct vali line chle gi 

const products = await Product.find(baseQuery)
   //products ko ascending ya descending order me sort krne k liye
.sort(sort && { price: sort === "asc" ? 1 : -1})
    //page per jitni limit h utne hi product dikhaye ge bas
.limit(limit)
    //jitne page no pr h us se phle vale pages k product ko skip krdege
.skip(skip);

    //filter huye product ko find krega
const filteredOnlyProduct = await Product.find(baseQuery);
    */

    const [products, filteredOnlyProduct] = await Promise.all([

        Product.find(baseQuery)
    .sort(sort && { price: sort === "asc" ? 1 : -1})
    .limit(limit)
    .skip(skip) ,

    Product.find(baseQuery)

    ])

    //total kitne page chaiye ge filtered products ko dikhane k liye.
    //for ex => 
    // total product = 103
    // filtered product = 45
    // limit(1 page pr 10 product aa skte h) = 10
    // totalPage = Math.ceil(45/10)
    // totalPage = 5
    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

    return res.status(200).json({
        success: true,
        products,
        totalPage,
    })
})


//ye function humne duplicate products ko bnane k liye use kiya h. Iski help se hum duplicate product bna kr apne search functionalities ko check kr skte h api k through

//import {faker} from '@faker-js/faker'

// const generateRandomProducts = async(count: number = 10) => {
//     const products = [];

//     for(let i = 0; i < count; i++){
//         const product = {
//             name: faker.commerce.productName(),
//             photo: "uploads\\6b5d185b-1a58-4ad9-856f-554db09bdc92.jpg",
//             price: faker.commerce.price({min:1500,max:80000,dec:0}),
//             stock: faker.commerce.price({min:0,max:100,dec:0}),
//             category: faker.commerce.department(),
//             createdAt: new Date(faker.date.past()),
//             updatedAt: new Date(faker.date.recent()),
//             _v: 0,
//         };
//         products.push(product);
//     }
//     await Product.create(products);

//     console.log({success: true});
// }

//ye function 50 fake products ko generate kr dega
//generateRandomProducts(50)


// 2 product ko chhod kr sbhi products ko database se delete kr dega ye function ko jab bhi hum call krege 
// const deleteRandomProducts = async(count: number = 10)=>{
//     const products = await Product.find({}).skip(2);
//     for(let i = 0; i< products.length; i++){
//         const product = products[i];
//         await product.deleteOne();
//     }
//     console.log({success: true});
// }
// deleteRandomProducts(48);