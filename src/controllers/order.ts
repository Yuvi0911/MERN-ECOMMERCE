import express, { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache, redis, redisTTL } from "../app.js";


//ye controller kisi bhi specific user k sbhi order show krdega uski id k basics pr
export const myOrders = TryCatch(async (req, res,next) => {

    //humne user ki id le li as user name
    const {id:user} = req.query;

    let orders;

    //hum iski `my-orders-${user}` jagah pr key bhi use kr skte h.
    const key = `my-orders-${user}`;

    orders = await redis.get(key);

    //yadi cache me data store hoga toh directly cache se data le lege.
    if(orders){
        // orders = JSON.parse(myCache.get(`my-orders-${user}`) as string);
        orders = JSON.parse(orders);
    }
    else{
        //hum specific user k order find krliye us user ki id de kr
        orders = await Order.find({user});

        //orders me jo data aaya h ushe cache me store krva dege
        //har ek user k alag alag orders hoge toh sab k liye hum alag alag key use krege uska data find krne k liye.
        // myCache.set(`my-orders-${user}`,JSON.stringify(orders))

        await redis.setex(key, redisTTL, JSON.stringify(orders));
    }
    
    return res.status(200).json({
        success: true,
        orders,
    })
});

//is controller ki help se admin sbhi users k order dekh skta h
export const allOrders = TryCatch(async(req, res, next) => {

    const key = `all-orders`;

    let orders;

    orders = await redis.get(key);

    //yadi cache me data store hoga toh directly cache se data le lege.
    if(orders){
        //as string ya ! in dono me se kuch bhi use kr skte h
        // orders = JSON.parse(myCache.get(key)!)
        orders = JSON.parse(orders);
    }
    else{
        //sbhi user k orders ko find kr lege
        //admin k dashboard pr jis bhi user k product dekha rhe h uske saath uska name bhi dikhaye ge populate method ki help se.
        orders = await Order.find().populate("user","name");
        //populate vali command hum un orders k saath saath us user ka naam bhi de degi.

        //sbhi orders ko cache me store krva dege
        // myCache.set(key,JSON.stringify(orders));
        await redis.setex(key, redisTTL, JSON.stringify(orders));
    }

    return res.status(200).json({
        success: true,
        orders,
    })
});


export const getSingleOrder = TryCatch(async(req,res,next) => {
    const {id} = req.params;
    const key = `order-${id}`;

    //abki baar hum keval 1 order le ge  isliye order ko array nhi bnaye ge.
    let order;

    order = await redis.get(key);

    if(order){
        // order = JSON.parse(myCache.get(key) as string)
        order = JSON.parse(order);
    }
    else{
        order = await Order.findById(id).populate("user","name");

        if(!order){
            return next(new ErrorHandler("Order Not Found",404));
        }

        // myCache.set(key,JSON.stringify(order));
        await redis.setex(key, redisTTL, JSON.stringify(order));
    }

    return res.status(200).json({
        success: true,
        order,
    })
});


//is controller ki help se hum naya order create create krege
export const newOrder = TryCatch(async(req: Request<{},{},NewOrderRequestBody>,res,next) => {

    const { shippingInfo, orderItems, user, subtotal, tax, shippingCharges, discount, total} = req.body;

    if(!shippingInfo || !orderItems || !user || !subtotal || !tax ||  !total ){
        return next(new ErrorHandler("Please Enter All Fields",400));
    }

    const order = await Order.create({
        shippingInfo,
        orderItems,
        user,
        subtotal,
        tax,
        shippingCharges,
        discount,
        total,
    });

    //ye function total stock me se un product ko hta dega jo user ne order placed kr diye h.
    await reduceStock(orderItems);

    //hum cache me jo purana data store h ushe delete kre ge
    await invalidateCache({ product:true, order: true, admin: true, userId: user, productId: order.orderItems.map((i)=>String(i.productId))});

    return res.status(201).json({
        success: true,
        message: "Order Placed Successfully",
    })
}) ;

//admin kisi bhi user k order ko update krega us order k status k according.
export const processOrder = TryCatch(async (req,res,next) => {
    const {id} = req.params;
    const order = await Order.findById(id);
    if(!order){
        return next(new ErrorHandler("Order Not Found",404));
    }

    switch(order.status) {
        case "Processing":
            order.status = "Shipped";
            break;
        case "Shipped":
            order.status = "Delivered";
            break;
        default: 
            order.status = "Delivered";
            break;
    }

    await order.save();

    await invalidateCache({ product: false,order: true,admin: true, userId: order.user, orderId: String(order._id),});

    return res.status(200).json({ 
        success: true,
        message: "Order Processed Successfully",
    })
})

export const deleteOrder = TryCatch(async (req, res, next) =>{
    const {id} = req.params;
    const order = await Order.findById(id);
    if(!order) {
        return next( new ErrorHandler("Order Not Found",404));
    } 

    await order.deleteOne();

    await invalidateCache({ product: false,order: true,admin: true, userId: order.user, orderId: String(order._id),});

    return res.status(200).json({
        success: true,
        message: "Order Deleted Successfully",
    })
})