import express from 'express'

import { connectDB, connectRedis } from './utils/features.js';

import { errorMiddleware } from './middlewares/error.js';

//NodeCache ki help se hum local storage/RAM me data save kr skte h
import NodeCache from 'node-cache';

//config ki help se hum env file k variables ko use kr skte h
import dotenv from 'dotenv';

//morgan ki help se hum terminal pr request show krva skte h jo jo user api ki request krega.
import morgan from 'morgan';

//importing Routes
import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";
import Stripe from 'stripe';

import cors from "cors";

import { v2 as cloudinary } from 'cloudinary';

const port = 3000;

dotenv.config({
    path:"./.env"
});

//const port = process.env.PORT || 3000;

const mongoURI = process.env.MONGO_URI || "";

const redisURI = process.env.REDIS_URI || "";

// yadi redis ki cache me 4 hour k baad data apne aap remove ho jaiye ga yadi kuch change nhi kiya toh.
// TTL(Time To Leave) => expiry time of data from cache.
export const redisTTL = process.env.REDIS_TTL || 60 * 60 * 4;


connectDB(mongoURI);
export const redis = connectRedis(redisURI);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


// connectDB();

export const stripe = new Stripe("sk_test_51OwJo1SBfptToIOgEUX7cTBpAKwLpRPdqEIiUnshrK2FZ1RgvxMih8JJCW0jIACCAiWR9tYrPaVJZoE0DJJEIRwI00WIzMH29h");

//humne caching krne k liye NodeCache class ka 1 object bnaya h jiski help se hum baar baar access hone vale data ko ram me store krvaye ge jisse vo fastly access ho jaiye ga aur performance ko increase kr dega 
export const myCache = new NodeCache();

const app = express();

//ye 1 middleware h jiski help se hum controllers me destructuring krege
app.use(express.json());

//morgan package ki help se hum jo bhi get, post, etc request user krega unhe terminal me show krva skte h.
app.use(morgan("dev"));

//Cross-Origin Resource Sharing => iski help se hum different domain, protocol ya port se web page pr request kr skte h.
app.use(cors({
    origin: [process.env.CLIENT_URL!],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}) );


app.get("/",(req,res)=>{
    res.send("API Working with /api/v1");
});

//using Routes
app.use("/api/v1/user",userRoute)
app.use("/api/v1/product",productRoute)
app.use("/api/v1/order",orderRoute);
app.use("/api/v1/payment",paymentRoute);
app.use("/api/v1/dashboard",dashboardRoute);


//uploads folder ko humne static bna diya, yadi koi bhi /uploads pr jaiye ga toh vo is folder ko access kr skta h
app.use("/uploads", express.static("uploads"));

//ye middleware errorhandling k liye h. Ye humne last me isliye likha h kyoki ise hum tab use krege jab sabhi kaam perform ho chuke hoge aur kuch error aa jaiye ga un me se kisi function me
//app.post("/new", newUser); => is me newUser k baad ayr middleware nhi h toh hum jab bhi next() function call krege toh ye niche vala code run hoga
//aur yadi us controller me kuch error aa jata h toh bhi ye code run hoga
app.use(errorMiddleware);

app.listen(port,() => {
    console.log(`Server is working on http://localhost:${port}`)
})