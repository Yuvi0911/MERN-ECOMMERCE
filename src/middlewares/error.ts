import { NextFunction, Request, Response }  from "express";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";


// ye function utility-class me jo error aaya h ushe legi aur hume show krdegi thunderclient me
export const errorMiddleware = (err:ErrorHandler,req:Request,res:Response,next:NextFunction)=>{
    //ydi err ka message nhi pta hoga toh Internal Server error aa jaiye ga
    err.message ||= "Internal Server Error";
    //yadi error k status code ka pta nhi hoga toh 500 status code aa jaiye ga
    err.statusCode ||= 500;

    if(err.name === "CastError"){
        err.message ="Invalid Id";
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}

//baar baar try catch ka syntax lgane ki jagah hum directly is function me wrap krde ge jis function ko try catch me rakhna hoga, isliye hum ishe wrapper function bhi kh skte h

export const TryCatch = (func: ControllerType) => {
    return (req: Request, res: Response,next: NextFunction) => {

        //TryCatch k ander likhe gye function ko resolve krega aur yadi us function me kuch error aa jaata h toh catch block me jaaiye ga aur next ko call krde ga jo ki errorMiddleware ko call krdega
         return Promise.resolve(func(req,res,next)).catch(next);
     };
}