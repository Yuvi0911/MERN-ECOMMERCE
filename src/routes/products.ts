import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAdminProducts, getAllCategories, getSearchProducts, getSingleProduct, getlatestProducts, newProduct, updateProduct } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

//admin ko naye product add krne h toh vo is route ki help se hoge
//Create New Product -> /api/v1/product/new
app.post("/new", adminOnly,singleUpload, newProduct)

//To get all products with filters -> /api/v1/product/all
app.get("/all", getSearchProducts);

//user ko latest product chaiye toh vo is api pr jaiye ga
//To get latest 5 product added -> /api/v1/product/latest
app.get("/latest",getlatestProducts )

//user ko product ki sbhi categories dekhni h toh vo is api pr request kre ga
//To get all unique categories -> /api/v1/product/categories
app.get("/categories",getAllCategories)

//yadi admin ko sbhi products dekhne h toh is api pr request krega
//To get all Products -> /api/v1/product/admin-products
app.get("/admin-products",adminOnly,getAdminProducts);


//single product ko get krne k liye, product ko update krne k liye, product ko delete krnr k liye h ye route
app.route("/:id").get(getSingleProduct).put(adminOnly, singleUpload, updateProduct).delete(adminOnly, deleteProduct);

export default app;