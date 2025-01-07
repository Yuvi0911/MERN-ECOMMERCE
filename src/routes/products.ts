import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allReviewsOfProduct, deleteProduct, deleteReview, getAdminProducts, getAllCategories, getSearchProducts, getSingleProduct, getlatestProducts, newProduct, newReview, updateProduct } from "../controllers/product.js";
import { multiUpload } from "../middlewares/multer.js";
// import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

//admin ko naye product add krne h toh vo is route ki help se hoge
//Create New Product -> /api/v1/product/new
// app.post("/new", adminOnly, singleUpload, newProduct)
app.post("/new", adminOnly, multiUpload(5), newProduct)

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
app.route("/:id").get(getSingleProduct).put(adminOnly, multiUpload(5), updateProduct).delete(adminOnly, deleteProduct);

// iski help se hum sbhi reviews ko get kr skte h jo ki kisi specific product pr kiye gye h.
app.get("/reviews/:id", allReviewsOfProduct);
// is route ki help se user kisi bhi product pr review daal skta h. id = product ki id h.
app.post("/review/new/:id", newReview);
app.delete("/review/:id", deleteReview);

export default app;