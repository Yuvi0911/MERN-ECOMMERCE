import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import { Product } from "../models/products.js";
import { User } from "../models/user.js";
import { OrderItemType, ShippingInfoType } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";

// export const createPaymentIntent = TryCatch( async(req, res, next) =>{
//     const {amount} = req.body;
    
//     if(!amount){
//         return next(new ErrorHandler("Please enter amount", 400));
//     }
    
//     const paymentIntent = await stripe.paymentIntents.create({
//         amount: Number(amount) * 100,
//         currency: "inr",
//     })
    
//     return res.status(201).json({
//         success: true,
//         clientSecret: paymentIntent.client_secret
//     })
// })

export const createPaymentIntent = TryCatch(async (req, res, next) => {
    const { id } = req.query;
  
    const user = await User.findById(id).select("name");
  
    if (!user) return next(new ErrorHandler("Please login first", 401));
  
    const {
      items,
      shippingInfo,
      coupon,
    }: {
      items: OrderItemType[];
      shippingInfo: ShippingInfoType | undefined;
      coupon: string | undefined;
    } = req.body;
  
    if (!items) return next(new ErrorHandler("Please send items", 400));
  
    if (!shippingInfo)
      return next(new ErrorHandler("Please send shipping info", 400));
  
    let discountAmount = 0;
  
    if (coupon) {
      const discount = await Coupon.findOne({ code: coupon });
      if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));
      discountAmount = discount.amount;
    }
  
    const productIDs = items.map((item) => item.productId);
  
    const products = await Product.find({
      _id: { $in: productIDs },
    });
  
    const subtotal = products.reduce((prev, curr) => {
      const item = items.find((i) => i.productId === curr._id.toString());
      if (!item) return prev;
      return curr.price * item.quantity + prev;
    }, 0);
  
    const tax = subtotal * 0.18;
  
    const shipping = subtotal > 1000 ? 0 : 200;
  
    const total = Math.floor(subtotal + tax + shipping - discountAmount);
  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: "inr",
      description: "MERN-Ecommerce",
      shipping: {
        name: user.name,
        address: {
          line1: shippingInfo.address,
          postal_code: shippingInfo.pinCode.toString(),
          city: shippingInfo.city,
          state: shippingInfo.state,
          country: shippingInfo.country,
        },
      },
    });
  
    return res.status(201).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  });

//iski help se hum new coupon create krege 
export const newCoupon = TryCatch(async (req, res, next) => {

    //hum coupon k schema me se destructuring kr k coupon aur amount lege
    const {code, amount} = req.body;

    //yadi coupon ya amount new hoga toh hum error send kr dege
    if(!code || !amount){
        return next(new ErrorHandler("Please Enter Both coupon and amount", 400));
    }

    //mongodb me coupon create krdege coupon k code aur amount k saath.
    await Coupon.create({ code, amount });

    return res.status(201).json({
        success: true,
        message: `Coupon ${code} created Successfully`,
    })
})

//iski help se user jo coupon code fill krega ushe database me find krege aur yadi vo coupon mil jata h toh hum discount amount apply kr dege aur yadi nhi milta h toh hum error bhej dege
export const applyDiscount = TryCatch(async(req, res, next) => {

    //user jo code likhe ga ushe hum lege aur database me check krege ki us naam ka koi coupon code h ya nhi
    const { coupon } = req.query;

    //database me hum coupon code find krege aur discount me save krdege
    const discount = await Coupon.findOne({code: coupon})

    //yadi us naam ka coupon code nhi milta toh hum error bhej dege
    if(!discount){
        return next(new ErrorHandler("Invalid Coupon Code", 400));
    }

    //database me coupon mil jata h toh response bhej dege
    return res.status(200).json({
        success: true,
        message: discount.amount
    })
})

//iski help se admin sbhi coupon ko dekh skta h, jo ki database me availabe h
export const allCoupons = TryCatch(async(req, res, next) => {

    const coupons = await Coupon.find({});

    return res.status(200).json({
        success: true,
        coupons,
    })
})

export const getCoupon = TryCatch(async(req, res, next)=> {
    const {id} = req.params;
    const coupon = await Coupon.findById(id);
    if(!coupon){
        return next(new ErrorHandler("Invalid Coupon ID", 400));
    }
    return res.status(200).json({
        success: true,
        coupon,
    })
})

export const updateCoupon = TryCatch(async(req, res, next) => {

    const {code, amount} = req.body;
  
    const coupon = await Coupon.findById(req.params.id);
    
    if(!coupon){
        return next ( new ErrorHandler("Invalid Coupon Id",400));
    }

    if(code) coupon.code = code;
    if(amount) coupon.amount = amount;

    await coupon.save();
    
    return res.status(200).json({
        success: true,
        message: `Coupon ${coupon.code} Updated Successfully`,
    })
})
export const deleteCoupon = TryCatch(async(req, res, next) => {
    // ye params me se coupon ki id fetch krega aur ushe db me se delete krdeg
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    
    if(!coupon){
        return next ( new ErrorHandler("Invalid Coupon Id",400));
    }
    
    return res.status(200).json({
        success: true,
        message: `Coupon ${coupon.code} Deleted Successfully`,
    })
})