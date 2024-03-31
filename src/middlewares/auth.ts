//ye file humne admin check krne k liye bnayi h

//phle hum dekhe ge ki jo aadmi admin ke routes access krna chahta h usne apni id di h ya nhi , mtlab ki vo aadmi login h ya nhi, id nhi di hogi toh hum error nhej dege

//yadi usne apni id di h toh hum ye dekhe ge usne apni id shi di h ya nhi, us id pr koi user found hota h ya nhi, user find nhi hota h toh hum error bhej dege

//user find hogya toh hum dekhe ki vo admin h ya nhi, yadi vo admin nhi hoga toh vo un routesko access nhi kr paaye ga jin me hum ish middleware ko bheje ge, jaise ki
//app.get("/all",adminOnly,getAllUsers);




import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";


export const adminOnly = TryCatch(async (req,res,next) => {
    //api/v1/user/asd ? key=24
    //asd params h
    // ? k baad jo likha hota h vo query hota h, isme key=24 query h
    const { id } = req.query;

    if(!id){
        return next(new ErrorHandler("Login Required",401));
    }

    const user = await User.findById(id);

    if(!user){
        return next(new ErrorHandler("User not found",404))
    }

    if(user.role !== "admin"){
        return next(new ErrorHandler("Cannot access",403))
    }

    //next me error pass nhi kiya toh router me chaining me jo agla middleware hoga us pr chla jaiye ga
    next()
})