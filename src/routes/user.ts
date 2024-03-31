import express from "express";
import { deleteUser, getAllUsers, getUser, newUser } from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

//route => /api/v1/user/new
app.post("/new", newUser);
// maanlo ki newUser k baad newUser1, newUser2 bhi h toh jab bhi hum newUser me next() ko call kre ge toh newUser1 me chla jaaiye ga aur jab newUser1 me next() call krege toh newUser2 me chle jaiye ge


//yadi admin ko sabhi user ki information chaiye toh vo is api pr request kre ge
//route => /api/v1/user/all
app.get("/all",adminOnly,getAllUsers);


//yadi admin ko single user ki information chaiye toh vo is api pr request krega
//route => /api/v1/user/dynamicID

app.route("/:id").get(getUser).delete(adminOnly,deleteUser);
//single user ko get krne k liye ya delete krne k liye hume keval id deni h toh hum dono ki chaining krde ge
//app.delete("/:id",deleteUser);


export default app;

