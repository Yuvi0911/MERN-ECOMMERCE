import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";

//new user bnane ke liye h ye function
//TryCatch function humne error.ts me bnaya hua h jo ki try catch ka logic h
export const newUser = TryCatch(
    async (
        req: Request<{},{},NewUserRequestBody>,
        res: Response,
        next: NextFunction
    ) => {
          
            const {name,email,photo,gender,_id,dob } = req.body;
            
            //yadi user ne sign up kr rhka h toh vo directly sign in krega aur ye line jo us user ko id allot hui thi uske basics pr database me us user ko find kregi
            let user = await User.findById(_id);

            //yadi user mil jata h toh directly if block execute ho jaiye ga
            if(user){
                return res.status(200).json({
                    success: true,
                    message: `Welcome, ${user.name}`,
                })
            }

            //yadi user ne koi bhi field nhi bhari toh hum ushe error de dege
            if(!_id || !name || !email || !photo || !gender || !dob){
                return next(new ErrorHandler("Please add all fields", 400))
            }

            //yadi user nhi milta us id k basics pr toh user ko sign up krna pde ga apni sbhi information fill kr k
            user = await User.create({
                name,
                email,
                photo,
                gender,
                _id,
                dob: new Date(dob),
            });
    
            return res.status(201).json({
                success: true,
                message: `Welcome, ${user.name}`,
            })

    }
)

//yadi admin ko sbhi user ki details dkhni h toh uske liye ye function hoga
export const getAllUsers = TryCatch(async (req,res,next) => {
    const users = await User.find({});

    return res.status(200).json({
        success: true,
        users,
    })
}) 

//yadi admin ko kisi single user ki details dekhni h toh ye function hoga
export const getUser = TryCatch(async (req,res,next) => {
    //req.params ki help se hum dynamic id ko le skte h, jo ki admin api me fill krega user ko find krne k liye 
    const id = req.params.id;
    //app.get("/:id",getUser);
    //req.params.___  is fill up me hum vo hi keyword dege jo humne router me diye h, jo ki is case me id h. id ki jagah router me yadi hum name dete toh hume req.params.name lena pdta.

    //aur niche vale function ki help se hum us id pr findById function lga kr k database me ushe find kr skte h 
    const user = await User.findById(id)
    
    //yadi user nhi milta toh hum error return krde ge
    if(!user){
        return next(new ErrorHandler(`User does not exist with id: ${id}`, 404))
    }

    //yadi user mil jata h toh uski information de dege admin ko
    res.status(200).json({
        success: true,
        user,
    })
})

export const deleteUser = TryCatch(async (req,res,next) =>{
    const id = req.params.id;

    const user = await User.findById(id)

    if(!user){
        return next(new ErrorHandler(`User does not exist with id: ${id}`,404))
    }

    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
    })
})